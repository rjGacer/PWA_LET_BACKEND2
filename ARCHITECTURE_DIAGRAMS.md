# Quiz System Architecture & Visual Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     LearnIQ Quiz System                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  Student Page    │  →   │  Quiz Questions  │  →   │ Quiz Results  │
│  (Dashboard)     │      │  (Answering)     │      │ (Feedback)    │
└──────────────────┘      └──────────────────┘      └───────────────┘
        ↑                         ↑                          ↑
        │                         │                          │
    Sidebar              Progress Tracking              Summary Stats
    Navigation           Option Selection               Question Review
                         Mark for Review                Filter Options
                         
        └─────────────────────┬──────────────────────────┘
                              │
                      Store Results in
                       IndexedDB (Offline)
                              │
                    ┌─────────┴──────────┐
                    ↓                    ↓
              sessionStorage         localStorage
              (currentResultData)    (userProgress)
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Flow                                │
└─────────────────────────────────────────────────────────────────┘

USER INTERACTION LAYER
├─ Quiz Selection
├─ Option Selection  
├─ Mark for Review
└─ Submit Quiz

    ↓ (answers object)

PROCESSING LAYER
├─ Calculate Score
├─ Compare with Correct Answers
├─ Generate Statistics
└─ Format Result Data

    ↓ (resultData object)

STORAGE LAYER
├─ sessionStorage (immediate)
│  └─ currentResultData
├─ IndexedDB (persistent)
│  └─ quiz_results / module_results
└─ localStorage (user progress)
   └─ quizHistory

    ↓

DISPLAY LAYER
├─ Results Page Load
├─ Render Statistics
├─ Display Question Review
└─ Enable Actions (Retake/Back)
```

---

## 🔀 Navigation Flow Diagram

```
START
  │
  ├─ Dashboard / Module / Subject Page
  │         ↓
  ├─ User Clicks "Take Quiz"
  │         │
  │         ├─ sessionStorage.setItem('quizSource', referrer)
  │         │
  │         ↓
  ├─ Quiz Questions Page
  │         │
  │         ├─ User Answers Questions
  │         │
  │         ├─ [Back Button] → Check quizSource → Return to Source
  │         │ OR
  │         ├─ [Submit Button] → Validate Answers
  │         │
  │         ↓
  ├─ API: POST /quizzes/{id}/submit
  │         │
  │         ├─ Backend Validates
  │         ├─ Calculates Score
  │         ├─ Returns Result ID
  │         │
  │         ↓
  ├─ Quiz Results Page
  │         │
  │         ├─ Load Result Data
  │         ├─ Render Statistics
  │         ├─ Show Question Review
  │         │
  │         ├─ [Back Button] → Router Decision
  │         │  ├─ Module Mode → Module Page
  │         │  ├─ Exam Mode → Exam Page
  │         │  └─ Default → Quiz List
  │         │ OR
  │         ├─ [Retake Button] → Quiz Questions (same quiz)
  │         │
  │         ↓
  └─ END

KEY DECISION POINTS:
  1. quizSource stored? → Return there
  2. Quiz mode? → Route accordingly
  3. Subject ID available? → Include in URL
