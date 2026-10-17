// ============================================
// NEWLMS - Storage Service (IndexedDB)
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type { Course, MediaAsset, StorageSchema, ID } from '../types';

// ============================================
// STORAGE CONSTANTS
// ============================================

const DB_NAME = 'newLMS';
const DB_VERSION = 1;
const COURSES_STORE = 'courses';
const MEDIA_STORE = 'media';
const META_STORE = 'meta';

const SCHEMA_VERSION = '1.0.0';

// ============================================
// STORAGE SCHEMA
// ============================================

interface StorageMeta {
  version: string;
  lastActiveCourseId: ID | null;
  lastUpdated: number;
}

// ============================================
// STORAGE SERVICE CLASS
// ============================================

class StorageService {
  private db: IDBDatabase | null = null;
  private isReady: boolean = false;
  private readyPromise: Promise<void> | null = null;
  private listeners: ((event: StorageEvent) => void)[] = [];

  constructor() {
    this.init();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private async init(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise(async (resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.error('Database error:', event);
          reject(new Error('Failed to open database'));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isReady = true;
          this.readyPromise = null;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(COURSES_STORE)) {
            db.createObjectStore(COURSES_STORE, { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains(MEDIA_STORE)) {
            db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains(META_STORE)) {
            db.createObjectStore(META_STORE, { keyPath: 'id' });
          }
        };
      } catch (error) {
        reject(error);
      }
    });

    return this.readyPromise;
  }

  private async ensureReady(): Promise<void> {
    if (this.isReady) {
      return;
    }
    await this.readyPromise;
  }

  // ============================================
  // COURSE OPERATIONS
  // ============================================

  public async saveCourse(course: Course): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COURSES_STORE], 'readwrite');
      const store = transaction.objectStore(COURSES_STORE);
      const request = store.put(course);

      request.onsuccess = () => {
        this.notifyListeners({ type: 'courseSaved', data: course, timestamp: Date.now() });
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error('Failed to save course'));
      };
    });
  }

  public async loadCourse(courseId: ID): Promise<Course | null> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([COURSES_STORE], 'readonly');
      const store = transaction.objectStore(COURSES_STORE);
      const request = store.get(courseId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  public async loadAllCourses(): Promise<Course[]> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([COURSES_STORE], 'readonly');
      const store = transaction.objectStore(COURSES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  public async deleteCourse(courseId: ID): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COURSES_STORE], 'readwrite');
      const store = transaction.objectStore(COURSES_STORE);
      const request = store.delete(courseId);

      request.onsuccess = () => {
        this.notifyListeners({ type: 'courseDeleted', data: { courseId }, timestamp: Date.now() });
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error('Failed to delete course'));
      };
    });
  }

  public async loadAllMedia(): Promise<MediaAsset[]> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([MEDIA_STORE], 'readonly');
      const store = transaction.objectStore(MEDIA_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  public async saveMedia(asset: MediaAsset): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDIA_STORE], 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE);
      const request = store.put(asset);

      request.onsuccess = () => {
        this.notifyListeners({ type: 'mediaSaved', data: asset, timestamp: Date.now() });
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error('Failed to save media'));
      };
    });
  }

  public async deleteMedia(assetId: ID): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDIA_STORE], 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE);
      const request = store.delete(assetId);

      request.onsuccess = () => {
        this.notifyListeners({ type: 'mediaDeleted', data: { assetId }, timestamp: Date.now() });
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error('Failed to delete media'));
      };
    });
  }

  public async exportCourse(courseId: ID): Promise<{ course: Course; media: MediaAsset[] } | null> {
    const course = await this.loadCourse(courseId);
    if (!course) return null;
    const media = await this.loadAllMedia();
    return { course, media };
  }

  public async importCourse(course: Course, media: MediaAsset[]): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COURSES_STORE, MEDIA_STORE], 'readwrite');
      const coursesStore = transaction.objectStore(COURSES_STORE);
      const mediaStore = transaction.objectStore(MEDIA_STORE);

      // Save all media first
      for (const asset of media) {
        mediaStore.put(asset);
      }

      // Save the course
      coursesStore.put(course);

      transaction.oncomplete = () => {
        this.notifyListeners({ type: 'courseImported', data: course, timestamp: Date.now() });
        resolve();
      };

      transaction.onerror = (event) => {
        reject(new Error('Failed to import course'));
      };
    });
  }

  // ============================================
  // LISTENERS
  // ============================================

  public addListener(listener: (event: StorageEvent) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (event: StorageEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(event: StorageEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in storage listener:', error);
      }
    });
  }

  // ============================================
  // META OPERATIONS
  // ============================================

  public async saveMeta(meta: StorageMeta): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([META_STORE], 'readwrite');
      const store = transaction.objectStore(META_STORE);
      const request = store.put({ id: 'meta', ...meta });

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(new Error('Failed to save meta'));
    });
  }

  public async loadMeta(): Promise<StorageMeta | null> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([META_STORE], 'readonly');
      const store = transaction.objectStore(META_STORE);
      const request = store.get('meta');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }
}

// ============================================
// EVENT TYPES
// ============================================

export type StorageEventType = 'courseSaved' | 'courseDeleted' | 'courseImported' | 'mediaSaved' | 'mediaDeleted';

export interface StorageEvent {
  type: StorageEventType;
  data: any;
  timestamp: number;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let storageService: StorageService | null = null;

function getStorageService(): StorageService {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}

function resetStorageService(): void {
  if (storageService) {
    storageService = null;
  }
}

// ============================================
// EXPORT
// ============================================

export {
  StorageService,
  getStorageService,
  resetStorageService,
  DB_NAME,
  DB_VERSION,
  SCHEMA_VERSION,
};

export type {
  StorageEventType,
  StorageEvent,
};
