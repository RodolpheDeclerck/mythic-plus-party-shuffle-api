import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Character } from '../entities/character.entity.js';
import { Party } from '../entities/party.entity.js';
import { User } from '../entities/user.entity.js';
import { AppEvent as Event } from '../entities/event.entity.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration de la base de données en fonction de l'environnement
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  logging: true,
  entities: [Character, Party, User, Event],
  migrations: ["src/migrations/*.js"], // Emplacement des fichiers de migrations
  subscribers: [],
});

// Initialiser la connexion
if (!AppDataSource.isInitialized) {
  AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization:", err);
      if (AppDataSource.isInitialized) {
        AppDataSource.destroy().catch((destroyErr) => {
          console.error("Error while closing the connection pool:", destroyErr);
        });
      }
    });
}
