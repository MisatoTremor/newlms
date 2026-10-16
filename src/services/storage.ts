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

export class StorageService {
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

    this.readyPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('StorageService: Error opening database', event);
        this.isReady = false;
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = request.result;
        this.isReady = true;
        this.setupEventListeners();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(COURSES_STORE)) {
          db.createObjectStore(COURSES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };
    });

    await this.readyPromise;
  }

  private setupEventListeners(): void {
    if (!this.db) return;

    this.db.onclose = () => {
      this.isReady = false;
      this.db = null;
    };

    this.db.onversionchange = () => {
      this.db?.close();
      this.isReady = false;
    };
  }

  // ============================================
  // READY CHECK
  // ============================================

  public async ensureReady(): Promise<void> {
    if (this.isReady) return;
    if (this.readyPromise) {
      return this.readyPromise;
    }
    await this.init();
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
      const transaction = this.db!.transaction([COURSES_STORE, META_STORE], 'readwrite');
      const coursesStore = transaction.objectStore(COURSES_STORE);
      const metaStore = transaction.objectStore(META_STORE);

      // Save course
      const saveRequest = coursesStore.put(course);

      saveRequest.onerror = () => {
        reject(new Error('Failed to save course'));
      };

      // Update last active course
      const metaRequest = metaStore.put({
        key: 'lastActiveCourseId',
        value: course.id,
      });

      metaRequest.onerror = () => {
        // Non-critical, don't reject
      };

      transaction.oncomplete = () => {
        this.emit({ type: 'courseSaved', data: { courseId: course.id } });
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Transaction failed'));
      };
    });
  }

  public async loadCourse(courseId: ID): Promise<Course | null> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(COURSES_STORE, 'readonly');
      const store = transaction.objectStore(COURSES_STORE);

      const request = store.get(courseId);

      request.onerror = () => {
        reject(new Error('Failed to load course'));
      };

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      };
    });
  }

  public async loadAllCourses(): Promise<Course[]> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(COURSES_STORE, 'readonly');
      const store = transaction.objectStore(COURSES_STORE);

      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('Failed to load all courses'));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  public async deleteCourse(courseId: ID): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COURSES_STORE, MEDIA_STORE], 'readwrite');
      const coursesStore = transaction.objectStore(COURSES_STORE);
      const mediaStore = transaction.objectStore(MEDIA_STORE);

      // Delete course
      const deleteCourseRequest = coursesStore.delete(courseId);

      deleteCourseRequest.onerror = () => {
        reject(new Error('Failed to delete course'));
      };

      // Delete all media associated with this course
      // (In a real implementation, we'd need to track which media belongs to which course)
      // For now, we'll delete all media when a course is deleted
      const deleteMediaRequest = mediaStore.clear();

      deleteMediaRequest.onerror = () => {
        // Non-critical
      };

      transaction.oncomplete = () => {
        this.emit({ type: 'courseDeleted', data: { courseId } });
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Transaction failed'));
      };
    });
  }

  public async getLastActiveCourseId(): Promise<ID | null> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(META_STORE, 'readonly');
      const store = transaction.objectStore(META_STORE);

      const request = store.get('lastActiveCourseId');

      request.onerror = () => {
        reject(new Error('Failed to get last active course'));
      };

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
    });
  }

  // ============================================
  // MEDIA OPERATIONS
  // ============================================

  public async saveMedia(asset: MediaAsset): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(MEDIA_STORE, 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE);

      const request = store.put(asset);

      request.onerror = () => {
        reject(new Error('Failed to save media'));
      };

      transaction.oncomplete = () => {
        this.emit({ type: 'mediaSaved', data: { mediaId: asset.id } });
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Transaction failed'));
      };
    });
  }

  public async loadMedia(mediaId: ID): Promise<MediaAsset | null> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(MEDIA_STORE, 'readonly');
      const store = transaction.objectStore(MEDIA_STORE);

      const request = store.get(mediaId);

      request.onerror = () => {
        reject(new Error('Failed to load media'));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  public async loadAllMedia(): Promise<MediaAsset[]> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(MEDIA_STORE, 'readonly');
      const store = transaction.objectStore(MEDIA_STORE);

      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('Failed to load all media'));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  public async deleteMedia(mediaId: ID): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(MEDIA_STORE, 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE);

      const request = store.delete(mediaId);

      request.onerror = () => {
        reject(new Error('Failed to delete media'));
      };

      transaction.oncomplete = () => {
        this.emit({ type: 'mediaDeleted', data: { mediaId } });
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Transaction failed'));
      };
    });
  }

  public async saveMediaData(dataUrl: string, fileName: string, mimeType: string): Promise<MediaAsset> {
    const asset: MediaAsset = {
      id: uuidv4(),
      name: fileName,
      type: mimeType.startsWith('image/') ? 'image' : 'audio',
      dataUrl,
      fileName,
      fileSize: dataUrl.length,
      mimeType,
      createdAt: Date.now(),
    };

    await this.saveMedia(asset);
    return asset;
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

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

      // Save course
      coursesStore.put(course);

      transaction.oncomplete = () => {
        this.emit({ type: 'courseImported', data: { courseId: course.id } });
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to import course'));
      };
    });
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  public on(listener: (event: StorageEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: StorageEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('StorageService: Error in event listener', error);
      }
    }
  }

  // ============================================
  // CLEAR ALL DATA (for testing/dev)
  // ============================================

  public async clearAll(): Promise<void> {
    await this.ensureReady();
    
    if (!this.db) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COURSES_STORE, MEDIA_STORE, META_STORE], 'readwrite');
      
      transaction.objectStore(COURSES_STORE).clear();
      transaction.objectStore(MEDIA_STORE).clear();
      transaction.objectStore(META_STORE).clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to clear all data'));
      };
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

export function getStorageService(): StorageService {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}

export function resetStorageService(): void {
  if (storageService) {
    storageService = null;
  }
}

// ============================================
// EXPORT
// ============================================

export {
  DB_NAME,
  DB_VERSION,
  SCHEMA_VERSION,
  StorageService,
  getStorageService,
  resetStorageService,
};

export type {
  StorageEventType,
  StorageEvent,
};
