const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const moduleController = require('../controllers/moduleController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Configure multer for module files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `module-${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp4', '.webm', '.jpg', '.png', '.jpeg', '.gif', '.txt', '.mp3'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 104857600 } // 100MB
});

router.get('/', optionalAuth, moduleController.getAll);
router.get('/:id', optionalAuth, moduleController.getById);
router.post('/', authenticateToken, upload.single('file'), moduleController.create);
router.put('/:id', authenticateToken, upload.single('file'), moduleController.update);
router.delete('/:id', authenticateToken, moduleController.delete);
router.delete('/file/:fileId', authenticateToken, moduleController.deleteFile);

module.exports = router;
