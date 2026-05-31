const Quiz = require('../models/Quiz');
const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { subjectId, mode = 'exam' } = req.query; // mode defaults to 'exam' for subject quizzes
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const quizzes = await Quiz.getAll(subjectId, onlySync);
    
    // Add question count and attempt status to each quiz
    for (const quiz of quizzes) {
      quiz.question_count = await Quiz.getQuestionCount(quiz.id);
      
      // Check if student has already attempted this quiz (any mode counts as attempted)
      // Since UNIQUE constraint on (quiz_id, student_id), only one attempt allowed per quiz
      if (req.user?.role === 'student' && req.user?.id) {
        const attempts = await Quiz.getStudentAttempts(quiz.id, req.user.id);
        quiz.student_has_attempted = attempts.length > 0;
        if (attempts.length > 0) {
          quiz.last_attempt = attempts[0];
        }
      }
    }
    
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { mode = 'exam' } = req.query; // mode defaults to 'exam' for subject quizzes
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const quiz = await Quiz.getWithQuestions(req.params.id, onlySync);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Add question count
    quiz.question_count = quiz.questions ? quiz.questions.length : 0;
    
    // Check if student has already attempted this quiz (any mode counts as attempted)
    if (req.user?.role === 'student' && req.user?.id) {
      const attempts = await Quiz.getStudentAttempts(req.params.id, req.user.id);
      quiz.student_has_attempted = attempts.length > 0;
    }
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { subject_id, title, description, time_limit, passing_score, total_points, is_randomized, show_answers, question_ids } = req.body;
    
    if (!subject_id || !title) {
      return res.status(400).json({ error: 'Subject ID and title are required' });
    }

    const quizId = await Quiz.create({
      subject_id,
      title,
      description,
      time_limit,
      passing_score,
      total_points,
      is_randomized,
      show_answers,
      created_by: req.user.id
    });

    // Add questions if provided
    if (question_ids && Array.isArray(question_ids)) {
      for (let i = 0; i < question_ids.length; i++) {
        await Quiz.addQuestion(quizId, question_ids[i], i);
      }
    }

    // Check if auto-sync is enabled for this teacher and mark content as synced if it is
    try {
      const [results] = await pool.query(
        'SELECT auto_sync_enabled FROM teacher_sync_settings WHERE teacher_id = ?',
        [req.user.id]
      );
      
      console.log(`[AUTO-SYNC] Quiz ${quizId}: Teacher ${req.user.id} sync settings:`, results);
      
      if (results.length > 0 && (results[0].auto_sync_enabled === 1 || results[0].auto_sync_enabled === true)) {
        console.log(`[AUTO-SYNC] Auto-sync ENABLED - marking quiz ${quizId} as synced`);
        await pool.query(
          'UPDATE quizzes SET is_synced = TRUE, synced_at = NOW() WHERE id = ?',
          [quizId]
        );
        console.log(`[AUTO-SYNC] Quiz ${quizId} marked as synced successfully`);
      } else {
        console.log(`[AUTO-SYNC] Auto-sync DISABLED - quiz ${quizId} remains unsynced`);
      }
    } catch (syncError) {
      console.error('Auto-sync error:', syncError);
      // Continue even if sync fails
    }

    const quiz = await Quiz.getWithQuestions(quizId);
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const quiz = await Quiz.getById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { title, description, time_limit, passing_score, total_points, is_randomized, show_answers, question_ids } = req.body;
    
    await Quiz.update(req.params.id, {
      title,
      description,
      time_limit,
      passing_score,
      total_points,
      is_randomized,
      show_answers
    });

    // Update questions if provided
    if (question_ids && Array.isArray(question_ids)) {
      // Delete old questions
      const oldQuiz = await Quiz.getWithQuestions(req.params.id);
      for (const question of oldQuiz.questions) {
        await Quiz.removeQuestion(req.params.id, question.id);
      }
      
      // Add new questions
      for (let i = 0; i < question_ids.length; i++) {
        await Quiz.addQuestion(req.params.id, question_ids[i], i);
      }
    }

    const updated = await Quiz.getWithQuestions(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const quiz = await Quiz.getById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await Quiz.delete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const { question_id, order } = req.body;
    const quiz = await Quiz.getById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await Quiz.addQuestion(req.params.id, question_id, order);
    const updated = await Quiz.getWithQuestions(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeQuestion = async (req, res) => {
  try {
    const { question_id } = req.body;
    const quiz = await Quiz.getById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await Quiz.removeQuestion(req.params.id, question_id);
    const updated = await Quiz.getWithQuestions(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit quiz attempt
exports.submitAttempt = async (req, res) => {
  try {
    const { student_id, answers, time_spent, mode } = req.body;
    const quiz_id = req.params.id;

    if (!student_id || !answers) {
      return res.status(400).json({ error: 'Student ID and answers are required' });
    }

    console.log(`[Quiz Submit] Quiz: ${quiz_id}, Student: ${student_id}, Mode: ${mode || 'exam'}, Time: ${time_spent}s`);

    const attemptId = await Quiz.submitAttempt({
      quiz_id,
      student_id,
      answers,
      time_spent: time_spent || 0,
      mode: mode || 'exam'
    });

    console.log(`[Quiz Submit] Attempt created: ${attemptId}`);

    res.status(201).json({
      message: 'Quiz submitted successfully',
      attemptId: attemptId
    });
  } catch (error) {
    console.error('[Quiz Submit Error]', error);
    res.status(500).json({ error: error.message });
  }
};

// Get quiz attempt result
exports.getAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user?.id; // From authenticateToken middleware

    const attempt = await Quiz.getAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Verify that the attempt belongs to the authenticated user
    if (studentId && attempt.student_id !== studentId) {
      return res.status(403).json({ error: 'Unauthorized: This attempt does not belong to you' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('[Quiz Attempt Error]', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all student attempts
exports.getStudentAttempts = async (req, res) => {
  try {
    const { studentId } = req.params;

    const attempts = await Quiz.getAllStudentAttempts(studentId);
    res.json(attempts);
  } catch (error) {
    console.error('[Get Student Attempts Error]', error);
    res.status(500).json({ error: error.message });
  }
};
