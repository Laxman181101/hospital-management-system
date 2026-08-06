const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://laxmansaroj:lax31579@cluster0.up7cyws.mongodb.net/hms-db')
  .then(async () => {
    const db = mongoose.connection.db;
    await db.collection('hospitals').updateOne(
      { hospitalName: 'Simple Hospital' },
      { $set: { isActive: true } }
    );
    console.log('Simple Hospital is now active!');
    process.exit(0);
  });
