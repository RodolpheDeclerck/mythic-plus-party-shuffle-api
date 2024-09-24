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
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', characterRoutes);
app.use('/api', partyRoutes);
app.use('/api', metadataRoutes);

// Créer un serveur HTTP
const httpServer = createServer(app);

// Configurer Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',  // Autorise uniquement les requêtes venant du frontend
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

export default httpServer;  // Exporter httpServer
