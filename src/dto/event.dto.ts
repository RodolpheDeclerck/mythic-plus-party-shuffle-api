export class EventDto {
    id?: number;  // Optionnel pour la mise à jour (pas obligatoire lors de la création)

    name!: string;  // Nom de l'événement, requis

    code?: string;  // Code de l'événement (généré automatiquement si non fourni)

    createdBy?: number;  // ID de l'utilisateur qui crée l'événement (requis)

    admins?: string[];  // Liste des ID des administrateurs optionnelle lors de la création

    expiresAt?: Date;  // Date d'expiration de l'événement (optionnelle)

    // Ajoute ici d'autres propriétés si nécessaire (par exemple, une description ou un lieu)
}
