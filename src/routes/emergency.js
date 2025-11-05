const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');

// Setup database schema
router.get('/emergency-setup', async (req, res) => {
  try {
    // Force sync semua tables
    await require('../config/database').sequelize.sync({ alter: true });
    
    res.json({
      success: true,
      message: 'Database schema setup completed'
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Setup failed',
      error: error.message
    });
  }
});

// Create admin user
router.post('/emergency-create-admin', async (req, res) => {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin user already exists',
        data: {
          username: 'admin',
          note: 'Use existing password'
        }
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      full_name: 'System Administrator',
      role: 'admin',
      email: 'admin@example.com',
      is_active: true
    });

    res.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        email: 'admin@example.com'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});

// Insert sample data
router.post('/emergency-insert-data', async (req, res) => {
  try {
    // Create admin first if not exists
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        full_name: 'System Administrator',
        role: 'admin',
        email: 'admin@example.com',
        is_active: true
      });
    }

    res.json({
      success: true,
      message: 'Sample data inserted successfully',
      data: {
        users: 1
      }
    });
  } catch (error) {
    console.error('Insert data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to insert sample data',
      error: error.message
    });
  }
});

module.exports = router;
