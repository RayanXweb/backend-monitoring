const Alert = require('../models/Alert.model');

const getAlerts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, type, isRead } = req.query;
    
    const query = { userId };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({ userId, isRead: false });
    
    res.json({
      success: true,
      data: alerts,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const alert = await Alert.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    
    await Alert.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Mark all alerts as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const alert = await Alert.findOneAndDelete({ _id: id, userId });
    
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  markAsRead,
  markAllAsRead,
  deleteAlert,
};
