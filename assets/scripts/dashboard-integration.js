/**
 * Dashboard Integration Script
 * Loads and manages all dashboard data for both Student and Teacher dashboards
 */

const api = new ApiService();
let currentUser = null;
// Get dynamic API base URL from ApiService
const API_BASE = api.baseURL || window.location.origin + '/api/v1';

// Helper to read stored token (supports multiple storage keys)
function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
}

// ==================== STUDENT DASHBOARD ====================

// Initialize student dashboard
async function initializeDashboard() {
  try {
    // Record login session
    try {
      const loginSession = await api.recordLogin();
      if (loginSession && loginSession.sessionId) {
        sessionStorage.setItem('currentSessionId', loginSession.sessionId);
        console.log('✓ Login session recorded:', loginSession.sessionId);
      }
    } catch (err) {
      console.warn('Could not record login session:', err);
    }

    // Load user info first using ApiService (handles auth headers)
    try {
      currentUser = await api.request('/students/me');
      console.log('✓ User loaded via ApiService:', currentUser);

      // Update welcome section
      const welcomeName = document.querySelector('.welcome-name');
      if (welcomeName) welcomeName.textContent = currentUser.name || currentUser.full_name || currentUser.username || 'Student';

      const courseEl = document.querySelector('.welcome-info h2');
      if (courseEl) courseEl.textContent = currentUser.course || currentUser.program || currentUser.department || 'Student';

      const profileImg = document.querySelector('.welcome-card img');
      if (profileImg) {
        profileImg.src = currentUser.profile_picture || currentUser.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(currentUser.email || currentUser.id || Math.random())}`;
      }

      // ALSO UPDATE TOPBAR with student name and profile picture
      const topbarName = document.getElementById('topbarStudentName');
      const topbarPic = document.getElementById('topbarProfilePic');
      
      if (topbarName && currentUser.name) {
        const firstName = currentUser.name.trim().split(' ')[0];
        topbarName.textContent = firstName;
        console.log('✓ Updated topbar name to:', firstName);
      }
      
      if (topbarPic) {
        if (currentUser.profile_picture) {
          topbarPic.src = currentUser.profile_picture;
          console.log('✓ Updated topbar profile picture from database');
        } else {
          const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name || 'User') + '&background=2f49e0&color=fff&size=40';
          topbarPic.src = avatarUrl;
          console.log('✓ Updated topbar with generated avatar');
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch /students/me, falling back to local data:', e.message);
      // Fallback to stored profile in localStorage if available
      try {
        const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (stored && stored.name) {
          currentUser = stored;
          const welcomeName = document.querySelector('.welcome-name');
          if (welcomeName) welcomeName.textContent = currentUser.name;
          const courseEl = document.querySelector('.welcome-info h2');
          if (courseEl) courseEl.textContent = currentUser.course || 'Student';
          const profileImg = document.querySelector('.welcome-card img');
          if (profileImg) profileImg.src = currentUser.profile_picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(currentUser.email || Math.random())}`;
          
          // ALSO UPDATE TOPBAR
          const topbarName = document.getElementById('topbarStudentName');
          const topbarPic = document.getElementById('topbarProfilePic');
          
          if (topbarName && currentUser.name) {
            const firstName = currentUser.name.trim().split(' ')[0];
            topbarName.textContent = firstName;
          }
          
          if (topbarPic) {
            if (currentUser.profile_picture) {
              topbarPic.src = currentUser.profile_picture;
            } else {
              const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name || 'User') + '&background=2f49e0&color=fff&size=40';
              topbarPic.src = avatarUrl;
            }
          }
        }
      } catch (err) {
        console.warn('No local user cached');
      }
    }
    
    // Load student statistics
    await loadStudentStats();
    
    // Load weekly progress aggregates
    await loadWeeklyProgress();

    // Load recent activity
    await loadRecentActivityData();
    
    // Load leaderboard preview
    await loadLeaderboardPreview();
    
    // Load notifications and reminders
    await loadDashboardNotifications();
    await loadDashboardReminders();
    
    // Start periodic study time refresh (every 30 seconds) to update current session duration
    setupStudyTimeRefresh();
    
    console.log('✓ Dashboard initialized successfully');
  } catch (error) {
    console.error('❌ Dashboard initialization error:', error);
  }
}

