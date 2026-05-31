/**
 * Progress Tracker - Track student performance and progress
 * Manages quiz attempts, scores, and category performance
 */

class ProgressTracker {
  constructor() {
    this.currentUser = null;
    this.currentAttempt = null;
  }

  /**
   * Initialize progress tracker
   */
  async init() {
    await this._loadUser();
    console.log('✓ Progress tracker initialized');
  }

  /**
   * Load current user
   */
  async _loadUser() {
    this.currentUser = localStorage.getItem('userId');
    return this.currentUser;
  }

  /**
   * Record a quiz attempt
   */
  async recordAttempt(quizId, answers, score, timeSpent, category = null, mode = 'exam') {
    const attempt = {
      quizId,
      userId: this.currentUser,
      category: category || 'General',
      answers: answers || {},
      score: score || 0,
      timeSpent: timeSpent || 0,
      mode: mode,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
      synced: false,
    };

    try {
      // Save to IndexedDB
      const result = await db.put('quizAttempts', attempt);
      console.log('Attempt recorded:', result);

      // Update progress stats
      await this._updateProgressStats(category, score);

      // Add to sync queue if offline
      if (!navigator.onLine) {
        await this._addToSyncQueue('quiz_attempt', attempt);
        console.log('Attempt queued for sync');
      }

      return result;
    } catch (error) {
      console.error('Error recording attempt:', error);
      throw error;
    }
  }

  /**
   * Get all quiz attempts for current user
   */
  async getAttempts(limit = null) {
    try {
      let attempts = await db.getAll('quizAttempts');
      
      // Sort by timestamp descending (most recent first)
      attempts = attempts.sort((a, b) => b.timestamp - a.timestamp);

      if (limit) {
        attempts = attempts.slice(0, limit);
      }

      return attempts;
    } catch (error) {
      console.error('Error fetching attempts:', error);
      return [];
    }
  }

  /**
   * Get attempts for specific category
   */
  async getAttemptsByCategory(category) {
    try {
      const attempts = await db.queryIndex('quizAttempts', 'category', category);
      return attempts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching category attempts:', error);
      return [];
    }
  }

  /**
   * Get quiz attempt history (formatted for display)
   */
  async getQuizHistory() {
    try {
      const attempts = await this.getAttempts();
      
      return attempts.map((attempt) => ({
        id: attempt.id,
        quizId: attempt.quizId,
        category: attempt.category,
        score: attempt.score,
        maxScore: 100,
        percentage: attempt.score,
        date: attempt.date,
        time: new Date(attempt.timestamp).toLocaleTimeString(),
        timeSpent: this._formatTimeSpent(attempt.timeSpent),
        status: attempt.score >= 60 ? 'passed' : 'failed',
      }));
    } catch (error) {
      console.error('Error getting quiz history:', error);
      return [];
    }
  }

  /**
   * Update progress stats for a category
   */
  async _updateProgressStats(category, score) {
    try {
      const key = `progress-${category}`;
      let progress = await db.get('userProgress', key);

      if (!progress) {
        progress = {
          id: key,
          category,
          totalAttempts: 0,
          passedAttempts: 0,
          totalScore: 0,
          averageScore: 0,
          weakTopics: [],
          lastUpdated: Date.now(),
        };
      }

      // Update stats
      progress.totalAttempts += 1;
      if (score >= 60) {
        progress.passedAttempts += 1;
      }
      progress.totalScore += score;
      progress.averageScore = progress.totalScore / progress.totalAttempts;
      progress.lastUpdated = Date.now();

      // Save updated progress
      await db.put('userProgress', progress);
      console.log(`Progress updated for ${category}:`, progress);

      return progress;
    } catch (error) {
      console.error('Error updating progress stats:', error);
    }
  }

  /**
   * Get progress stats for all categories
   */
  async getAllProgressStats() {
    try {
      const stats = await db.getAll('userProgress');
      return stats.map((stat) => ({
        category: stat.category,
        attempts: stat.totalAttempts,
        passed: stat.passedAttempts,
        averageScore: Math.round(stat.averageScore),
        passRate: Math.round((stat.passedAttempts / stat.totalAttempts) * 100),
        lastUpdated: new Date(stat.lastUpdated).toLocaleDateString(),
      }));
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      return [];
    }
  }

