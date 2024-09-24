import { Character } from '../models/character.entity';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { Party } from '../models/party.entity.js';
import { CharacterService } from './character.service.js';

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

        // Ajouter un CAC/DIST avec BL dans chaque groupe sans BL
        this.assignCacsAndDistsWithBL(parties, cacs, dists, usedCharacters);

        // Créer un groupe pour chaque HEAL restant
        this.assignRemainingHealersToNewParties(parties, healers, usedCharacters);

        // Ajouter CAC/DIST avec BL et BR pour les groupes sans TANK
        this.assignCacsAndDistsWithoutTank(parties, cacs, dists, usedCharacters);

        // Ajouter un CAC/DIST avec BL dans les groupes avec un TANK sans BL
        this.assignCacsAndDistsWithoutBL(parties, cacs, dists, usedCharacters);

        // Ajouter un CAC/DIST avec BR dans les groupes avec un TANK sans BR
        this.assignCacsAndDistsWithoutBR(parties, cacs, dists, usedCharacters);

        // Répartir les CAC/DIST restants, sans dépasser 5 membres par groupe
        this.assignRemainingCacsAndDists(parties, cacs, dists, usedCharacters);

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
    private assignCacsAndDistsWithBL(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const groupHasBL = party.members.some(char => SpecializationDetails[char.specialization].bloodLust);
            if (!groupHasBL) {
                const blToAdd = this.findCharacterWithBL(cacs, dists, usedCharacters);
                if (blToAdd) {
                    party.members.push(blToAdd);
                    usedCharacters.add(blToAdd.id);
                }
            }
        });
    }

    private findCharacterWithBL(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => SpecializationDetails[char.specialization].bloodLust && !usedCharacters.has(char.id));
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

    // Étape 5 et 6 : Ajouter CAC/DIST avec BL et BR pour les groupes sans TANK
    private assignCacsAndDistsWithoutTank(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const hasTank = party.members.some(char => SpecializationDetails[char.specialization].role === 'TANK');
            if (!hasTank) {
                const blToAdd = this.findCharacterWithBL(cacs, dists, usedCharacters);
                if (blToAdd) {
                    party.members.push(blToAdd);
                    usedCharacters.add(blToAdd.id);
                }
                const brToAdd = this.findCharacterWithBR(cacs, dists, usedCharacters);
                if (brToAdd) {
                    party.members.push(brToAdd);
                    usedCharacters.add(brToAdd.id);
                }
            }
        });
    }

    private findCharacterWithBR(cacs: Character[], dists: Character[], usedCharacters: Set<number>): Character | undefined {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire
        return shuffleArray([...cacs, ...dists]).find(char => SpecializationDetails[char.specialization].battleRez && !usedCharacters.has(char.id));
    }

    // Étape 7 : Ajouter un CAC/DIST avec BL dans les groupes avec un TANK sans BL
    private assignCacsAndDistsWithoutBL(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const hasTank = party.members.some(char => SpecializationDetails[char.specialization].role === 'TANK');
            const groupHasBL = party.members.some(char => SpecializationDetails[char.specialization].bloodLust);
            if (hasTank && !groupHasBL) {
                const blToAdd = this.findCharacterWithBL(cacs, dists, usedCharacters);
                if (blToAdd) {
                    party.members.push(blToAdd);
                    usedCharacters.add(blToAdd.id);
                }
            }
        });
    }

    // Étape 8 : Ajouter un CAC/DIST avec BR dans les groupes avec un TANK sans BR
    private assignCacsAndDistsWithoutBR(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        parties.forEach(party => {
            const hasTank = party.members.some(char => SpecializationDetails[char.specialization].role === 'TANK');
            const groupHasBR = party.members.some(char => SpecializationDetails[char.specialization].battleRez);
            if (hasTank && !groupHasBR) {
                const brToAdd = this.findCharacterWithBR(cacs, dists, usedCharacters);
                if (brToAdd) {
                    party.members.push(brToAdd);
                    usedCharacters.add(brToAdd.id);
                }
            }
        });
    }

    // Étape 9 : Répartir les CAC/DIST restants
    private assignRemainingCacsAndDists(parties: Party[], cacs: Character[], dists: Character[], usedCharacters: Set<number>) {
        const shuffleArray = (array: Character[]) => array.sort(() => Math.random() - 0.5); // Mélange aléatoire

        shuffleArray([...cacs, ...dists]).forEach(char => {
            if (!usedCharacters.has(char.id)) {
                for (const party of parties) {
                    const canAddToParty = this.canAddCharacterToParty(party, char);
                    if (canAddToParty) {
                        party.members.push(char);
                        usedCharacters.add(char.id);
                        break;
                    }
                }

                if (!usedCharacters.has(char.id)) {
                    const newParty = new Party();
                    newParty.members = [char];
                    parties.push(newParty);
                    usedCharacters.add(char.id);
                }
            }
        });
    }

    private canAddCharacterToParty(party: Party, char: Character): boolean {
        const hasTank = party.members.some(char => SpecializationDetails[char.specialization].role === 'TANK');
        const hasHeal = party.members.some(char => SpecializationDetails[char.specialization].role === 'HEAL');
        const cacsInParty = party.members.filter(char => SpecializationDetails[char.specialization].role === 'CAC').length;
        const distsInParty = party.members.filter(char => SpecializationDetails[char.specialization].role === 'DIST').length;

        return (
            (!hasTank && party.members.length < 4) ||
            (!hasHeal && party.members.length < 4) ||
            (!hasTank && !hasHeal && party.members.length < 3) ||
            (hasTank && hasHeal && party.members.length < 5 && ((char.role === 'DIST' && distsInParty < 2) || (char.role === 'CAC' && cacsInParty < 2)))
        );
    }
}