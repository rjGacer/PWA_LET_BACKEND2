# PWA LET Teacher Backend API Documentation

## Overview
This is the backend API for the PWA LET (Licensure Examination for Teachers) reviewer system's teacher management portal. It provides endpoints for managing categories, subjects, questions, quizzes, modules, and monitoring student performance.

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation Steps

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create MySQL database:**
```bash
# Option 1: Using MySQL CLI
mysql -u root -p < database/schema.sql

# Option 2: Using MySQL Workbench
# Import the schema.sql file
```

4. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file and update:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pwa_let_db
JWT_SECRET=your_jwt_secret_key
```

5. **Start the server:**
```bash
npm run dev  # Development mode with auto-reload
npm start   # Production mode
```

The server will start on `http://localhost:5000`

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
Most endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Categories

### Get All Categories
```
GET /categories
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "General Education",
    "description": "General Education subjects for LET",
    "icon": "ri-book-open-line",
    "color": "#7c6ff7",
    "order": 1,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Category by ID
```
GET /categories/:id
```

### Create Category (Auth Required)
```
POST /categories
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description",
  "icon": "ri-icon-line",
  "color": "#ffffff",
  "order": 4
}
```

### Update Category (Auth Required)
```
PUT /categories/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "icon": "ri-icon-line",
  "color": "#000000",
  "order": 1
}
```

### Delete Category (Auth Required)
```
DELETE /categories/:id
```

---

## Subjects

### Get All Subjects
```
GET /subjects?categoryId=1
```

### Get Subject by ID
```
GET /subjects/:id
```

**Response includes:**
- All subject details
- Number of quizzes
- Number of modules
- Number of questions

```json
{
  "id": 1,
  "category_id": 1,
  "name": "English",
  "description": "Language and literature",
  "icon": "ri-english-input",
  "color": "blue",
  "created_by": 1,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "quizzes": 6,
  "modules": 3,
  "questions": 45
}
```

### Get Subjects by Category
```
GET /subjects/category/:categoryId
```

### Create Subject (Auth Required)
```
POST /subjects
Content-Type: application/json

{
  "category_id": 1,
  "name": "English",
  "description": "Language and literature",
  "icon": "ri-english-input",
  "color": "blue"
}
```

### Update Subject (Auth Required)
```
PUT /subjects/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "icon": "ri-icon-line",
  "color": "red"
}
```

### Delete Subject (Auth Required)
```
DELETE /subjects/:id
```

---

## Questions

### Get All Questions
```
GET /questions?subjectId=1
```

### Get Question by ID
```
GET /questions/:id
```

**Response includes all options:**
```json
{
  "id": 1,
  "subject_id": 1,
  "question_text": "What is the capital of France?",
  "question_image": null,
  "question_type": "multiple_choice",
  "difficulty": "easy",
  "points": 1,
  "explanation": "Paris is the capital of France",
  "created_by": 1,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "options": [
    {
      "id": 1,
      "question_id": 1,
      "option_text": "Paris",
      "option_image": null,
      "is_correct": true,
      "order": 0
    }
  ]
}
```

### Create Question (Auth Required)
```
POST /questions
Content-Type: application/json

{
  "subject_id": 1,
  "question_text": "What is 2+2?",
  "question_image": null,
  "question_type": "multiple_choice",
  "difficulty": "easy",
  "points": 1,
  "explanation": "Basic arithmetic",
  "options": [
    {
      "option_text": "3",
      "is_correct": false
    },
    {
      "option_text": "4",
      "is_correct": true
    }
  ]
}
```

### Update Question (Auth Required)
```
PUT /questions/:id
Content-Type: application/json

{
  "question_text": "Updated question",
  "difficulty": "medium",
  "points": 2,
  "options": [...]
}
```

### Delete Question (Auth Required)
```
DELETE /questions/:id
```

---

## Quizzes

### Get All Quizzes
```
GET /quizzes?subjectId=1
```

### Get Quiz by ID (includes questions)
```
GET /quizzes/:id
```

### Create Quiz (Auth Required)
```
POST /quizzes
Content-Type: application/json

{
  "subject_id": 1,
  "title": "General Education Quiz 1",
  "description": "Basic review quiz",
  "time_limit": 30,
  "passing_score": 70,
  "total_points": 100,
  "is_randomized": true,
  "show_answers": true,
  "question_ids": [1, 2, 3, 4, 5]
}
```

### Update Quiz (Auth Required)
```
PUT /quizzes/:id
Content-Type: application/json

