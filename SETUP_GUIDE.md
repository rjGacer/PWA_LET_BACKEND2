# 🚀 PWA LET Teacher Backend - Complete Setup Guide

## 📋 Overview

This is a complete **Node.js/Express backend** with **MySQL database** for the PWA LET Teacher Management System. It provides REST APIs for managing questions, quizzes, subjects, categories, and student performance analytics.

## 🎯 What's Included

✅ **Complete Backend API** with 7 major endpoints
✅ **MySQL Database** with optimized schema
✅ **Authentication** with JWT middleware
✅ **File Upload** support (CSV/Excel for bulk questions)
✅ **Performance Analytics** for student tracking
✅ **Frontend Integration** scripts ready to use
✅ **Complete Documentation** and examples

---

## 📁 File Structure

```
backend/
├── src/
│   ├── config/         # Database configuration
│   ├── models/         # Data models
│   ├── controllers/    # Business logic
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth & validation
│   ├── utils/          # Utilities (ApiService.js for frontend)
│   └── server.js       # Main Express app
├── database/
│   ├── schema.sql      # Database tables & sample data
│   └── migrate.js      # Migration scripts
├── uploads/            # File uploads directory
├── package.json        # Dependencies
├── .env                # Configuration (created from .env.example)
├── README.md           # Setup instructions
└── API_DOCUMENTATION.md # Complete API reference
```

---

## 🔧 Installation & Setup

### Step 1: Prerequisites

