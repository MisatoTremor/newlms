// ============================================
// NEWLMS - Editor Layout
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Timeline } from './Timeline';
import { SlideOverview } from './SlideOverview';
import { TopBar } from './TopBar';
import { Player } from '../Player/Player';
import type { ToolType } from '../../types';

// ============================================
// STYLES
// ============================================

const EditorLayout: React.FC = () => {
  const {
    course,
    editorState,
    initialize,
    saveCourse,
    setMode,
    setTool,
    setZoom,
    setPan,
    setTimelineOpen,
    setTimelineHeight,
    setupStorageListener,
  } = useCourseStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await initialize();
      setupStorageListener();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (isInitialized && course) {
      const timer = setTimeout(() => {
        saveCourse();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [course, isInitialized]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts during text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          useCourseStore.getState().undo();
        }
        if (e.key === 'y') {
          e.preventDefault();
          useCourseStore.getState().redo();
        }
        if (e.key === 's') {
          e.preventDefault();
          saveCourse();
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedElementIds, deleteElements } = useCourseStore.getState();
        if (selectedElementIds.length > 0) {
          deleteElements(selectedElementIds);
        }
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        useCourseStore.getState().deselectAll();
        setTool('select');
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolShortcuts: Record<string, ToolType> = {
          '1': 'select',
          '2': 'text',
          '3': 'image',
          '4': 'rectangle',
          '5': 'circle',
          '6': 'button',
        };
        if (toolShortcuts[e.key]) {
          setTool(toolShortcuts[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Adjust zoom to fit on small screens
      if (window.innerWidth < 1024) {
        setZoom(Math.min(1, window.innerWidth / 1024));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const currentZoom = editorState.zoom;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, currentZoom * zoomFactor));
      setZoom(newZoom);
    }
  };

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Lädt...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Kein Kurs gefunden</div>
      </div>
    );
  }

  // Check if in player mode
  if (editorState.mode === 'play') {
    return <Player />;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gray-100 overflow-hidden"
      onWheel={handleWheel}
    >
      {/* Top Bar */}
      <TopBar />

      <div className="flex h-[calc(100vh-48px)]">
        {/* Left Sidebar - Toolbar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <Toolbar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-gray-200">
            <Canvas />
          </div>

          {/* Timeline */}
          {editorState.isTimelineOpen && (
            <div
              className="border-t border-gray-300 bg-white"
              style={{ height: `${editorState.timelineHeight}px` }}
            >
              <Timeline />
            </div>
          )}

          {/* Slide Overview */}
          <div className="border-t border-gray-300 bg-white h-48">
            <SlideOverview />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