{
  "title": "Updated Quiz Title",
  "time_limit": 45,
  "question_ids": [1, 2, 3]
}
```

### Add Question to Quiz (Auth Required)
```
POST /quizzes/:id/add-question
Content-Type: application/json

{
  "question_id": 5,
  "order": 0
}
```

### Remove Question from Quiz (Auth Required)
```
POST /quizzes/:id/remove-question
Content-Type: application/json

{
  "question_id": 5
}
```

### Delete Quiz (Auth Required)
```
DELETE /quizzes/:id
```

---

## Modules (Learning Materials)

### Get All Modules
```
GET /modules?subjectId=1
```

### Get Module by ID
```
GET /modules/:id
```

### Create Module (Auth Required)
```
POST /modules
Content-Type: application/json

{
  "subject_id": 1,
  "title": "Module 1: Introduction",
  "description": "Introductory module",
  "content": "HTML content or markdown",
  "file_type": "pdf",
  "file_url": "/uploads/module.pdf",
  "order": 0
}
```

### Update Module (Auth Required)
```
PUT /modules/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

### Delete Module (Auth Required)
```
DELETE /modules/:id
```

---

## Performance & Analytics

### Get Overall Student Statistics
```
GET /performance/stats
```

**Response:**
```json
{
  "total_students": 1248,
  "total_attempts": 5892,
  "average_score": 72.4,
  "total_passed": 4234
}
```

### Get All Categories Performance
```
GET /performance/categories
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "General Education",
    "color": "#7c6ff7",
    "average_score": 75.5,
    "student_count": 1248,
    "total_attempts": 2500
  }
]
```

### Get Specific Category Performance
```
GET /performance/category/:categoryId
```

### Get Subject Performance
```
GET /performance/subject/:subjectId
```

### Get Quiz Performance
```
GET /performance/quiz/:quizId
```

### Get Top Performing Subjects
```
GET /performance/top-subjects?limit=5
```

### Get Recent Activity
```
GET /performance/recent-activity?limit=10
```

---

## File Upload (Bulk Import)

### Download Question Template
```
GET /upload/template
```

Returns a CSV template for bulk uploading questions.

**CSV Format:**
```
question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,points,question_type,question_image,option_a_image,option_b_image,option_c_image,option_d_image
"What is 2+2?","3","4","5","6","B","2+2 equals 4","easy","1","multiple_choice","","","","",""
```

### Upload Questions from CSV/Excel (Auth Required)
```
POST /upload/questions
Content-Type: multipart/form-data

Form Data:
- file: <CSV or XLSX file>
- subject_id: 1
```

**Response:**
```json
{
  "message": "File processed successfully",
  "total": 50,
  "successful": 48,
  "failed": 2,
  "errors": [
    "Row 5: Missing question text",
    "Row 12: Invalid correct option"
  ]
}
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Database Schema

### Tables
- `teachers` - Teacher/admin accounts
- `categories` - Question categories
- `subjects` - Subject topics within categories
- `questions` - Individual questions
- `question_options` - Options for multiple choice questions
- `quizzes` - Quiz collections
- `quiz_questions` - Questions in quizzes
- `modules` - Learning modules
- `students` - Student records
- `quiz_attempts` - Student quiz attempts
- `student_answers` - Student responses
- `category_performance` - Performance metrics

---

## Frontend Integration Example

```javascript
// Initialize API Service
const api = new ApiService('http://localhost:5000/api/v1');

// Set authentication token after login
api.setToken('your_jwt_token');

// Get categories
api.getCategories()
  .then(categories => {
    console.log('Categories:', categories);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Create a new subject
api.createSubject({
  category_id: 1,
  name: 'Mathematics',
  description: 'Math subjects',
  icon: 'ri-calculator-line',
  color: 'blue'
})
  .then(subject => {
    console.log('Subject created:', subject);
  });
```

---

## CORS Configuration

By default, CORS is enabled for all origins (`*`). Modify in `.env`:

```
CORS_ORIGIN=http://localhost:3000,http://localhost:8000
```

---

## Rate Limiting & Security Notes

- Implement rate limiting in production
- Use HTTPS instead of HTTP
- Store JWT_SECRET securely
- Validate all user inputs
- Use environment variables for sensitive data

---

## Support

For issues or questions, refer to the project documentation or contact the development team.
