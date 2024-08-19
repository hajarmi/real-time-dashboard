const express = require('express');
const mongoose = require('mongoose');
const redisClient = require('./cache'); // Assurez-vous que le chemin est correct
const transactionsRouter = require('./routes/transactions');
const path = require('path');

const app = express();

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/transactions', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => console.error('Erreur de connexion MongoDB :', err));

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Middleware pour gérer la mise en cache avec Redis (optionnel)
app.use('/transactions/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const cachedTransaction = await redisClient.get(`transaction:${id}`);

        if (cachedTransaction) {
            console.log(`Récupération de la transaction ${id} depuis le cache`);
            const transaction = JSON.parse(cachedTransaction);
            res.json(transaction);
        } else {
            next(); // Passer à la récupération depuis MongoDB si non trouvé en cache
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la transaction depuis Redis :', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Routes des transactions
app.use('/transactions', transactionsRouter);

// Servir le fichier HTML statique
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/dashboard', (req, res) => {
    res.render('index');
});

// Port d'écoute du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
app.get('/', async (req, res) => {
    try {
        const paymentMethods = await db.collection('transactions').distinct('payment_method');
        res.render('index', { paymentMethods });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
});