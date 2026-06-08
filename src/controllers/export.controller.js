const { Parser } = require('json2csv');
const {
  Email,
  WhatsApp,
  SMS,
  Call,
  Contact,
} = require('../models/MonitoringData.model');

const exportData = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, format = 'json' } = req.params;
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'emails':
        data = await Email.find({ userId }).sort({ date: -1 });
        filename = `emails_${Date.now()}`;
        break;
      case 'whatsapp':
        data = await WhatsApp.find({ userId }).sort({ timestamp: -1 });
        filename = `whatsapp_${Date.now()}`;
        break;
      case 'sms':
        data = await SMS.find({ userId }).sort({ date: -1 });
        filename = `sms_${Date.now()}`;
        break;
      case 'calls':
        data = await Call.find({ userId }).sort({ date: -1 });
        filename = `calls_${Date.now()}`;
        break;
      case 'contacts':
        data = await Contact.find({ userId }).sort({ name: 1 });
        filename = `contacts_${Date.now()}`;
        break;
      case 'all':
        const [emails, whatsapp, sms, calls, contacts] = await Promise.all([
          Email.find({ userId }),
          WhatsApp.find({ userId }),
          SMS.find({ userId }),
          Call.find({ userId }),
          Contact.find({ userId }),
        ]);
        data = { emails, whatsapp, sms, calls, contacts };
        filename = `all_data_${Date.now()}`;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }
    
    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(Array.isArray(data) ? data : [data]);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${filename}.csv`);
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      res.attachment(`${filename}.json`);
      return res.json(data);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { exportData };
