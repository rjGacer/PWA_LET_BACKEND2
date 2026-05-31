/**
 * Database Manager - IndexedDB Operations
 * Handles offline data storage for LearnIQ PWA
 */

class DatabaseManager {
  constructor() {
    this.dbName = 'LearnIQ';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('Database upgrade needed');

        // Create object stores
        this._createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores
   */
  _createObjectStores(db) {
    // Categories store
    if (!db.objectStoreNames.contains('categories')) {
      const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
      categoryStore.createIndex('name', 'name', { unique: false });
      console.log('Categories store created');
    }

    // Subjects store
    if (!db.objectStoreNames.contains('subjects')) {
      const subjectStore = db.createObjectStore('subjects', { keyPath: 'id' });
      subjectStore.createIndex('categoryId', 'categoryId', { unique: false });
      subjectStore.createIndex('name', 'name', { unique: false });
      console.log('Subjects store created');
    }

    // Modules store
    if (!db.objectStoreNames.contains('modules')) {
      const moduleStore = db.createObjectStore('modules', { keyPath: 'id' });
      moduleStore.createIndex('subjectId', 'subjectId', { unique: false });
      moduleStore.createIndex('title', 'title', { unique: false });
      console.log('Modules store created');
    }

    // Questions store (for offline quiz access)
    if (!db.objectStoreNames.contains('questions')) {
      const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
      questionStore.createIndex('quizId', 'quizId', { unique: false });
      questionStore.createIndex('categoryId', 'categoryId', { unique: false });
      console.log('Questions store created');
    }

    // Quizzes store
    if (!db.objectStoreNames.contains('quizzes')) {
      const quizStore = db.createObjectStore('quizzes', { keyPath: 'id' });
      quizStore.createIndex('subjectId', 'subjectId', { unique: false });
      quizStore.createIndex('categoryId', 'categoryId', { unique: false });
      console.log('Quizzes store created');
    }

    // Quiz Attempts store (offline submissions)
    if (!db.objectStoreNames.contains('quizAttempts')) {
      const attemptStore = db.createObjectStore('quizAttempts', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      attemptStore.createIndex('quizId', 'quizId', { unique: false });
      attemptStore.createIndex('timestamp', 'timestamp', { unique: false });
      attemptStore.createIndex('synced', 'synced', { unique: false });
      console.log('Quiz Attempts store created');
    }

    // User Progress store
    if (!db.objectStoreNames.contains('userProgress')) {
      const progressStore = db.createObjectStore('userProgress', { keyPath: 'id' });
      progressStore.createIndex('categoryId', 'categoryId', { unique: false });
      progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      console.log('User Progress store created');
    }

    // Engagement store (badges, streaks)
    if (!db.objectStoreNames.contains('engagement')) {
      const engagementStore = db.createObjectStore('engagement', { keyPath: 'id' });
      engagementStore.createIndex('type', 'type', { unique: false });
      engagementStore.createIndex('earnedDate', 'earnedDate', { unique: false });
      console.log('Engagement store created');
    }

    // Sync queue store (for offline submissions)
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      console.log('Sync Queue store created');
    }

    // Cache metadata store
    if (!db.objectStoreNames.contains('cacheMetadata')) {
      const metaStore = db.createObjectStore('cacheMetadata', { keyPath: 'key' });
      metaStore.createIndex('timestamp', 'timestamp', { unique: false });
      console.log('Cache Metadata store created');
    }
  }

  /**
   * Add or update data in a store
   */
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Add multiple items to a store
   */
  async putMany(storeName, dataArray) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const results = [];

      dataArray.forEach((data) => {
        const request = store.put(data);
        request.onsuccess = () => results.push(request.result);
        request.onerror = () => reject(request.error);
      });

      transaction.oncomplete = () => {
        resolve(results);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get data from a store by key
   */
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all data from a store
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Query by index
   */
  async queryIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete data from a store by key
   */
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear entire store
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Bulk insert with transaction
   */
  async transaction(storeName, data, mode = 'readwrite') {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], mode);
      const store = txn.objectStore(storeName);

      if (Array.isArray(data)) {
        data.forEach((item) => {
          store.put(item);
        });
      } else {
        store.put(data);
      }

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  }

  /**
   * Cache API data with metadata
   */
  async cacheData(key, data, ttl = 3600000) {
    try {
      // Store data
      await this.put('cacheMetadata', {
        key,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl,
      });

      // Store actual data (customize based on data type)
      if (Array.isArray(data)) {
        const storeName = this._getStoreNameFromKey(key);
        if (storeName) {
          await this.putMany(storeName, data);
        }
      }

      console.log(`Data cached for key: ${key}`);
    } catch (error) {
      console.error(`Cache error for ${key}:`, error);
    }
  }

  /**
   * Check if cache is valid (not expired)
   */
  async isCacheValid(key) {
    try {
      const metadata = await this.get('cacheMetadata', key);
      if (!metadata) return false;

      const isValid = metadata.expiresAt > Date.now();
      return isValid;
    } catch (error) {
      console.error('Cache validation error:', error);
      return false;
    }
  }

  /**
   * Get store name from cache key
   */
  _getStoreNameFromKey(key) {
    const mapping = {
      'categories-cache': 'categories',
      'subjects-cache': 'subjects',
      'modules-cache': 'modules',
      'quizzes-cache': 'quizzes',
      'questions-cache': 'questions',
    };
    return mapping[key] || null;
  }

  /**
   * Get storage usage
   */
  async getStorageUsage() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: (estimate.usage / estimate.quota) * 100,
        };
      }
    } catch (error) {
      console.error('Storage estimation error:', error);
    }
    return null;
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log('Persistent storage enabled:', isPersisted);
        return isPersisted;
      }
    } catch (error) {
      console.error('Persistent storage request error:', error);
    }
    return false;
  }
}

// Initialize database manager globally
const db = new DatabaseManager();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await db.init();
      console.log('✓ IndexedDB initialized');
    } catch (error) {
      console.error('✗ IndexedDB initialization failed:', error);
    }
  });
} else {
  db.init().catch((error) => {
    console.error('✗ IndexedDB initialization failed:', error);
  });
}
