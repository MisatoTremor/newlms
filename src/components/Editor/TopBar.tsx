// ============================================
// NEWLMS - Top Bar Component
// ============================================

import React, { useState, useEffect } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { FiSave, FiArrowLeft, FiArrowRight, FiPlay, FiSquare, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { MdOutlineTimeline } from 'react-icons/md';

export const TopBar: React.FC = () => {
  const {
    course,
    editorState,
    saveCourse,
    saveStatus,
    undo,
    redo,
    canUndo,
    canRedo,
    setMode,
    setTimelineOpen,
    setTimelineHeight,
    setCurrentTime,
    setIsPlaying,
  } = useCourseStore();

  const [timeDisplay, setTimeDisplay] = useState('00:00');
  const [isPlaying, setIsPlayingState] = useState(false);

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      if (editorState.currentSlideId && course) {
        const slide = course.slides.find(s => s.id === editorState.currentSlideId);
        if (slide) {
          const totalSeconds = typeof slide.duration === 'number' ? slide.duration : 10;
          const currentSeconds = editorState.currentTime;
          
          const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          };
          
          setTimeDisplay(`${formatTime(currentSeconds)} / ${formatTime(totalSeconds)}`);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [editorState.currentTime, editorState.currentSlideId, course]);

  // Sync playing state
  useEffect(() => {
    setIsPlayingState(editorState.isPlaying);
  }, [editorState.isPlaying]);

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    setIsPlaying(newPlayingState);
    
    if (newPlayingState) {
      // Start playback
    } else {
      // Pause playback
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePreview = () => {
    setMode('play');
  };

  const handleLoadExample = async () => {
    if (course && course.slides.length > 0) {
      if (window.confirm('Möchten Sie den aktuellen Kurs verwerfen und den Beispielkurs laden?')) {
        await useCourseStore.getState().loadExampleCourse();
      }
    } else {
      await useCourseStore.getState().loadExampleCourse();
    }
  };

  const handleTimelineToggle = () => {
    setTimelineOpen(!editorState.isTimelineOpen);
  };

  const handleZoomIn = () => {
    useCourseStore.getState().setZoom(Math.min(3, editorState.zoom * 1.2));
  };

  const handleZoomOut = () => {
    useCourseStore.getState().setZoom(Math.max(0.1, editorState.zoom / 1.2));
  };

  const handleZoomReset = () => {
    useCourseStore.getState().setZoom(1);
    useCourseStore.getState().setPan(0, 0);
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Speichert...';
      case 'saved':
        return 'Gespeichert';
      case 'error':
        return 'Fehler beim Speichern';
      default:
        return 'Änderungen vorhanden';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-500';
      case 'saved':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
      <div className="flex items-center flex-1 overflow-hidden">
        {/* Left Section - Course Info */}
        <div className="flex items-center space-x-4 min-w-0">
          <input
            type="text"
            value={course?.name || ''}
            onChange={(e) => useCourseStore.getState().setCourseName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none text-gray-800 w-48 truncate"
            placeholder="Kursname"
          />
          <span className={`text-sm ${getSaveStatusColor()}`}>
            {getSaveStatusText()}
          </span>
        </div>

        {/* Center Section - Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed ${
              canUndo() ? 'text-gray-600' : 'text-gray-300'
            }`}
            title="Rückgängig (Ctrl+Z)"
          >
            <FiArrowLeft size={18} />
          </button>
          
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed ${
              canRedo() ? 'text-gray-600' : 'text-gray-300'
            }`}
            title="Wiederholen (Ctrl+Y)"
          >
            <FiArrowRight size={18} />
          </button>

          <button
            onClick={handlePlayPause}
            className={`p-2 rounded hover:bg-gray-100 ${isPlaying ? 'text-blue-500' : 'text-gray-600'}`}
            title="Abspielen/Pausieren"
          >
            {isPlaying ? <FiSquare size={18} /> : <FiPlay size={18} />}
          </button>

          <button
            onClick={handleStop}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Stoppen"
          >
            <FiSquare size={18} />
          </button>

          <span className="text-sm text-gray-500 px-2">{timeDisplay}</span>

          <button
            onClick={handleTimelineToggle}
            className={`p-2 rounded hover:bg-gray-100 ${editorState.isTimelineOpen ? 'text-blue-500' : 'text-gray-600'}`}
            title="Timeline ein-/ausblenden"
          >
            <MdOutlineTimeline size={18} />
          </button>

          <button
            onClick={handlePreview}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Vorschau (Space)"
          >
            <FiEye size={18} />
          </button>
        </div>

        {/* Right Section - Zoom */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-sm"
            title="Verkleinern"
          >
            - 
          </button>
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(editorState.zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-sm"
            title="Vergößern"
          >
            + 
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-xs"
            title="Zoom zurücksetzen"
          >
            1:1
          </button>
          <button
            onClick={handleLoadExample}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            title="Beispielkurs laden"
          >
            Beispiel laden
          </button>
        </div>
      </div>
    </div>
  );
};
