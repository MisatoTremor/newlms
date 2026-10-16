// ============================================
// NEWLMS - Course Store (Zustand)
// ============================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Course,
  Chapter,
  Slide,
  SlideElement,
  ID,
  EditorState,
  ToolType,
  EditorMode,
  Point,
  HistoryState,
  EditorAction,
} from '../types';
import { getStorageService } from '../services/storage';
import type { StorageEventType } from '../services/storage';
import {
  createCourse,
  createChapter,
  createTextElement,
  createImageElement,
  createRectangleElement,
  createCircleElement,
  createButtonElement,
  deepCloneCourse,
  deepCloneSlide,
  deepCloneElement,
  getSlideById,
  getChapterById,
  getChapterBySlideId,
  getElementById,
  getSlideIndex,
  getChapterIndex,
  getNextSlideId,
  getPreviousSlideId,
} from '../models/course';

// ============================================
// INTERFACES
// ============================================

interface CourseStore {
  // State
  course: Course | null;
  editorState: EditorState;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  createNewCourse: (name?: string) => Promise<void>;
  loadCourse: (courseId: ID) => Promise<void>;
  loadExampleCourse: () => Promise<void>;
  saveCourse: () => Promise<void>;
  deleteCourse: () => Promise<void>;

  // Course actions
  setCourseName: (name: string) => void;
  setCourseDescription: (description: string) => void;

  // Chapter actions
  addChapter: (name?: string) => void;
  updateChapter: (chapterId: ID, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: ID) => void;
  reorderChapters: (newOrder: ID[]) => void;
  duplicateChapter: (chapterId: ID) => void;

  // Slide actions
  addSlide: (slide?: Partial<Slide>, chapterId?: ID) => void;
  updateSlide: (slideId: ID, updates: Partial<Slide>) => void;
  deleteSlide: (slideId: ID) => void;
  moveSlideToChapter: (slideId: ID, targetChapterId: ID, position?: number) => void;
  duplicateSlide: (slideId: ID) => void;
  reorderSlidesInChapter: (chapterId: ID, newOrder: ID[]) => void;
  setCurrentSlide: (slideId: ID) => void;

  // Element actions
  addElement: (element: SlideElement, slideId?: ID) => void;
  updateElement: (elementId: ID, updates: Partial<SlideElement>) => void;
  deleteElement: (elementId: ID) => void;
  deleteElements: (elementIds: ID[]) => void;
  duplicateElement: (elementId: ID) => void;
  reorderElements: (slideId: ID, newOrder: ID[]) => void;
  setElementZIndex: (elementId: ID, zIndex: number) => void;

  // Selection actions
  selectElement: (elementId: ID, multiSelect?: boolean) => void;
  selectElements: (elementIds: ID[]) => void;
  deselectElement: (elementId: ID) => void;
  deselectAll: () => void;
  selectSlide: (slideId: ID) => void;
  hoverElement: (elementId: ID | null) => void;

  // Editor state actions
  setTool: (tool: ToolType) => void;
  setMode: (mode: EditorMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  setTimelineOpen: (isOpen: boolean) => void;
  setTimelineHeight: (height: number) => void;

  // Drag and resize actions
  startDrag: (elementIds: ID[], startPosition: Point) => void;
  updateDrag: (currentPosition: Point) => void;
  endDrag: () => void;
  startResize: (elementId: ID, handle: string, start: Point & { width: number; height: number }) => void;
  updateResize: (currentPosition: Point) => void;
  endResize: () => void;
  startSelectionBox: (start: Point) => void;
  updateSelectionBox: (end: Point) => void;
  endSelectionBox: () => void;

  // Timeline actions
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  startScrubbing: (startTime: number, startX: number) => void;
  updateScrubbing: (currentX: number, maxTime: number) => void;
  endScrubbing: () => void;

  // Clipboard actions
  copyElements: () => void;
  pasteElements: (position?: Point) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  startAction: () => void;
  commitAction: (action: EditorAction) => void;
  cancelAction: () => void;

  // History management
  recordAction: (action: EditorAction) => void;

  // Utility getters
  getCurrentSlide: () => Slide | undefined;
  getCurrentChapter: () => Chapter | undefined;
  getSelectedElements: () => SlideElement[];
  getSlideElements: (slideId?: ID) => SlideElement[];
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Setup storage listener
  setupStorageListener: () => void;
}

// ============================================
// DEFAULT EDITOR STATE
// ============================================

const defaultEditorState: EditorState = {
  mode: 'edit',
  selectedTool: 'select',
  selectedElementIds: [],
  hoverElementId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isTimelineOpen: false,
  timelineHeight: 200,
  isPlaying: false,
  currentTime: 0,
  isDragging: false,
  dragStart: null,
  dragElements: [],
  isResizing: false,
  resizeStart: null,
  resizeElementId: null,
  resizeHandle: null,
  selectionBox: null,
  isScrubbing: false,
  scrubStartTime: 0,
  scrubStartX: 0,
  history: {
    past: [],
    future: [],
    currentIndex: -1,
  },
  clipboard: null,
};

const defaultHistoryState: HistoryState = {
  past: [],
  future: [],
  currentIndex: -1,
};

// ============================================
// STORE DEFINITION
// ============================================

export const useCourseStore = create<CourseStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        course: null,
        editorState: defaultEditorState,
        isLoading: false,
        isSaving: false,
        saveStatus: 'idle',
        error: null,

