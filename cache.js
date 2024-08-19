// cache.js
const redis = require('redis');

// Création du client Redis
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  // Autres options si nécessaires
});

// Gestion manuelle de la connexion avec .connect() (optionnel)
redisClient.connect();

redisClient.on('error', (error) => {
  console.error('Erreur Redis :', error);
});

redisClient.on('connect', () => {
  console.log('Client Redis connecté');
});

// Exportation du client Redis avec toutes ses méthodes
module.exports = redisClient;

