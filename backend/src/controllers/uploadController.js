const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const pool = require('../config/database');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { subject_id } = req.body;
    if (!subject_id) {
      return res.status(400).json({ error: 'Subject ID is required' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.filename).toLowerCase();
    let questions = [];

    if (fileExt === '.csv') {
      questions = await parseCSV(filePath);
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      questions = parseExcel(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
    }

    // Validate and insert questions
    const results = await insertQuestions(subject_id, questions, req.user.id);
    
    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      message: 'File processed successfully',
      total: questions.length,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const questions = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        questions.push(row);
      })
      .on('end', () => {
        resolve(questions);
      })
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

async function insertQuestions(subjectId, questions, teacherId) {
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < questions.length; i++) {
    try {
      const q = questions[i];
      
      // Validate required fields
      if (!q.question_text) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Missing question text`);
        continue;
      }

      // Insert question
      const [result] = await pool.query(
        'INSERT INTO questions (subject_id, question_text, question_image, question_type, difficulty, points, explanation, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          subjectId,
          q.question_text,
          q.question_image || null,
          q.question_type || 'multiple_choice',
          q.difficulty || 'medium',
          q.points || 1,
          q.explanation || null,
          teacherId
        ]
      );

      // Insert options if provided
      if (q.option_a || q.option_b || q.option_c || q.option_d) {
        const options = [
          { text: q.option_a, image: q.option_a_image, correct: q.correct_option === 'A' },
          { text: q.option_b, image: q.option_b_image, correct: q.correct_option === 'B' },
          { text: q.option_c, image: q.option_c_image, correct: q.correct_option === 'C' },
          { text: q.option_d, image: q.option_d_image, correct: q.correct_option === 'D' }
        ];

        for (let j = 0; j < options.length; j++) {
          if (options[j].text) {
            await pool.query(
              'INSERT INTO question_options (question_id, option_text, option_image, is_correct, `order`) VALUES (?, ?, ?, ?, ?)',
              [result.insertId, options[j].text, options[j].image || null, options[j].correct || false, j]
            );
          }
        }
      }

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  return results;
}

exports.downloadTemplate = (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../templates/questions-template.csv');
    
    if (!fs.existsSync(templatePath)) {
      // Create template on the fly
      const csvContent = `question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,points,question_type,question_image,option_a_image,option_b_image,option_c_image,option_d_image
"What is 2+2?","3","4","5","6","B","2+2 equals 4","easy","1","multiple_choice","","","","",""
"Is the Earth round?","True","False","","","A","The Earth is roughly spherical in shape","easy","1","true_false","","","","",""`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="questions-template.csv"');
      return res.send(csvContent);
    }

    res.download(templatePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
