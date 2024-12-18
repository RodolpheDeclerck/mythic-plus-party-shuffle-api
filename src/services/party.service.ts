import { Character } from '../entities/character.entity.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { Party } from '../entities/party.entity.js';
import redisClient from '../config/redis-client.js';

class PartyService {
    private shuffleHistoryKey = 'partyShuffleHistory';

    // Fonction principale pour mélanger les groupes
    async shuffleGroups(characters: Character[], eventCode: string): Promise<Party[]> {
        const parties: Party[] = [];

        const partiesHistory = await this.getLastThreeShuffles(eventCode);

        const usedCharacters = new Set<number>(); // Pour éviter les doublons

        // Filtrer les personnages selon leur rôle
        let { tanks, healers, melees, dists, brs, bls } = this.filterCharactersByRole(characters);

        this.createParties(characters, parties);

        // Creer un groupe pour chaque tank
        this.assignTanksToParties(tanks, parties, usedCharacters);

        // Creer un groupe pour chaque healer
        this.createPartiesForHealers(healers, parties, usedCharacters);

        //Add a Battle rez from random role to the party if needed
        this.assignBRToParties(brs, parties, usedCharacters, partiesHistory);

        //Add a Blood Lust to the group
        this.assignBLToParties(bls, parties, usedCharacters, partiesHistory);

        //Add healer to all parties without healer
        this.assignHealersToParties(parties, healers, usedCharacters, partiesHistory);

        this.addignDistAndMelees(dists, melees, parties, usedCharacters, partiesHistory);


        let unusedDps: Character[] = [];

        [...dists, ...melees].forEach(dps => {
            if (!usedCharacters.has(dps.id)) {
                unusedDps.push(dps);
            }
        })

        //Complete parrties with remaining DPS
        unusedDps = this.completePartiesWithRemainingDPS(unusedDps, parties)

        this.createGroupForRemainingDPS(unusedDps, parties);

        return parties;
    }

    // Charger les trois derniers shuffles depuis Redis
    async getLastThreeShuffles(eventCode: string): Promise<Party[][]> {
        const partiesJson = await redisClient.get(`${this.shuffleHistoryKey}:${eventCode}`);
        return partiesJson ? JSON.parse(partiesJson).slice(-3) : [];
    }

    // Sauvegarder le shuffle actuel dans l'historique Redis
    async saveShuffleToHistory(eventCode: string, parties: Party[]): Promise<void> {
        const history = await this.getLastThreeShuffles(eventCode);
        history.push(parties); // Ajouter le nouveau shuffle

        if (history.length > 3) history.shift(); // Limiter à trois shuffles

        await redisClient.set(`${this.shuffleHistoryKey}:${eventCode}`, JSON.stringify(history));
    }


    private filterEligibleMembers(
        candidates: Character[],
        party: Party,
        previousShuffles: Party[][]
    ): Character[] {
        const groupMembers = party.members.map(member => member.id);

        return candidates.filter(candidate => {
            // Vérifie si le candidat a été dans le même groupe que l'un des membres actuels du party
            const hasBeenGrouped = previousShuffles.some(shuffle =>
                shuffle.some(group =>
                    group.members.some(member => groupMembers.includes(member.id)) &&
                    group.members.some(member => member.id === candidate.id)
                )
            );

            // Retourne true si le candidat n'a pas été groupé avec les membres du party dans l'historique
            return !hasBeenGrouped && candidate.keystoneMinLevel <= party.members[0].keystoneMinLevel && candidate.keystoneMaxLevel >= party.members[0].keystoneMaxLevel;
        });
    }

    // Méthode pour récupérer les groupes à partir de Redis
    async getPartiesByEventCode(eventCode: string): Promise<Party[]> {
        const redisKey = 'party:' + eventCode;
        const partiesJson = await redisClient.get(redisKey);

        if (!partiesJson) {
            return [];
        }

        return JSON.parse(partiesJson);

    }

    // Méthode pour sauvegarder les groupes dans Redis
    async saveGroupsToRedis(parties: Party[], eventCode: string): Promise<void> {
        try {
            // Log des données à sauvegarder dans Redis
            console.log('Données à sauvegarder dans Redis:', JSON.stringify(parties));

            // Écriture dans Redis
            await redisClient.set('party:' + eventCode, JSON.stringify(parties));

            // Confirmation de l'écriture réussie
            console.log('Écriture dans Redis réussie pour party:' + eventCode);
        } catch (error) {
            // Log en cas d'erreur
            console.error('Erreur lors de l\'écriture des groupes dans Redis:', error);
        }
    }


