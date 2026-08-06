const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    transactionType: {
        type: String,
        enum: ['In', 'Out'], // In = Restock, Out = Issued/Used
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // Inventory Manager who recorded it
        required: true
    },
    issuedTo: {
        type: String, // e.g., 'ICU Ward', 'Dr. Smith', 'Operating Theater'
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

module.exports = InventoryTransaction;
