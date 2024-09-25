// app.ts
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import characterRoutes from './routes/character.routes.js';  // Import your character routes
import metadataRoutes from './routes/metadata.routes.js';
import partyRoutes from './routes/partyt.routes.js';

// Initialiser Express
const app = express();
app.use(express.json());

// Détection dynamique de l'environnement (local ou production)
const isProduction = process.env.NODE_ENV === 'production';

// Configurer CORS pour autoriser les requêtes du frontend (local ou production)
app.use(cors({
  origin: isProduction ? 'https://your-frontend-domain.com' : 'http://localhost:3000',  // Changez l'URL de production par votre domaine de frontend hébergé
  methods: ['GET', 'POST'],
}));

// Routes
app.use('/api', characterRoutes);
app.use('/api', partyRoutes);
app.use('/api', metadataRoutes);

// Créer un serveur HTTP
const httpServer = createServer(app);

// Configurer Socket.IO avec CORS
export const io = new Server(httpServer, {
  cors: {
    origin: isProduction ? 'https://mythic-plus-party-shuffle.onrender.com' : 'http://localhost:3000',  // Autoriser le front-end en production et en local
    methods: ['GET', 'POST'],
  },
});

// Lorsque des événements de mise à jour de personnages se produisent
io.on('connection', (socket) => {
  console.log('New client connected');

  // Gérer la déconnexion du client
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Démarrer le serveur sur le port défini par Render ou localement sur le port 3001
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default httpServer;  // Exporter httpServer