```

---

## 🎨 UI Component Hierarchy

```
QUIZ QUESTIONS PAGE
├─ Back Link
│  └─ Click → goBack()
│
├─ Page Title
│  └─ Quiz Name
│
├─ Progress Section
│  ├─ Progress Label (Question X of Y)
│  ├─ Progress Percentage (%)
│  └─ Progress Bar
│     └─ Animated Fill
│
├─ Question Card
│  ├─ Question Badge (Question #1)
│  ├─ Question Text
│  └─ Options List
│     ├─ Option Item (A)
│     │  ├─ Radio Button
│     │  ├─ Letter Badge
│     │  └─ Option Text
│     ├─ Option Item (B)
│     ├─ Option Item (C)
│     └─ Option Item (D)
│
├─ Mark for Review
│  └─ Toggle Button with Icon
│
└─ Navigation Row
   ├─ Previous Button
   ├─ Question Counter
   └─ Next/Submit Button


RESULTS PAGE
├─ Back Link
│
├─ Results Header (Hero)
│  ├─ Title
│  ├─ Score Circle
│  │  └─ Score Display
│  └─ Score Stats
│     ├─ Correct Stat
│     ├─ Incorrect Stat
│     └─ Skipped Stat
│
├─ Summary Cards
│  ├─ Correct Card (%)
│  ├─ Incorrect Card (%)
│  └─ Skipped Card (%)
│
├─ Performance Section
│  └─ Gauge Visualization
│
├─ Filter Buttons
│  ├─ All
│  ├─ Correct
│  ├─ Incorrect
│  └─ Skipped
│
├─ Question Review Container
│  ├─ Question Review Item
│  │  ├─ Status Icon
│  │  ├─ Question Number
│  │  ├─ Question Text
│  │  ├─ Your Answer
│  │  ├─ Correct Answer (if wrong)
│  │  └─ Explanation (if available)
│  └─ ... (repeated for each question)
│
└─ Action Buttons
   ├─ Retake Quiz Button
   └─ Go Back Button
```

---

## 🔄 State Management Flow

```
QUIZ QUESTIONS STATE
├─ quizId (from URL param)
├─ subjectId (from URL param)
├─ quizMode ('module' | 'exam' | 'regular')
├─ studentId (from JWT token)
├─ quizData (fetched from API)
├─ currentQuestionIndex (0-based)
├─ answers {
│  └─ [questionId]: optionIndex
│ }
├─ markedList {
│  └─ [questionId]: boolean
│ }
└─ startTime (timestamp)

    ↓ submitQuiz()

RESULT DATA
├─ studentId
├─ quizId
├─ quizTitle
├─ score (0-100)
├─ timeTaken (seconds)
├─ questions [{
│  ├─ questionId
│  ├─ questionText
│  ├─ selectedOptionText
│  ├─ correctOptionText
│  ├─ explanation
│  └─ isCorrect (boolean)
│ }]
├─ attemptId
└─ submittedAt (ISO string)

    ↓ storage

SESSIONSTORAGE
├─ currentResultData (JSON)
├─ currentResultId
└─ quizSource (referrer URL)

INDEXEDDB
├─ Database: learniQ
└─ Stores:
   ├─ quiz_results
   │  └─ [resultId]: resultData
   └─ module_results
      └─ [resultId]: resultData

LOCALSTORAGE
├─ quizHistory []
├─ userProgress {}
└─ settings {}
```

---

## 🎯 Function Call Sequence Diagram

```
QUIZ QUESTIONS SEQUENCE

DOMContentLoaded
    ↓
highlightActiveSidebarItem()
    ↓
loadQuiz()
    │
    ├─ fetch API: /quizzes/{id}?mode={mode}
    │
    ├─ Store in: quizData
    │
    └─ renderQuestion()
        ├─ Get current question
        ├─ Update progress
        ├─ Display options
        ├─ Update mark button
        └─ Update nav buttons

Option Click
    ↓
pickAnswer(questionId, optionIndex)
    ├─ Store: answers[questionId] = optionIndex
    └─ renderQuestion() [refresh UI]

Next/Previous Click
    ↓
nextQ() / prevQ()
    ├─ Update: currentQuestionIndex
    └─ renderQuestion() [refresh UI]

Submit Click (on last Q)
    ↓
submitQuiz()
    ├─ Validate answers
    │
    ├─ POST to API: /quizzes/{id}/submit
    │
    ├─ Receive: attemptData
    │
    ├─ Build: resultData
    │
    ├─ Save to IndexedDB: quizResultsManager
    │
    ├─ Store: sessionStorage.currentResultData
    │
    └─ Redirect: studentQuizResults.html?resultId=...

Back Button Click
    ↓
goBack()
    ├─ Check: sessionStorage.quizSource
    │  └─ if exists → window.location.href = source
    ├─ else Check: quizMode === 'module' && subjectId
    │  └─ if true → redirect to module page
    ├─ else Check: quizMode === 'exam'
    │  └─ if true → redirect to exam page
    └─ else → redirect to quiz list


RESULTS PAGE SEQUENCE

DOMContentLoaded
    ↓
Check: sessionStorage.currentResultData
    ├─ if exists → Use it
    └─ else Check: resultId → loadResultFromDB()

renderResults()
    ├─ Calculate statistics (correct, incorrect, skipped)
    ├─ Update header display
    ├─ Update summary cards
    └─ renderQuestions()

renderQuestions()
    ├─ Filter based on: currentFilter
    ├─ Create question cards
    ├─ Add status badges
    ├─ Display answers & explanations
    └─ Append to DOM

Filter Button Click
    ↓
filterResults(filter)
    ├─ Update: currentFilter
    ├─ Highlight active button
    └─ renderQuestions() [refresh]

Retake Button Click
    ↓
retakeQuiz()
    ├─ Build query params
    ├─ Store: sessionStorage.quizSource
    └─ Redirect: studentQuizQuestions.html?...

Back Button Click
    ↓
goBack()
    ├─ Check: quizMode && subjectId
    ├─ Route accordingly
    └─ Redirect to appropriate page
```

---

## 🎨 CSS Cascade & Specificity

```
GLOBAL STYLES
├─ CSS Variables (:root)
├─ Body & Base Elements
└─ Reusable Utility Classes

PAGE STRUCTURE
├─ .page-body
├─ .page-title
└─ .page-wrapper

COMPONENTS
├─ BACK LINK
│  ├─ .back-link (base)
│  └─ .back-link:hover (interactive)
│
├─ PROGRESS SECTION
│  ├─ .progress-row
│  ├─ .progress-track
│  └─ .progress-fill
│
├─ QUESTION CARD
│  ├─ .question-card (container)
│  ├─ .question-number (badge)
│  ├─ .question-text (content)
│  └─ .options-list (container)
│
├─ OPTION ITEMS
│  ├─ .option-item (base)
│  ├─ .option-item:hover (interactive)
│  ├─ .option-item.selected (state)
│  ├─ .option-radio (radio button)
│  ├─ .option-letter (badge)
│  └─ .option-text (content)
│
├─ BUTTONS
│  ├─ .mark-btn
│  ├─ .mark-btn.marked
│  ├─ .nav-btn
│  ├─ .nav-btn:hover
│  └─ .nav-btn:disabled
│
└─ ANIMATIONS
   ├─ @keyframes fadeIn
   ├─ @keyframes slideInOption
   └─ @keyframes floatBg

MEDIA QUERIES
├─ @media (max-width: 768px) [tablet]
├─ @media (max-width: 640px) [mobile]
└─ @media (prefers-reduced-motion: reduce) [accessibility]
```

---

## 📈 Performance Optimization

```
LOAD TIME OPTIMIZATION
├─ CSS: Minified & Combined
├─ JavaScript: Minimal, Efficient
├─ Images: Optimized, Lazy-loaded
└─ Fonts: Preconnected, Optimized

RUNTIME OPTIMIZATION
├─ Smooth Animations
│  └─ 60fps Target (0.0167ms per frame)
├─ Efficient DOM Updates
│  └─ Only update changed elements
├─ Event Delegation
│  └─ Single event listener where possible
└─ Debouncing/Throttling
   └─ For scroll/resize events

MEMORY OPTIMIZATION
├─ Cleanup on Page Unload
├─ Efficient Object Structures
├─ Minimize Global Variables
└─ Use sessionStorage (not localStorage) for temp data
```

---

## 🔐 Security Considerations

```
INPUT VALIDATION
├─ Quiz ID validation
├─ Answer validation
├─ Student ID from JWT (trusted)
└─ Mode validation

DATA PROTECTION
├─ Result data in sessionStorage (cleared on close)
├─ Sensitive data in JWT token only
├─ API calls authenticated
└─ CORS headers configured

XSS PREVENTION
├─ No innerHTML from user input
├─ textContent used for user data
├─ HTML escaped where needed
└─ CSP headers configured
```

---

## 📱 Responsive Design Breakpoints

```
DESKTOP (1024px+)
├─ Full sidebar (215px)
├─ Main content (max 1000px)
├─ Two-column layouts
├─ Large buttons & spacing
└─ All features visible

TABLET (768px - 1023px)
├─ Compact sidebar (70px collapsed)
├─ Content width adjusted
├─ Single column for some components
├─ Medium buttons & spacing
└─ Touch-optimized targets

MOBILE (<768px)
├─ Hamburger menu
├─ Full-width content
├─ Stacked layouts
├─ Large touch targets (40px+)
├─ Reduced padding
└─ Mobile-first approach
```

---

## ✅ Quality Assurance Matrix

```
                    Desktop  Tablet  Mobile  Accessibility
Navigation          ✅       ✅      ✅      ✅
Questions UI        ✅       ✅      ✅      ✅
Options Selection   ✅       ✅      ✅      ✅
Mark for Review     ✅       ✅      ✅      ✅
Progress Bar        ✅       ✅      ✅      ✅
Results Display     ✅       ✅      ✅      ✅
Filters             ✅       ✅      ✅      ✅
Animations          ✅       ✅      ✅      Respects preference
Keyboard Nav        ✅       ✅      ✅      ✅
Screen Readers      ✅       ✅      ✅      ✅
Color Contrast      ✅       ✅      ✅      ✅
Touch Targets       ✅       ✅      ✅      ✅
Performance         ✅       ✅      ✅      ✅
```

---

## 🚀 Deployment Checklist

- [x] All CSS files created
- [x] All HTML files updated
- [x] JavaScript functionality working
- [x] Navigation logic implemented
- [x] Results display complete
- [x] Mobile responsive verified
- [x] Accessibility tested
- [x] Performance optimized
- [x] Documentation complete
- [x] Code reviewed
- [x] Ready for production

---

**All systems operational and ready for deployment! 🎉**
