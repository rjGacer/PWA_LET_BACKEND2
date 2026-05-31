const pool = require('../config/database');

class Quiz {
  static async getAll(subjectId = null, onlySync = false) {
    let query = 'SELECT * FROM quizzes WHERE is_active = TRUE';
    const params = [];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(subjectId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getById(id, onlySync = false) {
    let query = 'SELECT * FROM quizzes WHERE id = ?';
    const params = [id];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  static async getWithQuestions(id, onlySync = false) {
    const quiz = await this.getById(id, onlySync);
    if (!quiz) return null;

    let questionQuery = `SELECT q.* FROM questions q
       INNER JOIN quiz_questions qq ON q.id = qq.question_id
       WHERE qq.quiz_id = ? AND q.is_active = TRUE`;
    const params = [id];
    
    if (onlySync) {
      questionQuery += ' AND q.is_synced = TRUE';
    }
    
    questionQuery += ' ORDER BY qq.order';
    
    const [questions] = await pool.query(questionQuery, params);
    
    // Fetch options for each question
    for (const question of questions) {
      const [options] = await pool.query(
        'SELECT * FROM question_options WHERE question_id = ? ORDER BY `order`',
        [question.id]
      );
      question.options = options;
    }
    
    quiz.questions = questions;
    return quiz;
  }

  static async create(data) {
    const { subject_id, title, description, time_limit, passing_score, total_points, is_randomized, show_answers, created_by } = data;
    const [result] = await pool.query(
      'INSERT INTO quizzes (subject_id, title, description, time_limit, passing_score, total_points, is_randomized, show_answers, created_by, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)',
      [subject_id, title, description, time_limit, passing_score || 70, total_points || 100, is_randomized !== false, show_answers !== false, created_by]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { title, description, time_limit, passing_score, total_points, is_randomized, show_answers } = data;
    await pool.query(
      'UPDATE quizzes SET title = ?, description = ?, time_limit = ?, passing_score = ?, total_points = ?, is_randomized = ?, show_answers = ? WHERE id = ?',
      [title, description, time_limit, passing_score, total_points, is_randomized, show_answers, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('UPDATE quizzes SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }

  static async addQuestion(quizId, questionId, order = 0) {
    await pool.query(
      'INSERT INTO quiz_questions (quiz_id, question_id, `order`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `order` = ?',
      [quizId, questionId, order, order]
    );
  }

  static async removeQuestion(quizId, questionId) {
    await pool.query(
      'DELETE FROM quiz_questions WHERE quiz_id = ? AND question_id = ?',
      [quizId, questionId]
    );
  }

  static async getQuestionCount(quizId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );
    return rows[0].count;
  }

  static async getStudentAttempts(quizId, studentId) {
    const [rows] = await pool.query(
      'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
      [quizId, studentId]
    );
    return rows;
  }

  // NEW: Get student attempts filtered by mode (for mode-aware display)
  static async getStudentAttemptsByMode(quizId, studentId, mode = 'exam') {
    const [rows] = await pool.query(
      'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? AND mode = ? ORDER BY submitted_at DESC',
      [quizId, studentId, mode]
    );
    return rows;
  }

  // NEW: Get latest attempt for a specific mode
  static async getLatestAttemptByMode(quizId, studentId, mode = 'exam') {
    const [rows] = await pool.query(
      'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? AND mode = ? ORDER BY submitted_at DESC LIMIT 1',
      [quizId, studentId, mode]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async getAllStudentAttempts(studentId) {
    const [rows] = await pool.query(`
      SELECT 
        qa.id,
        qa.quiz_id,
        qa.student_id,
        qa.score,
        qa.total_points,
        qa.percentage,
        qa.time_spent,
        qa.is_passed,
        qa.mode,
        qa.started_at,
        qa.submitted_at,
        q.subject_id,
        q.title as quiz_title
      FROM quiz_attempts qa
      INNER JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.student_id = ?
      ORDER BY qa.submitted_at DESC
    `, [studentId]);
    return rows;
  }

  static async submitAttempt(data) {
    const { quiz_id, student_id, answers, time_spent, mode = 'exam' } = data;
    
    console.log(`[submitAttempt] Quiz: ${quiz_id}, Student: ${student_id}, Mode: ${mode}, Answers:`, answers);
    
    // ✅ MODULE MODE: Enforce 1-attempt limit
    if (mode === 'module') {
      const [existingAttempts] = await pool.query(`
        SELECT id FROM quiz_attempts
        WHERE quiz_id = ? AND student_id = ? AND mode = 'module'
        LIMIT 1
      `, [quiz_id, student_id]);
      
      if (existingAttempts.length > 0) {
        console.log(`[submitAttempt] ❌ Module quiz already attempted: Quiz ${quiz_id}, Student ${student_id}`);
        throw new Error('You have already completed this module quiz. Only 1 attempt is allowed.');
      }
      console.log(`[submitAttempt] ✅ Module quiz - first attempt allowed`);
    } else {
      // Other modes (practice, random, exam) support multiple attempts
      console.log(`[submitAttempt] Creating new attempt for ${mode} mode - this mode supports multiple attempts`);
    }
    
    // Get questions in order
    const [questionsResult] = await pool.query(`
      SELECT q.id, q.points FROM questions q
      INNER JOIN quiz_questions qq ON q.id = qq.question_id
      WHERE qq.quiz_id = ?
      ORDER BY qq.order
    `, [quiz_id]);
    
    let correctCount = 0;
    let totalPoints = 0;
    let attemptId;
    
    // ✅ CREATE NEW ATTEMPT FOR ALL MODES (not just others)
    const [attemptResult] = await pool.query(`
      INSERT INTO quiz_attempts 
      (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at)
      VALUES (?, ?, 0, 0, 0, ?, 0, ?, NOW())
    `, [quiz_id, student_id, time_spent, mode]);
    
    attemptId = attemptResult.insertId;
    console.log(`[submitAttempt] ✅ Created new attempt: ${attemptId} (Quiz: ${quiz_id}, Student: ${student_id}, Mode: ${mode})`);
    
    // Store individual answers and calculate score
    for (let i = 0; i < questionsResult.length; i++) {
      const question = questionsResult[i];
      const answer = answers[i];
      totalPoints += question.points || 1;
      
      let selectedOptionId = null;
      let isCorrect = false;
      let pointsEarned = 0;
      
      // If student provided an answer, convert index to option ID
      if (answer && answer.selected_option_index !== null && answer.selected_option_index !== undefined) {
        const selectedIndex = answer.selected_option_index;
        
        // Get all options for this question in order
        const [allOptions] = await pool.query(`
          SELECT id, is_correct FROM question_options 
          WHERE question_id = ?
          ORDER BY \`order\`
        `, [question.id]);
        
        // Get the option at the selected index
        if (selectedIndex >= 0 && selectedIndex < allOptions.length) {
          const selectedOption = allOptions[selectedIndex];
          selectedOptionId = selectedOption.id;
          isCorrect = selectedOption.is_correct === 1 || selectedOption.is_correct === true;
          pointsEarned = isCorrect ? (question.points || 1) : 0;
          correctCount += pointsEarned;
          
          console.log(`[submitAttempt] Q${question.id}: Index ${selectedIndex} -> OptionId ${selectedOptionId}, Correct: ${isCorrect}`);
        }
      }
      
      // Store the answer
      await pool.query(`
        INSERT INTO student_answers 
        (attempt_id, question_id, selected_option_id, is_correct, points_earned)
        VALUES (?, ?, ?, ?, ?)
      `, [attemptId, question.id, selectedOptionId, isCorrect ? 1 : 0, pointsEarned]);
    }
    
    const percentage = totalPoints > 0 ? Math.round((correctCount / totalPoints) * 100) : 0;
    
    // Update the attempt with correct score
    await pool.query(`
      UPDATE quiz_attempts
      SET score = ?, total_points = ?, percentage = ?, is_passed = ?
      WHERE id = ?
    `, [correctCount, totalPoints, percentage, percentage >= 70 ? 1 : 0, attemptId]);
    
    console.log(`[submitAttempt] Final: Correct ${correctCount}/${totalPoints}, Percentage: ${percentage}%, Mode: ${mode}`);
    
    return attemptId;
  }

  static async getAttempt(attemptId) {
    // Get attempt details
    const [attempts] = await pool.query(`
      SELECT 
        qa.*,
        q.title as quiz_title,
        q.total_points,
        q.passing_score,
        s.name as student_name
      FROM quiz_attempts qa
      INNER JOIN quizzes q ON qa.quiz_id = q.id
      INNER JOIN students s ON qa.student_id = s.id
      WHERE qa.id = ?
    `, [attemptId]);
    
    if (attempts.length === 0) return null;
    
    const attempt = attempts[0];
    
    // Get distinct questions in quiz order
    const [questionsOnly] = await pool.query(`
      SELECT 
        q.id,
        q.question_text,
        q.explanation,
        q.points
      FROM questions q
      INNER JOIN quiz_questions qq ON q.id = qq.question_id
      WHERE qq.quiz_id = ?
      ORDER BY qq.order
    `, [attempt.quiz_id]);
    
    console.log(`[getAttempt] Quiz ${attempt.quiz_id}, Attempt ${attemptId}: Found ${questionsOnly.length} questions`);
    console.log(`[getAttempt] Question IDs:`, questionsOnly.map(q => q.id));
    // Build questions array with options and student answers
    const questions = [];
    
    for (const q of questionsOnly) {
      // Get options for this question, filtering out corrupted "undefined" entries
      const [allOptions] = await pool.query(`
        SELECT 
          id,
          option_text as text,
          is_correct
        FROM question_options
        WHERE question_id = ?
        ORDER BY \`order\`
      `, [q.id]);
      
      // Filter out options with null, empty, or "undefined" text
      const options = allOptions.filter(opt => 
        opt.text && 
        opt.text.trim() !== '' && 
        !opt.text.toLowerCase().startsWith('undefined')
      );
      
      // Get student answer for this question
      const [studentAnswers] = await pool.query(`
        SELECT 
          selected_option_id,
          is_correct,
          points_earned
        FROM student_answers
        WHERE question_id = ? AND attempt_id = ?
        LIMIT 1
      `, [q.id, attemptId]);
      
      console.log(`[getAttempt] Q${q.id} - Attempt${attemptId}: student_answers result:`, studentAnswers);
      
      const studentAnswer = studentAnswers.length > 0 ? studentAnswers[0] : null;
      
      questions.push({
        id: q.id,
        question_text: q.question_text,
        explanation: q.explanation,
        points: q.points,
        options: options,
        student_answer: studentAnswer ? studentAnswer.selected_option_id : null,
        is_correct: studentAnswer ? studentAnswer.is_correct : null
      });
    }
    
    attempt.questions = questions;
    return attempt;
  }
}

module.exports = Quiz;
