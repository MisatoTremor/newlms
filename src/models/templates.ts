// ============================================
// NEWLMS - Slide Templates
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type { Slide, Course } from '../types';
import { createTextElement, createImageElement, createRectangleElement, createButtonElement } from './course';

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  createSlide: () => Partial<Slide>;
}

// ============================================
// TITLE SLIDE TEMPLATE
// ============================================

const titleSlideTemplate: SlideTemplate = {
  id: 'template-title',
  name: 'Titelfolie',
  description: 'Eine Titelfolie mit Kursname und Untertitel',
  category: 'Starter',
  createSlide: () => {
    const titleElement = createTextElement('Kurstitel', 400, 200);
    titleElement.fontSize = 48;
    titleElement.fontWeight = '700';
    titleElement.textAlign = 'center';
    titleElement.color = '#1E293B';
    titleElement.width = 800;
    titleElement.height = 100;

    const subtitleElement = createTextElement('Willkommen zu unserem Kurs', 400, 350);
    subtitleElement.fontSize = 24;
    subtitleElement.fontWeight = '400';
    subtitleElement.textAlign = 'center';
    subtitleElement.color = '#64748B';
    subtitleElement.width = 800;
    subtitleElement.height = 60;

    return {
      type: 'title',
      name: 'Titelfolie',
      duration: 5,
      backgroundColor: '#FFFFFF',
      elements: [titleElement, subtitleElement],
      speakerText: 'Willkommen zu unserem Kurs. In diesem Kurs werden wir...',
    };
  },
};

// ============================================
// TEXT WITH IMAGE TEMPLATE
// ============================================

const textWithImageTemplate: SlideTemplate = {
  id: 'template-text-image',
  name: 'Text mit Bild',
  description: 'Eine Folie mit Text und einem Bild',
  category: 'Content',
  createSlide: () => {
    const titleElement = createTextElement('Thema', 100, 100);
    titleElement.fontSize = 28;
    titleElement.fontWeight = '600';
    titleElement.color = '#1E293B';
    titleElement.width = 600;
    titleElement.height = 60;

    const textElement = createTextElement('Hier steht der Inhaltstext. Erklären Sie Ihr Thema mit klarem und präzisen Text.', 100, 200);
    textElement.fontSize = 18;
    textElement.fontWeight = '400';
    textElement.color = '#475569';
    textElement.lineHeight = 1.6;
    textElement.width = 600;
    textElement.height = 300;

    const imageElement = createImageElement(750, 150);
    imageElement.width = 400;
    imageElement.height = 300;

    return {
      type: 'content',
      name: 'Text mit Bild',
      duration: 10,
      backgroundColor: '#FFFFFF',
      elements: [titleElement, textElement, imageElement],
      speakerText: 'Wie Sie sehen können, zeigt diese Folie...',
    };
  },
};

// ============================================
// TWO COLUMNS TEMPLATE
// ============================================

const twoColumnsTemplate: SlideTemplate = {
  id: 'template-two-columns',
  name: 'Zwei Spalten',
  description: 'Eine Folie mit zwei Textspalten',
  category: 'Content',
  createSlide: () => {
    const titleElement = createTextElement('Thema', 100, 100);
    titleElement.fontSize = 28;
    titleElement.fontWeight = '600';
    titleElement.color = '#1E293B';
    titleElement.width = 800;
    titleElement.height = 60;
    titleElement.x = 100;

    const leftTextElement = createTextElement('Linke Spalte: Hier steht der erste Teil des Inhalts.', 100, 200);
    leftTextElement.fontSize = 16;
    leftTextElement.fontWeight = '400';
    leftTextElement.color = '#475569';
    leftTextElement.lineHeight = 1.6;
    leftTextElement.width = 350;
    leftTextElement.height = 400;

    const rightTextElement = createTextElement('Rechte Spalte: Hier steht der zweite Teil des Inhalts.', 550, 200);
    rightTextElement.fontSize = 16;
    rightTextElement.fontWeight = '400';
    rightTextElement.color = '#475569';
    rightTextElement.lineHeight = 1.6;
    rightTextElement.width = 350;
    rightTextElement.height = 400;

    return {
      type: 'content',
      name: 'Zwei Spalten',
      duration: 10,
      backgroundColor: '#F8FAFC',
      elements: [titleElement, leftTextElement, rightTextElement],
      speakerText: 'Auf dieser Folie sehen Sie zwei Spalten mit Informationen.',
    };
  },
};

