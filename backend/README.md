# PWA LET - Teacher Backend System

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js              # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── models/
│   │   ├── Category.js              # Category model
│   │   ├── Subject.js               # Subject model
│   │   ├── Question.js              # Question model
│   │   ├── Quiz.js                  # Quiz model
│   │   ├── Module.js                # Learning Module model
│   │   └── Performance.js           # Analytics model
│   ├── controllers/
│   │   ├── categoryController.js    # Category logic
│   │   ├── subjectController.js     # Subject logic
│   │   ├── questionController.js    # Question logic
│   │   ├── quizController.js        # Quiz logic
│   │   ├── moduleController.js      # Module logic
│   │   ├── performanceController.js # Analytics logic
│   │   └── uploadController.js      # File upload logic
│   ├── routes/
│   │   ├── categories.js            # Category routes
│   │   ├── subjects.js              # Subject routes
│   │   ├── questions.js             # Question routes
│   │   ├── quizzes.js               # Quiz routes
│   │   ├── modules.js               # Module routes
│   │   ├── performance.js           # Analytics routes
│   │   └── upload.js                # Upload routes
│   ├── utils/
│   │   └── ApiService.js            # Frontend API client
│   └── server.js                    # Express app
├── database/
│   ├── schema.sql                   # Database schema
│   └── seeds.sql                    # Sample data (optional)
├── uploads/                         # User uploaded files
├── package.json                     # Dependencies
├── .env                             # Environment variables
├── .env.example                     # Example env file
├── .gitignore                       # Git ignore rules
├── API_DOCUMENTATION.md             # API docs
└── README.md                        # This file
```

## Quick Start

### 1. Prerequisites

- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MySQL** v5.7+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **npm** or **yarn** (comes with Node.js)

### 2. Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### 3. Database Setup

**Option A: Using MySQL CLI**
```bash
mysql -u root -p < database/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. File → Open SQL Script
3. Select `database/schema.sql`
4. Click Execute (⚡ icon)

**Option C: Manual Setup**
1. Create database: `CREATE DATABASE pwa_let_db;`
2. Import schema from `database/schema.sql`

### 4. Configure Environment

Edit `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pwa_let_db
JWT_SECRET=your_secret_key_here
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000`

```
✅ Server running on http://localhost:5000
✅ Database connected
✅ Ready to accept requests
```

---

## API Overview

### Base URL
```
http://localhost:5000/api/v1
```

### Main Endpoints

#### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category details
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Subjects
- `GET /subjects` - Get all subjects
- `GET /subjects/:id` - Get subject details
- `GET /subjects/category/:categoryId` - Get subjects by category
- `POST /subjects` - Create subject
- `PUT /subjects/:id` - Update subject
- `DELETE /subjects/:id` - Delete subject

#### Questions
- `GET /questions` - Get all questions
- `GET /questions/:id` - Get question with options
- `POST /questions` - Create question
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question

#### Quizzes
- `GET /quizzes` - Get all quizzes
- `GET /quizzes/:id` - Get quiz with questions
- `POST /quizzes` - Create quiz
- `PUT /quizzes/:id` - Update quiz
- `DELETE /quizzes/:id` - Delete quiz
- `POST /quizzes/:id/add-question` - Add question to quiz
- `POST /quizzes/:id/remove-question` - Remove question from quiz

#### Modules (Learning Materials)
- `GET /modules` - Get all modules
- `GET /modules/:id` - Get module details
- `POST /modules` - Create module
- `PUT /modules/:id` - Update module
- `DELETE /modules/:id` - Delete module

#### Performance & Analytics
- `GET /performance/stats` - Get overall statistics
- `GET /performance/categories` - Get all category performance
- `GET /performance/category/:categoryId` - Get category performance
- `GET /performance/subject/:subjectId` - Get subject performance
- `GET /performance/quiz/:quizId` - Get quiz performance
- `GET /performance/top-subjects` - Get top performing subjects
- `GET /performance/recent-activity` - Get recent activity

#### File Upload
- `POST /upload/questions` - Upload questions (CSV/Excel)
- `GET /upload/template` - Download question template

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## Frontend Integration

