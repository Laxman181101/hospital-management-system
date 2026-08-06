const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Equipment', 'Consumable', 'Blood', 'Furniture', 'Medicine', 'Other'],
        required: true
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Only applicable if category is 'Blood'
        required: function() { return this.category === 'Blood'; }
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    unit: {
        type: String,
        required: true,
        trim: true,
        default: 'pieces' // e.g., pieces, boxes, ml, units
    },
    reorderLevel: {
        type: Number,
        required: true,
        min: 0,
        default: 10 // When stock reaches this level, it's considered low
    },
    supplier: {
        type: String,
        trim: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;
