const Question = require('../models/Question');
const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { subjectId } = req.query;
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const questions = await Question.getAll(subjectId, onlySync);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const question = await Question.getWithOptions(req.params.id, onlySync);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { subject_id, question_text, question_image, question_type, difficulty, points, explanation, options } = req.body;
    
    if (!subject_id || !question_text) {
      return res.status(400).json({ error: 'Subject ID and question text are required' });
    }

    const questionId = await Question.create({
      subject_id,
      question_text,
      question_image,
      question_type: question_type || 'multiple_choice',
      difficulty: difficulty || 'medium',
      points,
      explanation,
      created_by: req.user.id
    });

    // Add options if provided
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        await Question.createOption(questionId, {
          ...options[i],
          order: i
        });
      }
    }

    // Check if auto-sync is enabled for this teacher and mark content as synced
    try {
      const pool = require('../config/database');
      const [results] = await pool.query(
        'SELECT auto_sync_enabled FROM teacher_sync_settings WHERE teacher_id = ?',
        [req.user.id]
      );
      
      if (results.length > 0 && results[0].auto_sync_enabled) {
        await pool.query(
          'UPDATE questions SET is_synced = TRUE, synced_at = NOW() WHERE id = ?',
          [questionId]
        );
      }
    } catch (syncError) {
      console.error('Auto-sync error:', syncError);
      // Continue even if sync fails
    }

    const question = await Question.getWithOptions(questionId);
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const question = await Question.getById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { question_text, question_image, difficulty, points, explanation, options } = req.body;
    
    await Question.update(req.params.id, {
      question_text,
      question_image,
      difficulty,
      points,
      explanation
    });

    // Update options if provided
    if (options && Array.isArray(options)) {
      await Question.deleteAllOptions(req.params.id);
      for (let i = 0; i < options.length; i++) {
        await Question.createOption(req.params.id, {
          ...options[i],
          order: i
        });
      }
    }

    const updated = await Question.getWithOptions(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const question = await Question.getById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await Question.delete(req.params.id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
