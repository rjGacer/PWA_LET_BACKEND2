const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pwa_let_secret_key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// Teacher Registration
exports.teacherRegister = async (req, res) => {
  try {
    const { name, email, password, phone, specialization } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if teacher already exists
    const [existing] = await pool.query('SELECT id FROM teachers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create teacher
    const [result] = await pool.query(
      'INSERT INTO teachers (name, email, password, phone, specialization, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, specialization || null, 'teacher']
    );

    const teacherId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { id: teacherId, email, role: 'teacher' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(201).json({
      message: 'Teacher registered successfully',
      token,
      user: {
        id: teacherId,
        name,
        email,
        role: 'teacher'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Teacher Login
exports.teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find teacher
    const [teachers] = await pool.query(
      'SELECT id, name, email, password, role FROM teachers WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (teachers.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const teacher = teachers[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: teacher.id, email: teacher.email, role: teacher.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Student Registration
exports.studentRegister = async (req, res) => {
  try {
    const { name, email, password, phone, device_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if student already exists
    const [existing] = await pool.query('SELECT id FROM students WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const [result] = await pool.query(
      'INSERT INTO students (name, email, password, phone, device_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, device_id || 'web-' + Date.now()]
    );

    const studentId = result.insertId;
    const newDeviceId = device_id || 'web-' + Date.now();

    // Generate token
    const token = jwt.sign(
      { id: studentId, name, email, role: 'student', device_id: newDeviceId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: studentId,
        name,
        email,
        role: 'student',
        device_id: newDeviceId
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Student Login
exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find student
    const [students] = await pool.query(
      'SELECT id, name, email, password, device_id FROM students WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (students.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const student = students[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: student.id, name: student.name, email: student.email, role: 'student', device_id: student.device_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student',
        device_id: student.device_id
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify Token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const [teachers] = await pool.query(
        'SELECT id, name, email, phone, specialization, role FROM teachers WHERE id = ?',
        [req.user.id]
      );

      if (teachers.length === 0) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      return res.json(teachers[0]);
    } else if (req.user.role === 'student') {
      const [students] = await pool.query(
        'SELECT id, name, email, phone, device_id FROM students WHERE id = ?',
        [req.user.id]
      );

      if (students.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json(students[0]);
    }

    res.status(400).json({ error: 'Invalid role' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout (frontend handles this by removing token)
exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};
