const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createDirectories = () => {
  const dirs = ['uploads', 'uploads/images', 'uploads/videos', 'uploads/documents', 'uploads/temp'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.mimetype.startsWith('image/')) {
      folder += 'images/';
    } else if (file.mimetype.startsWith('video/')) {
      folder += 'videos/';
    } else {
      folder += 'documents/';
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|bmp/;
  const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|txt/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (allowedImageTypes.test(extname) || allowedImageTypes.test(mimetype)) {
    file.category = 'image';
    cb(null, true);
  } else if (allowedVideoTypes.test(extname) || allowedVideoTypes.test(mimetype)) {
    file.category = 'video';
    cb(null, true);
  } else if (allowedDocTypes.test(extname) || allowedDocTypes.test(mimetype)) {
    file.category = 'document';
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 10, // Max 10 files per upload
  },
  fileFilter,
});

// Multiple file upload handler
const uploadMultiple = upload.array('files', 10);

// Single file upload handler
const uploadSingle = upload.single('file');

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Max size 100MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files. Max 10 files' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
};
