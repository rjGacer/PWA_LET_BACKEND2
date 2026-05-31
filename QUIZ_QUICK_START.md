# Quick Start: Quiz Creation & Exam Simulation

## For Teachers: Creating a Quiz

### Method 1: Manual Question Entry
1. Navigate to Subject Details page
2. Click **"Create Quiz"** button under Quizzes section
3. Enter **Quiz Title** (e.g., "Midterm Exam")
4. Set **Time Limit** in minutes (e.g., 30, 60, 90)
5. Click **"Add Question"** button
6. Enter:
   - Question text
   - Four multiple choice options (A, B, C, D)
   - Select correct answer
   - (Optional) Add explanation
7. Click **"Add Question"** to save
8. Repeat steps 5-7 for each question
9. Click **"Save Quiz"** to create

### Method 2: Bulk Upload CSV
1. Prepare CSV file with format:
   ```
   Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation
   What is 2+2?,3,4,5,6,B,2 + 2 = 4
   ```
2. In quiz modal, scroll to **"Bulk Upload Questions"**
3. Drag-and-drop CSV file OR click to choose
4. Confirm number of questions to add
5. Questions appear in list immediately
6. Continue adding or click **"Save Quiz"**

### Method 3: Bulk Upload Excel
1. Prepare Excel file with columns:
   - Column A: Question
   - Column B: Option A
   - Column C: Option B
   - Column D: Option C
   - Column E: Option D
   - Column F: Correct Answer (A/B/C/D)
   - Column G: Explanation
2. In quiz modal, go to **"Bulk Upload Questions"**
3. Drop Excel file
4. SheetJS library auto-loads
5. Questions are parsed and added

### Editing an Existing Quiz
1. Find quiz in the list
2. Click **"Edit"** button
3. Same UI opens with existing data
4. Modify title, time, or questions
5. Add more questions via bulk upload if needed
6. Click **"Save Quiz"** to update

## For Students: Taking a Timed Exam

### Starting the Exam
1. Navigate to **Student Quiz Page**
2. Click the blue **"Exam Simulation"** card
3. Read the confirmation: "Ready to start the Exam Simulation?"
4. Click OK to proceed

### During the Exam
- **Timer**: Top right corner shows MM:SS format
  - Blue: Normal (>5 min remaining)
  - Orange: Warning (5-1 min remaining)
  - Red: Critical (<1 min remaining)
- **Navigation**: 
  - Use Previous/Next buttons to move between questions
  - Or click question numbers in right panel
- **Mark for Review**: Click the flag icon to mark confusing questions
- **Answer Tracking**:
  - Green: Question answered
  - Orange: Question marked for review
  - Blue: Current question
  - Gray: Unanswered

### Submitting the Exam
- **Automatic**: Auto-submits when timer reaches 0:00
- **Manual**: Click **"End Exam"** button to submit early
- **Result**: Shows summary with:
  - Total questions answered
  - Questions marked for review
  - Total time spent

## Features Highlight

✨ **Timed Exams**
- Realistic mock exam conditions
- Auto-submit when time expires
- Color-coded timer warnings
- Early end option

✨ **Question Management**
- Add questions individually
- Bulk import from CSV/Excel
- Edit questions anytime
- Delete unwanted questions

✨ **Student Experience**
- Clean, distraction-free interface
- Easy question navigation
- Progress bar shows completion
- Mark questions for later review

✨ **Flexible Time Limits**
- Set any duration (30, 60, 90, 120 minutes)
- Countdown shows remaining time
- Critical alert at <1 minute

## CSV Template

```csv
Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation
What is the capital of France?,London,Paris,Berlin,Madrid,B,Paris is the capital of France
Which planet is closest to the sun?,Venus,Mercury,Earth,Mars,B,Mercury is the closest planet to the sun
What is 5 × 5?,20,25,30,35,B,5 times 5 equals 25
```

## Troubleshooting

**Q: Excel upload not working**
A: Excel requires internet (loads SheetJS dynamically). Use CSV as fallback.

**Q: Time limit won't save**
A: Must be a number. Enter just the value (e.g., "30" not "30 minutes")

**Q: Exam auto-submitted before I was done**
A: This is intentional - mimics real exam conditions. Plan your time accordingly.

**Q: Questions not showing in quiz**
A: Ensure all fields are filled (question, all 4 options, correct answer).

**Q: Edit button doesn't load quiz**
A: Refresh page if quiz was just created. API may need a moment.

## Best Practices

📌 **For Teachers:**
- Keep questions concise (under 200 chars)
- Provide clear explanations for learning
- Test quiz before assigning to students
- Use bulk upload for large question banks
- Set realistic time limits (1-2 min per question)

📌 **For Students:**
- Read questions carefully before answering
- Don't leave questions unanswered if possible
- Use "Mark for Review" for difficult questions
- Manage time - don't spend too long on one question
- Submit before time runs out to save your progress

## API Integration

If integrating from other systems, the quiz creation endpoint expects:
```json
{
  "subject_id": 1,
  "title": "Sample Quiz",
  "time_limit": 30,
  "total_points": 100,
  "is_randomized": true,
  "show_answers": true,
  "passing_score": 70
}
```

Then add questions via `/quizzes/{id}/add-question` endpoint.