    async deleteGroupsFromRedis(eventCode: string): Promise<void> {
        await redisClient.set('party:' + eventCode, JSON.stringify([]));
    }

    async createOrUpdatePartiesToRedis(parties: Party[], eventCode: string): Promise<void> {
        // Charger l'historique des trois derniers shuffles
        const history = await this.getLastThreeShuffles(eventCode);

        if (history.length > 0) {
            // Remplacer le dernier élément de l'historique par le nouveau `parties`
            history[history.length - 1] = parties;
        } else {
            // Si l'historique est vide, ajouter `parties` comme première entrée
            history.push(parties);
        }

        // Sauvegarder l'historique mis à jour dans Redis
        await redisClient.set(`${this.shuffleHistoryKey}:${eventCode}`, JSON.stringify(history));

        this.saveGroupsToRedis(parties, eventCode);

    }


    // Filtrer les personnages par rôle
    private filterCharactersByRole(characters: Character[]) {
        const tanks = characters.filter(char => SpecializationDetails[char.specialization].role === 'TANK').sort((a, b) => b.iLevel - a.iLevel);
        const healers = characters.filter(char => SpecializationDetails[char.specialization].role === 'HEAL').sort((a, b) => b.iLevel - a.iLevel);
        const melees = characters.filter(char => SpecializationDetails[char.specialization].role === 'CAC').sort((a, b) => b.iLevel - a.iLevel);
        const dists = characters.filter(char => SpecializationDetails[char.specialization].role === 'DIST').sort((a, b) => b.iLevel - a.iLevel);
        const brs = characters.filter(char => SpecializationDetails[char.specialization].battleRez === true && char.role !== 'TANK').sort((a, b) => b.iLevel - a.iLevel);
        const bls = characters.filter(char => SpecializationDetails[char.specialization].bloodLust === true && char.role !== 'TANK').sort((a, b) => b.iLevel - a.iLevel);

        return { tanks, healers, melees, dists, brs, bls };
    }

    private createParties(characters: Character[], parties: Party[]) {
        // Nombre total de parties nécessaires
        const numberOfParties = Math.ceil(characters.length / 5);

        for (let i = 0; i < numberOfParties; i++) {
            const party = new Party();
            parties.push(party);
        }
    }

    // Étape 1 : Créer un groupe pour chaque Tank
    private assignTanksToParties(tanks: Character[], parties: Party[], usedCharacters: Set<number>) {
        let tankIndex = 0;

        // Assigner un tank à chaque groupe existant
        parties.forEach(party => {
            if (tankIndex < tanks.length) {
                const tank = tanks[tankIndex];
                party.members.push(tank);
                usedCharacters.add(tank.id);
                tankIndex++;
            }
        });

        // Créer un nouveau groupe pour chaque tank restant
        while (tankIndex < tanks.length) {
            const tank = tanks[tankIndex];
            const newParty = new Party();
            newParty.members = [tank];
            usedCharacters.add(tank.id);
            parties.push(newParty);
            tankIndex++;
        }
    }


    private createPartiesForHealers(healers: Character[], parties: Party[], usedCharacters: Set<number>) {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const shuffledHealers = shuffleArray(healers);

        // Étape 1 : Ajouter des soigneurs aux groupes sans tanks
        parties.forEach((party) => {
            const hasTank = party.members.some((member) => member.role === 'TANK'); // Vérifie si le groupe a un tank
            if (!hasTank && shuffledHealers.length > 0) { // Si pas de tank et soigneurs disponibles
                const healerToAdd = shuffledHealers.shift(); // Prendre un soigneur
                if (healerToAdd) {
                    party.members.push(healerToAdd); // Ajouter au groupe
                    usedCharacters.add(healerToAdd.id); // Marquer comme utilisé
                }
            }
        });

        // Étape 2 : Calculer les soigneurs restants pour créer de nouveaux groupes
        const remainingPartyToAdd = shuffledHealers.length - parties.length;

        if (remainingPartyToAdd > 0) {
            for (let i = 0; i < remainingPartyToAdd; i++) {
                const party = new Party();
                parties.push(party);
                const healerToAdd = shuffledHealers.shift();
                if (healerToAdd) {
                    party.members = [healerToAdd];
                    usedCharacters.add(healerToAdd.id);
                }
            }
        }
    }


