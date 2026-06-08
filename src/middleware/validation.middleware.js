const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  };
};

// Validation rules
const pinValidation = [
  body('pin')
    .isLength({ min: 6, max: 6 })
    .withMessage('PIN must be 6 digits')
    .isNumeric()
    .withMessage('PIN must contain only numbers'),
];

const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

const contactValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('phone')
    .optional()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Invalid phone number'),
];

const messageValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message too long'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

module.exports = {
  validate,
  pinValidation,
  emailValidation,
  contactValidation,
  messageValidation,
  paginationValidation,
  dateRangeValidation,
};
