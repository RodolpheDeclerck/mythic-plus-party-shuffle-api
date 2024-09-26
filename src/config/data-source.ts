import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Character } from '../models/character.entity.js';
import { Party } from '../models/party.entity.js';
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
  entities: [Character, Party],
  migrations: [],
  subscribers: [],
});

// Initialiser la connexion
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err: any) => {
    console.error('Error during Data Source initialization:', err);
  });
