// ============================================
// NEWLMS - Toolbar Component
// ============================================

import React from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import {
  FiType,
  FiImage,
  FiSquare,
  FiCircle,
  FiMousePointer,
  FiPlus,
  FiLayers,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiDistributeHorizontal,
} from 'react-icons/fi';
import { createTextElement, createImageElement, createRectangleElement, createCircleElement, createButtonElement } from '../../models/course';

export const Toolbar: React.FC = () => {
  const {
    editorState,
    setTool,
    addElement,
    addSlide,
    addChapter,
  } = useCourseStore();

  const tools = [
    { type: 'select' as const, icon: FiMousePointer, label: 'Auswählen' },
    { type: 'text' as const, icon: FiType, label: 'Text' },
    { type: 'image' as const, icon: FiImage, label: 'Bild' },
    { type: 'rectangle' as const, icon: FiSquare, label: 'Rechteck' },
    { type: 'circle' as const, icon: FiCircle, label: 'Kreis' },
    { type: 'button' as const, icon: FiSquare, label: 'Button' },
  ];

  const handleToolSelect = (toolType: any) => {
    setTool(toolType);
  };

  const handleToolClick = (toolType: any) => {
    setTool(toolType);
    
    // For creation tools, switch back to select after creating
    if (toolType !== 'select') {
      // Create element on canvas click is handled separately
    }
  };

  const handleAddSlide = () => {
    addSlide();
  };

  const handleAddChapter = () => {
    addChapter();
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    const { selectedElementIds, course, editorState: state } = useCourseStore.getState();
    if (!course || !state.currentSlideId || selectedElementIds.length === 0) return;

    const slide = course.slides.find(s => s.id === state.currentSlideId);
    if (!slide) return;

    const selectedElements = slide.elements.filter(e => selectedElementIds.includes(e.id));
    if (selectedElements.length === 0) return;

    // Find the center X position of all selected elements
    const centerX = selectedElements.reduce((sum, e) => sum + e.x + e.width / 2, 0) / selectedElements.length;

    // Calculate new positions based on alignment
    selectedElements.forEach((element) => {
      let newX = element.x;
      
      switch (alignment) {
        case 'left':
          newX = element.x; // Already aligned
          break;
        case 'center':
          newX = centerX - element.width / 2;
          break;
        case 'right':
          newX = centerX + element.width / 2 - element.width;
          break;
        case 'justify':
          // Distribute evenly
          break;
      }

      useCourseStore.getState().updateElement(element.id, { x: newX });
    });
  };

  return (
    <div className="flex flex-col h-full p-1">
      {/* Tool Selection */}
      <div className="space-y-1 mb-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = editorState.selectedTool === tool.type;
          
          return (
            <button
              key={tool.type}
              onClick={() => handleToolClick(tool.type)}
              className={`w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${
                isSelected ? 'bg-blue-500 text-white' : 'text-gray-600'
              }`}
              title={tool.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2" />

      {/* Slide Actions */}
      <div className="space-y-1">
        <button
          onClick={handleAddSlide}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          title="Neue Folie"
        >
          <FiPlus size={20} />
        </button>

        <button
          onClick={handleAddChapter}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          title="Neues Kapitel"
        >
          <FiLayers size={20} />
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2" />

      {/* Alignment Tools */}
      <div className="space-y-1">
        <button
          onClick={() => handleAlign('left')}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          title="Links ausrichten"
        >
          <FiAlignLeft size={18} />
        </button>
        <button
          onClick={() => handleAlign('center')}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          title="Zentriert ausrichten"
        >
          <FiAlignCenter size={18} />
        </button>
        <button
          onClick={() => handleAlign('right')}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          title="Rechts ausrichten"
        >
          <FiAlignRight size={18} />
        </button>
        <button
          onClick={() => handleAlign('justify')}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          title="Verteilen"
        >
          <FiDistributeHorizontal size={18} />
        </button>
      </div>
    </div>
  );
};