    private assignBRToParties(brs: Character[], parties: Party[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
        //Pull of role to pick randomly
        let roles = ['HEAL', 'DIST', 'CAC'];

        //Init character with Battle Rez to add to the party
        let brToAdd: Character | null | undefined = null;

        //Browse all existing parties
        parties.forEach(party => {
            //Process only if the tank doesn't already have Battle Rez
            if (!party.members[0].battleRez) {

                //Remove HEAL from the role pull if previously added Battle Rez character is HEAL
                if (party.members.length > 0 && party.members[0].role === 'HEAL') {
                    roles = roles.filter(role => role !== 'HEAL');
                }

                //Conitnue until no character to add was found or no role left
                while (!brToAdd && roles.length > 0) {

                    //Pick a random role with Battle Rez to add to the party
                    const randomRole = roles[Math.floor(Math.random() * roles.length)];

                    // Supposons que le premier membre du groupe est déjà défini
                    const referenceILevel = party.members[0].iLevel;

                    // Filtrer les brs qui respectent les conditions de rôle et ne sont pas utilisés
                    let availableBrs = brs.filter(br => br.role === randomRole && !usedCharacters.has(br.id));

                    let filteredBrs = this.filterEligibleMembers(availableBrs, party, partiesHistory);
                    availableBrs = filteredBrs.length > 0 ? filteredBrs : availableBrs;

                    const filteredKeystoneBrs = availableBrs.sort((a, b) => a.keystoneMinLevel - b.keystoneMinLevel);

                    brToAdd = filteredKeystoneBrs.reduce((closestBr, currentBr) => {
                        const closestKeystoneDiff = closestBr.keystoneMaxLevel - closestBr.keystoneMinLevel;
                        const currentKeystoneDiff = currentBr.keystoneMaxLevel - currentBr.keystoneMinLevel;

                        if (currentKeystoneDiff < closestKeystoneDiff) {
                            // Prendre le personnage avec la plus petite différence de keystones
                            return currentBr;
                        } else if (currentKeystoneDiff === closestKeystoneDiff) {
                            // En cas d'égalité sur la différence de keystones, comparer l'iLevel
                            const closestDifference = Math.abs(closestBr.iLevel - referenceILevel);
                            const currentDifference = Math.abs(currentBr.iLevel - referenceILevel);

                            // Retourner celui avec l'iLevel le plus proche de la référence
                            return currentDifference < closestDifference ? currentBr : closestBr;
                        }

                        return closestBr;
                    }, availableBrs[0]); // Initialisation avec le premier élément


                    if (brToAdd) {
                        //Add the character with Battle rez to the party
                        party.members.push(brToAdd);
                        usedCharacters.add(brToAdd.id)
                        console.log(`Added ${brToAdd.name} as Battle Rez to the party: ${party.id}`);

                    }
                    else {
                        //If no character with Battle rez was find for this role: remove the rol from the list
                        roles = roles.filter(role => role !== randomRole);
                    }
                }
                brToAdd = null;
                roles = ['HEAL', 'DIST', 'CAC'];
            }
        });

    }

    private assignBLToParties(bls: Character[], parties: Party[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
        //Pull of role to pick randomly
        let roles = ['HEAL', 'DIST', 'CAC'];

        //Init character with Blood Lust to add to the party
        let blToAdd: Character | null | undefined = null;

        parties.forEach(party => {

            //Remove HEAL from the role pull if previously added Battle Rez character is HEAL
            if (party.members.length > 0 && party.members[0].role === 'HEAL' || party.members.length > 1 && party.members[1].role === 'HEAL') {
                roles = roles.filter(role => role !== 'HEAL');
            }

            while (!blToAdd && roles.length > 0) {
                const randomRole = roles[Math.floor(Math.random() * roles.length)];
                const referenceILevel = party.members[0].iLevel;

                // Filtrer les brs qui respectent les conditions de rôle et ne sont pas utilisés
                let availableBls = bls.filter(bl => bl.role === randomRole && !usedCharacters.has(bl.id));

                let filteredBls = this.filterEligibleMembers(availableBls, party, partiesHistory);
                availableBls = filteredBls.length > 0 ? filteredBls : availableBls;

                const filteredKeystoneBrs = availableBls.sort((a, b) => a.keystoneMinLevel - b.keystoneMinLevel);

                blToAdd = filteredKeystoneBrs.reduce((closestBr, currentBr) => {
                    const closestKeystoneDiff = closestBr.keystoneMaxLevel - closestBr.keystoneMinLevel;
                    const currentKeystoneDiff = currentBr.keystoneMaxLevel - currentBr.keystoneMinLevel;

                    if (currentKeystoneDiff < closestKeystoneDiff) {
                        // Prendre le personnage avec la plus petite différence de keystones
                        return currentBr;
                    } else if (currentKeystoneDiff === closestKeystoneDiff) {
                        // En cas d'égalité sur la différence de keystones, comparer l'iLevel
                        const closestDifference = Math.abs(closestBr.iLevel - referenceILevel);
                        const currentDifference = Math.abs(currentBr.iLevel - referenceILevel);

                        // Retourner celui avec l'iLevel le plus proche de la référence
                        return currentDifference < closestDifference ? currentBr : closestBr;
                    }

                    return closestBr;
                }, availableBls[0]); // Initialisation avec le premier élément

                if (blToAdd) {
                    party.members.push(blToAdd);
                    usedCharacters.add(blToAdd.id)
                    console.log(`Added ${blToAdd.name} as Blood Lust to the party: ${party.id}`);
                }
                else {
                    roles = roles.filter(role => role !== randomRole);
                }
            }
            blToAdd = null;
            roles = ['HEAL', 'DIST', 'CAC'];
        });
    }



    // Étape 2 : Ajouter un HEAL dans chaque groupe
    private assignHealersToParties(parties: Party[], healers: Character[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
        parties.forEach(party => {
            // Si le groupe n'a pas encore de HEAL
            if (!party.members.find(member => member.role === 'HEAL')) {
                const partyIlevel = party.members[0].iLevel; // On prend l'ilevel du premier membre du groupe

                // Filtrer les soigneurs qui ne sont pas déjà utilisés
                let availableHealers = healers.filter(healer => !usedCharacters.has(healer.id));

                let filteredHealers = this.filterEligibleMembers(availableHealers, party, partiesHistory);
                availableHealers = filteredHealers.length > 0 ? filteredHealers : availableHealers;

                if (availableHealers.length > 0) {
                    // Trouver le soigneur optimal
                    const healerToAdd = availableHealers.reduce((bestHealer, currentHealer) => {
                        const bestKeystoneDiff = bestHealer.keystoneMaxLevel - bestHealer.keystoneMinLevel;
                        const currentKeystoneDiff = currentHealer.keystoneMaxLevel - currentHealer.keystoneMinLevel;

                        if (currentKeystoneDiff < bestKeystoneDiff) {
                            // Prendre celui avec la plus petite différence de keystones
                            return currentHealer;
                        } else if (currentKeystoneDiff === bestKeystoneDiff) {
                            // Si égalité, comparer l'iLevel par rapport au partyIlevel
                            const bestDifference = Math.abs(bestHealer.iLevel - partyIlevel);
                            const currentDifference = Math.abs(currentHealer.iLevel - partyIlevel);
                            return currentDifference < bestDifference ? currentHealer : bestHealer;
                        }

                        return bestHealer;
                    });

                    if (healerToAdd) {
                        party.members.push(healerToAdd); // Ajouter le soigneur au groupe
                        usedCharacters.add(healerToAdd.id); // Marquer le soigneur comme utilisé
                        console.log(`Added ${healerToAdd.name} as healer to the party: ${party.id}`);
                    }
                }
            }
        });
    }

    private addignDistAndMelees(dists: Character[], melees: Character[], parties: Party[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
        parties.forEach(party => {
            // Filtrer les DPS éligibles
            let filteredMelees = this.filterEligibleMembers(melees, party, partiesHistory);
            melees = filteredMelees.find(fm => !usedCharacters.has(fm.id)) ? filteredMelees : melees;

            let filteredDists = this.filterEligibleMembers(dists, party, partiesHistory);
            dists = filteredDists.find(fd => !usedCharacters.has(fd.id)) ? filteredDists : dists;

            // Ajouter un CAC au groupe s'il n'y en a pas encore
            if (!party.members.find(member => member.role === 'CAC')) {
                const meleeToAdd = melees.reduce((bestMelee, currentMelee) => {
                    const bestKeystoneDiff = bestMelee.keystoneMaxLevel - bestMelee.keystoneMinLevel;
                    const currentKeystoneDiff = currentMelee.keystoneMaxLevel - currentMelee.keystoneMinLevel;

                    if (currentKeystoneDiff < bestKeystoneDiff) {
                        return currentMelee;
                    } else if (currentKeystoneDiff === bestKeystoneDiff) {
                        const bestDifference = Math.abs(bestMelee.iLevel - party.members[0].iLevel);
                        const currentDifference = Math.abs(currentMelee.iLevel - party.members[0].iLevel);
                        return currentDifference < bestDifference ? currentMelee : bestMelee;
                    }

                    return bestMelee;
                }, melees[0]);

                if (meleeToAdd && !usedCharacters.has(meleeToAdd.id)) {
                    party.members.push(meleeToAdd);
                    usedCharacters.add(meleeToAdd.id);
                    console.log(`Added ${meleeToAdd.name} as CAC to the party: ${party.id}`);
                }
            }

            // Ajouter un DIST au groupe s'il n'y en a pas encore
            if (!party.members.find(member => member.role === 'DIST')) {
                const distToAdd = dists.reduce((bestDist, currentDist) => {
                    const bestKeystoneDiff = bestDist.keystoneMaxLevel - bestDist.keystoneMinLevel;
                    const currentKeystoneDiff = currentDist.keystoneMaxLevel - currentDist.keystoneMinLevel;

                    if (currentKeystoneDiff < bestKeystoneDiff) {
                        return currentDist;
                    } else if (currentKeystoneDiff === bestKeystoneDiff) {
                        const bestDifference = Math.abs(bestDist.iLevel - party.members[0].iLevel);
                        const currentDifference = Math.abs(currentDist.iLevel - party.members[0].iLevel);
                        return currentDifference < bestDifference ? currentDist : bestDist;
                    }

                    return bestDist;
                }, dists[0]);

                if (distToAdd && !usedCharacters.has(distToAdd.id)) {
                    party.members.push(distToAdd);
                    usedCharacters.add(distToAdd.id);
                    console.log(`Added ${distToAdd.name} as DIST to the party: ${party.id}`);
                }
            }
        });
    }


    private completePartiesWithRemainingDPS(unusedDps: Character[], parties: Party[]): Character[] {
        parties.forEach(party => {
            while (this.isDpsAvailable(party) && unusedDps.length > 0) {
                // Calculer l'iLevel moyen des membres actuels du groupe
                const partyIlevel = party.members.reduce((sum, member) => sum + member.iLevel, 0) / party.members.length;

                // Trouver le meilleur DPS selon les critères
                const dpsToAdd = unusedDps.reduce((bestDps, currentDps) => {
                    const bestKeystoneDiff = bestDps.keystoneMaxLevel - bestDps.keystoneMinLevel;
                    const currentKeystoneDiff = currentDps.keystoneMaxLevel - currentDps.keystoneMinLevel;

                    if (currentKeystoneDiff < bestKeystoneDiff) {
                        return currentDps;
                    } else if (currentKeystoneDiff === bestKeystoneDiff) {
                        const bestDifference = Math.abs(bestDps.iLevel - partyIlevel);
                        const currentDifference = Math.abs(currentDps.iLevel - partyIlevel);
                        return currentDifference < bestDifference ? currentDps : bestDps;
                    }

                    return bestDps;
                }, unusedDps[0]);

                // Ajouter le DPS trouvé au groupe
                if (dpsToAdd) {
                    party.members.push(dpsToAdd);
                    unusedDps = unusedDps.filter(dps => dps.id !== dpsToAdd.id); // Retirer le DPS des inutilisés
                    console.log(`Added ${dpsToAdd.name} as remaining DPS to the party: ${party.id}`);
                } else {
                    break; // Si aucun DPS valide, sortir de la boucle
                }
            }
        });
        return unusedDps; // Retourner les DPS non utilisés après avoir complété les groupes
    }


    private createGroupForRemainingDPS(unusedDps: Character[], parties: Party[]) {
        // shuffle unused DPS
        unusedDps.sort(() => Math.random() - 0.5);
        if (unusedDps.length > 0) {
            let party = new Party();
            parties.push(party);
            unusedDps.forEach(dps => {
                if (party.members.length >= 3) {
                    party = new Party();
                    parties.push(party);
                }
                party.members.push(dps);
                console.log(`Added ${dps.name} as remaining DPS to the party: ${party.id}`);
            });
        }
    }

    private isDpsAvailable(party: Party) {
        return party.members.filter(member => member.role === 'DIST' || member.role === 'CAC').length < 3;
    }

}

export const partyService = new PartyService();