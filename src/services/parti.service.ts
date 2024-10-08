import { Character } from '../models/character.entity';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { Party } from '../models/party.entity.js';
import { CharacterService } from './character.service.js';
import e from 'cors';

export class PartyService {

    private characterService: CharacterService;

    constructor() {
        this.characterService = new CharacterService();
    }

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
            let healToAdd = this.findHealer(healers, usedCharacters, tankHasBR);
            if (healToAdd) {
                party.members.push(healToAdd);
                usedCharacters.add(healToAdd.id);
            }
        });
    }

    private findHealer(healers: Character[], usedCharacters: Set<number>, tankHasBR: boolean): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        let healToAdd: Character | undefined;

        if (!tankHasBR) {
            healToAdd = shuffleArray(healers).find(heal => SpecializationDetails[heal.specialization].battleRez && !usedCharacters.has(heal.id));
        }
        if (!healToAdd) {
            healToAdd = shuffleArray(healers).find(heal => SpecializationDetails[heal.specialization].bloodLust && !usedCharacters.has(heal.id));
        }
        if (!healToAdd) {
            healToAdd = shuffleArray(healers).find(heal => !usedCharacters.has(heal.id));
        }

        return healToAdd;
    }


    // Étape 3 : Ajouter un CAC/DIST avec BL dans chaque groupe sans BL
    private assignCacsAndDistsWithBROrBL(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const groupHasBL = party.members.some(char => SpecializationDetails[char.specialization].bloodLust);
            const groupHasBR = party.members.some(char => SpecializationDetails[char.specialization].battleRez);
            if (!groupHasBL && groupHasBR) {
                const blToAdd = this.findCharacterWithBL(cacs, dists, usedCharacters);
                if (blToAdd) {
                    party.members.push(blToAdd);
                    usedCharacters.add(blToAdd.id);
                }
            }
            else if (groupHasBL && !groupHasBR) {
                const brToAdd = this.findCharacterWithBR(cacs, dists, usedCharacters);
                if (brToAdd) {
                    party.members.push(brToAdd);
                    usedCharacters.add(brToAdd.id);
                }
            }
            else if (!groupHasBL && !groupHasBR) {
                const characterToAdd = this.findCharacterWithBLOrBR(cacs, dists, usedCharacters);
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
                    const cacsToAdd = this.findCharacterCAC(cacs, dists, usedCharacters);
                    if (cacsToAdd) {
                        party.members.push(cacsToAdd);
                        usedCharacters.add(cacsToAdd.id);
                    }
                }
                else if (!groupHasDIST) {
                    const distsToAdd = this.findCharacterDIST(cacs, dists, usedCharacters);
                    if (distsToAdd) {
                        party.members.push(distsToAdd);
                        usedCharacters.add(distsToAdd.id);
                    }
                }
                else {
                    const characterToAdd = this.findRandomDPS(cacs, dists, usedCharacters);
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

    private findCharacterWithBL(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => SpecializationDetails[char.specialization].bloodLust && !usedCharacters.has(char.id));
    }

    private findCharacterWithBR(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => SpecializationDetails[char.specialization].battleRez && !usedCharacters.has(char.id));
    }

    private findCharacterWithBLOrBR(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => (SpecializationDetails[char.specialization].bloodLust || SpecializationDetails[char.specialization].battleRez) && !usedCharacters.has(char.id));
    }

    private findCharacterCAC(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => SpecializationDetails[char.specialization].role === 'CAC');
    }

    private findCharacterDIST(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => SpecializationDetails[char.specialization].role === 'DIST');
    }

    private findRandomDPS(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => !usedCharacters.has(char.id));
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