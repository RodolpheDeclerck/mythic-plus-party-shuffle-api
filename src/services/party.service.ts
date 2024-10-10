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
        const { tanks, healers, cacs, dists } = this.filterCharactersByRole(characters);

        // Créer un groupe pour chaque Tank
        this.assignTanksToParties(tanks, parties, usedCharacters);

        // Ajouter un HEAL dans chaque groupe en fonction de BR/BL
        this.assignHealersToParties(parties, healers, usedCharacters);

        // Créer un groupe pour chaque HEAL restant
        this.assignRemainingHealersToNewParties(parties, healers, usedCharacters);

        // Ajouter un CAC/DIST avec BR ou BL dans chaque groupe sans BR ou BL
        this.assignCacsAndDistsWithBROrBL(parties, cacs, dists, usedCharacters);

        // Ajouter un autre CAC/DIST avec BR ou BL dans chaque groupe sans BR ou BL
        this.assignCacsAndDistsWithBROrBL(parties, cacs, dists, usedCharacters);

        // Completer les groupes avec des CAC/DIST jusqu'a 5 membres en privilégiant le fait d'avoir au moins un CAC et un DIST par groupe
        this.completePartiesWithCacsAndDists(parties, cacs, dists, usedCharacters);

        // Enregistrer les groupes dans Redis
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
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire

        const tanks = shuffleArray(characters.filter(char => SpecializationDetails[char.specialization].role === 'TANK'));
        const healers = shuffleArray(characters.filter(char => SpecializationDetails[char.specialization].role === 'HEAL'));
        const cacs = shuffleArray(characters.filter(char => SpecializationDetails[char.specialization].role === 'CAC'));
        const dists = shuffleArray(characters.filter(char => SpecializationDetails[char.specialization].role === 'DIST'));

        return { tanks, healers, cacs, dists };
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

    // Étape 2 : Ajouter un HEAL dans chaque groupe
    private assignHealersToParties(parties: Party[], healers: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const tankHasBR = party.members.some(char => SpecializationDetails[char.specialization].battleRez);
            let healToAdd = this.findHealer(healers, usedCharacters, tankHasBR, party.members[0].characterClass);
            if (healToAdd) {
                party.members.push(healToAdd);
                usedCharacters.add(healToAdd.id);
            }
        });
    }

    private findHealer(healers: Character[], usedCharacters: Set<number>, tankHasBR: boolean, characterClass?: string): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        let healToAdd: Character | undefined;

        const avoidSameCharacterClass = shuffleArray(healers).some(heal => heal.characterClass === characterClass) && shuffleArray(healers).some(heal => heal.characterClass != characterClass) ? true : false;

        if (!tankHasBR) {
            healToAdd = shuffleArray(healers).find(heal => SpecializationDetails[heal.specialization].battleRez && !usedCharacters.has(heal.id) && (!avoidSameCharacterClass || heal.characterClass != characterClass));
        }
        if (!healToAdd) {
            healToAdd = shuffleArray(healers).find(heal => SpecializationDetails[heal.specialization].bloodLust && !usedCharacters.has(heal.id) && (!avoidSameCharacterClass || heal.characterClass != characterClass));
        }
        if (!healToAdd) {
            healToAdd = shuffleArray(healers).find(heal => !usedCharacters.has(heal.id) && (!avoidSameCharacterClass || heal.characterClass != characterClass));
        }

        return healToAdd;
    }


    // Étape 3 : Ajouter un CAC/DIST avec BL dans chaque groupe sans BL
    private assignCacsAndDistsWithBROrBL(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const groupHasBL = party.members.some(char => SpecializationDetails[char.specialization].bloodLust);
            const groupHasBR = party.members.some(char => SpecializationDetails[char.specialization].battleRez);
            if (!groupHasBL && groupHasBR) {
                const blToAdd = this.findCharacterWithBL(cacs, dists, usedCharacters, party);
                if (blToAdd) {
                    party.members.push(blToAdd);
                    usedCharacters.add(blToAdd.id);
                }
            }
            else if (groupHasBL && !groupHasBR) {
                const brToAdd = this.findCharacterWithBR(cacs, dists, usedCharacters, party);
                if (brToAdd) {
                    party.members.push(brToAdd);
                    usedCharacters.add(brToAdd.id);
                }
            }
            else if (!groupHasBL && !groupHasBR) {
                const characterToAdd = this.findCharacterWithBLOrBR(cacs, dists, usedCharacters, party);
                if (characterToAdd) {
                    party.members.push(characterToAdd);
                    usedCharacters.add(characterToAdd.id);
                }
            }
        });
    }

    private completePartiesWithCacsAndDists(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {

            while (party.members.length < 5) {


                const groupHasCAC = parties.some(party => party.members.some(char => SpecializationDetails[char.specialization].role === 'CAC'));
                const groupHasDIST = parties.some(party => party.members.some(char => SpecializationDetails[char.specialization].role === 'DIST'));

                if (!groupHasCAC) {
                    const cacsToAdd = this.findCharacterCAC(cacs, dists, usedCharacters, party);
                    if (cacsToAdd) {
                        party.members.push(cacsToAdd);
                        usedCharacters.add(cacsToAdd.id);
                    }
                    else {
                        break;
                    }
                }
                else if (!groupHasDIST) {
                    const distsToAdd = this.findCharacterDIST(cacs, dists, usedCharacters, party);
                    if (distsToAdd) {
                        party.members.push(distsToAdd);
                        usedCharacters.add(distsToAdd.id);
                    }
                    else {
                        break;
                    }
                }
                else {
                    const characterToAdd = this.findRandomDPS(cacs, dists, usedCharacters, party);
                    if (characterToAdd) {
                        party.members.push(characterToAdd);
                        usedCharacters.add(characterToAdd.id);
                    }
                    else {
                        break;
                    }
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