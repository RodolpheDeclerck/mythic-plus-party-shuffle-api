// index.ts
import { AppDataSource } from './config/data-source.js';  // Import relatif
import httpServer from './app.js';  // Assurez-vous que httpServer est exporté de app.ts

const PORT = parseInt(process.env.PORT || '8080', 10);  // Convertir en nombre

// Initialize the database
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');

    // Start the server
    httpServer.listen(PORT, () => {  // Démarrer le serveur HTTP avec Socket.IO
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error('Error during Data Source initialization:', err);
  });