// Load weekly progress: aggregate correct answers and quizzes taken over last 7 days
// Includes both backend and local QuizResultsManager results
async function loadWeeklyProgress() {
  try {
    // 1. Fetch weekly progress stats from backend
    let weeklyStats = await api.getWeeklyProgressStats();
    console.log('✓ Weekly progress stats loaded from backend:', weeklyStats);

    if (!weeklyStats) {
      weeklyStats = {
        correct_answers: 0,
        quizzes_taken: 0,
        study_time_minutes: 0,
        completion_percentage: 0
      };
    }

    // Initialize if not set
    if (!weeklyStats.correct_answers) weeklyStats.correct_answers = 0;
    if (!weeklyStats.quizzes_taken) weeklyStats.quizzes_taken = 0;
    if (!weeklyStats.study_time_minutes) weeklyStats.study_time_minutes = 0;

    // 2. Add local results from QuizResultsManager (this week only)
    try {
      if (window.quizResultsManager && currentUser && currentUser.id) {
        console.log('📱 Loading this week\'s local stats from QuizResultsManager...');
        
        // Ensure IndexedDB is ready
        if (window.quizResultsManager.ensureReady) {
          try {
            await window.quizResultsManager.ensureReady();
            console.log('✅ IndexedDB ready for weekly progress');
          } catch (e) {
            console.warn('⚠️ IndexedDB initialization warning:', e);
          }
        }
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const practiceResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'practice') || [];
        const examResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'exam') || [];
        const randomResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'random') || [];
        
        // Filter to only this week's results
        const isThisWeek = (timestamp) => {
          const resultDate = new Date(timestamp);
          return resultDate >= weekAgo && resultDate <= now;
        };
        
        const thisWeekPractice = practiceResults.filter(r => isThisWeek(r.timestamp));
        const thisWeekExam = examResults.filter(r => isThisWeek(r.timestamp));
        const thisWeekRandom = randomResults.filter(r => isThisWeek(r.timestamp));
        
        // Add local quiz counts (this week)
        const localQuizzesThisWeek = thisWeekPractice.length + thisWeekExam.length + thisWeekRandom.length;
        weeklyStats.quizzes_taken += localQuizzesThisWeek;
        
        // Add local correct answers (this week)
        const localCorrectAnswersThisWeek = [
          ...thisWeekPractice,
          ...thisWeekExam,
          ...thisWeekRandom
        ].reduce((total, result) => {
          if (result.correctAnswers) return total + result.correctAnswers;
          if (result.score && result.totalQuestions) {
            return total + Math.round((result.score / 100) * result.totalQuestions);
          }
          return total;
        }, 0);
        
        weeklyStats.correct_answers += localCorrectAnswersThisWeek;
        
        console.log('✓ Local stats for this week added:', {
          localQuizzesThisWeek,
          localCorrectAnswersThisWeek,
          practiceCount: thisWeekPractice.length,
          examCount: thisWeekExam.length,
          randomCount: thisWeekRandom.length
        });
      }
    } catch (err) {
      console.warn('⚠️  Could not load local stats from QuizResultsManager:', err);
    }

    // 3. Calculate current session duration and add to study time
    let totalStudyTime = weeklyStats.study_time_minutes || 0;
    try {
      const activeSession = await api.getActiveSession();
      if (activeSession && activeSession.login_at) {
        const loginTime = new Date(activeSession.login_at);
        const currentTime = new Date();
        const currentSessionMinutes = Math.floor((currentTime - loginTime) / 60000); // Convert ms to minutes
        totalStudyTime += currentSessionMinutes;
        console.log('✓ Added current session time:', {
          sessionLoginTime: activeSession.login_at,
          currentSessionMinutes,
          totalStudyTime
        });
      }
    } catch (err) {
      console.warn('Could not fetch active session:', err);
      // Continue with just the recorded study time if session fetch fails
    }

    // 4. Update progress circle with completion percentage
    const progressPct = document.querySelector('.pct');
    if (progressPct) {
      const completionRate = weeklyStats.completion_percentage || 0;
      progressPct.textContent = completionRate + '%';

      // Update SVG circle
      const circle = document.querySelector('.fill');
      if (circle) {
        const circumference = 2 * Math.PI * 42;
        const offset = circumference - (completionRate / 100) * circumference;
        circle.style.strokeDashoffset = offset;
      }
    }

    // 5. Update legend rows: correct answers, quizzes taken, study time
    const correctAnswersSpan = document.querySelector('[data-stat="correct-answers"] .stat-value');
    const quizzesTakenSpan = document.querySelector('[data-stat="quizzes-taken"] .stat-value');
    const studyTimeSpan = document.querySelector('[data-stat="study-time"] .stat-value');
    
    if (correctAnswersSpan) correctAnswersSpan.textContent = weeklyStats.correct_answers || 0;
    if (quizzesTakenSpan) quizzesTakenSpan.textContent = weeklyStats.quizzes_taken || 0;
    if (studyTimeSpan) studyTimeSpan.textContent = formatStudyTime(totalStudyTime);
    
    console.log('✓ Progress box updated (backend + local):', {
      correct_answers: weeklyStats.correct_answers,
      quizzes_taken: weeklyStats.quizzes_taken,
      study_time_minutes: totalStudyTime
    });
  } catch (err) {
    console.warn('Could not load weekly progress:', err);
  }
}

