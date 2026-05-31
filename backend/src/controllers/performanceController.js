const Performance = require('../models/Performance');

exports.getStudentStats = async (req, res) => {
  try {
    const stats = await Performance.getStudentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const stats = await Performance.getStudentDashboardStats(studentId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWeeklyProgressStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const stats = await Performance.getWeeklyProgressStats(studentId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCategoriesPerformance = async (req, res) => {
  try {
    const performance = await Performance.getAllCategoriesPerformance();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryPerformance = async (req, res) => {
  try {
    const performance = await Performance.getCategoryPerformance(req.params.categoryId);
    if (!performance) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjectPerformance = async (req, res) => {
  try {
    const performance = await Performance.getSubjectPerformance(req.params.subjectId);
    if (!performance) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuizPerformance = async (req, res) => {
  try {
    const performance = await Performance.getQuizPerformance(req.params.quizId);
    if (!performance) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopPerformingSubjects = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const subjects = await Performance.getTopPerformingSubjects(parseInt(limit));
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activity = await Performance.getRecentActivity(parseInt(limit));
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentRecentActivity = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { limit = 10 } = req.query;
    const activity = await Performance.getStudentRecentActivity(studentId, parseInt(limit));
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 100, period = 'all', category = 'all' } = req.query;
    const leaderboard = await Performance.getLeaderboard(
      parseInt(limit),
      period,
      category
    );
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSystemOverview = async (req, res) => {
  try {
    const overview = await Performance.getSystemOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save a quiz attempt
 * POST /api/v1/performance/quiz-attempts
 */
exports.saveQuizAttempt = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      quizId,
      quizTitle,
      category,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      mode = 'quiz',
      answers = []
    } = req.body;

    // Validate required fields
    if (score === undefined || totalQuestions === undefined) {
      return res.status(400).json({ error: 'Missing required fields: score, totalQuestions' });
    }

    const result = await Performance.saveQuizAttempt({
      studentId,
      quizId,
      quizTitle,
      category,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      mode,
      answers
    });

    res.status(201).json({
      success: true,
      attemptId: result.insertId,
      message: 'Quiz attempt saved successfully'
    });
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get student quiz history
 * GET /api/v1/performance/student-history
 */
exports.getStudentQuizHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { limit = 100, mode = null } = req.query;

    const history = await Performance.getStudentQuizHistory(studentId, parseInt(limit), mode);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching student quiz history:', error);
    res.status(500).json({ error: error.message });
  }
};
