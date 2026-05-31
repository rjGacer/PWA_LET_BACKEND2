/**
 * Notification Integration Guide
 * How to use the NotificationManager in your application
 */

// ============================================
// EXAMPLE 1: Manual Notification Creation
// ============================================

// Add a simple notification
async function exampleSimpleNotification() {
  await notificationManager.addNotification({
    title: '🎉 Quiz Completed!',
    message: 'Great job! You scored 85% on General Education',
    type: 'achievement',
    icon: '🎉',
    actionUrl: '../student/studentHistory.html'
  });
}

// ============================================
// EXAMPLE 2: Quiz Due Reminder (from dashboard)
// ============================================

// Create reminders for upcoming quizzes
async function exampleCreateQuizReminder() {
  await notificationManager.createQuizReminder({
    quizTitle: 'ITEP101 Quiz #1',
    categoryName: 'General Education',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  });
}

// ============================================
// EXAMPLE 3: Achievement Notification
// ============================================

async function exampleAchievementNotification() {
  await notificationManager.addNotification({
    title: '🏆 Achievement Unlocked!',
    message: 'You unlocked the "Speed Demon" badge! Complete a quiz in under 5 minutes.',
    type: 'achievement',
    icon: '🏆',
    actionUrl: '../student/studentHistory.html'
  });
}

// ============================================
// EXAMPLE 4: Study Streak Notification
// ============================================

async function exampleStreakNotification() {
  await notificationManager.addNotification({
    title: '🔥 Streak Active!',
    message: 'Keep it up! You have a 5-day study streak.',
    type: 'streak',
    icon: '🔥'
  });
}

// ============================================
// EXAMPLE 5: Access Browser Notifications
// ============================================

async function requestBrowserNotificationPermission() {
  const granted = await NotificationManager.requestPermission();
  if (granted) {
    console.log('✅ Browser notifications enabled!');
  } else {
    console.log('❌ Browser notifications disabled');
  }
}

// ============================================
// INTEGRATION POINTS IN YOUR CODE
// ============================================

/*
// When a student completes a quiz (in QuizResultsManager.js or your submission handler):
async function onQuizCompleted(quizData) {
  const { score, quizTitle, category, timeSpent } = quizData;
  
  // Show completion notification
  await notificationManager.addNotification({
    title: `✅ ${quizTitle} Completed!`,
    message: `You scored ${score}% on this quiz.`,
    type: 'completion',
    icon: '✅',
    actionUrl: '../student/studentHistory.html'
  });
  
  // Check for achievements
  if (score >= 90) {
    await notificationManager.addNotification({
      title: '🌟 Outstanding Score!',
      message: 'You scored 90% or higher!',
      type: 'achievement',
      icon: '🌟'
    });
  }
}

// When loading dashboard - daily reminder is automatic
// But you can also manually trigger it:
async function onDashboardLoaded() {
  notificationManager.checkDailyReminder();
}
*/

// ============================================
// AUTO-TRIGGERED NOTIFICATIONS (Automatic)
// ============================================

/*
The NotificationManager automatically:
1. Sends daily "Time to Review!" reminders at first page load each day
2. Checks for new notifications every 5 minutes
3. Updates the notification badge in the header automatically
4. Shows browser push notifications if permission is granted

Notifications are stored in IndexedDB and persist across sessions.
*/

console.log('✅ Notification Integration Guide loaded');
