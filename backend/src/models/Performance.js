const pool = require('../config/database');

class Performance {
  static async getStudentStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT qa.attempt_id) as total_attempts,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as total_passed
      FROM students s
      LEFT JOIN quiz_attempts qa ON s.id = qa.student_id
    `);
    return stats[0];
  }

  static async getStudentDashboardStats(studentId) {
    // Get all-time stats (forever tracking for Welcome box)
    // Include ALL quiz attempts regardless of mode (Practice, Random, Simulation)
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as total_quizzes_passed,
        COUNT(DISTINCT qa.id) as quizzes_taken,
        SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
        CASE 
          WHEN MIN(qa.time_spent) IS NOT NULL AND MIN(qa.time_spent) > 0 
          THEN ROUND(MIN(qa.time_spent) / 60) 
          ELSE 0 
        END as fastest_time,
        ROUND(COALESCE(SUM(qa.time_spent), 0) / 60) as study_time_minutes,
        ROUND((COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) / NULLIF(COUNT(DISTINCT qa.id), 0) * 100), 2) as completion_rate
      FROM quiz_attempts qa
      LEFT JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN student_answers sa ON qa.id = sa.attempt_id
      WHERE qa.student_id = ?
    `, [studentId]);
    return stats[0] || {
      total_quizzes_passed: 0,
      quizzes_taken: 0,
      correct_answers: 0,
      fastest_time: 0,
      study_time_minutes: 0,
      completion_rate: 0
    };
  }

  static async getWeeklyProgressStats(studentId) {
    try {
      // Get this week's quiz attempts stats directly from database (all modes)
      // Use SQL DATE_SUB for reliable date calculation
      const [weeklyStats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT qa.id) as quizzes_taken,
          COALESCE(SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END), 0) as correct_answers,
          COALESCE(SUM(qa.time_spent), 0) as total_time_seconds
        FROM quiz_attempts qa
        LEFT JOIN student_answers sa ON qa.id = sa.attempt_id
        WHERE qa.student_id = ? AND qa.submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `, [studentId]);

      const stats = weeklyStats[0] || {};
      const totalQuizzesTaken = parseInt(stats.quizzes_taken) || 0;
      const totalCorrectAnswers = parseInt(stats.correct_answers) || 0;
      const studyTimeMinutes = Math.round((parseInt(stats.total_time_seconds) || 0) / 60);

      // Calculate module completion percentage (all-time, not weekly)
      const [modules] = await pool.query(`
        SELECT DISTINCT 
          sub.id as subject_id,
          COUNT(DISTINCT q.id) as total_quizzes
        FROM subjects sub
        INNER JOIN quizzes q ON sub.id = q.subject_id
        WHERE sub.is_active = TRUE AND q.is_active = TRUE
        GROUP BY sub.id
      `);

      let completionPercentage = 0;
      if (modules && modules.length > 0) {
        let totalModuleQuizzes = 0;
        let completedModuleQuizzes = 0;

        for (const module of modules) {
          totalModuleQuizzes += module.total_quizzes;

          // Count how many module-mode quizzes student has completed (all-time)
          const [completed] = await pool.query(`
            SELECT COUNT(DISTINCT qa.id) as count
            FROM quiz_attempts qa
            INNER JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.student_id = ? AND q.subject_id = ? AND qa.mode = 'module'
          `, [studentId, module.subject_id]);

          completedModuleQuizzes += completed[0]?.count || 0;
        }

        if (totalModuleQuizzes > 0) {
          completionPercentage = Math.round((completedModuleQuizzes / totalModuleQuizzes) * 100);
        }
      }

      const result = {
        completion_percentage: completionPercentage,
        correct_answers: totalCorrectAnswers,
        quizzes_taken: totalQuizzesTaken,
        study_time_minutes: studyTimeMinutes
      };
      
      console.log(`✓ Weekly stats for student ${studentId}:`, result);
      return result;
    } catch (error) {
      console.error('Error calculating weekly progress stats:', error);
      return {
        completion_percentage: 0,
        correct_answers: 0,
        quizzes_taken: 0,
        study_time_minutes: 0
      };
    }
  }

  static async getCategoryPerformance(categoryId) {
    const [performance] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(DISTINCT qa.student_id) as student_count,
        COUNT(qa.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count
      FROM categories c
      LEFT JOIN subjects s ON c.id = s.category_id
      LEFT JOIN quizzes q ON s.id = q.subject_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE c.id = ? AND c.is_active = TRUE AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
      GROUP BY c.id, c.name
    `, [categoryId]);
    return performance[0];
  }

  static async getAllCategoriesPerformance() {
    const [performance] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.color,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(DISTINCT qa.student_id) as student_count,
        COUNT(qa.id) as total_attempts
      FROM categories c
      LEFT JOIN subjects s ON c.id = s.category_id
      LEFT JOIN quizzes q ON s.id = q.subject_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE c.is_active = TRUE AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
      GROUP BY c.id, c.name, c.color
      ORDER BY average_score DESC
    `);
    return performance;
  }

  static async getSubjectPerformance(subjectId) {
    const [performance] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(DISTINCT qa.student_id) as student_count,
        COUNT(qa.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count
      FROM subjects s
      LEFT JOIN quizzes q ON s.id = q.subject_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE s.id = ? AND s.is_active = TRUE AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
      GROUP BY s.id, s.name
    `, [subjectId]);
    return performance[0];
  }

  static async getQuizPerformance(quizId) {
    const [performance] = await pool.query(`
      SELECT 
        q.id,
        q.title,
        COUNT(qa.id) as total_attempts,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count,
        COUNT(DISTINCT qa.student_id) as unique_students
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE q.id = ? AND q.is_active = TRUE
      GROUP BY q.id, q.title
    `, [quizId]);
    return performance[0];
  }

  static async getStudentCategoryPerformance(studentId, categoryId) {
    const [performance] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(qa.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count
      FROM categories c
      LEFT JOIN subjects s ON c.id = s.category_id
      LEFT JOIN quizzes q ON s.id = q.subject_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = ?
      WHERE c.id = ? AND c.is_active = TRUE AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
      GROUP BY c.id, c.name
    `, [studentId, categoryId]);
    return performance[0];
  }

  static async getTopPerformingSubjects(limit = 5) {
    const [subjects] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        ROUND(AVG(qa.percentage), 2) as average_score,
        COUNT(qa.id) as total_attempts
      FROM subjects s
      LEFT JOIN quizzes q ON s.id = q.subject_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name
      ORDER BY average_score DESC
      LIMIT ?
    `, [limit]);
    return subjects;
  }

  static async getRecentActivity(limit = 10) {
    const [activity] = await pool.query(`
      SELECT 
        qa.id as attempt_id,
        q.id as quiz_id,
        COALESCE(q.title, 'Quiz') as quiz_title,
        COALESCE(s.name, 'General') as subject_name,
        st.name as student_name,
        qa.percentage,
        qa.mode,
        qa.submitted_at,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = qa.quiz_id AND is_active = TRUE) as total_questions,
        (SELECT COUNT(*) FROM student_answers WHERE attempt_id = qa.id AND is_correct = TRUE) as correct_answers
      FROM quiz_attempts qa
      LEFT JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      INNER JOIN students st ON qa.student_id = st.id
      ORDER BY qa.submitted_at DESC
      LIMIT ?
    `, [limit]);
    return activity;
  }

  static async getStudentRecentActivity(studentId, limit = 10) {
    const [activity] = await pool.query(`
      SELECT 
        qa.id as attempt_id,
        q.id as quiz_id,
        COALESCE(q.title, 'Quiz') as quiz_title,
        COALESCE(s.name, 'General') as subject_name,
        qa.percentage,
        qa.mode,
        qa.submitted_at,
        qa.created_at,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = qa.quiz_id AND is_active = TRUE) as total_questions,
        (SELECT COUNT(*) FROM student_answers WHERE attempt_id = qa.id AND is_correct = TRUE) as correct_answers
      FROM quiz_attempts qa
      LEFT JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE qa.student_id = ?
      ORDER BY qa.submitted_at DESC
      LIMIT ?
    `, [studentId, limit]);
    return activity;
  }

  static async getLeaderboard(limit = 100, period = 'all', category = 'all') {
    let dateFilter = '';
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = `AND qa.submitted_at >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = `AND qa.submitted_at >= '${monthAgo.toISOString().split('T')[0]}'`;
    }
    
    let categoryFilter = '';
    if (category !== 'all') {
      categoryFilter = `AND c.name = '${category}'`;
    }

    const [leaderboard] = await pool.query(`
      SELECT 
        st.id as student_id,
        st.name as full_name,
        NULL as profile_picture,
        COUNT(DISTINCT qa.id) as attempts,
        ROUND(SUM(COALESCE(qa_correct.correct_count, 0)) * 10, 1) as avg_score,
        ROUND(COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) * 100.0 / NULLIF(COUNT(DISTINCT qa.id), 0), 1) as pass_rate,
        ROUND(SUM(COALESCE(qa_correct.correct_count, 0)) * 10, 1) as avg_score_sort
      FROM students st
      LEFT JOIN quiz_attempts qa ON st.id = qa.student_id ${dateFilter}
      LEFT JOIN (
        SELECT 
          qa.id,
          COALESCE(SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END), 0) as correct_count
        FROM quiz_attempts qa
        LEFT JOIN student_answers sa ON qa.id = sa.attempt_id
        GROUP BY qa.id
      ) qa_correct ON qa.id = qa_correct.id
      LEFT JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE st.is_active = TRUE ${categoryFilter}
      GROUP BY st.id, st.name
      HAVING COUNT(DISTINCT qa.id) > 0
      ORDER BY avg_score_sort DESC, attempts DESC
      LIMIT ?
    `, [limit]);
    
    // Add rank numbers after retrieving data
    const leaderboardWithRank = leaderboard.map((entry, idx) => ({
      student_id: entry.student_id,
      full_name: entry.full_name,
      profile_picture: entry.profile_picture,
      rank: idx + 1,
      attempts: entry.attempts,
      avg_score: entry.avg_score, // Average score where 1 correct answer = 10 points
      pass_rate: entry.pass_rate
    }));
    
    return leaderboardWithRank;
  }

  static async getSystemOverview() {
    try {
      // Get counts from each table
      const [questionCount] = await pool.query('SELECT COUNT(*) as count FROM questions WHERE is_active = TRUE');
      const [categoryCount] = await pool.query('SELECT COUNT(*) as count FROM categories WHERE is_active = TRUE');
      const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM students WHERE is_active = TRUE');
      const [teacherCount] = await pool.query('SELECT COUNT(*) as count FROM teachers WHERE is_active = TRUE');
      
      return {
        total_questions: questionCount[0]?.count || 0,
        total_categories: categoryCount[0]?.count || 0,
        total_students: studentCount[0]?.count || 0,
        total_teachers: teacherCount[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting system overview:', error);
      return {
        total_questions: 0,
        total_categories: 0,
        total_students: 0,
        total_teachers: 0
      };
    }
  }

  /**
   * Save a quiz attempt to the database
   * Supports all modes: quiz, module, practice, exam, random
   */
  static async saveQuizAttempt(data) {
    const {
      studentId,
      quizId,
      quizTitle,
      category,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent = 0,
      mode = 'quiz',
      answers = []
    } = data;

    try {
      // Calculate percentage and determine pass status
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const isPassed = percentage >= 70;
      const totalPoints = totalQuestions; // Assuming 1 point per question

      // Insert quiz attempt with correct columns only
      const [result] = await pool.query(`
        INSERT INTO quiz_attempts (
          student_id,
          quiz_id,
          score,
          total_points,
          percentage,
          is_passed,
          time_spent,
          mode,
          submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [studentId, quizId || null, correctAnswers, totalPoints, percentage, isPassed ? 1 : 0, timeSpent, mode]);

      const attemptId = result.insertId;

      // Insert individual student answers if provided
      if (answers && answers.length > 0) {
        for (const answer of answers) {
          const isCorrect = answer.isCorrect === true ? 1 : 0;
          const pointsEarned = isCorrect ? 1 : 0;
          await pool.query(`
            INSERT INTO student_answers (
              attempt_id,
              question_id,
              selected_option_id,
              is_correct,
              points_earned
            ) VALUES (?, ?, ?, ?, ?)
          `, [attemptId, answer.questionId || null, answer.selectedOptionId || null, isCorrect, pointsEarned]);
        }
      }

      console.log(`✓ Quiz attempt saved (ID: ${attemptId}) for student ${studentId} [mode: ${mode}]`);
      return result;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Get student's quiz history from the database
   * Supports all modes: quiz, module, practice, exam, random
   * For random/exam, uses qa.quiz_title and qa.category columns instead of JOINs
   */
  static async getStudentQuizHistory(studentId, limit = 100, mode = null) {
    try {
      let query = `
        SELECT 
          qa.id as attemptId,
          qa.quiz_id as quizId,
          COALESCE(q.title, 'Quiz') as quizTitle,
          COALESCE(c.name, 'Unknown') as category,
          qa.percentage as score,
          qa.is_passed as isPassed,
          qa.mode,
          qa.time_spent as timeSpent,
          qa.submitted_at as timestamp,
          qa.score as correctAnswers,
          qa.total_points as totalQuestions
        FROM quiz_attempts qa
        LEFT JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE qa.student_id = ?
      `;

      const params = [studentId];

      if (mode) {
        query += ` AND qa.mode = ?`;
        params.push(mode);
      }

      query += `
        ORDER BY qa.submitted_at DESC
        LIMIT ?
      `;
      params.push(limit);

      const [results] = await pool.query(query, params);

      return results.map(row => ({
        id: row.attemptId,
        quizId: row.quizId,
        quizTitle: row.quizTitle,
        category: row.category || 'Unknown',
        score: row.score || 0,
        percentage: row.score || 0,
        isPassed: row.isPassed === 1,
        mode: row.mode || 'quiz',
        timeSpent: row.timeSpent || 0,
        timestamp: new Date(row.timestamp).getTime(),
        date: new Date(row.timestamp).toLocaleDateString(),
        correctAnswers: row.correctAnswers || 0,
        totalQuestions: row.totalQuestions || 0
      }));
    } catch (error) {
      console.error('Error fetching student quiz history:', error);
      throw error;
    }
  }
}

module.exports = Performance;
