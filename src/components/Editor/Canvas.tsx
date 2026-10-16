// ============================================
// NEWLMS - Canvas Component
// ============================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { renderElement } from './ElementRenderer';
import { createTextElement, createImageElement, createRectangleElement, createCircleElement, createButtonElement } from '../../models/course';
import type { Point, SlideElement, ID } from '../../types';

// ============================================
// CONSTANTS
// ============================================

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const CANVAS_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

// ============================================
// CANVAS COMPONENT
// ============================================

export const Canvas: React.FC = () => {
  const {
    course,
    editorState,
    setCurrentSlide,
    selectElement,
    selectElements,
    deselectAll,
    hoverElement,
    setTool,
    addElement,
    updateElement,
    deleteElements,
    startDrag,
    endDrag,
    startResize,
    endResize,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    setPan,
    getCurrentSlide,
    getSelectedElements,
  } = useCourseStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate canvas transform
  const getCanvasTransform = useCallback(() => {
    const slide = getCurrentSlide();
    if (!slide) return { x: 0, y: 0, scale: 1 };

    // Calculate available space
    const availableWidth = containerSize.width;
    const availableHeight = containerSize.height;

    // Fit canvas to container while maintaining aspect ratio
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (availableWidth / availableHeight > CANVAS_RATIO) {
      // Container is wider than canvas ratio
      scale = availableHeight / CANVAS_HEIGHT;
      offsetX = (availableWidth - CANVAS_WIDTH * scale) / 2;
    } else {
      // Container is taller than canvas ratio
      scale = availableWidth / CANVAS_WIDTH;
      offsetY = (availableHeight - CANVAS_HEIGHT * scale) / 2;
    }

    // Apply editor zoom
    const finalScale = scale * editorState.zoom;
    const panX = editorState.panX * finalScale;
    const panY = editorState.panY * finalScale;

    return {
      x: offsetX + panX,
      y: offsetY + panY,
      scale: finalScale,
    };
  }, [containerSize, editorState.zoom, editorState.panX, editorState.panY, getCurrentSlide]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const transform = getCanvasTransform();
    const canvasX = (clickX - transform.x) / transform.scale;
    const canvasY = (clickY - transform.y) / transform.scale;

    // Check if click is on an element
    const slide = getCurrentSlide();
    if (slide) {
      const clickedElement = findElementAtPosition(slide.elements, canvasX, canvasY);
      
      if (clickedElement) {
        // Handle element click based on current tool
        if (editorState.selectedTool === 'select') {
          const multiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          selectElement(clickedElement.id, multiSelect);
        } else {
          // Create new element
          let newElement: any = null;
          switch (editorState.selectedTool) {
            case 'text':
              newElement = createTextElement('Neuer Text', canvasX, canvasY);
              break;
            case 'image':
              newElement = createImageElement(canvasX, canvasY);
              break;
            case 'rectangle':
              newElement = createRectangleElement(canvasX, canvasY);
              break;
            case 'circle':
              newElement = createCircleElement(canvasX, canvasY);
              break;
            case 'button':
              newElement = createButtonElement(canvasX, canvasY);
              break;
          }
          
          if (newElement) {
            addElement(newElement);
            setTool('select');
          }
        }
        return;
      }
    }

    // Click on empty space
    if (editorState.selectedTool === 'select') {
      deselectAll();
    }
  }, [getCanvasTransform, editorState.selectedTool, getCurrentSlide, selectElement, addElement, setTool, deselectAll]);

  // Handle mouse down for drag and selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const transform = getCanvasTransform();
    const canvasX = (startX - transform.x) / transform.scale;
    const canvasY = (startY - transform.y) / transform.scale;

    const slide = getCurrentSlide();
    if (!slide) return;

    // Check if mouse down is on an element
    const clickedElement = findElementAtPosition(slide.elements, canvasX, canvasY);
    const selectedElements = getSelectedElements();

    if (clickedElement) {
      // Check if we're clicking on a resize handle
      if (editorState.selectedTool === 'select' && selectedElements.length === 1 && selectedElements[0].id === clickedElement.id) {
        const handle = findResizeHandle(clickedElement, canvasX, canvasY);
        if (handle) {
          startResize(clickedElement.id, handle, {
            x: canvasX,
            y: canvasY,
            width: clickedElement.width,
            height: clickedElement.height,
          });
          return;
        }
      }

      // Start drag
      if (editorState.selectedTool === 'select') {
        const elementIds = clickedElement.id === selectedElements[0]?.id
          ? [clickedElement.id]
          : [clickedElement.id];
        
        startDrag(elementIds, { x: canvasX, y: canvasY });
      }
      
      setDragStart({ x: startX, y: startY });
      
    } else {
      // Start selection box
      if (editorState.selectedTool === 'select') {
        startSelectionBox({ x: canvasX, y: canvasY });
      }
      
      // Start canvas pan
      setIsDraggingCanvas(true);
      setDragStart({ x: startX, y: startY });
    }
  }, [getCanvasTransform, editorState.selectedTool, getCurrentSlide, getSelectedElements, startResize, startDrag, startSelectionBox]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !dragStart) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const transform = getCanvasTransform();
    const canvasX = (currentX - transform.x) / transform.scale;
    const canvasY = (currentY - transform.y) / transform.scale;

    const deltaX = (currentX - dragStart.x) / transform.scale;
    const deltaY = (currentY - dragStart.y) / transform.scale;

    // Update hover element
    const slide = getCurrentSlide();
    if (slide) {
      const hoveredElement = findElementAtPosition(slide.elements, canvasX, canvasY);
      hoverElement(hoveredElement?.id || null);
    }

    // Handle canvas pan
    if (isDraggingCanvas) {
      setPan(editorState.panX + deltaX / editorState.zoom, editorState.panY + deltaY / editorState.zoom);
      setDragStart({ x: currentX, y: currentY });
      return;
    }

    // Handle selection box
    if (editorState.selectionBox) {
      updateSelectionBox({ x: canvasX, y: canvasY });
      return;
    }

    // Handle drag
    if (editorState.isDragging && editorState.dragStart) {
      const { dragElements, dragStart: dragStartState } = editorState;
      
      const startCanvasX = (dragStartState.x - transform.x) / transform.scale;
      const startCanvasY = (dragStartState.y - transform.y) / transform.scale;
      
      dragElements.forEach((elementId) => {
        const element = slide?.elements.find(e => e.id === elementId);
        if (element) {
          const newX = element.x + (canvasX - startCanvasX);
          const newY = element.y + (canvasY - startCanvasY);
          updateElement(elementId, { x: newX, y: newY });
        }
      });
      
      return;
    }

    // Handle resize
    if (editorState.isResizing && editorState.resizeStart && editorState.resizeElementId) {
      const { resizeElementId, resizeStart, resizeHandle } = editorState;
      const element = slide?.elements.find(e => e.id === resizeElementId);
      
      if (element && resizeStart) {
        const { x: startX, y: startY, width: startWidth, height: startHeight } = resizeStart;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = element.x;
        let newY = element.y;

        switch (resizeHandle) {
          case 'top-left':
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
            newX = startX + deltaX;
            newY = startY + deltaY;
            break;
          case 'top':
            newHeight = startHeight - deltaY;
            newY = startY + deltaY;
            break;
          case 'top-right':
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            newY = startY + deltaY;
            break;
          case 'right':
            newWidth = startWidth + deltaX;
            break;
          case 'bottom-right':
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'bottom':
            newHeight = startHeight + deltaY;
            break;
          case 'bottom-left':
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
            newX = startX + deltaX;
            break;
          case 'left':
            newWidth = startWidth - deltaX;
            newX = startX + deltaX;
            break;
        }

        // Maintain minimum size
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

        updateElement(resizeElementId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
      
      return;
    }
  }, [
    dragStart,
    isDraggingCanvas,
    getCanvasTransform,
    editorState,
    setPan,
    hoverElement,
    getCurrentSlide,
    updateSelectionBox,
    updateElement,
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
    }
    
    if (editorState.isDragging) {
      endDrag();
    }
    
    if (editorState.isResizing) {
      endResize();
    }
    
    if (editorState.selectionBox) {
      endSelectionBox();
    }
    
    setDragStart(null);
  }, [isDraggingCanvas, editorState, endDrag, endResize, endSelectionBox]);

  // Find element at position
  const findElementAtPosition = (elements: SlideElement[], x: number, y: number): SlideElement | null => {
    // Sort by z-index (descending) to get topmost element
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    
    for (const element of sortedElements) {
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        return element;
      }
    }
    return null;
  };

  // Find resize handle
  const findResizeHandle = (element: SlideElement, x: number, y: number): string | null => {
    const HANDLE_SIZE = 8;
    const HANDLE_OFFSET = -HANDLE_SIZE / 2;

    const handles = [
      { name: 'top-left', x: element.x + HANDLE_OFFSET, y: element.y + HANDLE_OFFSET },
      { name: 'top', x: element.x + element.width / 2 + HANDLE_OFFSET, y: element.y + HANDLE_OFFSET },
      { name: 'top-right', x: element.x + element.width + HANDLE_OFFSET, y: element.y + HANDLE_OFFSET },
      { name: 'right', x: element.x + element.width + HANDLE_OFFSET, y: element.y + element.height / 2 + HANDLE_OFFSET },
      { name: 'bottom-right', x: element.x + element.width + HANDLE_OFFSET, y: element.y + element.height + HANDLE_OFFSET },
      { name: 'bottom', x: element.x + element.width / 2 + HANDLE_OFFSET, y: element.y + element.height + HANDLE_OFFSET },
      { name: 'bottom-left', x: element.x + HANDLE_OFFSET, y: element.y + element.height + HANDLE_OFFSET },
      { name: 'left', x: element.x + HANDLE_OFFSET, y: element.y + element.height / 2 + HANDLE_OFFSET },
    ];

    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
      );
      if (distance <= HANDLE_SIZE) {
        return handle.name;
      }
    }

    return null;
  };

  // Render resize handles
  const renderResizeHandles = (element: SlideElement) => {
    const HANDLE_SIZE = 8;
    const HANDLE_OFFSET = -HANDLE_SIZE / 2;
    const selectedElements = getSelectedElements();
    const isSelected = selectedElements.some(e => e.id === element.id);

    if (!isSelected || selectedElements.length > 1) return null;

    const handles = [
      { name: 'top-left', x: element.x + HANDLE_OFFSET, y: element.y + HANDLE_OFFSET, cursor: 'nwse-resize' },
      { name: 'top', x: element.x + element.width / 2 + HANDLE_OFFSET, y: element.y + HANDLE_OFFSET, cursor: 'ns-resize' },
      { name: 'top-right', x: element.x + element.width + HANDLE_OFFSET, y: element.y + HANDLE_OFFSET, cursor: 'nesw-resize' },
      { name: 'right', x: element.x + element.width + HANDLE_OFFSET, y: element.y + element.height / 2 + HANDLE_OFFSET, cursor: 'ew-resize' },
      { name: 'bottom-right', x: element.x + element.width + HANDLE_OFFSET, y: element.y + element.height + HANDLE_OFFSET, cursor: 'nwse-resize' },
      { name: 'bottom', x: element.x + element.width / 2 + HANDLE_OFFSET, y: element.y + element.height + HANDLE_OFFSET, cursor: 'ns-resize' },
      { name: 'bottom-left', x: element.x + HANDLE_OFFSET, y: element.y + element.height + HANDLE_OFFSET, cursor: 'nesw-resize' },
      { name: 'left', x: element.x + HANDLE_OFFSET, y: element.y + element.height / 2 + HANDLE_OFFSET, cursor: 'ew-resize' },
    ];

    return handles.map((handle) => (
      <div
        key={handle.name}
        className="absolute w-2 h-2 bg-white border border-blue-500 rounded-sm"
        style={{
          left: `${handle.x}px`,
          top: `${handle.y}px`,
          cursor: handle.cursor,
          transform: 'translate(-50%, -50%)',
        }}
      />
    ));
  };

  // Render selection border
  const renderSelectionBorder = (element: SlideElement) => {
    const selectedElements = getSelectedElements();
    const isSelected = selectedElements.some(e => e.id === element.id);

    if (!isSelected) return null;

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
        style={{
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width}px`,
          height: `${element.height}px`,
          borderRadius: element.type === 'circle' ? '50%' : undefined,
        }}
      />
    );
  };

  // Render selection box
  const renderSelectionBox = () => {
    if (!editorState.selectionBox) return null;

    const { startX, startY, endX, endY } = editorState.selectionBox;
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  };

  // Render grid
  const renderGrid = () => {
    const transform = getCanvasTransform();
    const gridSize = 20 * transform.scale;

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />
    );
  };

  // Get background for current slide
  const getBackground = () => {
    const slide = getCurrentSlide();
    if (!slide) return '#FFFFFF';
    
    if (slide.backgroundImage) {
      return `url(${slide.backgroundImage})`;
    }
    return slide.backgroundColor || '#FFFFFF';
  };

  // Calculate canvas size in view
  const canvasWidth = CANVAS_WIDTH * (containerSize.width / CANVAS_WIDTH);
  const canvasHeight = CANVAS_HEIGHT * (containerSize.height / CANVAS_HEIGHT);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Canvas Container */}
      <div
        className="relative"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `translate(${getCanvasTransform().x}px, ${getCanvasTransform().y}px) scale(${getCanvasTransform().scale})`,
          transformOrigin: '0 0',
          backgroundColor: getBackground(),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Grid */}
        {renderGrid()}

        {/* Slide Content */}
        {course && editorState.currentSlideId && (
          <>
            {getCurrentSlide()?.elements.map((element) => (
              <div key={element.id} className="absolute">
                {renderElement(element, {
                  isSelected: getSelectedElements().some(e => e.id === element.id),
                  isHovered: editorState.hoverElementId === element.id,
                })}
                {renderSelectionBorder(element)}
                {renderResizeHandles(element)}
              </div>
            ))}
          </>
        )}

        {/* Selection Box */}
        {renderSelectionBox()}
      </div>
    </div>
  );
};

// ============================================
// EXPORT
// ============================================

export default Canvas;
