// ============================================
// NEWLMS - Core Type Definitions
// ============================================

// Unique IDs
export type ID = string;

// ============================================
// ELEMENT TYPES
// ============================================

export type ElementType = 'text' | 'image' | 'rectangle' | 'circle' | 'button';

// Animation Types
export type AnimationType = 'none' | 'fade' | 'slide';
export type SlideDirection = 'left' | 'right' | 'top' | 'bottom';

export interface Animation {
  type: AnimationType;
  direction?: SlideDirection;
  duration: number; // in seconds
}

export interface ElementTiming {
  startTime: number; // in seconds
  visibleUntil: number | 'end'; // in seconds or 'end' for "bis Folienende"
  enterAnimation: Animation;
  exitAnimation: Animation;
}

// Base Element
export interface BaseElement {
  id: ID;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0-1
  zIndex: number;
  locked: boolean;
  timing: ElementTiming;
}

// Text Element
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  lineHeight: number;
  letterSpacing: number;
}

// Image Element
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // URL or data URL
  altText: string;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  naturalWidth: number;
  naturalHeight: number;
}

// Shape Elements
export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// Button Element
export interface ButtonElement extends BaseElement {
  type: 'button';
  label: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  action: ButtonAction;
}

export type ButtonActionType = 'next' | 'previous' | 'chapterOverview' | 'specificChapter' | 'specificSlide';
export interface ButtonAction {
  type: ButtonActionType;
  targetId?: ID; // for specificChapter or specificSlide
}

// Union Type for all elements
export type SlideElement = TextElement | ImageElement | RectangleElement | CircleElement | ButtonElement;

// ============================================
// SLIDE TYPES
// ============================================

export type SlideType = 'title' | 'instruction' | 'chapterOverview' | 'content' | 'custom';

export interface Slide {
  id: ID;
  type: SlideType;
  name: string;
  duration: number | 'auto'; // in seconds or 'auto' based on audio
  speakerText: string;
  audioSrc: string | null;
  audioDuration: number | null;
  backgroundColor: string;
  backgroundImage: string | null;
  elements: SlideElement[];
  // For chapter overview slides
  chapterOverviewConfig?: ChapterOverviewConfig;
  // Auto-advance setting
  autoAdvance: boolean;
}

export interface ChapterOverviewConfig {
  title: string;
  titleFontSize: number;
  titleColor: string;
  cardLayout: 'grid' | 'list' | 'carousel';
  cardsPerRow: number;
  cardBgColor: string;
  cardTextColor: string;
  cardHoverColor: string;
}

// ============================================
// CHAPTER & COURSE TYPES
// ============================================

export interface Chapter {
  id: ID;
  name: string;
  description: string;
  color: string;
  icon: string | null;
  slides: ID[]; // Array of slide IDs
}

export interface Course {
  id: ID;
  name: string;
  description: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  // Global styles
  theme: CourseTheme;
  chapters: Chapter[];
  slides: Slide[];
  // Special slides (title, instruction, chapter overview)
  titleSlideId: ID | null;
  instructionSlideId: ID | null;
  chapterOverviewSlideId: ID | null;
  // Current slide being edited
  currentSlideId: ID | null;
}

export interface CourseTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  // Typography
  headingFont: string;
  bodyFont: string;
  // Text styles
  headingStyles: {
    h1: { fontSize: number; fontWeight: string; color: string };
    h2: { fontSize: number; fontWeight: string; color: string };
    h3: { fontSize: number; fontWeight: string; color: string };
  };
  bodyTextStyle: {
    fontSize: number;
    fontWeight: string;
    color: string;
    lineHeight: number;
  };
}

// ============================================
// EDITOR STATE
// ============================================

export type EditorMode = 'edit' | 'preview' | 'play';
export type ToolType = 'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'button' | 'pan';

export interface EditorState {
  mode: EditorMode;
  selectedTool: ToolType;
  selectedElementIds: ID[];
  hoverElementId: ID | null;
  zoom: number;
  panX: number;
  panY: number;
  isTimelineOpen: boolean;
  timelineHeight: number;
  isPlaying: boolean;
  currentTime: number;
  // For drag operations
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  dragElements: ID[];
  // For resizing
  isResizing: boolean;
  resizeStart: { x: number; y: number; width: number; height: number } | null;
  resizeElementId: ID | null;
  resizeHandle: string | null;
  // For multi-select
  selectionBox: { startX: number; startY: number; endX: number; endY: number } | null;
  // Timeline scrubbing
  isScrubbing: boolean;
  scrubStartTime: number;
  scrubStartX: number;
  // Undo/Redo
  history: HistoryState;
  // Copy/Paste
  clipboard: SlideElement[] | null;
}

export interface HistoryState {
  past: EditorAction[];
  future: EditorAction[];
  currentIndex: number;
}

export type EditorAction = {
  type: string;
  data: any;
  timestamp: number;
};

// ============================================
// PLAYER STATE
// ============================================

export interface PlayerState {
  currentSlideId: ID | null;
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  currentChapterId: ID | null;
  // Navigation stack
  navigationStack: ID[];
  // Completed slides
  completedSlides: Set<ID>;
}

// ============================================
// STORAGE TYPES
// ============================================

export interface StorageSchema {
  version: number;
  courses: Course[];
  media: MediaAsset[];
  lastActiveCourseId: ID | null;
}

export interface MediaAsset {
  id: ID;
  name: string;
  type: 'image' | 'audio';
  dataUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface DragState {
  isDragging: boolean;
  startPosition: Point;
  currentPosition: Point;
  elementIds: ID[];
}

// ============================================
// EVENT TYPES
// ============================================

export type EditorEventType =
  | 'elementSelected'
  | 'elementDeselected'
  | 'elementCreated'
  | 'elementDeleted'
  | 'elementUpdated'
  | 'slideSelected'
  | 'slideCreated'
  | 'slideDeleted'
  | 'chapterCreated'
  | 'chapterDeleted'
  | 'courseSaved'
  | 'courseLoaded'
  | 'undo'
  | 'redo'
  | 'zoomChanged'
  | 'panChanged'
  | 'play'
  | 'pause'
  | 'stop'
  | 'scrub';

export interface EditorEvent {
  type: EditorEventType;
  data?: any;
  timestamp: number;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface SlideTemplate {
  id: ID;
  name: string;
  description: string;
  category: string;
  previewImage: string | null;
  createSlide: (course: Course) => Partial<Slide>;
}

// ============================================
// EXPORT
// ============================================

export type {
  ID,
  ElementType,
  AnimationType,
  SlideDirection,
  Animation,
  ElementTiming,
  BaseElement,
  TextElement,
  ImageElement,
  RectangleElement,
  CircleElement,
  ButtonElement,
  ButtonAction,
  ButtonActionType,
  SlideElement,
  SlideType,
  Slide,
  ChapterOverviewConfig,
  Chapter,
  Course,
  CourseTheme,
  EditorMode,
  ToolType,
  EditorState,
  HistoryState,
  EditorAction,
  PlayerState,
  StorageSchema,
  MediaAsset,
  Point,
  Size,
  Rect,
  Direction,
  DragState,
  EditorEventType,
  EditorEvent,
  SlideTemplate,
};
