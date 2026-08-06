const mongoose = require('mongoose');

async function checkDb() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hms');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log("All users:");
  users.forEach(u => console.log(`- ${u.email} [${u.role}]`));
  process.exit(0);
}

checkDb();
