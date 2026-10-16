// ============================================
// NEWLMS - Course Model
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Course,
  Chapter,
  Slide,
  SlideElement,
  ID,
  SlideType,
  CourseTheme,
} from '../types';

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_THEME: CourseTheme = {
  primaryColor: '#4F46E5',
  secondaryColor: '#6366F1',
  backgroundColor: '#F8FAFC',
  textColor: '#1E293B',
  accentColor: '#E11D48',
  headingFont: 'Inter, system-ui, sans-serif',
  bodyFont: 'Inter, system-ui, sans-serif',
  headingStyles: {
    h1: { fontSize: 36, fontWeight: '700', color: '#1E293B' },
    h2: { fontSize: 28, fontWeight: '600', color: '#1E293B' },
    h3: { fontSize: 24, fontWeight: '600', color: '#1E293B' },
  },
  bodyTextStyle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#475569',
    lineHeight: 1.6,
  },
};

const DEFAULT_SLIDE_DURATION = 10; // seconds

// ============================================
// COURSE FACTORY
// ============================================

export function createCourse(name: string = 'Neuer Kurs'): Course {
  const courseId = uuidv4();
  const now = Date.now();

  // Create title slide
  const titleSlide: Slide = createTitleSlide(courseId);

  // Create instruction slide
  const instructionSlide: Slide = createInstructionSlide(courseId);

  // Create chapter overview slide
  const chapterOverviewSlide: Slide = createChapterOverviewSlide(courseId);

  // Create first chapter
  const chapter: Chapter = createChapter('Kapitel 1', courseId);

  // Create first content slide for the chapter
  const contentSlide: Slide = createContentSlide('Inhaltsfolie', courseId);

  chapter.slides = [contentSlide.id];

  const course: Course = {
    id: courseId,
    name,
    description: '',
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    theme: DEFAULT_THEME,
    chapters: [chapter],
    slides: [titleSlide, instructionSlide, chapterOverviewSlide, contentSlide],
    titleSlideId: titleSlide.id,
    instructionSlideId: instructionSlide.id,
    chapterOverviewSlideId: chapterOverviewSlide.id,
    currentSlideId: contentSlide.id,
  };

  return course;
}

// ============================================
// CHAPTER FACTORY
// ============================================

export function createChapter(name: string, courseId: ID): Chapter {
  const chapterId = uuidv4();
  return {
    id: chapterId,
    name,
    description: '',
    color: '#4F46E5',
    icon: null,
    slides: [],
  };
}

// ============================================
// SLIDE FACTORIES
// ============================================

