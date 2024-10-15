import { Character } from '../models/character.entity.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { Party } from '../models/party.entity.js';
import { CharacterClass } from '../enums/characterClass.enum.js';
import redisClient from '../config/redis-client.js';

class PartyService {

    // Fonction principale pour mélanger les groupes
    async shuffleGroups(characters: Character[]): Promise<Party[]> {
        const parties: Party[] = [];

        const usedCharacters = new Set<number>(); // Pour éviter les doublons

        // Filtrer les personnages selon leur rôle
        let { tanks, healers, melees, dists, brs, bls } = this.filterCharactersByRole(characters);

        // Creer un groupe pour chaque tank
        this.assignTanksToParties(tanks, parties, usedCharacters);

        // Creer un groupe pour chaque healer
        this.createPartiesForHealers(healers, parties, usedCharacters);

        //Add a Battle rez from random role to the party if needed
        this.assignBRToParties(brs, parties, usedCharacters);

        //Add a Blood Lust to the group
        this.assignBLToParties(bls, parties, usedCharacters);


        //Add healer to all parties without healer
        this.assignHealersToParties(parties, healers, usedCharacters);

        this.addignDistAndMelees(dists, melees, parties, usedCharacters);



        let unusedDps: Character[] = [];

        [...dists, ...melees].forEach(dps => {
            if (!usedCharacters.has(dps.id)) {
                unusedDps.push(dps);
            }
        })

        //Complete parrties with remaining DPS
        this.completePartiesWithRemainingDPS(unusedDps, parties)


        return parties;
    }

    // Méthode pour récupérer les groupes à partir de Redis
    async getGroupsFromRedis(): Promise<Party[]> {
        const redisKey = 'party:1';
        const partiesJson = await redisClient.get(redisKey);

        if (partiesJson) {
            return JSON.parse(partiesJson);
        } else {
            throw new Error('No parties found in Redis');
        }
    }

    // Méthode pour sauvegarder les groupes dans Redis
    async saveGroupsToRedis(parties: Party[]): Promise<void> {
        try {
            // Log des données à sauvegarder dans Redis
            console.log('Données à sauvegarder dans Redis:', JSON.stringify(parties));

            // Écriture dans Redis
            await redisClient.set('party:1', JSON.stringify(parties));

            // Confirmation de l'écriture réussie
            console.log('Écriture dans Redis réussie pour party:1');
        } catch (error) {
            // Log en cas d'erreur
            console.error('Erreur lors de l\'écriture des groupes dans Redis:', error);
        }
    }

    async deleteGroupsFromRedis(): Promise<void> {
        await redisClient.set('party:1', JSON.stringify([]));
    }

