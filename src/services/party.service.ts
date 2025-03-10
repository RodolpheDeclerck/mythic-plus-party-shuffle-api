import { Character } from '../entities/character.entity.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { Party } from '../entities/party.entity.js';
import redisClient from '../config/redis-client.js';

class PartyService {
    private shuffleHistoryKey = 'partyShuffleHistory';

    // Fonction principale pour mélanger les groupes
    async shuffleGroups(characters: Character[], eventCode: string): Promise<Party[]> {
        if (characters.length === 0) {
            return [];
        }

        const parties: Party[] = [];
        const partiesHistory = await this.getLastThreeShuffles(eventCode);
        const usedCharacters = new Set<number>();

        // Mélanger tous les personnages avant de les filtrer
        characters = this.shuffleArray(characters);

        // Filtrer et mélanger les personnages par rôle
        let { tanks, healers, melees, dists, brs, bls } = this.filterCharactersByRole(characters);

        // Si aucun tank ni heal, créer des groupes de DPS uniquement
        if (tanks.length === 0 && healers.length === 0) {
            const allDps = [...melees, ...dists];
            const dpsOnlyParties = this.createBalancedDpsOnlyGroups(allDps, brs, bls, partiesHistory);
            this.checkGroupQuality(dpsOnlyParties);
            return dpsOnlyParties;
        }

        // Créer le nombre nécessaire de groupes
        const numberOfParties = Math.max(
            1,
            tanks.length,
            healers.length,
            Math.ceil(characters.length / 5)
        );

        // Créer les groupes initiaux
        for (let i = 0; i < numberOfParties; i++) {
            parties.push(new Party());
        }

        // Mélanger l'ordre des groupes
        this.shuffleArray(parties);

        // Distribuer les tanks et healers de manière aléatoire
        const availableParties = [...parties];
        this.shuffleArray(availableParties);

        // Assigner les tanks
        tanks.forEach(tank => {
            if (availableParties.length > 0) {
                const party = availableParties.pop()!;
                party.members.push(tank);
                usedCharacters.add(tank.id);
            } else {
                const newParty = new Party();
                newParty.members.push(tank);
                usedCharacters.add(tank.id);
                parties.push(newParty);
            }
        });

        // Mélanger à nouveau les groupes avant d'assigner les healers
        this.shuffleArray(parties);

        // Assigner les healers aux groupes qui n'en ont pas
        healers.forEach(healer => {
            if (!usedCharacters.has(healer.id)) {
                const eligibleParties = parties.filter(p => !p.members.some(m => m.role === 'HEAL'));
                if (eligibleParties.length > 0) {
                    const randomParty = eligibleParties[Math.floor(Math.random() * eligibleParties.length)];
                    randomParty.members.push(healer);
                    usedCharacters.add(healer.id);
                } else {
                    const newParty = new Party();
                    newParty.members.push(healer);
                    usedCharacters.add(healer.id);
                    parties.push(newParty);
                }
            }
        });

        // Mélanger les groupes avant d'assigner BR et BL
        this.shuffleArray(parties);

        // Assigner BR et BL
        this.assignBRToParties(brs, parties, usedCharacters, partiesHistory);
        this.assignBLToParties(bls, parties, usedCharacters, partiesHistory);

        // Mélanger à nouveau avant d'assigner les DPS
        this.shuffleArray(parties);

        // Assigner les DPS restants
        this.addignDistAndMelees(dists, melees, parties, usedCharacters, partiesHistory);

        let unusedDps: Character[] = [];
        [...dists, ...melees].forEach(dps => {
            if (!usedCharacters.has(dps.id)) {
                unusedDps.push(dps);
            }
        });

        // Mélanger les DPS non utilisés
        unusedDps = this.shuffleArray(unusedDps);

        // Compléter les groupes avec les DPS restants
        unusedDps = this.completePartiesWithRemainingDPS(unusedDps, parties);

        // Créer des groupes pour les DPS restants
        this.createGroupForRemainingDPS(unusedDps, parties);

        // Optimiser la distribution globale
        console.log('Optimisation de la distribution globale des groupes...');
        this.optimizeGlobalDistribution(parties, partiesHistory);
        console.log('Optimisation terminée');

        // Vérification finale : s'assurer que tous les joueurs sont dans un groupe
        const allAssignedPlayers = new Set(parties.flatMap(p => p.members.map(m => m.id)));
        const unassignedPlayers = characters.filter(c => !allAssignedPlayers.has(c.id));
        
        if (unassignedPlayers.length > 0) {
            console.log(`Répartition des ${unassignedPlayers.length} joueurs non assignés...`);
            this.distributeUnassignedPlayers(unassignedPlayers, parties);
        }

        // Vérifier la qualité des groupes formés
        this.checkGroupQuality(parties);

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

    private calculateRedundancyScore(candidate: Character, party: Party, previousShuffles: Party[][]): number {
        let score = 0;
        const currentGroupMembers = party.members.map(member => member.id);
        
        // Parcourir l'historique du plus récent au plus ancien
        for (let shuffleIndex = previousShuffles.length - 1; shuffleIndex >= 0; shuffleIndex--) {
            const shuffle = previousShuffles[shuffleIndex];
            const weight = 1 / (previousShuffles.length - shuffleIndex); // Plus récent = plus de poids
            
            for (const group of shuffle) {
                const commonMembers = group.members.filter(m => 
                    currentGroupMembers.includes(m.id) || m.id === candidate.id
                ).length;
                
                if (commonMembers > 0) {
                    score += commonMembers * weight;
                }
            }
        }
        
        return score;
    }

    private swapMembers(party1: Party, party2: Party, member1: Character, member2: Character): void {
        const index1 = party1.members.indexOf(member1);
        const index2 = party2.members.indexOf(member2);
        
        if (index1 !== -1 && index2 !== -1) {
            party1.members[index1] = member2;
            party2.members[index2] = member1;
        }
    }

    private optimizeGlobalDistribution(parties: Party[], previousShuffles: Party[][]): void {
        const allMembers = parties.flatMap(p => p.members);
        let improved = true;
        let iterations = 0;
        const MAX_ITERATIONS = 100; // Éviter les boucles infinies

        while (improved && iterations < MAX_ITERATIONS) {
            improved = false;
            iterations++;
            
            // Essayer d'échanger des membres entre les groupes
            for (let i = 0; i < parties.length; i++) {
                for (let j = i + 1; j < parties.length; j++) {
                    const party1 = parties[i];
                    const party2 = parties[j];
                    
                    for (const member1 of party1.members) {
                        for (const member2 of party2.members) {
                            // Vérifier si l'échange est possible (même rôle)
                            if (member1.role === member2.role) {
                                // Calculer le score avant l'échange
                                const scoreBefore = 
                                    this.calculateRedundancyScore(member1, party1, previousShuffles) +
                                    this.calculateRedundancyScore(member2, party2, previousShuffles);
                                
                                // Simuler l'échange
                                const scoreAfter = 
                                    this.calculateRedundancyScore(member2, party1, previousShuffles) +
                                    this.calculateRedundancyScore(member1, party2, previousShuffles);
                                
                                // Si l'échange améliore le score global
                                if (scoreAfter < scoreBefore) {
                                    // Effectuer l'échange
                                    this.swapMembers(party1, party2, member1, member2);
                                    improved = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private filterEligibleMembers(
        candidates: Character[],
        party: Party,
        previousShuffles: Party[][]
    ): Character[] {
        if (previousShuffles.length === 0 || party.members.length === 0) {
            return candidates;
        }

        // Calculer les scores de redondance pour chaque candidat
        const candidateScores = candidates.map(candidate => ({
            candidate,
            score: this.calculateRedundancyScore(candidate, party, previousShuffles)
        }));

        // Trouver le score minimum
        const minScore = Math.min(...candidateScores.map(c => c.score));

        // Filtrer les candidats avec le score minimum
        const leastRedundantCandidates = candidateScores
            .filter(c => c.score === minScore)
            .map(c => c.candidate);

        if (party.members.length === 0) {
            return leastRedundantCandidates;
        }

        // Calculer la plage de keystone du groupe
        const partyKeyMin = Math.min(...party.members.map(m => m.keystoneMinLevel));
        const partyKeyMax = Math.max(...party.members.map(m => m.keystoneMaxLevel));

        // Essayer d'abord avec des critères stricts
        const strictCompatibleCandidates = leastRedundantCandidates.filter(candidate =>
            candidate.keystoneMinLevel <= partyKeyMin &&
            candidate.keystoneMaxLevel >= partyKeyMax
        );

        if (strictCompatibleCandidates.length > 0) {
            return strictCompatibleCandidates;
        }

        // Si aucun candidat strictement compatible, essayer avec des critères plus souples
        const KEYSTONE_TOLERANCE = 2; // Tolérance de 2 niveaux
        const looseCompatibleCandidates = leastRedundantCandidates.filter(candidate =>
            Math.abs(candidate.keystoneMinLevel - partyKeyMin) <= KEYSTONE_TOLERANCE &&
            Math.abs(candidate.keystoneMaxLevel - partyKeyMax) <= KEYSTONE_TOLERANCE
        );

        if (looseCompatibleCandidates.length > 0) {
            return looseCompatibleCandidates;
        }

        // Si toujours aucun candidat, retourner les candidats avec la plus petite différence de keystone
        return leastRedundantCandidates.sort((a, b) => {
            const aDiff = Math.abs(a.keystoneMinLevel - partyKeyMin) + Math.abs(a.keystoneMaxLevel - partyKeyMax);
            const bDiff = Math.abs(b.keystoneMinLevel - partyKeyMin) + Math.abs(b.keystoneMaxLevel - partyKeyMax);
            return aDiff - bDiff;
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

    async deleteShuffleHistory(eventCode: string): Promise<void> {
        await redisClient.set(`${this.shuffleHistoryKey}:${eventCode}`, JSON.stringify([]));
    }

    async deleteGroupsFromRedis(eventCode: string): Promise<void> {
        // Réinitialiser l'historique des shuffles
        await this.deleteShuffleHistory(eventCode);
        // Réinitialiser les groupes actuels
        await redisClient.set('party:' + eventCode, JSON.stringify([]));
    }

    async createOrUpdatePartiesToRedis(parties: Party[], eventCode: string): Promise<void> {
        // Sauvegarder le nouveau shuffle dans l'historique
        await this.saveShuffleToHistory(eventCode, parties);

        // Sauvegarder l'état actuel des groupes
        await this.saveGroupsToRedis(parties, eventCode);
    }


    // Filtrer les personnages par rôle
    private filterCharactersByRole(characters: Character[]) {
        const tanks = characters
            .filter(char => SpecializationDetails[char.specialization].role === 'TANK')
            .sort((a, b) => {
                // Trier par keystoneMaxLevel - keystoneMinLevel croissant
                const diffA = a.keystoneMaxLevel - a.keystoneMinLevel;
                const diffB = b.keystoneMaxLevel - b.keystoneMinLevel;

                if (diffA !== diffB) {
                    return diffA - diffB; // Différence croissante
                }

                // En cas d'égalité, trier par iLevel décroissant
                return b.iLevel - a.iLevel;
            });
        const healers = characters.filter(char => SpecializationDetails[char.specialization].role === 'HEAL').sort((a, b) => b.iLevel - a.iLevel);
        const melees = characters.filter(char => SpecializationDetails[char.specialization].role === 'CAC').sort((a, b) => b.iLevel - a.iLevel);
        const dists = characters.filter(char => SpecializationDetails[char.specialization].role === 'DIST').sort((a, b) => b.iLevel - a.iLevel);
        const brs = characters.filter(char => SpecializationDetails[char.specialization].battleRez === true && char.role !== 'TANK').sort((a, b) => b.iLevel - a.iLevel);
        const bls = characters.filter(char => SpecializationDetails[char.specialization].bloodLust === true && char.role !== 'TANK').sort((a, b) => b.iLevel - a.iLevel);

        return { tanks, healers, melees, dists, brs, bls };
    }

    private createParties(characters: Character[], parties: Party[]) {
        // Compter le nombre de tanks et healers
        const tanks = characters.filter(char => SpecializationDetails[char.specialization].role === 'TANK');
        const healers = characters.filter(char => SpecializationDetails[char.specialization].role === 'HEAL');
        
        // Calculer le nombre de groupes nécessaires
        // Au moins 1 groupe, et le maximum entre :
        // - le nombre de tanks
        // - le nombre de healers (un healer par groupe)
        // - le nombre total de joueurs divisé par 5
        const numberOfParties = Math.max(
            1,
            tanks.length,
            healers.length,  // On veut un groupe par healer
            Math.ceil(characters.length / 5)
        );

        for (let i = 0; i < numberOfParties; i++) {
            const party = new Party();
            parties.push(party);
        }
    }

    // Étape 1 : Créer un groupe pour chaque Tank
    private assignTanksToParties(tanks: Character[], parties: Party[], usedCharacters: Set<number>) {
        let tankIndex = 0;

        // Si aucun tank, mais qu'il y a des personnages, on continue
        if (tanks.length === 0 && parties.length > 0) {
            return;
        }

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
        // Si nous avons un seul healer et aucun membre dans les groupes existants, l'ajouter au premier groupe
        if (healers.length === 1 && parties.length > 0 && parties[0].members.length === 0) {
            const healer = healers[0];
            parties[0].members.push(healer);
            usedCharacters.add(healer.id);
            return;
        }

        const shuffledHealers = healers
            .filter(char => SpecializationDetails[char.specialization].role === 'HEAL')
            .sort((a, b) => {
                // Trier par keystoneMaxLevel - keystoneMinLevel croissant
                const diffA = a.keystoneMaxLevel - a.keystoneMinLevel;
                const diffB = b.keystoneMaxLevel - b.keystoneMinLevel;

                if (diffA !== diffB) {
                    return diffA - diffB; // Différence croissante
                }

                // En cas d'égalité, trier par iLevel décroissant
                return b.iLevel - a.iLevel;
            });

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
            if (party.members.length > 0 && !party.members[0].battleRez) {

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

            if (party.members.length > 0) {
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
            }
        });
    }



    // Étape 2 : Ajouter un HEAL dans chaque groupe
    private assignHealersToParties(parties: Party[], healers: Character[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
        // Créer une copie des healers disponibles
        let availableHealers = [...healers].filter(healer => !usedCharacters.has(healer.id));

        // D'abord, essayer d'ajouter un healer à chaque groupe existant qui n'en a pas
        parties.forEach(party => {
            if (party.members.length > 0 && !party.members.find(member => member.role === 'HEAL') && availableHealers.length > 0) {
                const partyIlevel = party.members[0].iLevel;

                let filteredHealers = this.filterEligibleMembers(availableHealers, party, partiesHistory);
                let healersToConsider = filteredHealers.length > 0 ? filteredHealers : availableHealers;

                if (healersToConsider.length > 0) {
                    // Trouver le healer optimal
                    const healerToAdd = healersToConsider.reduce((bestHealer, currentHealer) => {
                        const bestKeystoneDiff = bestHealer.keystoneMaxLevel - bestHealer.keystoneMinLevel;
                        const currentKeystoneDiff = currentHealer.keystoneMaxLevel - currentHealer.keystoneMinLevel;

                        if (currentKeystoneDiff < bestKeystoneDiff) {
                            return currentHealer;
                        } else if (currentKeystoneDiff === bestKeystoneDiff) {
                            const bestDifference = Math.abs(bestHealer.iLevel - partyIlevel);
                            const currentDifference = Math.abs(currentHealer.iLevel - partyIlevel);
                            return currentDifference < bestDifference ? currentHealer : bestHealer;
                        }
                        return bestHealer;
                    });

                    if (healerToAdd) {
                        party.members.push(healerToAdd);
                        usedCharacters.add(healerToAdd.id);
                        console.log(`Added ${healerToAdd.name} as healer to the party: ${party.id}`);
                        availableHealers = availableHealers.filter(h => h.id !== healerToAdd.id);
                    }
                }
            }
        });

        // Ensuite, créer de nouveaux groupes pour les healers restants
        availableHealers.forEach(healer => {
            if (!usedCharacters.has(healer.id)) {
                const party = new Party();
                party.members.push(healer);
                usedCharacters.add(healer.id);
                parties.push(party);
                console.log(`Created new party with healer: ${healer.name}`);
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
        if (unusedDps.length === 0) return;

        // Trier les DPS par keystone et iLevel
        unusedDps.sort((a, b) => {
            const aKeyRange = a.keystoneMaxLevel - a.keystoneMinLevel;
            const bKeyRange = b.keystoneMaxLevel - b.keystoneMinLevel;
            if (aKeyRange !== bKeyRange) return aKeyRange - bKeyRange;
            return b.iLevel - a.iLevel;
        });

        let currentParty = new Party();
        parties.push(currentParty);

        for (const dps of unusedDps) {
            if (currentParty.members.length >= 5) {
                currentParty = new Party();
                parties.push(currentParty);
            }
            currentParty.members.push(dps);
            console.log(`Added ${dps.name} as remaining DPS to the party: ${currentParty.id}`);
        }
    }

    private isDpsAvailable(party: Party) {
        return party.members.filter(member => member.role === 'DIST' || member.role === 'CAC').length < 3;
    }

    private shuffleArray<T>(array: T[]): T[] {
        // Créer une copie de l'array pour ne pas modifier l'original
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private createBalancedDpsOnlyGroups(
        allDps: Character[],
        brs: Character[],
        bls: Character[],
        partiesHistory: Party[][]
    ): Party[] {
        const parties: Party[] = [];
        const usedCharacters = new Set<number>();
        const targetGroupSize = 5;

        // Créer des groupes de taille optimale
        while (allDps.length > 0) {
            const party = new Party();
            parties.push(party);

            // Essayer d'ajouter un BR s'il y en a de disponible
            const availableBr = brs.find(br => !usedCharacters.has(br.id));
            if (availableBr) {
                party.members.push(availableBr);
                usedCharacters.add(availableBr.id);
                allDps = allDps.filter(dps => dps.id !== availableBr.id);
            }

            // Essayer d'ajouter un BL s'il y en a de disponible
            const availableBl = bls.find(bl => !usedCharacters.has(bl.id));
            if (availableBl) {
                party.members.push(availableBl);
                usedCharacters.add(availableBl.id);
                allDps = allDps.filter(dps => dps.id !== availableBl.id);
            }

            // Remplir le reste du groupe
            while (party.members.length < targetGroupSize && allDps.length > 0) {
                const dpsToAdd = allDps[0];
                party.members.push(dpsToAdd);
                usedCharacters.add(dpsToAdd.id);
                allDps = allDps.filter(dps => dps.id !== dpsToAdd.id);
            }
        }

        return parties;
    }

    private distributeUnassignedPlayers(unassignedPlayers: Character[], parties: Party[]): void {
        // Trier les groupes par taille croissante
        parties.sort((a, b) => a.members.length - b.members.length);

        for (const player of unassignedPlayers) {
            // Trouver le groupe le plus petit qui peut accueillir le joueur
            const targetParty = parties.find(p => p.members.length < 5);
            
            if (targetParty) {
                targetParty.members.push(player);
            } else {
                // Si aucun groupe existant ne peut accueillir le joueur, créer un nouveau groupe
                const newParty = new Party();
                newParty.members.push(player);
                parties.push(newParty);
            }
        }
    }

    // Ajouter une méthode pour vérifier la qualité des groupes
    private checkGroupQuality(parties: Party[]): void {
        parties.forEach((party, index) => {
            if (party.members.length === 0) return;

            const keyMin = Math.min(...party.members.map(m => m.keystoneMinLevel));
            const keyMax = Math.max(...party.members.map(m => m.keystoneMaxLevel));
            const keyRange = keyMax - keyMin;

            if (keyRange > 4) { // Si la différence est trop grande
                console.log(`⚠️ Groupe ${index + 1} : Large écart de keystones (${keyMin}-${keyMax})`);
                party.members.forEach(member => {
                    console.log(`  - ${member.name}: ${member.keystoneMinLevel}-${member.keystoneMaxLevel}`);
                });
            }
        });
    }

}

export const partyService = new PartyService();