All frontend pages in the `teacher/` folder should include the API service:

```html
<script src="../assets/scripts/ApiService.js"></script>
<script src="../assets/scripts/api.js"></script>
```

### Example Usage

```javascript
const api = new ApiService('http://localhost:5000/api/v1');

// Get all categories
api.getCategories().then(categories => {
  console.log('Categories:', categories);
});

// Create a new subject
api.createSubject({
  category_id: 1,
  name: 'English',
  description: 'Language and literature',
  icon: 'ri-english-input',
  color: 'blue'
}).then(subject => {
  console.log('Subject created:', subject);
});
```

See [FRONTEND_INTEGRATION.md](../FRONTEND_INTEGRATION.md) for detailed integration examples.

---

## Database Schema

### Key Tables

**categories**
- Store question categories (General Education, Professional Education, Specialization)
- Used for organizing subjects and performance metrics

**subjects**
- Individual subjects within categories (English, Mathematics, etc.)
- Linked to categories and created by teachers

**questions**
- Individual questions with text, images, difficulty levels
- Can be multiple choice or true/false
- Includes explanation for correct answers

**question_options**
- Options for multiple choice questions
- Marks which option is correct

**quizzes**
- Collections of questions forming a quiz
- Settings for time limit, passing score, randomization

**quiz_questions**
- Junction table linking questions to quizzes
- Maintains question order

**modules**
- Learning materials/study guides
- Can include PDF, HTML content, or other file types

**quiz_attempts**
- Records of student quiz completions
- Stores scores, time spent, pass/fail status

**category_performance**
- Aggregated performance metrics by category
- Used for dashboard analytics

---

## Development Workflow

### Project Configuration

The project uses:
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **Multer** - File upload handling
- **JWT** - Authentication tokens
- **CORS** - Cross-origin requests
- **Body-Parser** - Request parsing

### File Organization

- **Models** - Database queries and logic
- **Controllers** - Request handling and response
- **Routes** - API endpoint definitions
- **Middleware** - Authentication and validation
- **Config** - Database connection setup

### Adding New Features

1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Mount routes in `src/server.js`

---

## Production Deployment

### Before Going Live

1. **Security**
   - Change JWT_SECRET to a strong random key
   - Set NODE_ENV=production
   - Enable HTTPS
   - Restrict CORS_ORIGIN to your domain

2. **Database**
   - Use strong DB_PASSWORD
   - Enable database backups
   - Consider managed hosting (AWS RDS, etc.)

3. **Environment**
   - Use environment-specific .env files
   - Store secrets in secure vaults
   - Enable logging

4. **Performance**
   - Add database indexing
   - Implement caching
   - Use CDN for uploads
   - Monitor server resources

### Deploy to Hosting

Popular options:
- **Heroku** - Simple deployment with free tier
- **AWS EC2** - More control and scalability
- **DigitalOcean** - Affordable VPS
- **Railway** - Modern, easy deployment
- **Render** - Free tier available

---

## Troubleshooting

### Database Connection Error
```
✗ Database connection failed
```
**Solution:**
- Check MySQL is running
- Verify DB credentials in .env
- Ensure database exists: `CREATE DATABASE pwa_let_db;`

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Change PORT in .env
- Kill process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Add frontend URL to CORS_ORIGIN in .env
- For development, use `CORS_ORIGIN=*`

### File Upload Errors
```
413 Payload Too Large
```
**Solution:**
- Increase MAX_FILE_SIZE in .env
- Default is 10MB

---

## Support & Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Authentication](https://jwt.io/)

---

## License

This project is part of the PWA LET Reviewer System. All rights reserved.

---

## Version

- **Backend Version:** 1.0.0
- **API Version:** v1
- **Last Updated:** 2024

---

## Next Steps

1. ✅ Setup database
2. ✅ Configure .env
3. ✅ Start server
4. 📄 Read API_DOCUMENTATION.md
5. 🔗 Integrate with frontend (FRONTEND_INTEGRATION.md)
6. 🧪 Test endpoints with Postman
7. 🚀 Deploy to production
