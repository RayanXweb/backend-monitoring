const crypto = require('crypto');

const generateUniqueId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const sanitizeData = (data) => {
  if (!data) return null;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'pin', 'privateKey'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
};

const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  
  return {
    page: currentPage,
    limit: perPage,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhoneNumber = (phone) => {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
};

module.exports = {
  generateUniqueId,
  sanitizeData,
  calculatePagination,
  validateEmail,
  validatePhoneNumber,
};
