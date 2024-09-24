import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'  // Changez l'URL si nécessaire
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.connect();

export default redisClient;
