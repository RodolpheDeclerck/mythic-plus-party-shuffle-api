import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Character } from '../models/character.entity'; 
import { Party } from '../models/party.entity';


export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',           // or your MySQL username
  password: 'password',  // replace with your MySQL password
  database: 'mythic_plus_party_shuffle',  // the database name you created earlier
  synchronize: true,          // synchronize the database schema with the entity definitions
  logging: true,
  entities: [Character, Party],      // specify your entities here
  migrations: [],
  subscribers: [],
});

// Initialize the connection
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
