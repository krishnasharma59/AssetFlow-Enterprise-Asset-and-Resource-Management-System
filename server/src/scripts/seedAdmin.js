require('dotenv').config();
const connectDatabase = require('../config/database');
const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'AssetFlow Admin';
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before seeding');
  await connectDatabase();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) { existing.role = 'Admin'; existing.status = 'Active'; existing.password = password; await existing.save(); console.log(`Reset password and promoted existing account: ${email}`); }
  else { await User.create({ name, email: email.toLowerCase(), password, role: 'Admin', status: 'Active' }); console.log(`Created Admin account: ${email}`); }
  process.exit(0);
}
seedAdmin().catch((error) => { console.error(error.message); process.exit(1); });
