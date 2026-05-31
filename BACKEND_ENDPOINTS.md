# Backend API Endpoints - Leaderboard & Sync

This guide documents the required API endpoints for the PWA student features. These endpoints must be implemented in the backend to support leaderboard, progress tracking, and offline sync.

## 📍 Base URL
```
http://localhost:5000/api/v1
```

## 🔄 Required Endpoints

### 1. GET /performance/leaderboard
**Purpose**: Fetch student rankings and scores

**Query Parameters:**
| Parameter | Type | Required | Options |
|-----------|------|----------|---------|
| `category` | string | No | "general", "professional", "major" |
| `period` | string | No | "all-time" (default), "month", "week" |
| `limit` | number | No | default: 50 |

**Example Request:**
```bash
GET /api/v1/performance/leaderboard?period=month&category=general&limit=10
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "studentId": "stu-001",
      "name": "John Doe",
      "attempts": 25,
      "avgScore": 92.5,
      "passRate": 96,
      "category": "general",
      "lastAttempt": "2024-06-07T10:30:00Z"
    },
    {
      "rank": 2,
      "studentId": "stu-002",
      "name": "Jane Smith",
      "attempts": 23,
      "avgScore": 89.3,
      "passRate": 91,
      "category": "general",
      "lastAttempt": "2024-06-07T09:15:00Z"
    }
  ],
  "total": 150,
  "period": "month"
}
```

**Implementation Note**: Should aggregate Performance table grouped by studentId with category filter

---

### 2. POST /performance/record-attempt
**Purpose**: Record a single quiz attempt from student (online)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quizId": "quiz-001",
  "answers": [
    {
      "questionId": "q-001",
      "selectedAnswer": "A",
      "isCorrect": true,
      "timeSpent": 12
    },
    {
      "questionId": "q-002",
      "selectedAnswer": "B",
      "isCorrect": false,
      "timeSpent": 8
    }
  ],
  "score": 75,
  "totalQuestions": 2,
  "timeSpent": 20,
  "category": "general",
  "mode": "exam",
  "timestamp": "2024-06-07T10:30:00Z"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "attemptId": "attempt-uuid-1234",
  "score": 75,
  "badges_earned": [
    "milestone-5",
    "speed-demon"
  ],
  "synced": true,
  "timestamp": "2024-06-07T10:30:00Z"
}
```

**Implementation Note**: 
- Save to Performance table
- Return any newly earned badges
- Check against Performance model for validation

---

### 3. POST /performance/bulk-record
**Purpose**: Sync multiple offline quiz attempts (used by offline-sync.js)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "attempts": [
    {
      "quizId": "quiz-001",
      "answers": [...],
      "score": 75,
      "totalQuestions": 2,
      "timeSpent": 20,
      "category": "general",
      "mode": "practice",
      "timestamp": "2024-06-07T08:15:00Z"
    },
    {
      "quizId": "quiz-002",
      "answers": [...],
      "score": 85,
      "totalQuestions": 2,
      "timeSpent": 18,
      "category": "professional",
      "mode": "exam",
      "timestamp": "2024-06-07T10:30:00Z"
    }
  ],
  "syncedAt": "2024-06-07T14:45:00Z",
  "deviceId": "device-uuid-5678"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "recorded_count": 2,
  "failed_count": 0,
  "badges_earned": [
    "quiz-lover",
    "comeback-kid"
  ],
  "synced_at": "2024-06-07T14:45:00Z",
  "errors": []
}
```

**Implementation Note**:
- Transactional: all-or-nothing for consistency
- Skip duplicates (check by timestamp + quizId + studentId)
- Accumulate badges from all attempts

---

### 4. POST /performance/sync-progress
**Purpose**: Sync student progress metadata (streaks, overall stats)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "progress_data": {
    "totalAttempts": 27,
    "passRate": 85,
    "averageScore": 78.5,
    "currentStreak": 5,
    "bestStreak": 12,
    "weakTopics": ["algebra", "probability"],
    "strongTopics": ["geometry", "statistics"],
    "badges": ["milestone-25", "speed-demon", "quiz-lover"],
    "lastSyncTime": "2024-06-07T10:00:00Z"
  },
  "last_sync": "2024-06-06T15:30:00Z",
  "deviceId": "device-uuid-5678"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "synced": true,
  "server_stats": {
    "totalAttempts": 27,
    "passRate": 85,
    "averageScore": 78.5
  },
  "conflicts": [],
  "synced_at": "2024-06-07T14:45:30Z"
}
```

**Implementation Note**:
- Optional endpoint: can be informational/audit only
- Compare with server calculations to detect conflicts
- Update user profile last_sync_at timestamp

---

## 🔐 Authentication

All endpoints require valid JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Use existing auth middleware from `backend/src/middleware/auth.js`

---

## 📊 Database Schema (Required Tables)

### Performance Table
```sql
CREATE TABLE performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  category VARCHAR(50),
  mode VARCHAR(20),
  score INT,
  total_questions INT,
  time_spent INT,
  pass BOOLEAN,
  answers JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  device_id VARCHAR(255),
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  INDEX idx_student_created (student_id, created_at),
  INDEX idx_category (category),
  INDEX idx_synced (synced_at)
);
```

### Student Profile Extensions
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP;
```

---

## 🧪 Testing the Endpoints

### 1. Record Single Attempt
```bash
curl -X POST http://localhost:5000/api/v1/performance/record-attempt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "quiz-001",
    "answers": [{"questionId": "q-1", "selectedAnswer": "A", "isCorrect": true}],
    "score": 100,
    "totalQuestions": 1,
    "timeSpent": 5,
    "category": "general",
    "mode": "practice"
  }'
```

### 2. Get Leaderboard
```bash
curl -X GET "http://localhost:5000/api/v1/performance/leaderboard?period=month&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Bulk Sync
```bash
curl -X POST http://localhost:5000/api/v1/performance/bulk-record \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attempts": [
      {"quizId": "quiz-001", "score": 80, "totalQuestions": 1, "timeSpent": 5, "category": "general", "mode": "practice"}
    ],
    "syncedAt": "2024-06-07T14:45:00Z"
  }'
```

---

## ✅ Implementation Checklist

- [ ] Create GET /performance/leaderboard endpoint
- [ ] Create POST /performance/record-attempt endpoint
- [ ] Create POST /performance/bulk-record endpoint
- [ ] Create POST /performance/sync-progress endpoint (optional)
- [ ] Add performance-related routes to backend/src/routes/
- [ ] Create performanceController with all handlers
- [ ] Add database migrations for Performance table
- [ ] Test endpoints with sample data
- [ ] Verify JWT authentication on all endpoints
- [ ] Test offline sync workflow (queue → sync → clear)

---

**Note**: These endpoints are called automatically by the frontend PWA modules. No frontend changes needed once backend endpoints are ready.