        // ============================================
        // INITIALIZATION
        // ============================================

        initialize: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const storage = getStorageService();
            await storage.ensureReady();
            
            const lastCourseId = await storage.getLastActiveCourseId();
            
            if (lastCourseId) {
              const course = await storage.loadCourse(lastCourseId);
              if (course) {
                set({ course, isLoading: false });
                return;
              }
            }

            // Create a new course if none exists
            const newCourse = createCourse('Mein Kurs');
            await storage.saveCourse(newCourse);
            set({ course: newCourse, isLoading: false });
            
          } catch (error) {
            console.error('Failed to initialize course store:', error);
            set({ 
              error: 'Fehler beim Laden des Kurses', 
              isLoading: false 
            });
          }
        },

        loadExampleCourse: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const { createExampleCourse } = await import('../models/exampleCourse');
            const exampleCourse = createExampleCourse();
            
            const storage = getStorageService();
            await storage.saveCourse(exampleCourse);
            
            set({ 
              course: exampleCourse, 
              editorState: {
                ...defaultEditorState,
                currentSlideId: exampleCourse.currentSlideId,
              },
              isLoading: false,
            });
            
          } catch (error) {
            console.error('Failed to load example course:', error);
            set({ 
              error: 'Fehler beim Laden des Beispielkurses', 
              isLoading: false 
            });
          }
        },

        createNewCourse: async (name?: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const storage = getStorageService();
            const newCourse = createCourse(name || 'Neuer Kurs');
            await storage.saveCourse(newCourse);
            set({ 
              course: newCourse, 
              editorState: {
                ...defaultEditorState,
                currentSlideId: newCourse.currentSlideId,
              },
              isLoading: false,
              saveStatus: 'saved',
            });
          } catch (error) {
            console.error('Failed to create new course:', error);
            set({ 
              error: 'Fehler beim Erstellen eines neuen Kurses', 
              isLoading: false 
            });
          }
        },

        loadCourse: async (courseId: ID) => {
          set({ isLoading: true, error: null });
          
          try {
            const storage = getStorageService();
            const course = await storage.loadCourse(courseId);
            
            if (course) {
              set({ 
                course, 
                editorState: {
                  ...defaultEditorState,
                  currentSlideId: course.currentSlideId,
                },
                isLoading: false,
              });
            } else {
              set({ 
                error: 'Kurs nicht gefunden', 
                isLoading: false 
              });
            }
          } catch (error) {
            console.error('Failed to load course:', error);
            set({ 
              error: 'Fehler beim Laden des Kurses', 
              isLoading: false 
            });
          }
        },

        saveCourse: async () => {
          const { course, saveStatus } = get();
          
          if (!course || saveStatus === 'saving') return;
          
          set({ saveStatus: 'saving', isSaving: true, error: null });
          
          try {
            const storage = getStorageService();
            const courseToSave = deepCloneCourse(course);
            await storage.saveCourse(courseToSave);
            
            set({ 
              saveStatus: 'saved', 
              isSaving: false,
              course: courseToSave,
              error: null,
            });
            
            setTimeout(() => {
              set({ saveStatus: 'idle' });
            }, 2000);
            
          } catch (error) {
            console.error('Failed to save course:', error);
            set({ 
              saveStatus: 'error', 
              isSaving: false,
              error: 'Fehler beim Speichern des Kurses',
            });
          }
        },

        deleteCourse: async () => {
          const { course } = get();
          
          if (!course) return;
          
          set({ isLoading: true, error: null });
          
          try {
            const storage = getStorageService();
            await storage.deleteCourse(course.id);
            
            set({ 
              course: null,
              editorState: defaultEditorState,
              isLoading: false,
            });
            
            // Create a new course
            await get().createNewCourse();
            
          } catch (error) {
            console.error('Failed to delete course:', error);
            set({ 
              error: 'Fehler beim Löschen des Kurses', 
              isLoading: false 
            });
          }
        },

        // ============================================
        // COURSE ACTIONS
        // ============================================

        setCourseName: (name: string) => {
          const { course } = get();
          if (!course) return;
          
          set({
            course: {
              ...course,
              name,
              updatedAt: Date.now(),
            },
          });
        },

        setCourseDescription: (description: string) => {
          const { course } = get();
          if (!course) return;
          
          set({
            course: {
              ...course,
              description,
              updatedAt: Date.now(),
            },
          });
        },

        // ============================================
        // CHAPTER ACTIONS
        // ============================================

        addChapter: (name?: string) => {
          const { course } = get();
          if (!course) return;
          
          const newChapter = createChapter(name || `Kapitel ${course.chapters.length + 1}`, course.id);
          
          set({
            course: {
              ...course,
              chapters: [...course.chapters, newChapter],
              updatedAt: Date.now(),
            },
          });
        },

        updateChapter: (chapterId: ID, updates: Partial<Chapter>) => {
          const { course } = get();
          if (!course) return;
          
          const updatedChapters = course.chapters.map((chapter) =>
            chapter.id === chapterId ? { ...chapter, ...updates } : chapter
          );
          
          set({
            course: {
              ...course,
              chapters: updatedChapters,
              updatedAt: Date.now(),
            },
          });
        },

        deleteChapter: (chapterId: ID) => {
          const { course } = get();
          if (!course) return;
          
          // Don't delete the last chapter
          if (course.chapters.length <= 1) return;
          
          const chapter = getChapterById(course, chapterId);
          if (!chapter) return;
          
          // Remove all slides in this chapter
          const slidesToKeep = course.slides.filter(
            (slide) => !chapter.slides.includes(slide.id)
          );
          
          const updatedChapters = course.chapters.filter(
            (c) => c.id !== chapterId
          );
          
          // Update current slide if it was in the deleted chapter
          let newCurrentSlideId = course.currentSlideId;
          if (chapter.slides.includes(course.currentSlideId!)) {
            newCurrentSlideId = slidesToKeep.length > 0 ? slidesToKeep[0].id : null;
          }
          
          set({
            course: {
              ...course,
              chapters: updatedChapters,
              slides: slidesToKeep,
              currentSlideId: newCurrentSlideId,
              updatedAt: Date.now(),
            },
          });
        },

        reorderChapters: (newOrder: ID[]) => {
          const { course } = get();
          if (!course) return;
          
          // Sort chapters by the new order
          const sortedChapters = [...course.chapters].sort(
            (a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
          );
          
          set({
            course: {
              ...course,
              chapters: sortedChapters,
              updatedAt: Date.now(),
            },
          });
        },

        duplicateChapter: (chapterId: ID) => {
          const { course } = get();
          if (!course) return;
          
          const chapter = getChapterById(course, chapterId);
          if (!chapter) return;
          
          const newChapter: Chapter = {
            ...chapter,
            id: uuidv4(),
            name: `${chapter.name} (Kopie)`,
            slides: [],
          };
          
          // Duplicate all slides in the chapter
          const newSlides: Slide[] = [];
          for (const slideId of chapter.slides) {
            const slide = getSlideById(course, slideId);
            if (slide) {
              const newSlide: Slide = {
                ...deepCloneSlide(slide),
                id: uuidv4(),
                name: `${slide.name} (Kopie)`,
              };
              newSlides.push(newSlide);
              newChapter.slides.push(newSlide.id);
            }
          }
          
          set({
            course: {
              ...course,
              chapters: [...course.chapters, newChapter],
              slides: [...course.slides, ...newSlides],
              updatedAt: Date.now(),
            },
          });
        },

        // ============================================
        // SLIDE ACTIONS
        // ============================================

        addSlide: (slidePartial?: Partial<Slide>, chapterId?: ID) => {
          const { course } = get();
          if (!course) return;
          
          let targetChapterId = chapterId;
          
          // If no chapter specified, use the chapter of the current slide
          if (!targetChapterId && course.currentSlideId) {
            const currentChapter = getChapterBySlideId(course, course.currentSlideId);
            if (currentChapter) {
              targetChapterId = currentChapter.id;
            }
          }
          
          // If still no chapter, use the first chapter
          if (!targetChapterId && course.chapters.length > 0) {
            targetChapterId = course.chapters[0].id;
          }
          
          if (!targetChapterId) return;
          
          const newSlide: Slide = {
            id: uuidv4(),
            type: 'content',
            name: 'Neue Folie',
            duration: 10,
            speakerText: '',
            audioSrc: null,
            audioDuration: null,
            backgroundColor: '#FFFFFF',
            backgroundImage: null,
            elements: [],
            autoAdvance: false,
            ...slidePartial,
          };
          
          // Update chapter
          const updatedChapters = course.chapters.map((chapter) =>
            chapter.id === targetChapterId
              ? { ...chapter, slides: [...chapter.slides, newSlide.id] }
              : chapter
          );
          
          set({
            course: {
              ...course,
              slides: [...course.slides, newSlide],
              chapters: updatedChapters,
              currentSlideId: newSlide.id,
              updatedAt: Date.now(),
            },
            editorState: {
              ...get().editorState,
              currentSlideId: newSlide.id,
              selectedElementIds: [],
            },
          });
        },

        updateSlide: (slideId: ID, updates: Partial<Slide>) => {
          const { course } = get();
          if (!course) return;
          
          const updatedSlides = course.slides.map((slide) =>
            slide.id === slideId ? { ...slide, ...updates, updatedAt: Date.now() } : slide
          );
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          });
        },

        deleteSlide: (slideId: ID) => {
          const { course } = get();
          if (!course) return;
          
          // Don't delete the last slide
          if (course.slides.length <= 1) return;
          
          const slide = getSlideById(course, slideId);
          if (!slide) return;
          
          // Remove from chapter
          const updatedChapters = course.chapters.map((chapter) => ({
            ...chapter,
            slides: chapter.slides.filter((id) => id !== slideId),
          }));
          
          // Remove from slides array
          const updatedSlides = course.slides.filter((s) => s.id !== slideId);
          
          // Update current slide if it was the deleted one
          let newCurrentSlideId = course.currentSlideId;
          if (course.currentSlideId === slideId) {
            newCurrentSlideId = updatedSlides.length > 0 ? updatedSlides[0].id : null;
          }
          
          // Also update special slide IDs if they reference the deleted slide
          const titleSlideId = course.titleSlideId === slideId ? null : course.titleSlideId;
          const instructionSlideId = course.instructionSlideId === slideId ? null : course.instructionSlideId;
          const chapterOverviewSlideId = course.chapterOverviewSlideId === slideId ? null : course.chapterOverviewSlideId;
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              chapters: updatedChapters,
              currentSlideId: newCurrentSlideId,
              titleSlideId,
              instructionSlideId,
              chapterOverviewSlideId,
              updatedAt: Date.now(),
            },
            editorState: {
              ...get().editorState,
              currentSlideId: newCurrentSlideId,
              selectedElementIds: [],
            },
          });
        },

        moveSlideToChapter: (slideId: ID, targetChapterId: ID, position?: number) => {
          const { course } = get();
          if (!course) return;
          
          const slide = getSlideById(course, slideId);
          if (!slide) return;
          
          const sourceChapter = getChapterBySlideId(course, slideId);
          if (!sourceChapter) return;
          
          const targetChapter = getChapterById(course, targetChapterId);
          if (!targetChapter) return;
          
          // Remove from source chapter
          const sourceSlides = sourceChapter.slides.filter((id) => id !== slideId);
          
          // Add to target chapter at specified position or at the end
          const insertPosition = position !== undefined ? position : targetChapter.slides.length;
          const targetSlides = [...targetChapter.slides];
          targetSlides.splice(insertPosition, 0, slideId);
          
          const updatedChapters = course.chapters.map((chapter) => {
            if (chapter.id === sourceChapter.id) {
              return { ...chapter, slides: sourceSlides };
            }
            if (chapter.id === targetChapter.id) {
              return { ...chapter, slides: targetSlides };
            }
            return chapter;
          });
          
          set({
            course: {
              ...course,
              chapters: updatedChapters,
              updatedAt: Date.now(),
            },
          });
        },

        duplicateSlide: (slideId: ID) => {
          const { course } = get();
          if (!course) return;
          
          const slide = getSlideById(course, slideId);
          if (!slide) return;
          
          const chapter = getChapterBySlideId(course, slideId);
          if (!chapter) return;
          
          const newSlide: Slide = {
            ...deepCloneSlide(slide),
            id: uuidv4(),
            name: `${slide.name} (Kopie)`,
          };
          
          // Update chapter
          const updatedChapters = course.chapters.map((c) =>
            c.id === chapter.id
              ? { ...c, slides: [...c.slides, newSlide.id] }
              : c
          );
          
          set({
            course: {
              ...course,
              slides: [...course.slides, newSlide],
              chapters: updatedChapters,
              currentSlideId: newSlide.id,
              updatedAt: Date.now(),
            },
            editorState: {
              ...get().editorState,
              currentSlideId: newSlide.id,
              selectedElementIds: [],
            },
          });
        },

        reorderSlidesInChapter: (chapterId: ID, newOrder: ID[]) => {
          const { course } = get();
          if (!course) return;
          
          const updatedChapters = course.chapters.map((chapter) =>
            chapter.id === chapterId ? { ...chapter, slides: newOrder } : chapter
          );
          
          set({
            course: {
              ...course,
              chapters: updatedChapters,
              updatedAt: Date.now(),
            },
          });
        },

        setCurrentSlide: (slideId: ID) => {
          const { course } = get();
          if (!course) return;
          
          set({
            course: {
              ...course,
              currentSlideId: slideId,
            },
            editorState: {
              ...get().editorState,
              currentSlideId: slideId,
              selectedElementIds: [],
              currentTime: 0,
              isPlaying: false,
            },
          });
        },

        // ============================================
        // ELEMENT ACTIONS
        // ============================================

        addElement: (element: SlideElement, slideId?: ID) => {
          const { course, editorState } = get();
          if (!course) return;
          
          const targetSlideId = slideId || course.currentSlideId;
          if (!targetSlideId) return;
          
          const slide = getSlideById(course, targetSlideId);
          if (!slide) return;
          
          // Position the element
          const newElement = {
            ...element,
            id: uuidv4(),
            zIndex: slide.elements.length + 1,
          };
          
          const updatedSlides = course.slides.map((s) => {
            if (s.id === targetSlideId) {
              return {
                ...s,
                elements: [...s.elements, newElement],
                updatedAt: Date.now(),
              };
            }
            return s;
          });
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
            editorState: {
              ...editorState,
              selectedElementIds: [newElement.id],
              selectedTool: 'select',
            },
          });
        },

        updateElement: (elementId: ID, updates: Partial<SlideElement>) => {
          const { course } = get();
          if (!course) return;
          
          const updatedSlides = course.slides.map((slide) => {
            const updatedElements = slide.elements.map((element) =>
              element.id === elementId ? { ...element, ...updates } : element
            );
            return updatedElements !== slide.elements
              ? { ...slide, elements: updatedElements, updatedAt: Date.now() }
              : slide;
          });
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          });
        },

        deleteElement: (elementId: ID) => {
          const { course, editorState } = get();
          if (!course) return;
          
          const updatedSlides = course.slides.map((slide) => {
            const updatedElements = slide.elements.filter(
              (element) => element.id !== elementId
            );
            return updatedElements !== slide.elements
              ? { ...slide, elements: updatedElements, updatedAt: Date.now() }
              : slide;
          });
          
          const updatedSelectedIds = editorState.selectedElementIds.filter(
            (id) => id !== elementId
          );
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
            editorState: {
              ...editorState,
              selectedElementIds: updatedSelectedIds,
              hoverElementId: editorState.hoverElementId === elementId ? null : editorState.hoverElementId,
            },
          });
        },

        deleteElements: (elementIds: ID[]) => {
          const { course, editorState } = get();
          if (!course) return;
          
          const updatedSlides = course.slides.map((slide) => {
            const updatedElements = slide.elements.filter(
              (element) => !elementIds.includes(element.id)
            );
            return updatedElements !== slide.elements
              ? { ...slide, elements: updatedElements, updatedAt: Date.now() }
              : slide;
          });
          
          const updatedSelectedIds = editorState.selectedElementIds.filter(
            (id) => !elementIds.includes(id)
          );
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
            editorState: {
              ...editorState,
              selectedElementIds: updatedSelectedIds,
              hoverElementId: elementIds.includes(editorState.hoverElementId || '')
                ? null
                : editorState.hoverElementId,
            },
          });
        },

        duplicateElement: (elementId: ID) => {
          const { course, editorState } = get();
          if (!course || !editorState.currentSlideId) return;
          
          const slide = getSlideById(course, editorState.currentSlideId);
          if (!slide) return;
          
          const element = getElementById(slide, elementId);
          if (!element) return;
          
          const newElement = {
            ...deepCloneElement(element),
            id: uuidv4(),
            name: `${element.name} (Kopie)`,
            x: element.x + 20,
            y: element.y + 20,
            zIndex: slide.elements.length + 1,
          };
          
          const updatedSlides = course.slides.map((s) => {
            if (s.id === editorState.currentSlideId) {
              return {
                ...s,
                elements: [...s.elements, newElement],
                updatedAt: Date.now(),
              };
            }
            return s;
          });
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
            editorState: {
              ...editorState,
              selectedElementIds: [newElement.id],
            },
          });
        },

        reorderElements: (slideId: ID, newOrder: ID[]) => {
          const { course } = get();
          if (!course) return;
          
          const updatedSlides = course.slides.map((slide) => {
            if (slide.id === slideId) {
              // Reorder elements by newOrder, preserving those not in the list
              const orderedElements = [...slide.elements];
              orderedElements.sort((a, b) => {
                const aIndex = newOrder.indexOf(a.id);
                const bIndex = newOrder.indexOf(b.id);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
              });
              
              // Update zIndex based on position
              const elementsWithZIndex = orderedElements.map((el, index) => ({
                ...el,
                zIndex: index + 1,
              }));
              
              return {
                ...slide,
                elements: elementsWithZIndex,
                updatedAt: Date.now(),
              };
            }
            return slide;
          });
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          });
        },

        setElementZIndex: (elementId: ID, zIndex: number) => {
          const { course } = get();
          if (!course) return;
          
          const updatedSlides = course.slides.map((slide) => {
            const updatedElements = slide.elements.map((element) =>
              element.id === elementId ? { ...element, zIndex } : element
            );
            return updatedElements !== slide.elements
              ? { ...slide, elements: updatedElements, updatedAt: Date.now() }
              : slide;
          });
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          });
        },

        // ============================================
        // SELECTION ACTIONS
        // ============================================

        selectElement: (elementId: ID, multiSelect?: boolean) => {
          const { editorState, course } = get();
          if (!course || !editorState.currentSlideId) return;
          
          const slide = getSlideById(course, editorState.currentSlideId);
          if (!slide) return;
          
          // Check if element exists in current slide
          const elementExists = slide.elements.some((e) => e.id === elementId);
          if (!elementExists) return;
          
          if (multiSelect && editorState.selectedElementIds.includes(elementId)) {
            // Deselect if already selected and multi-select is enabled
            const newSelectedIds = editorState.selectedElementIds.filter(
              (id) => id !== elementId
            );
            set({
              editorState: {
                ...editorState,
                selectedElementIds: newSelectedIds,
              },
            });
          } else if (multiSelect) {
            // Add to selection
            set({
              editorState: {
                ...editorState,
                selectedElementIds: [...editorState.selectedElementIds, elementId],
              },
            });
          } else {
            // Replace selection
            set({
              editorState: {
                ...editorState,
                selectedElementIds: [elementId],
              },
            });
          }
        },

        selectElements: (elementIds: ID[]) => {
          set({
            editorState: {
              ...get().editorState,
              selectedElementIds: elementIds,
            },
          });
        },

        deselectElement: (elementId: ID) => {
          const { editorState } = get();
          const newSelectedIds = editorState.selectedElementIds.filter(
            (id) => id !== elementId
          );
          set({
            editorState: {
              ...editorState,
              selectedElementIds: newSelectedIds,
            },
          });
        },

        deselectAll: () => {
          set({
            editorState: {
              ...get().editorState,
              selectedElementIds: [],
            },
          });
        },

        selectSlide: (slideId: ID) => {
          const { course } = get();
          if (!course) return;
          
          set({
            editorState: {
              ...get().editorState,
              currentSlideId: slideId,
              selectedElementIds: [],
              currentTime: 0,
              isPlaying: false,
            },
            course: {
              ...course,
              currentSlideId: slideId,
            },
          });
        },

        hoverElement: (elementId: ID | null) => {
          set({
            editorState: {
              ...get().editorState,
              hoverElementId: elementId,
            },
          });
        },

        // ============================================
        // EDITOR STATE ACTIONS
        // ============================================

        setTool: (tool: ToolType) => {
          set({
            editorState: {
              ...get().editorState,
              selectedTool: tool,
            },
          });
        },

        setMode: (mode: EditorMode) => {
          set({
            editorState: {
              ...get().editorState,
              mode,
            },
          });
        },

        setZoom: (zoom: number) => {
          set({
            editorState: {
              ...get().editorState,
              zoom,
            },
          });
        },

        setPan: (panX: number, panY: number) => {
          set({
            editorState: {
              ...get().editorState,
              panX,
              panY,
            },
          });
        },

        setTimelineOpen: (isOpen: boolean) => {
          set({
            editorState: {
              ...get().editorState,
              isTimelineOpen: isOpen,
            },
          });
        },

        setTimelineHeight: (height: number) => {
          set({
            editorState: {
              ...get().editorState,
              timelineHeight: height,
            },
          });
        },

        // ============================================
        // DRAG AND RESIZE ACTIONS
        // ============================================

        startDrag: (elementIds: ID[], startPosition: Point) => {
          set({
            editorState: {
              ...get().editorState,
              isDragging: true,
              dragStart: startPosition,
              dragElements: elementIds,
            },
          });
        },

        updateDrag: (currentPosition: Point) => {
          set({
            editorState: {
              ...get().editorState,
              // Store current position for drag
            },
          });
          
          // Actual position updates are handled in components
        },

        endDrag: () => {
          const { editorState } = get();
          
          // Record the drag action for undo
          if (editorState.dragElements.length > 0) {
            const action: EditorAction = {
              type: 'dragElements',
              data: {
                elementIds: editorState.dragElements,
              },
              timestamp: Date.now(),
            };
            get().recordAction(action);
          }
          
          set({
            editorState: {
              ...editorState,
              isDragging: false,
              dragStart: null,
              dragElements: [],
            },
          });
        },

        startResize: (elementId: ID, handle: string, start: Point & { width: number; height: number }) => {
          set({
            editorState: {
              ...get().editorState,
              isResizing: true,
              resizeStart: start,
              resizeElementId: elementId,
              resizeHandle: handle,
            },
          });
        },

        updateResize: (currentPosition: Point) => {
          // Position updates handled in components
        },

        endResize: () => {
          const { editorState } = get();
          
          if (editorState.resizeElementId) {
            const action: EditorAction = {
              type: 'resizeElement',
              data: {
                elementId: editorState.resizeElementId,
              },
              timestamp: Date.now(),
            };
            get().recordAction(action);
          }
          
          set({
            editorState: {
              ...editorState,
              isResizing: false,
              resizeStart: null,
              resizeElementId: null,
              resizeHandle: null,
            },
          });
        },

        startSelectionBox: (start: Point) => {
          set({
            editorState: {
              ...get().editorState,
              selectionBox: {
                startX: start.x,
                startY: start.y,
                endX: start.x,
                endY: start.y,
              },
            },
          });
        },

        updateSelectionBox: (end: Point) => {
          const { editorState } = get();
          
          if (!editorState.selectionBox) return;
          
          set({
            editorState: {
              ...editorState,
              selectionBox: {
                ...editorState.selectionBox,
                endX: end.x,
                endY: end.y,
              },
            },
          });
        },

        endSelectionBox: () => {
          const { editorState, course } = get();
          
          if (!editorState.selectionBox || !course || !editorState.currentSlideId) {
            set({
              editorState: {
                ...editorState,
                selectionBox: null,
              },
            });
            return;
          }
          
          const slide = getSlideById(course, editorState.currentSlideId);
          if (!slide) {
            set({
              editorState: {
                ...editorState,
                selectionBox: null,
              },
            });
            return;
          }
          
          // Find elements within the selection box
          const { startX, startY, endX, endY } = editorState.selectionBox;
          const left = Math.min(startX, endX);
          const top = Math.min(startY, endY);
          const right = Math.max(startX, endX);
          const bottom = Math.max(startY, endY);
          
          const selectedElementIds = slide.elements
            .filter((element) => {
              // Check if element intersects with selection box
              return !(
                element.x + element.width < left ||
                element.x > right ||
                element.y + element.height < top ||
                element.y > bottom
              );
            })
            .map((e) => e.id);
          
          set({
            editorState: {
              ...editorState,
              selectionBox: null,
              selectedElementIds: selectedElementIds.length > 0 ? selectedElementIds : [],
            },
          });
        },

        // ============================================
        // TIMELINE ACTIONS
        // ============================================

        setIsPlaying: (isPlaying: boolean) => {
          set({
            editorState: {
              ...get().editorState,
              isPlaying,
            },
          });
        },

        setCurrentTime: (time: number) => {
          set({
            editorState: {
              ...get().editorState,
              currentTime: time,
            },
          });
        },

        startScrubbing: (startTime: number, startX: number) => {
          set({
            editorState: {
              ...get().editorState,
              isScrubbing: true,
              scrubStartTime: startTime,
              scrubStartX: startX,
            },
          });
        },

        updateScrubbing: (currentX: number, maxTime: number) => {
          const { editorState } = get();
          
          if (!editorState.isScrubbing) return;
          
          // Calculate time based on X position
          const deltaX = currentX - editorState.scrubStartX;
          const timePerPixel = maxTime / (window.innerWidth || 800);
          const newTime = editorState.scrubStartTime + deltaX * timePerPixel;
          
          set({
            editorState: {
              ...editorState,
              currentTime: Math.max(0, Math.min(maxTime, newTime)),
            },
          });
        },

        endScrubbing: () => {
          set({
            editorState: {
              ...get().editorState,
              isScrubbing: false,
              scrubStartTime: 0,
              scrubStartX: 0,
            },
          });
        },

        // ============================================
        // CLIPBOARD ACTIONS
        // ============================================

        copyElements: () => {
          const { course, editorState } = get();
          if (!course || !editorState.currentSlideId || editorState.selectedElementIds.length === 0) return;
          
          const slide = getSlideById(course, editorState.currentSlideId);
          if (!slide) return;
          
          const elementsToCopy = slide.elements.filter((e) =>
            editorState.selectedElementIds.includes(e.id)
          );
          
          set({
            editorState: {
              ...editorState,
              clipboard: elementsToCopy as any[],
            },
          });
        },

        pasteElements: (position?: Point) => {
          const { course, editorState } = get();
          if (!course || !editorState.currentSlideId || !editorState.clipboard) return;
          
          const slide = getSlideById(course, editorState.currentSlideId);
          if (!slide) return;
          
          const defaultPosition = position || { x: 100, y: 100 };
          
          const newElements = editorState.clipboard.map((element, index) => ({
            ...deepCloneElement(element as any),
            id: uuidv4(),
            x: defaultPosition.x + index * 20,
            y: defaultPosition.y + index * 20,
            zIndex: slide.elements.length + index + 1,
          }));
          
          const updatedSlides = course.slides.map((s) => {
            if (s.id === editorState.currentSlideId) {
              return {
                ...s,
                elements: [...s.elements, ...newElements],
                updatedAt: Date.now(),
              };
            }
            return s;
          });
          
          set({
            course: {
              ...course,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
            editorState: {
              ...editorState,
              selectedElementIds: newElements.map((e) => e.id),
            },
          });
        },

        // ============================================
        // UNDO/REDO
        // ============================================

        startAction: () => {
          // Called when starting a new action that should be undoable
          const { editorState } = get();
          
          // Save current state for potential undo
          // This is a simplified approach - in a full implementation,
          // we'd track specific changes
        },

        commitAction: (action: EditorAction) => {
          const { editorState } = get();
          
          const newHistory: HistoryState = {
            ...editorState.history,
            past: [...editorState.history.past.slice(0, editorState.history.currentIndex + 1), action],
            future: [],
            currentIndex: editorState.history.currentIndex + 1,
          };
          
          set({
            editorState: {
              ...editorState,
              history: newHistory,
            },
          });
        },

        cancelAction: () => {
          // Discard the current action without recording
        },

        recordAction: (action: EditorAction) => {
          const { editorState } = get();
          
          // Only record if we're not in the middle of an action
          // and if the action is different from the last one
          const lastAction = editorState.history.past[editorState.history.currentIndex];
          
          // Simple deduplication - don't record the same action type twice in a row
          // unless there's been an undo
          if (lastAction && lastAction.type === action.type) {
            // Merge or replace the last action
            const newHistory: HistoryState = {
              ...editorState.history,
              past: [
                ...editorState.history.past.slice(0, editorState.history.currentIndex),
                action,
              ],
              future: [],
              currentIndex: editorState.history.currentIndex,
            };
            
            set({
              editorState: {
                ...editorState,
                history: newHistory,
              },
            });
          } else {
            const newHistory: HistoryState = {
              ...editorState.history,
              past: [...editorState.history.past.slice(0, editorState.history.currentIndex + 1), action],
              future: [],
              currentIndex: editorState.history.currentIndex + 1,
            };
            
            set({
              editorState: {
                ...editorState,
                history: newHistory,
              },
            });
          }
        },

        undo: () => {
          const { editorState } = get();
          
          if (editorState.history.currentIndex < 0) return;
          
          const actionToUndo = editorState.history.past[editorState.history.currentIndex];
          if (!actionToUndo) return;
          
          // Create inverse action
          const inverseAction: EditorAction = {
            type: `undo_${actionToUndo.type}`,
            data: actionToUndo.data,
            timestamp: Date.now(),
          };
          
          const newHistory: HistoryState = {
            ...editorState.history,
            past: editorState.history.past.slice(0, editorState.history.currentIndex),
            future: [actionToUndo, ...editorState.history.future],
            currentIndex: editorState.history.currentIndex - 1,
          };
          
          set({
            editorState: {
              ...editorState,
              history: newHistory,
            },
          });
          
          // Here we would apply the inverse action to the state
          // For now, we'll just record it
          console.log('Undo:', actionToUndo.type, inverseAction);
        },

        redo: () => {
          const { editorState } = get();
          
          if (editorState.history.future.length === 0) return;
          
          const actionToRedo = editorState.history.future[0];
          if (!actionToRedo) return;
          
          const newHistory: HistoryState = {
            ...editorState.history,
            past: [...editorState.history.past, actionToRedo],
            future: editorState.history.future.slice(1),
            currentIndex: editorState.history.currentIndex + 1,
          };
          
          set({
            editorState: {
              ...editorState,
              history: newHistory,
            },
          });
          
          // Apply the redo action
          console.log('Redo:', actionToRedo.type);
        },

        canUndo: () => {
          const { editorState } = get();
          return editorState.history.currentIndex >= 0 && editorState.history.past.length > 0;
        },

        canRedo: () => {
          const { editorState } = get();
          return editorState.history.future.length > 0;
        },

        // ============================================
        // UTILITY GETTERS
        // ============================================

        getCurrentSlide: () => {
          const { course, editorState } = get();
          if (!course || !editorState.currentSlideId) return undefined;
          return getSlideById(course, editorState.currentSlideId);
        },

        getCurrentChapter: () => {
          const { course, editorState } = get();
          if (!course || !editorState.currentSlideId) return undefined;
          return getChapterBySlideId(course, editorState.currentSlideId);
        },

        getSelectedElements: () => {
          const { course, editorState } = get();
          if (!course || !editorState.currentSlideId) return [];
          
          const slide = getSlideById(course, editorState.currentSlideId);
          if (!slide) return [];
          
          return slide.elements.filter((e) =>
            editorState.selectedElementIds.includes(e.id)
          );
        },

        getSlideElements: (slideId?: ID) => {
          const { course, editorState } = get();
          if (!course) return [];
          
          const targetSlideId = slideId || editorState.currentSlideId;
          if (!targetSlideId) return [];
          
          const slide = getSlideById(course, targetSlideId);
          return slide ? slide.elements : [];
        },

        // ============================================
        // STORAGE LISTENER
        // ============================================

        setupStorageListener: () => {
          const storage = getStorageService();
          storage.on((event) => {
            if (event.type === 'courseSaved') {
              set({ saveStatus: 'saved' });
              setTimeout(() => set({ saveStatus: 'idle' }), 2000);
            }
          });
        },
      }),
      {
        name: 'courseStore',
        partialize: (state) => ({
          // Only persist course data, not editor state
          course: state.course,
        }),
      }
    ),
    { name: 'CourseStore' }
  )
);

// ============================================
// EXPORT
// ============================================

export default useCourseStore;
