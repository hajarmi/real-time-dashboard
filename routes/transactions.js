//transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const redisClient = require('../cache');


//const { validateTransaction } = require('../validators');

// Agrégation des volumes de ventes par catégorie
router.get('/aggregations/sales-volume-by-category', async (req, res) => {
    try {
        const salesVolumeByCategory = await Transaction.aggregate([
            { $group: { _id: '$category', totalQuantity: { $sum: '$quantity' } } },
            { $sort: { totalQuantity: -1 } }
        ]);

        const formattedResponse = salesVolumeByCategory.map(item => ({
            category: item._id,
            quantity: item.totalQuantity
        }));

        res.json(formattedResponse);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des volumes de ventes par catégorie :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des ventes totales par méthode de paiement
router.get('/aggregations/total-sales-by-payment-method', async (req, res) => {
    try {
        const totalSalesByPaymentMethod = await Transaction.aggregate([
            { $group: { _id: '$payment_method', totalSales: { $sum: '$total_price' } } },
            { $sort: { totalSales: -1 } }
        ]);

        const formattedResponse = totalSalesByPaymentMethod.map(item => ({
            payment_method: item._id,
            totalSales: item.totalSales
        }));

        res.json(formattedResponse);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des ventes totales par méthode de paiement :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des ventes au fil du temps
router.get('/aggregations/sales-over-time', async (req, res) => {
    try {
        const salesOverTime = await Transaction.aggregate([
            // Convertir le champ 'timestamp' en objet Date
            { 
                $addFields: { 
                    timestamp: { $dateFromString: { dateString: "$timestamp" } }
                } 
            },
            // Regrouper par jour
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" }
                    },
                    totalSales: { $sum: '$total_price' }
                }
            },
            // Trier les résultats par date
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        const formattedResponse = salesOverTime.map(item => ({
            timestamp: `${item._id.year}-${item._id.month}-${item._id.day}`,
            totalSales: item.totalSales
        }));

        res.json(formattedResponse);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des ventes au fil du temps :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});


// Agrégation des produits les plus vendus
router.get('/aggregations/top-selling-products', async (req, res) => {
    try {
        const topSellingProducts = await Transaction.aggregate([
            { $group: { _id: '$product_name', totalQuantity: { $sum: '$quantity' } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        const formattedResponse = topSellingProducts.map(item => ({
            product_name: item._id,
            quantity: item.totalQuantity
        }));

        res.json(formattedResponse);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des produits les plus vendus :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des ventes par emplacement
router.get('/aggregations/sales-distribution-by-location', async (req, res) => {
    try {
        const salesDistributionByLocation = await Transaction.aggregate([
            { $group: { _id: '$location', totalSales: { $sum: '$total_price' } } }
        ]);

        const formattedResponse = salesDistributionByLocation.map(item => ({
            location: item._id,
            totalSales: item.totalSales
        }));

        res.json(formattedResponse);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des ventes par emplacement :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Endpoint to get total quantity, total price, and total number of customers
router.get('/aggregations/total-quantity-price-and-customers', async (req, res) => {
    try {
        const totals = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" },
                    totalPrice: { $sum: "$total_price" },
                    totalCustomers: { $sum: 1 },
                    uniqueCustomers: { $addToSet: "$customer_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalQuantity: 1,
                    totalPrice: 1,
                    totalCustomers: { $size: "$uniqueCustomers" }
                }
            }
        ]);

        res.json(totals[0] || { totalQuantity: 0, totalPrice: 0, totalCustomers: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Agrégation pour trouver la localisation avec la plus grande quantité de ventes pour chaque produit
router.get('/aggregations/top-location-by-product', async (req, res) => {
    try {
        const topLocationByProduct = await Transaction.aggregate([
            // Grouper par produit et par localisation
            {
                $group: {
                    _id: { product: '$product_name', location: '$location' },
                    totalQuantity: { $sum: '$quantity' }
                }
            },
            // Trier les groupes par produit, puis par quantité de ventes décroissante
            {
                $sort: { '_id.product': 1, 'totalQuantity': -1 }
            },
            // Regrouper par produit et prendre uniquement la première localisation (celle avec le plus de ventes)
            {
                $group: {
                    _id: '$_id.product',
                    topLocation: { $first: '$_id.location' },
                    topQuantity: { $first: '$totalQuantity' }
                }
            },
            // Trier par ordre alphabétique des produits
            {
                $sort: { '_id': 1 }
            }
        ]);

        const formattedResponse = topLocationByProduct.map(item => ({
            product: item._id,
            location: item.topLocation,
            quantity: item.topQuantity
        }));

        res.json(formattedResponse);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des localisations avec la plus grande quantité de ventes par produit :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// GET d'une transaction par ID
router.get('/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;

        const cachedTransaction = await redisClient.get(`transaction:${transactionId}`);
        if (cachedTransaction) {
            console.log(`Récupération de la transaction ${transactionId} depuis le cache`);
            res.json(JSON.parse(cachedTransaction));
        } else {
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ message: 'Transaction non trouvée' });
            }
            redisClient.set(`transaction:${transactionId}`, JSON.stringify(transaction), 'EX', 3600);
            res.json(transaction);
        }
    } catch (err) {
        console.error('Erreur lors de la récupération de la transaction :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des ventes par catégorie
router.get('/aggregations/sales-by-category', async (req, res) => {
    try {
        const salesByCategory = await Transaction.aggregate([
            {
                $group: {
                    _id: '$category',
                    totalSales: { $sum: '$total_price' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalSales: -1 }
            }
        ]);

        res.json(salesByCategory);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des ventes par catégorie :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation du nombre de transactions par méthode de paiement
router.get('/aggregations/transactions-by-payment-method', async (req, res) => {
    try {
        const transactionsByPaymentMethod = await Transaction.aggregate([
            {
                $group: {
                    _id: '$payment_method',
                    totalTransactions: { $sum: 1 }
                }
            },
            {
                $sort: { totalTransactions: -1 }
            }
        ]);

        res.json(transactionsByPaymentMethod);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des transactions par méthode de paiement :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des revenus totaux par client
router.get('/aggregations/revenue-by-customer', async (req, res) => {
    try {
        const revenueByCustomer = await Transaction.aggregate([
            {
                $group: {
                    _id: '$customer_id',
                    totalRevenue: { $sum: '$total_price' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        res.json(revenueByCustomer);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des revenus par client :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des quantités totales vendues par produit
router.get('/aggregations/quantity-by-product', async (req, res) => {
    try {
        const quantityByProduct = await Transaction.aggregate([
            {
                $group: {
                    _id: '$product_id',
                    totalQuantity: { $sum: '$quantity' }
                }
            },
            {
                $sort: { totalQuantity: -1 }
            }
        ]);

        res.json(quantityByProduct);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des quantités par produit :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Agrégation des ventes par mois
router.get('/aggregations/sales-by-month', async (req, res) => {
    try {
        // Log de démarrage de l'agrégation
        console.log('Début de l\'agrégation des ventes par mois');

        const salesByMonth = await Transaction.aggregate([
            {
                $group: {
                    _id: { $month: '$timestamp' },
                    totalSales: { $sum: '$total_price' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        // Log du résultat de l'agrégation
        console.log('Résultat de l\'agrégation des ventes par mois:', salesByMonth);

        res.json(salesByMonth);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des ventes par mois :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});



router.get('/aggregations/sales-distribution-with-coordinates', async (req, res) => {
    try {
        console.log('Début de l\'agrégation des ventes avec coordonnées');

        const salesDistribution = await Transaction.aggregate([
            {
                $group: {
                    _id: '$location',
                    totalSales: { $sum: '$total_price' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } }, // Trier par ventes totales décroissantes
            { $limit: 5} // Limiter aux 10 premiers résultats
        ]);

        console.log('Données d\'agrégation récupérées après limitation :', salesDistribution);

        // Promises pour ajouter les coordonnées
        const promises = salesDistribution.map(async (item) => {
            try {
                const coordinates = await getCoordinates(item._id); // Assumez que cette fonction existe
                return {
                    location: item._id,
                    totalSales: item.totalSales,
                    count: item.count,
                    latitude: coordinates ? coordinates.latitude : null,
                    longitude: coordinates ? coordinates.longitude : null
                };
            } catch (error) {
                console.error('Erreur lors de la récupération des coordonnées pour :', item._id, error.message);
                return {
                    location: item._id,
                    totalSales: item.totalSales,
                    count: item.count,
                    latitude: null,
                    longitude: null
                };
            }
        });

        // Attendre que toutes les promises soient résolues
        const resultsWithCoordinates = await Promise.all(promises);

        console.log('Résultats finaux avec coordonnées :', resultsWithCoordinates);

        res.json(resultsWithCoordinates);
    } catch (err) {
        console.error('Erreur lors de l\'agrégation des ventes par emplacement avec coordonnées :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

router.get('/test-coordinates/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const coordinates = await getCoordinates(location);
        res.json(coordinates);
    } catch (err) {
        console.error('Erreur lors de la récupération des coordonnées :', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});



module.exports = router;



