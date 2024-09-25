import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import characterRoutes from './routes/character.routes.js';
import metadataRoutes from './routes/metadata.routes.js';
import partyRoutes from './routes/partyt.routes.js';

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

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export default httpServer;  // No `listen()` here
