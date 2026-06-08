const fs = require('fs');
const path = require('path');

class LoggerService {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }
  
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  getLogFileName(type) {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }
  
  writeLog(type, level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      type,
      message,
      meta,
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = this.getLogFileName(type);
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) console.error('Error writing log:', err);
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
      console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`);
    }
  }
  
  info(type, message, meta = {}) {
    this.writeLog(type, 'info', message, meta);
  }
  
  warn(type, message, meta = {}) {
    this.writeLog(type, 'warn', message, meta);
  }
  
  error(type, message, meta = {}) {
    this.writeLog(type, 'error', message, meta);
  }
  
  debug(type, message, meta = {}) {
    if (process.env.DEBUG === 'true') {
      this.writeLog(type, 'debug', message, meta);
    }
  }
  
  async getLogs(type, date, limit = 100) {
    const logFile = path.join(this.logDir, `${type}-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    const content = await fs.promises.readFile(logFile, 'utf8');
    const lines = content.trim().split('\n');
    const logs = lines.slice(-limit).map(line => JSON.parse(line));
    
    return logs;
  }
  
  async cleanupOldLogs(daysToKeep = 30) {
    const files = fs.readdirSync(this.logDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log: ${file}`);
      }
    }
  }
}

module.exports = new LoggerService();
