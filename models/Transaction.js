const mongoose = require('mongoose');

//Definir le schema des transactions 
const transactionSchema = new mongoose.Schema({
    transaction_id: {
        type: String,
        required: true,
        unique: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    customer_id: {
        type: String,
        required: true
    },
    customer_name: {
        type: String,
        required: true
    },
    product_id: {
        type: String,
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price_per_unit: {
        type: Number,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    processed: {
        type: Boolean,
        default: false // Par défaut, une transaction n'est pas traitée
    }
});

//Ajouter un index pour ameliorer les performances des requetes 
transactionSchema.index({ transaction_id: 1 });

// Spécifiez le nom de la collection comme troisième argument du modèle
const Transaction = mongoose.model('Transaction', transactionSchema, 'transaction');


//exporte le modèle Transaction pour qu'il puisse être utilisé dans d'autres fichiers 
//importer ce modèle dans d'autres fichiers avec require('./path/to/transaction'), ce qui permet d'utiliser le modèle pour effectuer des opérations sur la collection MongoDB associée.
module.exports = Transaction;