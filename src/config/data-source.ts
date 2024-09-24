import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Character } from '../models/character.entity.js'; 
import { Party } from '../models/party.entity.js';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'aws-0-us-east-2.pooler.supabase.com',
  port: 6543,
  username: 'postgres.ctjzlyiarxhrrlzujkiy',
  password: process.env.SUPABASE_PASSWORD,
  database: 'postgres',
  synchronize: false, // Désactiver la synchronisation automatique
  logging: true,
  entities: [Character, Party],
  migrations: [],
  subscribers: [],
});


// Initialize the connection
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized with Supabase!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
