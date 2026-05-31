/**
 * Engagement Module - Badges and Streaks
 * Gamification features for LearnIQ PWA
 */

class EngagementManager {
  constructor() {
    this.currentUser = null;
    this.badges = {
      'gened-master': {
        name: 'General Education Master',
        description: 'Score 90%+ in General Education',
        icon: '🎓',
        category: 'General Education',
        threshold: 90,
      },
      'profed-master': {
        name: 'Professional Education Master',
        description: 'Score 90%+ in Professional Education',
        icon: '📚',
        category: 'Professional Education',
        threshold: 90,
      },
      'major-master': {
        name: 'Major Specialization Master',
        description: 'Score 90%+ in Major/Specialization',
        icon: '⭐',
        category: 'Major/Specialization',
        threshold: 90,
      },
      'quiz-lover': {
        name: 'Quiz Lover',
        description: 'Complete 10 quizzes',
        icon: '❤️',
        type: 'attempts',
        threshold: 10,
      },
      'speed-demon': {
        name: 'Speed Demon',
        description: 'Complete a quiz in under 5 minutes',
        icon: '⚡',
        type: 'speed',
        threshold: 300000, // 5 minutes in ms
      },
      'perfect-score': {
        name: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: '🏆',
        type: 'perfect',
        threshold: 100,
      },
      'comeback-kid': {
        name: 'Comeback Kid',
        description: 'Score 60%+ after scoring below 60%',
        icon: '💪',
        type: 'comeback',
      },
      'early-bird': {
        name: 'Early Bird',
        description: 'Complete a quiz before 6 AM',
        icon: '🌅',
        type: 'early_bird',
      },
      'night-owl': {
        name: 'Night Owl',
        description: 'Complete a quiz after 10 PM',
        icon: '🦉',
        type: 'night_owl',
      },
      'milestone-5': {
        name: '5 Quiz Milestone',
        description: 'Complete 5 quizzes',
        icon: '🎯',
        type: 'milestone',
        threshold: 5,
      },
      'milestone-25': {
        name: '25 Quiz Milestone',
        description: 'Complete 25 quizzes',
        icon: '🚀',
        type: 'milestone',
        threshold: 25,
      },
      'milestone-50': {
        name: '50 Quiz Milestone',
        description: 'Complete 50 quizzes',
        icon: '👑',
        type: 'milestone',
        threshold: 50,
      },
    };
  }

  /**
   * Initialize engagement manager
   */
  async init() {
    this.currentUser = localStorage.getItem('userId');
    this._initializeStreaks();
    console.log('✓ Engagement manager initialized');
  }

