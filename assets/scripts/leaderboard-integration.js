/**
 * Leaderboard Integration Script
 * Handles loading and filtering leaderboard data
 */

let leaderboardData = [];
let currentPeriod = 'all';
let currentCategory = 'all';

// Initialize leaderboard
async function initializeLeaderboard() {
  try {
    console.log('Initializing leaderboard...');
    await loadLeaderboardData();
    setupEventListeners();
  } catch (error) {
    console.error('❌ Leaderboard initialization error:', error);
  }
}

// Load leaderboard data from backend
async function loadLeaderboardData() {
  try {
    const params = new URLSearchParams({
      period: currentPeriod,
      category: currentCategory,
      limit: 100
    });
    // Use ApiService for consistent auth handling
    const api = new ApiService();
    try {
      leaderboardData = await api.getLeaderboard({ period: currentPeriod, category: currentCategory, limit: 100 });
      console.log('✓ Leaderboard data loaded via ApiService:', leaderboardData);
      renderLeaderboard();
    } catch (err) {
      throw err;
    }
  } catch (error) {
    console.error('❌ Error loading leaderboard:', error);
    showEmptyState('Error loading leaderboard. Please try again later.');
  }
}

// Render leaderboard table
function renderLeaderboard() {
  const container = document.getElementById('leaderboardContent');
  if (!container) return;

  if (leaderboardData.length === 0) {
    showEmptyState('No data available for this period');
    return;
  }

  container.innerHTML = leaderboardData.map((entry, idx) => {
    const rank = entry.rank || (idx + 1);
    let rankClass = '';
    let medal = '';

    // Ensure numeric values
    const attempts = parseInt(entry.attempts) || 0;
    const avgScore = parseFloat(entry.avg_score) || 0;
    const passRate = parseFloat(entry.pass_rate) || 0;

    if (rank === 1) {
      rankClass = 'top-1 rank-1';
      medal = '🥇';
    } else if (rank === 2) {
      rankClass = 'top-2 rank-2';
      medal = '🥈';
    } else if (rank === 3) {
      rankClass = 'top-3 rank-3';
      medal = '🥉';
    }

    return `
      <div class="leaderboard-row ${rankClass}" onclick="showStudentProfile('${entry.student_id}', '${entry.full_name}', '${entry.profile_picture || 'https://i.pravatar.cc/150?img=12'}', ${attempts}, ${avgScore}, ${passRate})" style="cursor: pointer; transition: all 0.3s;">
        <div class="rank-badge${rankClass ? ' ' + rankClass.split(' ')[1] : ' other'}" title="${medal}">${rank}</div>
        <div class="student-info">
          <img src="${entry.profile_picture || 'https://i.pravatar.cc/50?img=' + (idx % 20)}" alt="${entry.full_name}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;">
          <span class="student-name">${entry.full_name}</span>
        </div>
        <div class="score-stat">
          <div class="score-value">${attempts}</div>
          <div class="score-label">Attempts</div>
        </div>
        <div class="score-stat">
          <div class="score-value">${avgScore.toFixed(0)}</div>
          <div class="score-label">Avg Score</div>
        </div>
        <div class="score-stat">
          <div class="score-value">${passRate.toFixed(0)}%</div>
          <div class="score-label">Pass Rate</div>
        </div>
      </div>
    `;
  }).join('');
}

// Show empty state
function showEmptyState(message) {
  const container = document.getElementById('leaderboardContent');
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">${message}</div>
      </div>
    `;
  }
}

// Switch period filter
function switchPeriod(period) {
  currentPeriod = period;
  
  // Update button states
  document.querySelectorAll('.time-period .filter-btn').forEach(btn => {
    const txt = (btn.textContent || '').toLowerCase();
    btn.classList.toggle('active', txt.includes(period.toLowerCase()) || (period === 'all' && txt.includes('all')));
  });

  loadLeaderboardData();
}

// Switch category filter
function switchCategory(category) {
  currentCategory = category;
  
  // Update button states
  document.querySelectorAll('.filter-tabs .filter-btn').forEach(btn => {
    const txt = (btn.textContent || '').toLowerCase();
    btn.classList.toggle('active', txt.includes(category.toLowerCase()) || (category === 'all' && txt.includes('all')));
  });

  loadLeaderboardData();
}

// Show student profile modal
function showStudentProfile(studentId, name, picture, attempts, avgScore, passRate) {
  const modal = document.getElementById('studentProfileModal');
  if (!modal) {
    console.log('Profile modal not found');
    return;
  }

  // Fetch real student data from API
  const api = new ApiService();
  api.getStudentProfileById(studentId)
    .then(profile => {
      console.log('✓ Student profile loaded:', profile);
      
      // Populate modal with real data
      const profilePic = document.getElementById('profileStudentPic');
      profilePic.src = profile.profile_picture || picture || 'https://i.pravatar.cc/150?img=12';
      profilePic.onerror = function() {
        this.src = 'https://i.pravatar.cc/150?img=12';
        this.style.background = '#818cf8';
      };
      document.getElementById('profileStudentName').textContent = profile.name || name;
      document.getElementById('profileStudentEmail').textContent = profile.email || 'student@learniq.edu';
      document.getElementById('profileStudentCourse').textContent = profile.course || 'Student';
      document.getElementById('profileStudentBio').textContent = profile.bio || 'Active learner on LearnIQ';
      document.getElementById('profileAttempts').textContent = attempts || '0';
      document.getElementById('profileAvgScore').textContent = (avgScore || 0).toFixed(0);
      document.getElementById('profilePassRate').textContent = (passRate || 0).toFixed(0) + '%';
      
      modal.style.display = 'flex';
    })
    .catch(error => {
      console.warn('Could not fetch student profile:', error);
      
      // Fallback to data passed in parameters
      const profilePic = document.getElementById('profileStudentPic');
      profilePic.src = picture || 'https://i.pravatar.cc/150?img=12';
      profilePic.onerror = function() {
        this.src = 'https://i.pravatar.cc/150?img=12';
        this.style.background = '#818cf8';
      };
      document.getElementById('profileStudentName').textContent = name;
      document.getElementById('profileStudentEmail').textContent = 'student@learniq.edu';
      document.getElementById('profileStudentCourse').textContent = 'Student';
      document.getElementById('profileStudentBio').textContent = 'Active learner on LearnIQ';
      document.getElementById('profileAttempts').textContent = attempts || '0';
      document.getElementById('profileAvgScore').textContent = (avgScore || 0).toFixed(0);
      document.getElementById('profilePassRate').textContent = (passRate || 0).toFixed(0) + '%';
      
      modal.style.display = 'flex';
    });
}

// Close student profile modal
function closeStudentProfile() {
  const modal = document.getElementById('studentProfileModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('studentProfileModal');
    if (modal && e.target === modal) {
      closeStudentProfile();
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeLeaderboard);