  /**
   * Get progress for specific category
   */
  async getProgressByCategory(category) {
    try {
      const key = `progress-${category}`;
      const progress = await db.get('userProgress', key);
      
      if (!progress) {
        return null;
      }

      return {
        category: progress.category,
        attempts: progress.totalAttempts,
        passed: progress.passedAttempts,
        failed: progress.totalAttempts - progress.passedAttempts,
        averageScore: Math.round(progress.averageScore),
        passRate: Math.round((progress.passedAttempts / progress.totalAttempts) * 100),
        lastUpdated: new Date(progress.lastUpdated).toLocaleString(),
      };
    } catch (error) {
      console.error('Error fetching category progress:', error);
      return null;
    }
  }

  /**
   * Calculate overall statistics
   */
  async getOverallStats() {
    try {
      const attempts = await db.getAll('quizAttempts');
      
      if (attempts.length === 0) {
        return {
          totalAttempts: 0,
          totalPassed: 0,
          totalFailed: 0,
          averageScore: 0,
          overallPassRate: 0,
          totalTimeSpent: 0,
          fastestTime: 0,
          slowestTime: 0,
          categories: 0,
        };
      }

      const passed = attempts.filter((a) => a.score >= 60).length;
      const failed = attempts.length - passed;
      const averageScore = Math.round(
        attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
      );
      const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
      const times = attempts
        .map((a) => a.timeSpent)
        .filter((t) => t > 0)
        .sort((a, b) => a - b);

      return {
        totalAttempts: attempts.length,
        totalPassed: passed,
        totalFailed: failed,
        averageScore,
        overallPassRate: Math.round((passed / attempts.length) * 100),
        totalTimeSpent,
        fastestTime: times.length > 0 ? times[0] : 0,
        slowestTime: times.length > 0 ? times[times.length - 1] : 0,
        categories: new Set(attempts.map((a) => a.category)).size,
      };
    } catch (error) {
      console.error('Error calculating overall stats:', error);
      return null;
    }
  }

  /**
   * Get weak topics (categories with lowest scores)
   */
  async getWeakTopics(limit = 3) {
    try {
      const stats = await db.getAll('userProgress');
      const weakTopics = stats
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, limit)
        .map((stat) => ({
          topic: stat.category,
          averageScore: Math.round(stat.averageScore),
          attempts: stat.totalAttempts,
          recommendation: this._getRecommendation(stat.averageScore),
        }));

      return weakTopics;
    } catch (error) {
      console.error('Error fetching weak topics:', error);
      return [];
    }
  }

  /**
   * Get strong topics (categories with highest scores)
   */
  async getStrongTopics(limit = 3) {
    try {
      const stats = await db.getAll('userProgress');
      const strongTopics = stats
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, limit)
        .map((stat) => ({
          topic: stat.category,
          averageScore: Math.round(stat.averageScore),
          attempts: stat.totalAttempts,
        }));

      return strongTopics;
    } catch (error) {
      console.error('Error fetching strong topics:', error);
      return [];
    }
  }

  /**
   * Get recommendation based on score
   */
  _getRecommendation(score) {
    if (score < 40) return 'Needs significant improvement - focus on basics';
    if (score < 60) return 'Needs more practice - study key concepts';
    if (score < 75) return 'Good progress - keep practicing';
    if (score < 85) return 'Very good - just a bit more review needed';
    return 'Excellent - ready for exam!';
  }

  /**
   * Format time spent (milliseconds to readable format)
   */
  _formatTimeSpent(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Add to sync queue for offline submissions
   */
  async _addToSyncQueue(type, data) {
    try {
      await db.put('syncQueue', {
        type,
        data,
        timestamp: Date.now(),
        status: 'pending',
      });
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Clear all offline progress (use with caution)
   */
  async clearOfflineProgress() {
    try {
      await db.clear('quizAttempts');
      await db.clear('userProgress');
      console.log('Offline progress cleared');
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }

  /**
   * Export progress as JSON
   */
  async exportProgress() {
    try {
      const attempts = await db.getAll('quizAttempts');
      const stats = await db.getAll('userProgress');
      const overall = await this.getOverallStats();

      const exportData = {
        exportDate: new Date().toISOString(),
        overall,
        categoryStats: stats,
        attempts,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting progress:', error);
      return null;
    }
  }
}

// Initialize progress tracker globally
const progressTracker = new ProgressTracker();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await progressTracker.init();
    } catch (error) {
      console.error('Progress tracker initialization error:', error);
    }
  });
} else {
  progressTracker.init().catch((error) => {
    console.error('Progress tracker initialization error:', error);
  });
}
