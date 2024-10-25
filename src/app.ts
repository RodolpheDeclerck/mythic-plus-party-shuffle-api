import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import characterRoutes from './routes/character.routes.js';
import metadataRoutes from './routes/metadata.routes.js';
import partyRoutes from './routes/party.routes.js';
import authenticationRoutes from './routes/authentication.routes.js';
import userRoutes from './routes/user.routes.js';
import eventRoutes from './routes/event.routes.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser()); // Ajoute le middleware pour lire les cookies

app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true, // Envoie et reçoit les cookies
}));

app.use('/api', characterRoutes);
app.use('/api', partyRoutes);
app.use('/api', metadataRoutes);
app.use('/api', userRoutes);
app.use('/api', eventRoutes);
app.use('/auth', authenticationRoutes);

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
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