// ============================================
// CHAPTER START TEMPLATE
// ============================================

const chapterStartTemplate: SlideTemplate = {
  id: 'template-chapter-start',
  name: 'Kapitelstart',
  description: 'Eine Folie für den Beginn eines neuen Kapitels',
  category: 'Starter',
  createSlide: () => {
    const chapterElement = createTextElement('Kapitel 1', 400, 200);
    chapterElement.fontSize = 42;
    chapterElement.fontWeight = '700';
    chapterElement.textAlign = 'center';
    chapterElement.color = '#1E293B';
    chapterElement.width = 800;
    chapterElement.height = 80;

    const titleElement = createTextElement('Kapitelthema', 400, 320);
    titleElement.fontSize = 24;
    titleElement.fontWeight = '600';
    titleElement.textAlign = 'center';
    titleElement.color = '#475569';
    titleElement.width = 800;
    titleElement.height = 60;

    const descriptionElement = createTextElement('In diesem Kapitel werden wir uns mit... beschäftigen.', 200, 420);
    descriptionElement.fontSize = 18;
    descriptionElement.fontWeight = '400';
    descriptionElement.textAlign = 'center';
    descriptionElement.color = '#64748B';
    descriptionElement.lineHeight = 1.6;
    descriptionElement.width = 800;
    descriptionElement.height = 200;

    return {
      type: 'content',
      name: 'Kapitelstart',
      duration: 5,
      backgroundColor: '#FFFFFF',
      elements: [chapterElement, titleElement, descriptionElement],
      speakerText: 'Willkommen zu Kapitel 1. In diesem Kapitel...',
    };
  },
};

// ============================================
// INSTRUCTION SLIDE TEMPLATE
// ============================================

const instructionSlideTemplate: SlideTemplate = {
  id: 'template-instruction',
  name: 'Bedienungsfolie',
  description: 'Eine Folie mit Bedienungshinweisen',
  category: 'Starter',
  createSlide: () => {
    const titleElement = createTextElement('Bedienungshinweise', 400, 100);
    titleElement.fontSize = 36;
    titleElement.fontWeight = '700';
    titleElement.textAlign = 'center';
    titleElement.color = '#1E293B';
    titleElement.width = 800;
    titleElement.height = 80;

    const textElement = createTextElement(
      'Navigieren Sie durch den Kurs mit den Pfeiltasten oder durch Klicken auf die Navigationsbuttons. Sie können jederzeit pausieren und weitermachen.',
      200, 250
    );
    textElement.fontSize = 20;
    textElement.fontWeight = '400';
    textElement.textAlign = 'center';
    textElement.color = '#475569';
    textElement.lineHeight = 1.6;
    textElement.width = 800;
    textElement.height = 200;

    const buttonElement = createButtonElement(550, 500);
    buttonElement.label = 'Kurs starten';
    buttonElement.width = 200;
    buttonElement.height = 60;
    buttonElement.fontSize = 18;
    buttonElement.bgColor = '#4F46E5';
    buttonElement.hoverColor = '#4338CA';
    buttonElement.action = { type: 'next' };

    return {
      type: 'instruction',
      name: 'Bedienungsfolie',
      duration: 5,
      backgroundColor: '#F8FAFC',
      elements: [titleElement, textElement, buttonElement],
      speakerText: 'Diese Folie erklärt die Bedienung des Kurses.',
    };
  },
};

