require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // "two patient" ke 11/7 wale 3 prescriptions mein se 2 duplicates delete karo
  // Rakhenge: 6a52071c9ae9bf12f0a81e97 (pehla 11/7 wala - 2:34 PM)
  // Delete karenge: 6a520924 aur 6a520b2c (baad wale duplicates)
  const toDelete = [
    '6a520924a864135e279bfc7e',
    '6a520b2ca864135e279bfcb9'
  ];
  
  const result = await db.collection('prescriptions').deleteMany({
    _id: { $in: toDelete.map(id => new mongoose.Types.ObjectId(id)) }
  });
  
  console.log('Deleted duplicate prescriptions:', result.deletedCount);
  
  const remaining = await db.collection('prescriptions').countDocuments();
  console.log('Remaining prescriptions:', remaining);
  
  // Verify what's left
  const left = await db.collection('prescriptions').find({}).sort({ createdAt: 1 }).toArray();
  left.forEach(p => {
    const meds = (p.medicines || []).map(m => m.name).join(', ') || 'No meds';
    console.log('-', p._id, '|', meds, '|', new Date(p.createdAt).toLocaleString('en-IN'));
  });
  
  mongoose.disconnect();
  console.log('\nCleanup complete!');
}).catch(e => { console.error(e.message); process.exit(1); });
