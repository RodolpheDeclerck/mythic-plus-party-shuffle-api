import { User } from '../entities/user.entity.js'; // Assurez-vous que c'est bien une entité TypeORM.
import { AppDataSource } from '../config/data-source.js'; // Connexion à la base de données TypeORM.

export const getUsers = async () => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.find();
};


export const getUserByEmail = async (email: string) => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'username', 'password', 'salt'] // Sélection des champs sensibles
    });
};


export const getUserBySessionToken = async (sessionToken: string) => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.findOne({
        where: { sessionToken }
    });
};


export const getUserById = async (id: number) => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.findOneBy({ id });
};

export const createUser = async (values: Record<string, any>) => {
    const userRepository = AppDataSource.getRepository(User);

    // Création d'une nouvelle instance d'utilisateur avec les valeurs passées
    const newUser = userRepository.create({
        email: values.email,
        username: values.username,
        salt: values.authentication.salt,
        password: values.authentication.password,
        sessionToken: values.authentication.sessionToken || null

    });

    // Sauvegarde de l'utilisateur dans la base de données
    await userRepository.save(newUser);

    return newUser;
};


export const deleteUserById = async (id: number) => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.delete(id); // La méthode `delete` retourne des informations sur la suppression
};

export const updateUserById = async (id: string, values: Record<string, any>) => {
    const userRepository = AppDataSource.getRepository(User);

    if (!id) {
        throw new Error('User ID is required to update user');
    }

    await userRepository.update(id, values); // Mets à jour l'utilisateur avec l'ID fourni et les nouvelles valeurs

}