    async createOrUpdatePartiesToRedis(parties: Party[]): Promise<void> {
        this.saveGroupsToRedis(parties);
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

    // Étape 1 : Créer un groupe pour chaque Tank
    private assignTanksToParties(tanks: Character[], parties: Party[], usedCharacters: Set<number>) {
        tanks.forEach(tank => {
            const party = new Party();
            party.members = [tank];
            usedCharacters.add(tank.id);
            parties.push(party);
        });
    }

    private createPartiesForHealers(healers: Character[], parties: Party[], usedCharacters: Set<number>) {
        const remainingPartyToAdd = healers.length - parties.length;

        if (remainingPartyToAdd > 0) {
            const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire

            const shuffledHealers = shuffleArray(healers);

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

    private assignBRToParties(brs: Character[], parties: Party[], usedCharacters: Set<number>) {
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
                    const availableBrs = brs.filter(br => br.role === randomRole && !usedCharacters.has(br.id));

                    // Trouver celui dont l'iLevel est le plus proche de referenceILevel
                    brToAdd = availableBrs.reduce((closestBr, currentBr) => {
                        const closestDifference = Math.abs(closestBr.iLevel - referenceILevel);
                        const currentDifference = Math.abs(currentBr.iLevel - referenceILevel);

                        // Sélectionner celui dont la différence d'iLevel est la plus petite
                        return currentDifference < closestDifference ? currentBr : closestBr;
                    }, availableBrs[0]); // Initialisation avec le premier élément du tableau filtré

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

    private assignBLToParties(bls: Character[], parties: Party[], usedCharacters: Set<number>) {
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
                const availableBls = bls.filter(bl => bl.role === randomRole && !usedCharacters.has(bl.id));

                // Trouver celui dont l'iLevel est le plus proche de referenceILevel
                blToAdd = availableBls.reduce((closestBl, currentBl) => {
                    const closestDifference = Math.abs(closestBl.iLevel - referenceILevel);
                    const currentDifference = Math.abs(currentBl.iLevel - referenceILevel);

                    // Sélectionner celui dont la différence d'iLevel est la plus petite
                    return currentDifference < closestDifference ? currentBl : closestBl;
                }, availableBls[0]); // Initialisation avec le premier élément du tableau filtré

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
    private assignHealersToParties(parties: Party[], healers: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            // Si le groupe n'a pas encore de HEAL
            if (!party.members.find(member => member.role === 'HEAL')) {
                const partyIlevel = party.members[0].iLevel; // On prend l'ilevel du premier membre du groupe

                // Filtrer les soigneurs qui ne sont pas déjà utilisés
                const availableHealers = healers.filter(healer => !usedCharacters.has(healer.id));

                if (availableHealers.length > 0) {
                    // On cherche le soigneur avec l'ilevel le plus proche
                    const healerToAdd = availableHealers.reduce((closestHealer, currentHealer) => {
                        const closestDifference = Math.abs(closestHealer.iLevel - partyIlevel);
                        const currentDifference = Math.abs(currentHealer.iLevel - partyIlevel);
                        return currentDifference < closestDifference ? currentHealer : closestHealer;
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

    private addignDistAndMelees(dists: Character[], melees: Character[], parties: Party[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            if (!party.members.find(member => member.role === 'CAC')) {
                const meleeToAdd = melees.find(melee => !usedCharacters.has(melee.id))
                if (meleeToAdd) {
                    party.members.push(meleeToAdd);
                    usedCharacters.add(meleeToAdd.id)
                    console.log(`Added ${meleeToAdd.name} as CAC to the party: ${party.id}`);
                }
            }

            if (!party.members.find(member => member.role === 'DIST')) {
                const distToAdd = dists.find(dist => !usedCharacters.has(dist.id))
                if (distToAdd) {
                    party.members.push(distToAdd);
                    usedCharacters.add(distToAdd.id)
                    console.log(`Added ${distToAdd.name} as DIST to the party: ${party.id}`);
                }
            }

        })
    }

    private completePartiesWithRemainingDPS(unusedDps: Character[], parties: Party[]) {
        parties.forEach(party => {
            while (party.members.length < 5 && unusedDps.length > 0) {
                // Chercher un DPS avec une classe unique
                let dpsToAdd = unusedDps.find(dps =>
                    !party.members.some(member => member.characterClass === dps.characterClass)
                ) ||
                    // Si non trouvé, chercher un DPS avec une spécialisation unique
                    unusedDps.find(dps =>
                        !party.members.some(member => member.specialization === dps.specialization)
                    ) ||
                    // Sinon, prendre le premier DPS disponible
                    unusedDps.shift();

                // Ajouter le DPS si trouvé
                if (dpsToAdd) {
                    party.members.push(dpsToAdd);
                    unusedDps = unusedDps.filter(dps => dps !== dpsToAdd);
                    console.log(`Added ${dpsToAdd.name} as remaining DPS to the party: ${party.id}`);
                } else {
                    break;
                }
            }
        });
    }


    private findCharacterWithBL(cacs: Character[], dists: Character[], usedCharacters: Set<number>, party: Party): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const partyClasses = new Set(party.members.map(member => member.characterClass));  // Classes des membres du party
        const unusedCharPool = [...cacs, ...dists].filter(char => !usedCharacters.has(char.id)); // Filtrer les personnages non utilisés dans le charPool
        const avoidSameClass = this.shouldAvoidSameClass(partyClasses, unusedCharPool);
        return shuffleArray(unusedCharPool).find(char => SpecializationDetails[char.specialization].bloodLust && (!avoidSameClass || !partyClasses.has(char.characterClass)));
    }

    private findCharacterWithBR(cacs: Character[], dists: Character[], usedCharacters: Set<number>, party: Party): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const partyClasses = new Set(party.members.map(member => member.characterClass));  // Classes des membres du party
        const unusedCharPool = [...cacs, ...dists].filter(char => !usedCharacters.has(char.id)); // Filtrer les personnages non utilisés dans le charPool
        const avoidSameClass = this.shouldAvoidSameClass(partyClasses, unusedCharPool);
        return shuffleArray(unusedCharPool).find(char => SpecializationDetails[char.specialization].battleRez && (!avoidSameClass || !partyClasses.has(char.characterClass)));
    }

    private findCharacterWithBLOrBR(cacs: Character[], dists: Character[], usedCharacters: Set<number>, party: Party): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const partyClasses = new Set(party.members.map(member => member.characterClass));  // Classes des membres du party
        const unusedCharPool = [...cacs, ...dists].filter(char => !usedCharacters.has(char.id)); // Filtrer les personnages non utilisés dans le charPool
        const avoidSameClass = this.shouldAvoidSameClass(partyClasses, unusedCharPool);
        return shuffleArray(unusedCharPool).find(char => SpecializationDetails[char.specialization].bloodLust && (!avoidSameClass || !partyClasses.has(char.characterClass)));
    }

    private findCharacterCAC(cacs: Character[], dists: Character[], usedCharacters: Set<number>, party: Party): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const partyClasses = new Set(party.members.map(member => member.characterClass));  // Classes des membres du party
        const unusedCharPool = [...cacs, ...dists].filter(char => !usedCharacters.has(char.id)); // Filtrer les personnages non utilisés dans le charPool
        const avoidSameClass = this.shouldAvoidSameClass(partyClasses, unusedCharPool);
        return shuffleArray(unusedCharPool).find(char => SpecializationDetails[char.specialization].role === 'CAC' && (!avoidSameClass || !partyClasses.has(char.characterClass)));
    }

    private findCharacterDIST(cacs: Character[], dists: Character[], usedCharacters: Set<number>, party: Party): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const partyClasses = new Set(party.members.map(member => member.characterClass));  // Classes des membres du party
        const unusedCharPool = [...cacs, ...dists].filter(char => !usedCharacters.has(char.id)); // Filtrer les personnages non utilisés dans le charPool
        const avoidSameClass = this.shouldAvoidSameClass(partyClasses, unusedCharPool);
        return shuffleArray(unusedCharPool).find(char => SpecializationDetails[char.specialization].role === 'DIST' && (!avoidSameClass || !partyClasses.has(char.characterClass)));
    }

    private findRandomDPS(cacs: Character[], dists: Character[], usedCharacters: Set<number>, party: Party): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        const partyClasses = new Set(party.members.map(member => member.characterClass));  // Classes des membres du party
        const unusedCharPool = [...cacs, ...dists].filter(char => !usedCharacters.has(char.id)); // Filtrer les personnages non utilisés dans le charPool
        const avoidSameClass = this.shouldAvoidSameClass(partyClasses, unusedCharPool);
        return shuffleArray(unusedCharPool).find(char => !usedCharacters.has(char.id) && (!avoidSameClass || !partyClasses.has(char.characterClass)));
    }

    private shouldAvoidSameClass(partyClasses: Set<CharacterClass>, unusedCharPool: Character[]): boolean {

        // Vérifier s'il y a un personnage inutilisé avec une classe déjà présente dans party
        const hasSameClassInPool = unusedCharPool.some(char => partyClasses.has(char.characterClass));

        // Vérifier s'il y a un personnage inutilisé avec une classe non présente dans party
        const hasNewClassInPool = unusedCharPool.some(char => !partyClasses.has(char.characterClass));

        // Retourner true si les deux conditions sont remplies
        return hasSameClassInPool && hasNewClassInPool;
    }

    // Étape 4 : Créer un groupe pour chaque HEAL restant
    private assignRemainingHealersToNewParties(parties: Party[], healers: Character[], usedCharacters: Set<number>) {
        healers.forEach(heal => {
            if (!usedCharacters.has(heal.id)) {
                const newParty = new Party();
                newParty.members = [heal];
                parties.push(newParty);
                usedCharacters.add(heal.id);
            }
        });
    }
}

export const partyService = new PartyService();