// Setup periodic study time refresh to update current session duration
function setupStudyTimeRefresh() {
  // Refresh every 30 seconds to update the study time with current session duration
  setInterval(async () => {
    try {
      const weeklyStats = await api.getWeeklyProgressStats();
      if (!weeklyStats) return;

      // Calculate current session duration and add to study time
      let totalStudyTime = weeklyStats.study_time_minutes || 0;
      try {
        const activeSession = await api.getActiveSession();
        if (activeSession && activeSession.login_at) {
          const loginTime = new Date(activeSession.login_at);
          const currentTime = new Date();
          const currentSessionMinutes = Math.floor((currentTime - loginTime) / 60000);
          totalStudyTime += currentSessionMinutes;
        }
      } catch (err) {
        // Continue with just recorded study time if session fetch fails
      }

      // Update study time display
      const studyTimeSpan = document.querySelector('[data-stat="study-time"] .stat-value');
      if (studyTimeSpan) {
        studyTimeSpan.textContent = formatStudyTime(totalStudyTime);
      }
    } catch (err) {
      console.warn('Could not refresh study time:', err);
    }
  }, 30000); // Refresh every 30 seconds
}

// Load student statistics - from backend and local QuizResultsManager
async function loadStudentStats() {
  try {
    let stats = {
      quizzes_taken: 0,
      fastest_time: 0,
      correct_answers: 0
    };

    // 1. Load backend stats
    try {
      const backendStats = await api.getStudentDashboardStats();
      console.log('✓ Backend stats loaded via ApiService:', backendStats);
      if (backendStats) {
        stats.quizzes_taken = backendStats.quizzes_taken || 0;
        stats.fastest_time = backendStats.fastest_time || 0;
        stats.correct_answers = backendStats.correct_answers || 0;
      }
    } catch (err) {
      console.warn('⚠️  Could not load backend stats:', err);
    }

    // 2. Add local results from QuizResultsManager (practice, exam, random)
    try {
      if (window.quizResultsManager && currentUser && currentUser.id) {
        console.log('📱 Loading local stats from QuizResultsManager...');
        
        // Ensure IndexedDB is ready
        if (window.quizResultsManager.ensureReady) {
          try {
            await window.quizResultsManager.ensureReady();
            console.log('✅ IndexedDB ready for student stats');
          } catch (e) {
            console.warn('⚠️ IndexedDB initialization warning:', e);
          }
        }
        
        const practiceResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'practice') || [];
        const examResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'exam') || [];
        const randomResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'random') || [];
        
        // Add local quiz counts
        const localQuizzes = practiceResults.length + examResults.length + randomResults.length;
        stats.quizzes_taken += localQuizzes;
        
        // Add local correct answers
        const localCorrectAnswers = [
          ...practiceResults,
          ...examResults,
          ...randomResults
        ].reduce((total, result) => {
          if (result.correctAnswers) return total + result.correctAnswers;
          if (result.score && result.totalQuestions) {
            return total + Math.round((result.score / 100) * result.totalQuestions);
          }
          return total;
        }, 0);
        
        stats.correct_answers += localCorrectAnswers;
        
        console.log('✓ Local stats added:', {
          localQuizzes,
          localCorrectAnswers,
          practiceCount: practiceResults.length,
          examCount: examResults.length,
          randomCount: randomResults.length
        });
      }
    } catch (err) {
      console.warn('⚠️  Could not load local stats from QuizResultsManager:', err);
    }

    // 3. Update stat cards in welcome section (ALL-TIME stats)
    const statCards = document.querySelectorAll('.stat-card-text');
    // Divide correct_answers by 10 because backend returns score (answers * 10)
    const correctAnswersDisplay = Math.round((stats.correct_answers || 0) / 10);
    if (statCards[0]) statCards[0].innerHTML = `<strong>${stats.quizzes_taken || 0}</strong> Quiz Taken`;
    if (statCards[1]) statCards[1].innerHTML = `<strong>${stats.fastest_time || 0}m</strong> Fastest Time`;
    if (statCards[2]) statCards[2].innerHTML = `<strong>${correctAnswersDisplay}</strong> Correct`;
    
    console.log('✓ Welcome card stats updated:', {
      quizzes_taken: stats.quizzes_taken,
      fastest_time: stats.fastest_time,
      correct_answers: stats.correct_answers,
      correct_answers_display: correctAnswersDisplay
    });
    
    console.log('✓ Dashboard stats updated:', stats);
    
    // Note: Progress circle is updated by loadWeeklyProgress() which is called after this
  } catch (error) {
    console.error('❌ Failed to load student stats:', error);
  }
}

