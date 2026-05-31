/**
 * NotificationManager.js
 * Manages in-app notifications and daily reminders for students
 * Features: Daily review reminders, quiz/assignment notifications, notification dropdown
 */

class NotificationManager {
  constructor() {
    this.db = null;
    this.dbReady = this.initDB();
    this.notifications = [];
    this.readNotifications = new Set();
    this.lastReminderDate = null;
    this.studentId = null;
    this.init();
  }

  /**
   * Initialize IndexedDB for notifications
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LearnIQ-Notifications', 1);

      request.onerror = () => {
        console.warn('❌ NotificationDB failed, using localStorage fallback');
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ NotificationDB initialized');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
          store.createIndex('studentId', 'studentId', { unique: false });
          store.createIndex('isRead', 'isRead', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'studentId' });
        }
      };
    });
  }

  /**
   * Initialize notification manager
   */
  async init() {
    await this.ensureReady();
    this.studentId = parseInt(localStorage.getItem('userId') || 0);
    
    if (this.studentId) {
      await this.loadNotifications();
      this.checkDailyReminder();
      this.setupPeriodicCheck();
    }

    console.log('✅ NotificationManager initialized for student:', this.studentId);
  }

  /**
   * Wait for DB to be ready
   */
  async ensureReady() {
    await this.dbReady;
  }

  /**
   * Load all unread notifications for current student
   */
  async loadNotifications() {
    try {
      const notifications = await this.getStudentNotifications(this.studentId);
      this.notifications = notifications || [];
      this.updateNotificationBadge();
      console.log(`📬 Loaded ${this.notifications.length} notifications`);
    } catch (error) {
      console.warn('Error loading notifications:', error);
    }
  }

  /**
   * Create a new notification
   */
  async addNotification(notificationData) {
    const notification = {
      studentId: this.studentId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'reminder', // reminder, quiz, assignment, achievement
      icon: notificationData.icon || '📌',
      isRead: false,
      timestamp: Date.now(),
      actionUrl: notificationData.actionUrl || null,
      data: notificationData.data || {}
    };

    try {
      if (this.db) {
        await this.saveToIndexedDB('notifications', notification);
      } else {
        this.saveToLocalStorage('notifications', notification);
      }

      // Add to in-memory list
      this.notifications.push(notification);
      this.updateNotificationBadge();

      // Show browser notification if enabled
      await this.showBrowserNotification(notification);

      console.log('📬 New notification added:', notification.title);
      return notification;
    } catch (error) {
      console.warn('Error adding notification:', error);
    }
  }

  /**
   * Check and send daily "Time to review!" reminder
   */
  async checkDailyReminder() {
    try {
      const today = new Date().toDateString();
      const lastReminder = localStorage.getItem('lastReminderDate');

      if (lastReminder !== today) {
        // Send daily reminder
        await this.addNotification({
          title: '⏰ Time to Review!',
          message: 'Keep your streak going! Review your modules and take a quiz today.',
          type: 'daily_reminder',
          icon: '⏰',
          actionUrl: '../student/studentModules.html'
        });

        localStorage.setItem('lastReminderDate', today);
        console.log('✅ Daily reminder sent');
      }
    } catch (error) {
      console.warn('Error checking daily reminder:', error);
    }
  }

  /**
   * Create quiz/assignment reminders
   */
  async createQuizReminder(quizData) {
    try {
      const { quizTitle, dueDate, categoryName } = quizData;
      
      if (dueDate) {
        const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue === 1) {
          // Due tomorrow
          await this.addNotification({
            title: `📋 ${quizTitle} Due Tomorrow!`,
            message: `Your ${categoryName} quiz is due in 1 day. Start preparing now!`,
            type: 'quiz_reminder',
            icon: '📋',
            actionUrl: '../student/studentQuiz.html',
            data: { quizTitle, categoryName }
          });
        } else if (daysUntilDue <= 3 && daysUntilDue > 1) {
          // Due soon (2-3 days)
          await this.addNotification({
            title: `⚠️ ${quizTitle} Due Soon!`,
            message: `Your ${categoryName} quiz is due in ${daysUntilDue} days.`,
            type: 'quiz_reminder',
            icon: '⚠️',
            actionUrl: '../student/studentQuiz.html',
            data: { quizTitle, categoryName }
          });
        }
      }
    } catch (error) {
      console.warn('Error creating quiz reminder:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      if (this.db) {
        const notification = await this.getFromIndexedDB('notifications', notificationId);
        if (notification) {
          notification.isRead = true;
          await this.saveToIndexedDB('notifications', notification);
        }
      }

      // Update in-memory list
      const notif = this.notifications.find(n => n.id === notificationId);
      if (notif) {
        notif.isRead = true;
      }

      this.updateNotificationBadge();
      console.log(`✓ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.warn('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      for (const notification of this.notifications) {
        if (!notification.isRead) {
          await this.markAsRead(notification.id);
        }
      }
      this.updateNotificationBadge();
    } catch (error) {
      console.warn('Error marking all as read:', error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      if (this.db) {
        const tx = this.db.transaction(['notifications'], 'readwrite');
        const store = tx.objectStore('notifications');
        store.delete(notificationId);
      }

      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.updateNotificationBadge();
      console.log(`🗑️ Notification ${notificationId} deleted`);
    } catch (error) {
      console.warn('Error deleting notification:', error);
    }
  }

  /**
   * Get unread notification count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Update notification badge in UI
   */
  updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    const unreadCount = this.getUnreadCount();

    console.log(`🔔 [updateNotificationBadge] Unread count: ${unreadCount}, Badge element found: ${!!badge}`);

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
        console.log(`✅ Badge updated: showing ${unreadCount}`);
      } else {
        badge.style.display = 'none';
        console.log(`✅ Badge hidden (no unread)`);
      }
    } else {
      console.warn(`⚠️ Badge element not found. Retrying in 100ms...`);
      // Retry after a short delay
      setTimeout(() => this.updateNotificationBadge(), 100);
    }

    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { unreadCount, notifications: this.notifications }
    }));
  }

  /**
   * Get all notifications for a student
   */
  async getStudentNotifications(studentId) {
    try {
      if (this.db) {
        const results = await this.getAllFromIndexedDB('notifications', 'studentId', studentId);
        return results.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.warn('Error getting notifications from IndexedDB:', error);
    }

    // Fallback to localStorage
    return this.getAllFromLocalStorage('notifications', studentId);
  }

  /**
   * Setup periodic notification check
   */
  setupPeriodicCheck() {
    // Check for daily reminder every hour
    setInterval(() => {
      this.checkDailyReminder();
    }, 60 * 60 * 1000); // 1 hour

    // Check and load notifications every 5 minutes
    setInterval(() => {
      this.loadNotifications();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Show browser notification (if permission granted)
   */
  async showBrowserNotification(notification) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/images/icon-192x192.png',
          tag: `notif-${notification.timestamp}`,
          badge: '/assets/images/badge-72x72.png'
        });
      }
    } catch (error) {
      console.warn('Error showing browser notification:', error);
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission() {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    } catch (error) {
      console.warn('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * IndexedDB helpers
   */
  async saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async getFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromIndexedDB(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(parseInt(value));

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  saveToLocalStorage(storeName, data) {
    const key = `${storeName}_${data.studentId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(data);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  getAllFromLocalStorage(storeName, studentId) {
    const key = `${storeName}_${studentId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
}

// Create global instance
const notificationManager = new NotificationManager();
