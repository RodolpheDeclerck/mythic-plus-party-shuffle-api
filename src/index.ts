import { AppDataSource } from './config/data-source.js';
import httpServer from './app.js';  // Import the httpServer created in app.ts

const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize the database
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');

    // Start the server here
    httpServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error('Error during Data Source initialization:', err);
  });
