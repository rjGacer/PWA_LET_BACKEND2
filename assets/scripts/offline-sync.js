/**
 * Offline Sync Module - Sync queued data when connection is restored
 * Handles quiz submissions and progress syncing
 */

class OfflineSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = [];
  }

  /**
   * Initialize offline sync
   */
  init() {
    this._setupNetworkListeners();
    this._setupServiceWorkerListeners();
    console.log('✓ Offline sync initialized');
  }

  /**
   * Setup network event listeners
   */
  _setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('✓ Online connection restored');
      this.isOnline = true;
      this._notifyListeners({ type: 'online', status: true });
      this._autoSync();
    });

    window.addEventListener('offline', () => {
      console.log('✗ Offline mode activated');
      this.isOnline = false;
      this._notifyListeners({ type: 'offline', status: false });
    });
  }

  /**
   * Setup service worker message listeners
   */
  _setupServiceWorkerListeners() {
    navigator.serviceWorker?.controller?.addEventListener('message', (event) => {
      const { type, data } = event.data;

      if (type === 'SYNC_COMPLETE') {
        console.log('✓ Background sync completed');
        this._notifyListeners({ type: 'sync_complete', data });
      }

      if (type === 'OFFLINE_DATA_READY') {
        console.log('Offline data ready for sync');
        this._performSync(data);
      }
    });
  }

  /**
   * Auto-sync when connection restored
   */
  async _autoSync() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping auto-sync');
      return;
    }

    const hasQueuedData = await this._hasQueuedData();
    if (hasQueuedData) {
      console.log('Queued data detected, starting sync...');
      await this.syncAll();
    }
  }

  /**
   * Perform sync of specific data
   */
  async _performSync(data) {
    try {
      if (data.type === 'quiz_attempts') {
        await this._syncQuizAttempts(data.items);
      }
      if (data.type === 'progress') {
        await this._syncProgress(data.items);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  /**
   * Check if there's queued data to sync
   */
  async _hasQueuedData() {
    try {
      const queue = await db.getAll('syncQueue');
      return queue.length > 0;
    } catch (error) {
      console.error('Error checking sync queue:', error);
      return false;
    }
  }

  /**
   * Sync all queued data
   */
  async syncAll() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;
    this._notifyListeners({ type: 'sync_start' });

    try {
      // Get all queued items
      const queue = await db.getAll('syncQueue');
      console.log(`Syncing ${queue.length} items...`);

      if (queue.length === 0) {
        console.log('No items to sync');
        this._notifyListeners({ type: 'sync_complete', synced: 0 });
        this.syncInProgress = false;
        return;
      }

      let syncedCount = 0;
      const errors = [];

      // Process each queued item
      for (const item of queue) {
        try {
          if (item.type === 'quiz_attempt') {
            await this._syncQuizAttempt(item.data);
            syncedCount++;
          } else if (item.type === 'progress_update') {
            await this._syncProgressUpdate(item.data);
            syncedCount++;
          }

          // Remove from queue after successful sync
          await db.delete('syncQueue', item.id);
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          errors.push({ itemId: item.id, error: error.message });
        }
      }

      console.log(`✓ Synced ${syncedCount} items`);
      this._notifyListeners({
        type: 'sync_complete',
        synced: syncedCount,
        errors: errors.length > 0 ? errors : null,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      this._notifyListeners({
        type: 'sync_error',
        error: error.message,
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync individual quiz attempt
   */
  async _syncQuizAttempt(attempt) {
    try {
      const response = await fetch('/api/v1/performance/record-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(attempt),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Quiz attempt synced:', data);
      
      // Mark as synced in local storage
      const attemptRecord = await db.get('quizAttempts', attempt.id);
      if (attemptRecord) {
        attemptRecord.synced = true;
        await db.put('quizAttempts', attemptRecord);
      }

      return data;
    } catch (error) {
      console.error('Error syncing quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Sync progress update
   */
  async _syncProgressUpdate(progressData) {
    try {
      const response = await fetch('/api/v1/performance/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing progress:', error);
      throw error;
    }
  }

  /**
   * Sync multiple quiz attempts
   */
  async _syncQuizAttempts(attempts) {
    try {
      const response = await fetch('/api/v1/performance/bulk-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ attempts }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk syncing attempts:', error);
      throw error;
    }
  }

  /**
   * Sync progress data
   */
  async _syncProgress(progressData) {
    try {
      const response = await fetch('/api/v1/performance/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing progress:', error);
      throw error;
    }
  }

  /**
   * Queue data for sync
   */
  async queueForSync(type, data) {
    try {
      await db.put('syncQueue', {
        type,
        data,
        timestamp: Date.now(),
        status: 'pending',
      });

      console.log(`Item queued for sync: ${type}`);
      this._notifyListeners({ type: 'item_queued', dataType: type });

      // If online, sync immediately
      if (this.isOnline) {
        await this.syncAll();
      }
    } catch (error) {
      console.error('Error queuing data:', error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      const queue = await db.getAll('syncQueue');
      const attempts = await db.getAll('quizAttempts');
      const syncedAttempts = attempts.filter((a) => a.synced).length;

      return {
        isOnline: this.isOnline,
        isSyncing: this.syncInProgress,
        queuedItems: queue.length,
        syncedAttempts,
        pendingAttempts: attempts.length - syncedAttempts,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  /**
   * Manual sync trigger
   */
  async manualSync() {
    console.log('Manual sync triggered');
    if (!this.isOnline) {
      console.warn('Cannot sync: offline');
      return false;
    }
    await this.syncAll();
    return true;
  }

  /**
   * Add sync listener
   */
  onSyncStatusChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove sync listener
   */
  offSyncStatusChange(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  /**
   * Notify listeners
   */
  _notifyListeners(status) {
    this.listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Get online status
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * Force offline mode (for testing)
   */
  forceOffline(offline = true) {
    this.isOnline = !offline;
    this._notifyListeners({ type: offline ? 'offline' : 'online', status: !offline });
  }

  /**
   * Get detailed sync statistics
   */
  async getSyncStats() {
    try {
      const attempts = await db.getAll('quizAttempts');
      const queue = await db.getAll('syncQueue');
      const engagements = await db.getAll('engagement');

      return {
        totalAttempts: attempts.length,
        syncedAttempts: attempts.filter((a) => a.synced).length,
        pendingAttempts: attempts.filter((a) => !a.synced).length,
        queuedItems: queue.length,
        badges: engagements.filter((e) => e.type === 'badge').length,
        lastSyncTime: localStorage.getItem('lastSyncTime'),
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return null;
    }
  }
}

// Initialize offline sync globally
const offlineSync = new OfflineSync();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    offlineSync.init();
  });
} else {
  offlineSync.init();
}
