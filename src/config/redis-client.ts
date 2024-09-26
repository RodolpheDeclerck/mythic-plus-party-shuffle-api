import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  database: 0,
});

// Gestion des erreurs
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.connect().then(async () => {
  try {
    console.log('Redis URL:', redisUrl);
    
    // Vérifier la connexion
    const pong = await redisClient.ping();
    console.log('Ping:', pong);

    // Écrire une clé dans Redis
    await redisClient.set('testKey', 'testValue');
    console.log('Écriture réussie dans Redis');

    // Lire la clé dans Redis
    const value = await redisClient.get('testKey');
    console.log('Lecture réussie :', value);

    // Vérifier si la clé existe
    const exists = await redisClient.exists('testKey');
    console.log('testKey existe:', exists ? 'Oui' : 'Non');

    // Test d'enregistrement d'une "party"
    await redisClient.set('party:2', JSON.stringify([]));
    console.log('Party enregistrée avec succès');

  } catch (err) {
    console.error('Erreur lors de l\'écriture/lecture dans Redis:', err);
  }
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
});


export default redisClient;