Make sure you have installed:
- **Node.js v14+** → [Download](https://nodejs.org/)
- **MySQL v5.7+** → [Download](https://dev.mysql.com/downloads/mysql/)
- **npm or yarn** (comes with Node.js)
- **Git** (optional, for version control)

**Verify Installation:**
```bash
node --version    # Should show v14+
npm --version     # Should show 8+
mysql --version   # Should show 5.7+
```

### Step 2: Clone/Copy Files

Navigate to your project root:
```bash
cd C:\Users\rj\Downloads\PWA-LET-master
```

The backend folder already exists in your structure.

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install all required packages (Express, MySQL, Multer, JWT, etc.)

**Expected Output:**
```
added 245 packages in 2m
```

### Step 4: Database Setup

**Option A: Using MySQL Command Line (Recommended)**

```bash
# Connect to MySQL
mysql -u root -p

# When prompted, enter your MySQL password
# If you have no password, just press Enter

# Then run:
source database/schema.sql

# Verify tables were created:
SHOW TABLES;
EXIT;
```

**Option B: Using MySQL Workbench**

1. Open MySQL Workbench
2. Click File → Open SQL Script
3. Select `backend/database/schema.sql`
4. Click Execute (⚡ button) or press Ctrl+Enter
5. Verify tables in the schema browser

**Option C: Manual Database Import**

1. Open MySQL CLI or Workbench
2. Create database:
   ```sql
   CREATE DATABASE pwa_let_db;
   USE pwa_let_db;
   ```
3. Copy content from `database/schema.sql` and execute

### Step 5: Configure Environment

Create `.env` file from the template:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

Edit `.env` and update database credentials:

```env
PORT=5000
NODE_ENV=development

# Database - Update with your MySQL credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=pwa_let_db
DB_PORT=3306

# Keep these as is for development
JWT_SECRET=pwa_let_super_secret_key_change_in_production_2024
JWT_EXPIRATION=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

CORS_ORIGIN=*
API_URL=http://localhost:5000
API_PREFIX=/api/v1
```

**Save the file!**

### Step 6: Start the Server

```bash
npm run dev
```

**Expected Output:**
```
🚀 PWA LET Teacher Backend Server
📍 Running on http://localhost:5000
📡 API Prefix: /api/v1
🌐 CORS Origin: *
✓ Ready to accept requests
```

If you see errors, check the troubleshooting section below.

---

## 🧪 Testing the API

### Using Browser

Visit these URLs in your browser:

```
http://localhost:5000/health
http://localhost:5000/api/v1/categories
http://localhost:5000/api/v1/subjects
```

### Using Postman

1. Open [Postman](https://www.postman.com/downloads/)
2. Create a new request
3. Set method to `GET`
4. Enter URL: `http://localhost:5000/api/v1/categories`
5. Click Send

You should see JSON response with categories.

### Using cURL

```bash
# Get categories
curl http://localhost:5000/api/v1/categories

# Get subjects
curl http://localhost:5000/api/v1/subjects?categoryId=1
```

---

## 🔗 Frontend Integration

### Step 1: Copy API Service

The `ApiService.js` is already created in `backend/src/utils/`. You need to make it accessible to your frontend.

Copy to your frontend:
```bash
copy backend\src\utils\ApiService.js assets\scripts\
```

### Step 2: Include in HTML Pages

Add to your teacher HTML files (dashboard.html, categories.html, etc.):

```html
<!-- Before closing </body> tag -->
<script src="../assets/scripts/ApiService.js"></script>

<!-- Optional: Include specific integration script -->
<script src="../assets/scripts/dashboard-integration.js"></script>
```

### Step 3: Use in JavaScript

```javascript
// Initialize API
const api = new ApiService('http://localhost:5000/api/v1');

// Get categories
api.getCategories()
  .then(categories => {
    console.log('Categories:', categories);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Create subject
api.createSubject({
  category_id: 1,
  name: 'English',
  description: 'Language studies',
  icon: 'ri-english-input',
  color: 'blue'
})
  .then(subject => {
    console.log('Subject created:', subject);
  });
```

### Pre-built Integration Scripts

Ready-to-use integration scripts are provided in `assets/scripts/`:

- **dashboard-integration.js** - Dashboard statistics and charts
- **categories-integration.js** - Category management
- **subject-integration.js** - Subject and quiz management

Include these in your HTML pages for instant API integration!

---

## 📊 API Endpoints Reference

### Categories
```
GET    /api/v1/categories              # List all
GET    /api/v1/categories/:id          # Get one
POST   /api/v1/categories              # Create (Auth required)
PUT    /api/v1/categories/:id          # Update (Auth required)
DELETE /api/v1/categories/:id          # Delete (Auth required)
```

### Subjects
```
GET    /api/v1/subjects                # List all
GET    /api/v1/subjects/:id            # Get one
GET    /api/v1/subjects/category/:id   # By category
POST   /api/v1/subjects                # Create (Auth required)
PUT    /api/v1/subjects/:id            # Update (Auth required)
DELETE /api/v1/subjects/:id            # Delete (Auth required)
```

### Questions
```
GET    /api/v1/questions               # List all
GET    /api/v1/questions/:id           # Get one with options
POST   /api/v1/questions               # Create (Auth required)
PUT    /api/v1/questions/:id           # Update (Auth required)
DELETE /api/v1/questions/:id           # Delete (Auth required)
```

### Quizzes
```
GET    /api/v1/quizzes                 # List all
GET    /api/v1/quizzes/:id             # Get one with questions
POST   /api/v1/quizzes                 # Create (Auth required)
PUT    /api/v1/quizzes/:id             # Update (Auth required)
DELETE /api/v1/quizzes/:id             # Delete (Auth required)
POST   /api/v1/quizzes/:id/add-question     # Add question
POST   /api/v1/quizzes/:id/remove-question  # Remove question
```

### Modules
```
GET    /api/v1/modules                 # List all
GET    /api/v1/modules/:id             # Get one
POST   /api/v1/modules                 # Create (Auth required)
PUT    /api/v1/modules/:id             # Update (Auth required)
DELETE /api/v1/modules/:id             # Delete (Auth required)
```

### Performance/Analytics
```
GET    /api/v1/performance/stats              # Overall stats
GET    /api/v1/performance/categories         # All categories
GET    /api/v1/performance/category/:id       # Specific category
GET    /api/v1/performance/subject/:id        # Subject performance
GET    /api/v1/performance/quiz/:id           # Quiz performance
GET    /api/v1/performance/top-subjects       # Top performers
GET    /api/v1/performance/recent-activity    # Recent activity
```

### File Upload
```
POST   /api/v1/upload/questions        # Upload CSV/Excel (Auth required)
GET    /api/v1/upload/template         # Download CSV template
```

**For detailed API documentation**, see [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

---

## 🔐 Database Schema

The database automatically creates these tables:

**Admin & Users:**
- `teachers` - Teacher/admin accounts
- `students` - Student records

**Content Management:**
- `categories` - Question categories
- `subjects` - Subject topics
- `questions` - Individual questions
- `question_options` - Multiple choice options
- `quizzes` - Quiz collections
- `quiz_questions` - Questions in quizzes
- `modules` - Learning materials

**Analytics:**
- `quiz_attempts` - Student quiz submissions
- `student_answers` - Individual answers
- `category_performance` - Performance metrics

**Logs:**
- `bulk_upload_logs` - File upload history

All tables include timestamps and soft deletes (is_active flag).

---

## 🚨 Troubleshooting

### Error: "Cannot find module 'express'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd backend
npm install
```

### Error: "Database connection failed"

**Cause:** MySQL not running or wrong credentials

**Solution:**
1. Start MySQL:
   - **Windows:** Check Services or run `mysqld.exe`
   - **Mac:** `brew services start mysql`
   - **Linux:** `sudo service mysql start`

2. Verify .env file has correct credentials:
   ```env
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=pwa_let_db
   ```

3. Test connection:
   ```bash
   mysql -u root -p pwa_let_db
   ```

### Error: "EADDRINUSE: Address already in use :::5000"

**Cause:** Another process using port 5000

**Solution:**
- **Option A:** Change port in .env:
  ```env
  PORT=5001
  ```

- **Option B:** Kill the process using port 5000
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID [pid] /F`
  - Mac/Linux: `lsof -ti:5000 | xargs kill -9`

### Error: "CORS error" in browser console

**Cause:** Frontend and backend are on different origins

**Solution:** Update `.env`:
```env
CORS_ORIGIN=http://localhost:8000,http://localhost:3000
```

Or for development:
```env
CORS_ORIGIN=*
```

### Error: "413 Payload Too Large"

**Cause:** File upload exceeds size limit

**Solution:** Update `.env`:
```env
MAX_FILE_SIZE=52428800  # 50MB instead of 10MB
```

---

## 📝 Sample Data

The database is pre-populated with:

- **3 Categories:** General Education, Professional Education, Major/Specialization
- **2 Teachers:** Admin and regular teacher accounts
- Sample data ready for development

Sample login credentials (passwords hashed):
- Email: `admin@example.com`
- Email: `john.doe@example.com`

---

## 🌐 Production Deployment

### Pre-Deployment Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (not HTTP)
- [ ] Set specific `CORS_ORIGIN` (not *)
- [ ] Enable database backups
- [ ] Use environment variables for secrets
- [ ] Add rate limiting
- [ ] Enable logging

### Deployment Options

1. **Heroku** (Simplest)
   - Free tier available
   - Automatic deployment from Git

2. **AWS EC2**
   - More control and scalability

3. **DigitalOcean**
   - Affordable VPS
   - Droplets starting at $5/month

4. **Railway.app**
   - Modern deployment platform
   - Free tier

5. **Render**
   - Managed services
   - Free tier available

---

## 📚 File Upload (CSV/Excel)

### Download Template
```
GET /api/v1/upload/template
```

### CSV Format
```
question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,points,question_type
"What is 2+2?","3","4","5","6","B","Correct answer is 4","easy","1","multiple_choice"
"Is Earth round?","True","False","","","A","Earth is roughly spherical","easy","1","true_false"
```

### Upload Questions
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('subject_id', 1);

const result = await api.uploadQuestions(formData);
console.log(result);
// { message: "Success", total: 50, successful: 48, failed: 2, errors: [...] }
```

---

## 📞 Support & Resources

- **Node.js:** https://nodejs.org/docs/
- **Express:** https://expressjs.com/
- **MySQL:** https://dev.mysql.com/doc/
- **JWT:** https://jwt.io/
- **REST API:** https://restfulapi.net/

---

## 🎓 Next Steps

1. ✅ Complete setup following this guide
2. 📖 Read [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
3. 🔗 Read [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
4. 🧪 Test endpoints with Postman
5. 🚀 Deploy to production

---

## 📄 Version Info

- **Backend Version:** 1.0.0
- **API Version:** v1
- **Database:** MySQL 5.7+
- **Node.js:** 14+
- **Last Updated:** 2024

---

## ✨ Key Features Implemented

✅ Complete CRUD operations for all resources
✅ User authentication with JWT
✅ Role-based access control (Admin/Teacher)
✅ Bulk question import from CSV/Excel
✅ Student performance analytics
✅ Real-time activity logging
✅ File upload with validation
✅ Comprehensive error handling
✅ CORS support
✅ Production-ready structure

---

**Happy coding! 🎉**

For questions or issues, refer to the documentation or check the troubleshooting section.
