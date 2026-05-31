const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 10485760 } // 10MB default
});

router.post('/questions', authenticateToken, upload.single('file'), uploadController.uploadQuestions);
router.get('/template', uploadController.downloadTemplate);

module.exports = router;
