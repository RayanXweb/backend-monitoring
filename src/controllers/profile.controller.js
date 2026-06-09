const User = require('../models/User.model');
const { getUserByEmail } = require('../config/firebase');

const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findOne({ uid: userId }).select('-pin');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;
    
    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already used' });
      }
      user.email = email;
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: { uid: user.uid, name: user.name, email: user.email, role: user.role },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user.notificationSettings || {
        email: true,
        push: true,
        alerts: true,
      },
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    const { email, push, alerts } = req.body;
    
    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.notificationSettings = {
      email: email !== undefined ? email : user.notificationSettings?.email ?? true,
      push: push !== undefined ? push : user.notificationSettings?.push ?? true,
      alerts: alerts !== undefined ? alerts : user.notificationSettings?.alerts ?? true,
    };
    
    await user.save();
    
    res.json({
      success: true,
      data: user.notificationSettings,
      message: 'Notification settings updated',
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getNotificationSettings,
  updateNotificationSettings,
};
