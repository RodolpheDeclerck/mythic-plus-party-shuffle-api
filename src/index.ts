import dotenvSafe from 'dotenv-safe';

dotenvSafe.config({
  allowEmptyValues: false, // Empêche les valeurs vides
  example: '.env.example', // Chemin vers le fichier d'exemple
  path: '.env',            // Chemin vers votre fichier .env
});

import { AppDataSource } from './config/data-source.js'; // Import après la configuration dotenv-safe
import httpServer from './app.js';

const PORT = parseInt(process.env.PORT || '8080', 10); // Convertir en nombre

// Initialize the database
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');

    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error('Error during Data Source initialization:', err);
  });
