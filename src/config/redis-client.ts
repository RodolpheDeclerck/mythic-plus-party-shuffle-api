import { createClient } from 'redis';

const redisClient = createClient({
  url: 'rediss://default:AVA_AAIjcDFkM2U2NmU3M2I5NzI0YzZhYjM4ZTgyNDY0MTEwMjA0N3AxMA@moved-osprey-20543.upstash.io:6379'  // Changez l'URL si nécessaire
});

// Gestion des erreurs
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.connect().then(async () => {
  try {
    // Écrire une clé dans Redis
    await redisClient.set('testKey', 'testValue');
    console.log('Écriture réussie dans Redis');

    // Lire la clé dans Redis
    const value = await redisClient.get('testKey');
    console.log('Lecture réussie :', value);

    // Test d'enregistrement d'une "party"
    await redisClient.set('party:1', JSON.stringify([]));
    console.log('Party enregistrée avec succès');

  } catch (err) {
    console.error('Erreur lors de l\'écriture/lecture dans Redis:', err);
  }
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
});


export default redisClient;
