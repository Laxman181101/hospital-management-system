require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Delete the 6 duplicate OPD orders (keep only the latest one 12:59:33)
  const toDelete = [
    '6a53425bffee55b1a772cbb5',
    '6a53425bffee55b1a772cbb6',
    '6a53425bffee55b1a772cbb7',
    '6a53425bffee55b1a772cbb8',
    '6a53425bffee55b1a772cbb9',
    '6a53425cffee55b1a772cbba'
  ];
  
  const result = await db.collection('pharmacyorders').deleteMany({
    _id: { $in: toDelete.map(id => new mongoose.Types.ObjectId(id)) }
  });
  
  console.log('Deleted duplicate orders:', result.deletedCount);
  
  const remaining = await db.collection('pharmacyorders').countDocuments();
  console.log('Remaining orders in DB:', remaining);
  
  mongoose.disconnect();
  console.log('Cleanup done!');
}).catch(e => { console.error(e.message); process.exit(1); });
