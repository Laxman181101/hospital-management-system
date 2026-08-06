const InventoryItem = require('./models/inventoryItem.model');
const InventoryTransaction = require('./models/inventoryTransaction.model');

// --- Inventory Items Management ---
const createItem = async (hospitalId, data) => {
    // Check for duplicate item name (and blood group if applicable)
    const filter = { itemName: data.itemName, hospitalId };
    if (data.category === 'Blood') {
        filter.bloodGroup = data.bloodGroup;
    }

    const existing = await InventoryItem.findOne(filter);
    if (existing) {
        throw new Error('An inventory item with this name (and blood group) already exists.');
    }

    const item = new InventoryItem({
        ...data,
        hospitalId
    });

    await item.save();
    return item;
};

const getItems = async (hospitalId, queryParams) => {
    const filter = { hospitalId };

    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.bloodGroup) filter.bloodGroup = queryParams.bloodGroup;
    if (queryParams.search) filter.itemName = { $regex: queryParams.search, $options: 'i' };
    
    // Low stock filter
    if (queryParams.lowStock === 'true') {
        filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    return await InventoryItem.find(filter).sort({ category: 1, itemName: 1 });
};

const updateItem = async (hospitalId, itemId, data) => {
    const item = await InventoryItem.findOne({ _id: itemId, hospitalId });
    if (!item) throw new Error('Inventory item not found');

    Object.assign(item, data);
    await item.save();
    return item;
};

// --- Inventory Transactions (In / Out) ---
const recordTransaction = async (hospitalId, managerId, data) => {
    const item = await InventoryItem.findOne({ _id: data.item, hospitalId });
    if (!item) {
        throw new Error('Inventory item not found');
    }

    if (data.transactionType === 'Out') {
        if (item.quantity < data.quantity) {
            throw new Error(`Insufficient stock. Only ${item.quantity} ${item.unit} available.`);
        }
        item.quantity -= data.quantity;
    } else {
        // 'In' transaction
        item.quantity += data.quantity;
    }

    await item.save();

    const transaction = new InventoryTransaction({
        ...data,
        handledBy: managerId,
        hospitalId
    });

    await transaction.save();
    return transaction;
};

const getTransactions = async (hospitalId, queryParams) => {
    const filter = { hospitalId };

    if (queryParams.item) filter.item = queryParams.item;
    if (queryParams.transactionType) filter.transactionType = queryParams.transactionType;

    return await InventoryTransaction.find(filter)
        .populate({ path: 'item', select: 'itemName category unit' })
        .populate({ path: 'handledBy', select: 'firstName lastName' })
        .sort({ createdAt: -1 });
};

module.exports = {
    createItem,
    getItems,
    updateItem,
    recordTransaction,
    getTransactions
};
