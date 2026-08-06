const mongoose = require('mongoose');

async function checkDb() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hms');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({
    email: { $in: ['onereceptionist@gmail.com', 'onedoctor@gmail.com'] }
  }).toArray();
  console.log("Found users:", users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}

checkDb();