  /**
   * Initialize daily streak tracking
   */
  _initializeStreaks() {
    const today = new Date().toDateString();
    const lastActiveDate = localStorage.getItem('lastActiveDate');
    const currentStreak = parseInt(localStorage.getItem('currentStreak')) || 0;
    const bestStreak = parseInt(localStorage.getItem('bestStreak')) || 0;

    if (lastActiveDate !== today) {
      const lastDate = new Date(lastActiveDate);
      const currentDate = new Date(today);
      const daysDiff = Math.floor(
        (currentDate - lastDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Streak continues
        const newStreak = currentStreak + 1;
        localStorage.setItem('currentStreak', newStreak);
        if (newStreak > bestStreak) {
          localStorage.setItem('bestStreak', newStreak);
        }
      } else if (daysDiff > 1) {
        // Streak broken
        localStorage.setItem('currentStreak', '1');
      }

      localStorage.setItem('lastActiveDate', today);
    }
  }

  /**
   * Check and award badges after quiz attempt
   */
  async checkAndAwardBadges(attempt, categoryStats) {
    const earnedBadges = [];

    // Check category master badges
    if (categoryStats && categoryStats.averageScore >= 90) {
      const categoryBadgeMap = {
        'General Education': 'gened-master',
        'Professional Education': 'profed-master',
        'Major/Specialization': 'major-master',
      };

      const badgeId = categoryBadgeMap[attempt.category];
      if (badgeId && !(await this.hasBadge(badgeId))) {
        earnedBadges.push(badgeId);
        await this.awardBadge(badgeId);
      }
    }

    // Check perfect score badge
    if (attempt.score === 100 && !(await this.hasBadge('perfect-score'))) {
      earnedBadges.push('perfect-score');
      await this.awardBadge('perfect-score');
    }

    // Check speed badge
    if (
      attempt.timeSpent < 300000 &&
      !(await this.hasBadge('speed-demon'))
    ) {
      earnedBadges.push('speed-demon');
      await this.awardBadge('speed-demon');
    }

    // Check time-based badges
    const hour = new Date(attempt.timestamp).getHours();
    if (hour < 6 && !(await this.hasBadge('early-bird'))) {
      earnedBadges.push('early-bird');
      await this.awardBadge('early-bird');
    }
    if (hour >= 22 && !(await this.hasBadge('night-owl'))) {
      earnedBadges.push('night-owl');
      await this.awardBadge('night-owl');
    }

    // Check attempt milestone badges
    const attempts = await progressTracker.getAttempts();
    const totalAttempts = attempts.length;
    
    const milestones = [5, 25, 50];
    for (const milestone of milestones) {
      if (
        totalAttempts >= milestone &&
        !(await this.hasBadge(`milestone-${milestone}`))
      ) {
        earnedBadges.push(`milestone-${milestone}`);
        await this.awardBadge(`milestone-${milestone}`);
      }
    }

    // Check quiz-lover badge
    if (totalAttempts >= 10 && !(await this.hasBadge('quiz-lover'))) {
      earnedBadges.push('quiz-lover');
      await this.awardBadge('quiz-lover');
    }

    return earnedBadges;
  }

  /**
   * Award a badge to the user
   */
  async awardBadge(badgeId) {
    try {
      const badge = this.badges[badgeId];
      if (!badge) {
        console.warn('Badge not found:', badgeId);
        return false;
      }

      const engagement = {
        id: `badge-${badgeId}-${Date.now()}`,
        type: 'badge',
        badgeId,
        name: badge.name,
        icon: badge.icon,
        earnedDate: Date.now(),
        timestamp: Date.now(),
      };

      await db.put('engagement', engagement);
      console.log('✓ Badge awarded:', badge.name);

      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }

  /**
   * Check if user has a specific badge
   */
  async hasBadge(badgeId) {
    try {
      const badges = await db.queryIndex('engagement', 'type', 'badge');
      return badges.some((b) => b.badgeId === badgeId);
    } catch (error) {
      console.error('Error checking badge:', error);
      return false;
    }
  }

  /**
   * Get all earned badges
   */
  async getEarnedBadges() {
    try {
      const badges = await db.queryIndex('engagement', 'type', 'badge');
      return badges
        .map((b) => ({
          id: b.badgeId,
          name: b.name,
          icon: b.icon,
          earnedDate: new Date(b.earnedDate).toLocaleDateString(),
          description: this.badges[b.badgeId]?.description || '',
        }))
        .sort((a, b) => b.earnedDate - a.earnedDate);
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  }

  /**
   * Get badge progress (badges not yet earned)
   */
  async getBadgeProgress() {
    try {
      const earnedBadges = new Set();
      const badges = await db.queryIndex('engagement', 'type', 'badge');
      badges.forEach((b) => earnedBadges.add(b.badgeId));

      const progress = [];
      for (const [badgeId, badgeInfo] of Object.entries(this.badges)) {
        if (!earnedBadges.has(badgeId)) {
          progress.push({
            id: badgeId,
            name: badgeInfo.name,
            icon: badgeInfo.icon,
            description: badgeInfo.description,
            progress: await this._calculateBadgeProgress(badgeId),
          });
        }
      }

      return progress;
    } catch (error) {
      console.error('Error fetching badge progress:', error);
      return [];
    }
  }

  /**
   * Calculate progress towards a badge
   */
  async _calculateBadgeProgress(badgeId) {
    const badge = this.badges[badgeId];
    if (!badge) return { current: 0, target: 0, percentage: 0 };

    try {
      if (badge.category) {
        // Category-based badge
        const stats = await progressTracker.getProgressByCategory(
          badge.category
        );
        return {
          current: stats ? stats.averageScore : 0,
          target: badge.threshold,
          percentage: stats ? (stats.averageScore / badge.threshold) * 100 : 0,
        };
      } else if (badge.type === 'attempts' || badge.type === 'milestone') {
        // Attempt-based badge
        const attempts = await progressTracker.getAttempts();
        return {
          current: attempts.length,
          target: badge.threshold,
          percentage: (attempts.length / badge.threshold) * 100,
        };
      } else if (badge.type === 'speed') {
        // Speed badge - just show if available
        return {
          current: 0,
          target: 1,
          percentage: 0,
        };
      }
    } catch (error) {
      console.error('Error calculating badge progress:', error);
    }

    return { current: 0, target: 0, percentage: 0 };
  }

  /**
   * Get current streak
   */
  getCurrentStreak() {
    return parseInt(localStorage.getItem('currentStreak')) || 0;
  }

  /**
   * Get best streak
   */
  getBestStreak() {
    return parseInt(localStorage.getItem('bestStreak')) || 0;
  }

  /**
   * Increment daily streak
   */
  incrementStreak() {
    this._initializeStreaks();
    return this.getCurrentStreak();
  }

  /**
   * Get streak UI data
   */
  getStreakData() {
    return {
      current: this.getCurrentStreak(),
      best: this.getBestStreak(),
      lastActive: localStorage.getItem('lastActiveDate'),
    };
  }

  /**
   * Get all engagement stats
   */
  async getEngagementStats() {
    try {
      const earnedBadges = await this.getEarnedBadges();
      const badgeProgress = await this.getBadgeProgress();
      const streakData = this.getStreakData();

      return {
        earnedBadgesCount: earnedBadges.length,
        earnedBadges,
        badgeProgress,
        streaks: streakData,
      };
    } catch (error) {
      console.error('Error fetching engagement stats:', error);
      return null;
    }
  }
}

// Initialize engagement manager globally
const engagement = new EngagementManager();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await engagement.init();
    } catch (error) {
      console.error('Engagement manager initialization error:', error);
    }
  });
} else {
  engagement.init().catch((error) => {
    console.error('Engagement manager initialization error:', error);
  });
}
