const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initEmail();
  }
  
  initEmail() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  
  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: `"Monitoring System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html,
      });
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }
  
  async sendPushNotification(deviceToken, title, body, data = {}) {
    if (!deviceToken) return false;
    
    try {
      const message = {
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        token: deviceToken,
      };
      
      const response = await admin.messaging().send(message);
      console.log('Push notification sent:', response);
      return true;
    } catch (error) {
      console.error('Send push notification error:', error);
      return false;
    }
  }
  
  async sendBulkPushNotification(tokens, title, body, data = {}) {
    if (!tokens || !tokens.length) return false;
    
    try {
      const messages = tokens.map(token => ({
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        token,
      }));
      
      const response = await admin.messaging().sendEach(messages);
      console.log('Bulk push sent:', response);
      return response;
    } catch (error) {
      console.error('Send bulk push error:', error);
      return false;
    }
  }
  
  async sendAlert(userId, type, message, metadata = {}) {
    // Save alert to database
    const Alert = require('../models/Alert.model');
    await Alert.create({
      userId,
      type,
      message,
      metadata,
      createdAt: new Date(),
    });
    
    // Emit via WebSocket if needed
    const { getIO } = require('../socket/socket.manager');
    const io = getIO();
    if (io) {
      io.to(userId).emit('alert', { type, message, metadata });
    }
    
    return true;
  }
}

module.exports = new NotificationService();