// Load recent activity from backend + local QuizResultsManager
async function loadRecentActivityData() {
  try {
    const container = document.querySelector('.activity-grid');
    if (!container) return;

    const exploreCard = container.querySelector('.activity-card.explore');
    container.innerHTML = '';

    let allAttempts = [];

    // 1. Load backend results (module & quiz modes)
    try {
      const backendResponse = await api.getStudentQuizHistory(100); // Use the same endpoint as History page
      console.log('✓ Backend recent activity loaded:', backendResponse?.data?.length || 0);
      if (backendResponse && backendResponse.data && Array.isArray(backendResponse.data)) {
        // Normalize backend data to match expected format
        const normalizedBackend = backendResponse.data.map(result => ({
          ...result,
          quiz_title: result.quizTitle || 'Quiz',
          subject_name: result.category || 'General',
          total_questions: result.totalQuestions || 0,
          correct_answers: result.correctAnswers || 0,
          percentage: result.score || result.percentage || 0,
          submitted_at: new Date(result.timestamp).toISOString(),
          attempt_timestamp: result.timestamp,
          _source: 'backend'
        }));
        allAttempts = [...allAttempts, ...normalizedBackend];
      }
    } catch (err) {
      console.warn('⚠️  Could not load backend recent activity:', err);
    }

    // 2. Load local results from QuizResultsManager (practice, exam, random)
    try {
      if (window.quizResultsManager && currentUser && currentUser.id) {
        console.log('📱 Loading local results from QuizResultsManager...');
        
        // Ensure IndexedDB is ready
        if (window.quizResultsManager.ensureReady) {
          try {
            await window.quizResultsManager.ensureReady();
            console.log('✅ IndexedDB ready for recent activity');
          } catch (e) {
            console.warn('⚠️ IndexedDB initialization warning:', e);
          }
        }
        
        // Get all local results (practice, exam, random)
        const practiceResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'practice');
        const examResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'exam');
        const randomResults = await window.quizResultsManager.getStudentResultsByMode(currentUser.id, 'random');
        
        console.log('✓ Local practice results:', practiceResults?.length || 0);
        console.log('✓ Local exam results:', examResults?.length || 0);
        console.log('✓ Local random results:', randomResults?.length || 0);

        // Normalize local results to match backend format
        const normalizeLocalResult = (result) => ({
          ...result,
          quiz_title: result.quizTitle || 'Quiz',
          subject_name: result.subjectName || 'General',
          total_questions: result.totalQuestions || result.questions?.length || 0,
          correct_answers: result.correctAnswers || Math.round((result.score / 100) * (result.totalQuestions || result.questions?.length || 0)) || 0,
          percentage: result.score || 0,
          submitted_at: new Date(result.timestamp).toISOString(),
          attempt_timestamp: result.timestamp, // Keep original timestamp for sorting
          _source: 'local'
        });

        if (practiceResults && Array.isArray(practiceResults)) {
          allAttempts = [...allAttempts, ...practiceResults.map(normalizeLocalResult)];
        }
        if (examResults && Array.isArray(examResults)) {
          allAttempts = [...allAttempts, ...examResults.map(normalizeLocalResult)];
        }
        if (randomResults && Array.isArray(randomResults)) {
          allAttempts = [...allAttempts, ...randomResults.map(normalizeLocalResult)];
        }
      } else {
        console.warn('⚠️  QuizResultsManager not available or currentUser not set');
      }
    } catch (err) {
      console.warn('⚠️  Could not load local results from QuizResultsManager:', err);
    }

    // Deduplicate results: Prioritize backend results over local ones
    // Create maps for quick lookup and deduplication
    const backendAttempts = allAttempts.filter(a => a._source === 'backend');
    const localAttempts = allAttempts.filter(a => a._source === 'local');
    
    // Create a set of backend result signatures for matching
    const backendSignatures = new Set();
    backendAttempts.forEach(attempt => {
      // Create signature: score + question count + time window (5 min tolerance)
      const timestamp = attempt.attempt_timestamp || new Date(attempt.submitted_at).getTime();
      const timeWindow = Math.floor(timestamp / 300000); // 5 minute window
      const signature = `${attempt.correct_answers}/${attempt.total_questions}|${timeWindow}`;
      backendSignatures.add(signature);
    });

    // Filter local attempts to exclude those that match backend results
    const deduplicatedLocal = localAttempts.filter(attempt => {
      const timestamp = attempt.attempt_timestamp || new Date(attempt.submitted_at).getTime();
      const timeWindow = Math.floor(timestamp / 300000); // 5 minute window
      const signature = `${attempt.correct_answers}/${attempt.total_questions}|${timeWindow}`;
      
      const isDuplicate = backendSignatures.has(signature);
      if (isDuplicate) {
        console.log(`🔄 Deduplicating local result: ${attempt.quiz_title} (score: ${attempt.correct_answers}/${attempt.total_questions})`);
      }
      return !isDuplicate; // Only keep if NOT a duplicate
    });

    // Combine backend results + non-duplicate local results
    const deduplicatedAttempts = [...backendAttempts, ...deduplicatedLocal];
    
    console.log(`✓ Total attempts loaded (backend + local): ${allAttempts.length} → ${deduplicatedAttempts.length} after dedup (backend: ${backendAttempts.length}, local: ${deduplicatedLocal.length})`);

    // 3. Sort by timestamp (most recent first)
    deduplicatedAttempts.sort((a, b) => {
      const timeA = a.attempt_timestamp || new Date(a.submitted_at).getTime();
      const timeB = b.attempt_timestamp || new Date(b.submitted_at).getTime();
      return timeB - timeA;
    });

    // 4. Display top 3 most recent
    deduplicatedAttempts.slice(0, 3).forEach(attempt => {
      const percentage = Math.round(attempt.percentage || (attempt.correct_answers && attempt.total_questions ? (attempt.correct_answers / attempt.total_questions) * 100 : 0)) || 0;
      
      // Determine tag color and text based on mode
      let tagClass = 'purple-tag';
      let tagText = 'Quiz Attempt';
      
      if (attempt.mode === 'practice') {
        tagClass = 'green-tag';
        tagText = 'Practice Mode';
      } else if (attempt.mode === 'exam') {
        tagClass = 'blue-tag';
        tagText = 'Exam Simulation';
      } else if (attempt.mode === 'random') {
        tagClass = 'purple-tag';
        tagText = 'Random Quiz';
      } else if (attempt.mode === 'module') {
        tagClass = 'purple-tag';
        tagText = 'Module Quiz';
      } else if (attempt.mode === 'quiz') {
        tagClass = 'purple-tag';
        tagText = 'Quiz Attempt';
      }

      const card = document.createElement('div');
      card.className = 'activity-card';
      card.innerHTML = `
        <span class="tag ${tagClass}">${tagText}</span>
        <h3>${attempt.quiz_title || attempt.subject_name || 'Quiz'}</h3>
        <p>${attempt.total_questions || 0} Questions</p>
        <div class="stats-row">
          <div><small>Score</small><div class="big">${attempt.correct_answers || 0}/${attempt.total_questions || 0}</div></div>
          <div><small>Accuracy</small><div class="big accuracy">${percentage}%</div></div>
        </div>
        <span class="completed-badge">${attempt.completed ? 'Completed' : (attempt.in_progress ? 'In Progress' : 'Attempted')}</span>
      `;
      container.appendChild(card);
    });

    if (exploreCard) container.appendChild(exploreCard);

    console.log('✓ Recent activity displayed');
  } catch (error) {
    console.error('❌ Failed to load recent activity:', error);
  }
}

