const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const { createCustomToken } = require('../config/firebase');

// Master PIN untuk admin (bisa diubah di .env)
const MASTER_PIN = process.env.MASTER_PIN || '123456';
const PIN_SALT = process.env.PIN_SALT || 'default-salt';

const hashPin = (pin) => {
  return bcrypt.hashSync(pin + PIN_SALT, 10);
};

const verifyPin = (inputPin, hashedPin) => {
  return bcrypt.compareSync(inputPin + PIN_SALT, hashedPin);
};

const verifyPinController = async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin || pin.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'PIN harus 6 digit' 
      });
    }

    // Check master PIN atau database PIN
    let isValid = false;
    let user = null;

    if (pin === MASTER_PIN) {
      isValid = true;
      // Create default admin user if not exists
      user = await User.findOne({ role: 'admin' });
      if (!user) {
        user = await User.create({
          uid: 'admin-uid',
          email: 'admin@monitoring.com',
          pin: hashPin(MASTER_PIN),
          name: 'Super Admin',
          role: 'admin',
        });
      }
    } else {
      user = await User.findOne({ pin: hashPin(pin), isActive: true });
      if (user) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'PIN tidak valid' 
      });
    }

    // Update last login
    await User.updateOne(
      { _id: user._id },
      { lastLogin: new Date() }
    );

    // Create Firebase custom token
    const customToken = await createCustomToken(user.uid, {
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      customToken,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const registerPinController = async (req, res) => {
  try {
    const { pin, email, name } = req.body;
    
    if (!pin || pin.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'PIN harus 6 digit' 
      });
    }

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email diperlukan' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah terdaftar' 
      });
    }

    // Create new user
    user = await User.create({
      uid: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      pin: hashPin(pin),
      role: 'admin',
    });

    // Create Firebase custom token
    const customToken = await createCustomToken(user.uid, {
      role: user.role,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      message: 'PIN berhasil didaftarkan',
      customToken,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register PIN error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const changePinController = async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const { userId } = req.user;

    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan' 
      });
    }

    if (!verifyPin(oldPin, user.pin)) {
      return res.status(401).json({ 
        success: false, 
        message: 'PIN lama salah' 
      });
    }

    if (newPin.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'PIN baru harus 6 digit' 
      });
    }

    user.pin = hashPin(newPin);
    await user.save();

    res.json({
      success: true,
      message: 'PIN berhasil diubah',
    });
  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  verifyPinController,
  registerPinController,
  changePinController,
};
