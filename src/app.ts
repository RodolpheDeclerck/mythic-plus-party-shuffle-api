import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import characterRoutes from './routes/character.routes.js';
import metadataRoutes from './routes/metadata.routes.js';
import partyRoutes from './routes/partyt.routes.js';
import { partyController } from './controllers/party.controller.js';

const app = express();
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProduction ? 'https://mythic-plus-party-shuffle.onrender.com' : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Spécifiez les méthodes HTTP autorisées
}));

app.use('/api', characterRoutes);
app.use('/api', partyRoutes);
app.use('/api', metadataRoutes);

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: isProduction ? 'https://mythic-plus-party-shuffle.onrender.com' : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Spécifiez les méthodes HTTP autorisées
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');

  // Écoute de l'événement WebSocket depuis le front-end
  socket.on('fetchParties', async () => {
    try {
      // Appelle la méthode du contrôleur pour récupérer les parties
      const parties = await partyController.fetchParties();
      // Envoie les parties récupérées au client via le WebSocket
      socket.emit('partiesData', parties);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des parties via WebSocket:', error);
      // Envoyer une réponse d'erreur au client si nécessaire
      socket.emit('error', 'Échec de la récupération des parties');
    }
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export default httpServer;  // No `listen()` here