// Load leaderboard preview
async function loadLeaderboardPreview() {
  try {
    try {
      const leaderboard = await api.getLeaderboard({ limit: 3, period: 'all' });
      console.log('✓ Leaderboard preview loaded via ApiService:', leaderboard);

      const container = document.querySelector('.side-card:has(.leader-item)');
      if (!container) return;

      const leaderItems = container.querySelectorAll('.leader-item');
      (leaderboard || []).slice(0, 3).forEach((entry, idx) => {
        if (leaderItems[idx]) {
          // Backend returns avg_score (not score)
          const score = Math.round(entry.avg_score || entry.score || entry.points || 0);
          leaderItems[idx].innerHTML = `
            <div class="leader-left" style="cursor: pointer;" onclick="showProfileModal('${entry.student_id}', '${(entry.full_name||entry.name||'').replace(/'/g, "\\'")}'  , '${entry.profile_picture || 'https://i.pravatar.cc/50?img=12'}')">  
              <span class="rank-num">${entry.rank || idx+1}</span>
              <img src="${entry.profile_picture || 'https://i.pravatar.cc/50?img=12'}" alt="${entry.full_name || entry.name}" />
              <span class="leader-name">${entry.full_name || entry.name}</span>
            </div>
            <span class="leader-score">${score}</span>
          `;
          console.log('✓ Updated leaderboard item', idx, 'with avg_score:', score);
        }
      });
    } catch (err) {
      console.error('❌ Failed to load leaderboard preview via ApiService:', err);
    }
  } catch (error) {
    console.error('❌ Failed to load leaderboard preview:', error);
  }
}