function createTitleSlide(courseId: ID): Slide {
  const slideId = uuidv4();
  const titleElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Titel',
    content: 'Kurstitel',
    x: 400,
    y: 200,
    width: 800,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 48,
    fontWeight: '700',
    fontStyle: 'normal',
    textAlign: 'center',
    textDecoration: 'none',
    color: '#1E293B',
    lineHeight: 1.2,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  const subtitleElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Untertitel',
    content: 'Willkommen zum Kurs',
    x: 400,
    y: 350,
    width: 800,
    height: 60,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 24,
    fontWeight: '400',
    fontStyle: 'normal',
    textAlign: 'center',
    textDecoration: 'none',
    color: '#64748B',
    lineHeight: 1.4,
    letterSpacing: 0,
    timing: {
      startTime: 0.5,
      visibleUntil: 'end',
      enterAnimation: { type: 'fade', duration: 0.5 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  return {
    id: slideId,
    type: 'title',
    name: 'Titelfolie',
    duration: DEFAULT_SLIDE_DURATION,
    speakerText: '',
    audioSrc: null,
    audioDuration: null,
    backgroundColor: '#FFFFFF',
    backgroundImage: null,
    elements: [titleElement, subtitleElement],
    autoAdvance: false,
  };
}

function createInstructionSlide(courseId: ID): Slide {
  const slideId = uuidv4();
  const titleElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Titel',
    content: 'Bedienungshinweise',
    x: 400,
    y: 100,
    width: 800,
    height: 80,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 36,
    fontWeight: '700',
    fontStyle: 'normal',
    textAlign: 'center',
    textDecoration: 'none',
    color: '#1E293B',
    lineHeight: 1.2,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  const textElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Text',
    content: 'Navigieren Sie durch den Kurs mit den Pfeiltasten oder durch Klicken auf die Navigationsbuttons.',
    x: 200,
    y: 250,
    width: 800,
    height: 200,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 20,
    fontWeight: '400',
    fontStyle: 'normal',
    textAlign: 'center',
    textDecoration: 'none',
    color: '#475569',
    lineHeight: 1.6,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'fade', duration: 0.5 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  const buttonElement: any = {
    id: uuidv4(),
    type: 'button',
    name: 'Weiter-Button',
    label: 'Kurs starten',
    x: 550,
    y: 500,
    width: 200,
    height: 60,
    rotation: 0,
    opacity: 1,
    zIndex: 3,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    bgColor: '#4F46E5',
    hoverColor: '#4338CA',
    borderColor: '#4F46E5',
    borderWidth: 0,
    cornerRadius: 8,
    action: { type: 'next' },
    timing: {
      startTime: 1,
      visibleUntil: 'end',
      enterAnimation: { type: 'fade', duration: 0.3 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  return {
    id: slideId,
    type: 'instruction',
    name: 'Bedienungsfolie',
    duration: DEFAULT_SLIDE_DURATION,
    speakerText: '',
    audioSrc: null,
    audioDuration: null,
    backgroundColor: '#F8FAFC',
    backgroundImage: null,
    elements: [titleElement, textElement, buttonElement],
    autoAdvance: false,
  };
}

function createChapterOverviewSlide(courseId: ID): Slide {
  const slideId = uuidv4();
  const titleElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Titel',
    content: 'Kapitelübersicht',
    x: 400,
    y: 100,
    width: 800,
    height: 80,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 36,
    fontWeight: '700',
    fontStyle: 'normal',
    textAlign: 'center',
    textDecoration: 'none',
    color: '#1E293B',
    lineHeight: 1.2,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  return {
    id: slideId,
    type: 'chapterOverview',
    name: 'Kapitelübersicht',
    duration: DEFAULT_SLIDE_DURATION,
    speakerText: '',
    audioSrc: null,
    audioDuration: null,
    backgroundColor: '#F8FAFC',
    backgroundImage: null,
    elements: [titleElement],
    chapterOverviewConfig: {
      title: 'Kapitel',
      titleFontSize: 24,
      titleColor: '#1E293B',
      cardLayout: 'grid',
      cardsPerRow: 3,
      cardBgColor: '#FFFFFF',
      cardTextColor: '#1E293B',
      cardHoverColor: '#E0E7FF',
    },
    autoAdvance: false,
  };
}

function createContentSlide(name: string, courseId: ID): Slide {
  const slideId = uuidv4();
  const titleElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Titel',
    content: 'Thema',
    x: 100,
    y: 100,
    width: 800,
    height: 60,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 28,
    fontWeight: '600',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none',
    color: '#1E293B',
    lineHeight: 1.3,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  const textElement: any = {
    id: uuidv4(),
    type: 'text',
    name: 'Text',
    content: 'Hier steht der Inhaltstext.',
    x: 100,
    y: 200,
    width: 800,
    height: 300,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 18,
    fontWeight: '400',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none',
    color: '#475569',
    lineHeight: 1.6,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };

  return {
    id: slideId,
    type: 'content',
    name,
    duration: DEFAULT_SLIDE_DURATION,
    speakerText: '',
    audioSrc: null,
    audioDuration: null,
    backgroundColor: '#FFFFFF',
    backgroundImage: null,
    elements: [titleElement, textElement],
    autoAdvance: false,
  };
}

// ============================================
// TEMPLATE FUNCTIONS
// ============================================

export function createTextElement(
  content: string = 'Neuer Text',
  x: number = 100,
  y: number = 100
): any {
  return {
    id: uuidv4(),
    type: 'text' as const,
    name: 'Text',
    content,
    x,
    y,
    width: 400,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 20,
    fontWeight: '400',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none',
    color: '#1E293B',
    lineHeight: 1.4,
    letterSpacing: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };
}

export function createImageElement(x: number = 100, y: number = 100): any {
  return {
    id: uuidv4(),
    type: 'image' as const,
    name: 'Bild',
    src: '',
    altText: '',
    x,
    y,
    width: 300,
    height: 200,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    crop: null,
    naturalWidth: 0,
    naturalHeight: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };
}

export function createRectangleElement(x: number = 100, y: number = 100): any {
  return {
    id: uuidv4(),
    type: 'rectangle' as const,
    name: 'Rechteck',
    x,
    y,
    width: 200,
    height: 150,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fillColor: '#4F46E5',
    strokeColor: '#4F46E5',
    strokeWidth: 0,
    cornerRadius: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };
}

export function createCircleElement(x: number = 100, y: number = 100): any {
  return {
    id: uuidv4(),
    type: 'circle' as const,
    name: 'Kreis',
    x,
    y,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fillColor: '#4F46E5',
    strokeColor: '#4F46E5',
    strokeWidth: 0,
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };
}

export function createButtonElement(x: number = 100, y: number = 100): any {
  return {
    id: uuidv4(),
    type: 'button' as const,
    name: 'Button',
    label: 'Button',
    x,
    y,
    width: 150,
    height: 50,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    bgColor: '#4F46E5',
    hoverColor: '#4338CA',
    borderColor: '#4F46E5',
    borderWidth: 0,
    cornerRadius: 8,
    action: { type: 'next' as const },
    timing: {
      startTime: 0,
      visibleUntil: 'end',
      enterAnimation: { type: 'none', duration: 0 },
      exitAnimation: { type: 'none', duration: 0 },
    },
  };
}

// ============================================
// COURSE UTILITIES
// ============================================

export function getSlideById(course: Course, slideId: ID): Slide | undefined {
  return course.slides.find((s) => s.id === slideId);
}

export function getChapterById(course: Course, chapterId: ID): Chapter | undefined {
  return course.chapters.find((c) => c.id === chapterId);
}

export function getChapterBySlideId(course: Course, slideId: ID): Chapter | undefined {
  return course.chapters.find((c) => c.slides.includes(slideId));
}

export function getElementById(slide: Slide, elementId: ID): SlideElement | undefined {
  return slide.elements.find((e) => e.id === elementId) as SlideElement | undefined;
}

export function getAllElementsInCourse(course: Course): SlideElement[] {
  const allElements: SlideElement[] = [];
  for (const slide of course.slides) {
    allElements.push(...slide.elements);
  }
  return allElements;
}

export function getSlideIndex(course: Course, slideId: ID): number {
  return course.slides.findIndex((s) => s.id === slideId);
}

export function getChapterIndex(course: Course, chapterId: ID): number {
  return course.chapters.findIndex((c) => c.id === chapterId);
}

export function getSlidePositionInChapter(course: Course, slideId: ID): number {
  const chapter = getChapterBySlideId(course, slideId);
  if (!chapter) return -1;
  return chapter.slides.indexOf(slideId);
}

export function getNextSlideId(course: Course, currentSlideId: ID): ID | null {
  const currentIndex = getSlideIndex(course, currentSlideId);
  if (currentIndex === -1 || currentIndex >= course.slides.length - 1) return null;
  return course.slides[currentIndex + 1].id;
}

export function getPreviousSlideId(course: Course, currentSlideId: ID): ID | null {
  const currentIndex = getSlideIndex(course, currentSlideId);
  if (currentIndex <= 0) return null;
  return course.slides[currentIndex - 1].id;
}

export function isSpecialSlide(slide: Slide): boolean {
  return slide.type === 'title' || slide.type === 'instruction' || slide.type === 'chapterOverview';
}

export function getChapterFromSlide(course: Course, slideId: ID): Chapter | null {
  for (const chapter of course.chapters) {
    if (chapter.slides.includes(slideId)) {
      return chapter;
    }
  }
  return null;
}

// ============================================
// DEEP CLONE FUNCTIONS
// ============================================

export function deepCloneCourse(course: Course): Course {
  return JSON.parse(JSON.stringify(course));
}

export function deepCloneSlide(slide: Slide): Slide {
  return JSON.parse(JSON.stringify(slide));
}

export function deepCloneElement(element: SlideElement): SlideElement {
  return JSON.parse(JSON.stringify(element));
}

// ============================================
// EXPORT
// ============================================

export {
  DEFAULT_THEME,
  DEFAULT_SLIDE_DURATION,
};
