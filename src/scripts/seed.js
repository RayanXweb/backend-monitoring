const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User.model');

const users = [
  {
    uid: 'admin-001',
    email: 'admin@monitoring.com',
    name: 'Super Admin',
    role: 'admin',
    isActive: true,
  },
  {
    uid: 'user-001',
    email: 'user@monitoring.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Insert seed data
    for (const user of users) {
      const hashedPin = bcrypt.hashSync('123456' + (process.env.PIN_SALT || 'default-salt'), 10);
      await User.create({ ...user, pin: hashedPin });
      console.log(`Created user: ${user.email}`);
    }
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