// Load and display dashboard notifications (recent modules/quizzes created)
async function loadDashboardNotifications() {
  try {
    const container = document.getElementById('notificationList');
    if (!container) return;

    // Try to load recent activity which includes module/quiz creation alerts
    try {
      const recentActivity = await api.getStudentRecentActivity(5);
      console.log('✓ Recent activity loaded for notifications:', recentActivity);

      if (recentActivity && Array.isArray(recentActivity) && recentActivity.length > 0) {
        container.innerHTML = recentActivity.slice(0, 5).map((item, idx) => `
          <div style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'" onclick="window.handleNotificationClick && window.handleNotificationClick('${idx}', '')">
            <div style="display: flex; gap: 12px;">
              <div style="font-size: 20px; flex-shrink: 0;">📚</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; font-size: 13px;">${item.quiz_title || item.title || 'New Activity'}</div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 4px; line-height: 1.4;">${item.subject_name || item.category || ''} - ${item.percentage || 0}%</div>
                <div style="color: #9ca3af; font-size: 11px; margin-top: 4px;">${new Date(item.submitted_at || item.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        `).join('');
        return;
      }
    } catch (err) {
      console.warn('Could not load recent activity for notifications:', err);
    }

    // Fallback: Show message if no recent activity
    container.innerHTML = '<div style="padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">No new notifications</div>';
  } catch (error) {
    console.error('❌ Failed to load notifications:', error);
  }
}