// ============================================
// CHAPTER OVERVIEW TEMPLATE
// ============================================

const chapterOverviewTemplate: SlideTemplate = {
  id: 'template-chapter-overview',
  name: 'Kapitelübersicht',
  description: 'Eine automatische Kapitelübersichtsfolie',
  category: 'Starter',
  createSlide: () => {
    const titleElement = createTextElement('Kapitelübersicht', 400, 100);
    titleElement.fontSize = 36;
    titleElement.fontWeight = '700';
    titleElement.textAlign = 'center';
    titleElement.color = '#1E293B';
    titleElement.width = 800;
    titleElement.height = 80;

    return {
      type: 'chapterOverview',
      name: 'Kapitelübersicht',
      duration: 5,
      backgroundColor: '#F8FAFC',
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
      speakerText: 'Wählen Sie ein Kapitel aus, um zu beginnen.',
    };
  },
};

// ============================================
// QUIZ TEMPLATE
// ============================================

const quizTemplate: SlideTemplate = {
  id: 'template-quiz',
  name: 'Quiz-Folie',
  description: 'Eine Folie mit einer Quizfrage',
  category: 'Interactive',
  createSlide: () => {
    const titleElement = createTextElement('Quizfrage', 100, 100);
    titleElement.fontSize = 28;
    titleElement.fontWeight = '600';
    titleElement.color = '#1E293B';
    titleElement.width = 800;
    titleElement.height = 60;

    const questionElement = createTextElement('Was ist die richtige Antwort?', 100, 200);
    questionElement.fontSize = 20;
    questionElement.fontWeight = '400';
    questionElement.color = '#475569';
    questionElement.width = 800;
    questionElement.height = 60;

    const option1Element = createButtonElement(100, 300);
    option1Element.label = 'Antwort A';
    option1Element.width = 300;
    option1Element.height = 50;
    option1Element.bgColor = '#E5E7EB';
    option1Element.color = '#1E293B';
    option1Element.hoverColor = '#D1D5DB';
    option1Element.action = { type: 'next' };

    const option2Element = createButtonElement(100, 380);
    option2Element.label = 'Antwort B';
    option2Element.width = 300;
    option2Element.height = 50;
    option2Element.bgColor = '#E5E7EB';
    option2Element.color = '#1E293B';
    option2Element.hoverColor = '#D1D5DB';
    option2Element.action = { type: 'next' };

    const option3Element = createButtonElement(100, 460);
    option3Element.label = 'Antwort C';
    option3Element.width = 300;
    option3Element.height = 50;
    option3Element.bgColor = '#E5E7EB';
    option3Element.color = '#1E293B';
    option3Element.hoverColor = '#D1D5DB';
    option3Element.action = { type: 'next' };

    return {
      type: 'content',
      name: 'Quiz-Folie',
      duration: 15,
      backgroundColor: '#FFFFFF',
      elements: [titleElement, questionElement, option1Element, option2Element, option3Element],
      speakerText: 'Wählen Sie die richtige Antwort aus.',
    };
  },
};

// ============================================
// TEMPLATES ARRAY
// ============================================

export const templates: SlideTemplate[] = [
  titleSlideTemplate,
  instructionSlideTemplate,
  chapterOverviewTemplate,
  chapterStartTemplate,
  textWithImageTemplate,
  twoColumnsTemplate,
  quizTemplate,
];

// ============================================
// TEMPLATE UTILITIES
// ============================================

export function getTemplateById(templateId: string): SlideTemplate | undefined {
  return templates.find((t) => t.id === templateId);
}

export function createSlideFromTemplate(templateId: string): Partial<Slide> | undefined {
  const template = getTemplateById(templateId);
  return template?.createSlide();
}

export function getTemplatesByCategory(category: string): SlideTemplate[] {
  return templates.filter((t) => t.category === category);
}

// ============================================
// EXPORT
// ============================================

export default templates;