// Load and display unattempted quizzes as reminders
async function loadDashboardReminders() {
  try {
    const container = document.getElementById('remindersContainer');
    if (!container) return;

    // Get all available subjects
    const categories = await api.getCategories();
    let unattemptedQuizzes = [];

    // For each category, get subjects with quizzes
    for (const category of categories || []) {
      try {
        const subjects = await api.getSubjectsByCategory(category.id);
        
        for (const subject of subjects || []) {
          try {
            // Get all quizzes for this subject
            const quizzes = await api.getQuizzes(subject.id, 'exam');
            
            // Get student attempts
            const attempts = await api.getStudentAttempts(currentUser.id);
            const attemptedQuizIds = new Set((attempts || []).map(a => a.quiz_id));
            
            // Find unattempted quizzes
            for (const quiz of quizzes || []) {
              if (!attemptedQuizIds.has(quiz.id)) {
                unattemptedQuizzes.push({
                  id: quiz.id,
                  title: quiz.title || 'Quiz',
                  subject: subject.name,
                  subjectId: subject.id,
                  dueDate: quiz.due_date || 'No due date'
                });
              }
            }
          } catch (err) {
            console.warn('Could not load quizzes for subject:', subject.id, err);
          }
        }
      } catch (err) {
        console.warn('Could not load subjects for category:', category.id, err);
      }
    }

    // Update reminders display
    if (unattemptedQuizzes.length > 0) {
      container.innerHTML = unattemptedQuizzes.slice(0, 3).map((quiz, idx) => `
        <div class="reminder-item" style="cursor: pointer;" onclick="window.location.href='../student/studentViewModules.html?subjectId=${quiz.subjectId}'">
          <div class="reminder-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
          <div class="reminder-info">
            <strong>${quiz.title}</strong>
            <span class="due" style="display: block; font-size: 12px;">${quiz.subject}</span>
            <span class="due" style="display: block; font-size: 11px; color: #9ca3af;">${quiz.dueDate}</span>
          </div>
        </div>
      `).join('');
    } else {
      // No unattempted quizzes
      container.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">
          <i class="fa-solid fa-check-circle" style="font-size: 24px; color: #10b981; margin-bottom: 8px;"></i>
          <p>All caught up! No pending quizzes.</p>
        </div>
      `;
    }

    console.log('✓ Reminders updated:', unattemptedQuizzes.length, 'unattempted quizzes found');
  } catch (error) {
    console.error('❌ Failed to load reminders:', error);
  }
}

// Format study time
function formatStudyTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return mins + 'm';
  return hours + 'h ' + mins + 'm';
}

// Show profile modal
function showProfileModal(studentId, name, picture) {
  const modal = document.getElementById('profileModal');
  if (!modal) {
    console.log('Profile modal not found');
    return;
  }
  
  // Populate modal with data
  document.getElementById('modalStudentName').textContent = name;
  document.getElementById('modalStudentPicture').src = picture || 'https://i.pravatar.cc/150?img=12';
  document.getElementById('modalStudentCourse').textContent = 'Student';
  document.getElementById('modalStudentEmail').textContent = 'student@learniq.edu';
  document.getElementById('modalStudentBio').textContent = 'Passionate learner';
  
  modal.style.display = 'flex';
}

// Close modal
function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ==================== TEACHER DASHBOARD ====================

// Initialize teacher dashboard
function initDashboard() {
  console.log('📊 Initializing Teacher Dashboard...');
  
  // Check if user is authenticated
  const token = getAuthToken();
  if (!token && window.location.pathname.includes('/teacher/')) {
    console.warn('⚠️  No authentication token found. Redirecting to login...');
    // Uncomment to redirect: window.location.href = '/login.html';
  }
  
  // Load all data
  loadDashboardStatistics();
  loadCategoryPerformanceChart();
  loadRecentActivity();
  loadTopSubjects();
  loadSystemOverview();
  
  console.log('✓ Teacher Dashboard initialized');
}

// Load dashboard statistics
async function loadDashboardStatistics() {
  try {
    // Get student stats
    const response = await fetch(`${API_BASE}/performance/stats`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const stats = await response.json();
      console.log('✓ Dashboard statistics loaded:', stats);
      
      // Update stat cards
      const statCards = document.querySelectorAll('.stat-card');
      
      if (statCards[0]) {
        const statValue = statCards[0].querySelector('.stat-value');
        const statChange = statCards[0].querySelector('.stat-change');
        if (statValue) statValue.textContent = stats.total_students || '1,248';
        if (statChange) statChange.innerHTML = '↑ 12.5% <span>from last month</span>';
      }
      
      if (statCards[1]) {
        const statValue = statCards[1].querySelector('.stat-value');
        if (statValue) statValue.textContent = (stats.average_score || 72.4) + '%';
      }
      
      if (statCards[2]) {
        const statValue = statCards[2].querySelector('.stat-value');
        if (statValue) statValue.textContent = stats.total_attempts || '5,892';
      }
      
      if (statCards[3]) {
        const statValue = statCards[3].querySelector('.stat-value');
        if (statValue) statValue.textContent = stats.active_users || '892';
      }
    }
  } catch (error) {
    console.error('❌ Failed to load dashboard statistics:', error);
  }
}

// Load category performance chart data
async function loadCategoryPerformanceChart() {
  try {
    const response = await fetch(`${API_BASE}/performance/categories`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const categories = await response.json();
      console.log('✓ Category performance loaded:', categories);
      
      // Update bar chart
      const barsRow = document.querySelector('.bars-row');
      if (barsRow && categories.length > 0) {
        barsRow.innerHTML = '';
        
        categories.slice(0, 3).forEach(cat => {
          const score = cat.average_score || 0;
          const height = Math.max(50, (score / 100) * 180);
          const color = ['#a78bfa', '#60a5fa', '#4ade80'][categories.indexOf(cat) % 3];
          
          const barCol = document.createElement('div');
          barCol.className = 'bar-col';
          barCol.innerHTML = `
            <span class="bar-pct">${score}%</span>
            <div class="bar" style="background: ${color}; height: ${height}px;"></div>
          `;
          barsRow.appendChild(barCol);
        });
      }
      
      // Update bar labels
      const barLabels = document.querySelector('.bars-bottom');
      if (barLabels) {
        barLabels.innerHTML = '';
        categories.slice(0, 3).forEach(cat => {
          const label = document.createElement('span');
          label.className = 'bar-label';
          label.textContent = cat.name;
          barLabels.appendChild(label);
        });
      }
    }
  } catch (error) {
    console.error('❌ Failed to load category performance:', error);
  }
}

// Load recent quiz activity
async function loadRecentActivity() {
  try {
    const response = await fetch(`${API_BASE}/performance/recent-activity?limit=4`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const activities = await response.json();
      console.log('✓ Recent activity loaded:', activities);
      
      const quizList = document.querySelector('.quiz-list');
      if (quizList) {
        quizList.innerHTML = '';
        
        activities.forEach(activity => {
          const categoryMap = {
            'General Education': 'gened',
            'Professional Education': 'profed',
            'Major': 'major'
          };
          
          const badgeClass = categoryMap[activity.subject_name] || 'gened';
          const badgeText = badgeClass === 'gened' ? 'GenEd' : badgeClass === 'profed' ? 'ProfEd' : 'Major';
          
          const quizItem = document.createElement('div');
          quizItem.className = 'quiz-item';
          quizItem.innerHTML = `
            <div class="quiz-badge ${badgeClass}">${badgeText}</div>
            <div class="quiz-info">
              <div class="quiz-name">${activity.quiz_title || 'Quiz'}</div>
              <div class="quiz-meta">${new Date(activity.submitted_at).toLocaleDateString()} <span class="dot">•</span> ${activity.student_count || 0} students</div>
            </div>
            <div class="quiz-score">
              <div class="quiz-score-label">Average Score</div>
              <div class="quiz-score-val">${Math.round(activity.average_score) || 0}%</div>
            </div>
          `;
          quizList.appendChild(quizItem);
        });
      }
    }
  } catch (error) {
    console.error('❌ Failed to load recent activity:', error);
  }
}

// Load top performing subjects
async function loadTopSubjects() {
  try {
    const response = await fetch(`${API_BASE}/performance/top-subjects?limit=5`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const subjects = await response.json();
      console.log('✓ Top subjects loaded:', subjects);
      
      // Update top performing topics
      const topicList = document.querySelectorAll('.topic-list')[0];
      if (topicList) {
        topicList.innerHTML = '';
        
        subjects.forEach(subject => {
          const score = subject.average_score || 0;
          const topicRow = document.createElement('div');
          topicRow.className = 'topic-row';
          topicRow.innerHTML = `
            <span class="topic-name">${subject.name}</span>
            <div class="topic-bar-bg">
              <div class="topic-bar-fill" style="width: ${score}%; background: #22c55e"></div>
            </div>
            <span class="topic-pct">${score}%</span>
          `;
          topicList.appendChild(topicRow);
        });
      }
    }
  } catch (error) {
    console.error('❌ Failed to load top subjects:', error);
  }
}

// Load system overview data
async function loadSystemOverview() {
  try {
    const response = await fetch(`${API_BASE}/performance/system-overview`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const overview = await response.json();
      console.log('✓ System overview loaded:', overview);
      
      // Update donut chart legend
      const legendItems = document.querySelectorAll('.legend-item');
      if (legendItems[0]) legendItems[0].querySelector('.legend-val').textContent = overview.total_questions || '12,560';
      if (legendItems[1]) legendItems[1].querySelector('.legend-val').textContent = overview.total_categories || '38';
      if (legendItems[2]) legendItems[2].querySelector('.legend-val').textContent = overview.total_students || '1,248';
      if (legendItems[3]) legendItems[3].querySelector('.legend-val').textContent = overview.total_teachers || '24';
      
      // Render donut chart
      renderDonutChart([
        overview.total_questions || 12560,
        overview.total_categories || 38,
        overview.total_students || 1248,
        overview.total_teachers || 24
      ]);
    }
  } catch (error) {
    console.error('❌ Failed to load system overview:', error);
  }
}

// Render donut chart
function renderDonutChart(data) {
  const canvas = document.getElementById('donutChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const outerR = 56;
  const innerR = 34;
  const colors = ['#7c6ff7', '#60a5fa', '#4ade80', '#fb923c'];
  
  const total = data.reduce((a, b) => a + b, 0);
  let currentAngle = -Math.PI / 2;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  data.forEach((value, idx) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    // Draw outer arc
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, currentAngle, currentAngle + sliceAngle);
    ctx.lineTo(
      cx + innerR * Math.cos(currentAngle + sliceAngle),
      cy + innerR * Math.sin(currentAngle + sliceAngle)
    );
    ctx.arc(cx, cy, innerR, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[idx];
    ctx.fill();
    
    currentAngle += sliceAngle;
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check which dashboard we're on
  if (window.location.pathname.includes('/student/')) {
    initializeDashboard();
  } else if (window.location.pathname.includes('/teacher/')) {
    initDashboard();
    startAutoRefresh();
  }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('profileModal');
  if (modal && e.target === modal) {
    closeProfileModal();
  }
});

// Auto-refresh data every 30 seconds
function startAutoRefresh() {
  setInterval(() => {
    console.log('🔄 Auto-refreshing data...');
    loadRecentActivity();
  }, 30000); // 30 seconds
}

// Export functions for use in HTML and other scripts
window.dashboardApi = {
  loadStatistics: loadDashboardStatistics,
  loadPerformance: loadCategoryPerformanceChart,
  loadActivity: loadRecentActivity,
  loadTopSubjects: loadTopSubjects,
  api: api
};

console.log('✓ Dashboard integration script loaded');
