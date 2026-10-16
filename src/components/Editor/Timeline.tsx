// ============================================
// NEWLMS - Timeline Component
// ============================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { FiPlay, FiPause, FiSquare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export const Timeline: React.FC = () => {
  const {
    course,
    editorState,
    getCurrentSlide,
    getSelectedElements,
    updateElement,
    selectElement,
    setCurrentTime,
    setIsPlaying,
    startScrubbing,
    updateScrubbing,
    endScrubbing,
    setTimelineHeight,
  } = useCourseStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(1000);
  const [zoomLevel, setZoomLevel] = useState(1);

  const slide = getCurrentSlide();
  const elements = slide?.elements || [];

  // Calculate timeline dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth - 100);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Get max duration
  const getMaxDuration = useCallback(() => {
    if (!slide) return 10;
    if (slide.duration === 'auto') return 10;
    if (typeof slide.duration === 'number') return slide.duration;
    
    // Find max end time from elements
    let maxTime = 10;
    for (const element of elements) {
      if (element.timing.visibleUntil === 'end') {
        continue;
      }
      const endTime = element.timing.startTime + 
        (element.timing.enterAnimation.duration || 0) +
        (element.timing.exitAnimation.duration || 0);
      maxTime = Math.max(maxTime, endTime);
    }
    return maxTime;
  }, [slide, elements]);

  const maxDuration = getMaxDuration();

  // Convert time to pixels
  const timeToPixels = useCallback((time: number) => {
    return (time / maxDuration) * timelineWidth * zoomLevel;
  }, [maxDuration, timelineWidth, zoomLevel]);

  // Convert pixels to time
  const pixelsToTime = useCallback((pixels: number) => {
    return (pixels / (timelineWidth * zoomLevel)) * maxDuration;
  }, [maxDuration, timelineWidth, zoomLevel]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    const newPlayingState = !editorState.isPlaying;
    setIsPlaying(newPlayingState);
    
    if (newPlayingState) {
      // Start playback timer
      const startTime = Date.now();
      const animate = () => {
        if (!editorState.isPlaying) return;
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentTime(editorState.currentTime + elapsed);
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [editorState.isPlaying, editorState.currentTime, setIsPlaying, setCurrentTime]);

  // Handle stop
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [setIsPlaying, setCurrentTime]);

  // Handle playhead drag
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPlayhead(true);
    
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 50; // Subtract header width
      const newTime = pixelsToTime(x);
      startScrubbing(newTime, x);
    }
  }, [pixelsToTime, startScrubbing]);

  const handlePlayheadMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPlayhead || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const newTime = pixelsToTime(x);
    updateScrubbing(x, maxDuration);
    setCurrentTime(newTime);
  }, [isDraggingPlayhead, pixelsToTime, maxDuration, updateScrubbing, setCurrentTime]);

  const handlePlayheadMouseUp = useCallback(() => {
    if (isDraggingPlayhead) {
      setIsDraggingPlayhead(false);
      endScrubbing();
    }
  }, [isDraggingPlayhead, endScrubbing]);

  // Add event listeners for playhead drag
  useEffect(() => {
    if (isDraggingPlayhead) {
      document.addEventListener('mousemove', handlePlayheadMouseMove);
      document.addEventListener('mouseup', handlePlayheadMouseUp);
    } else {
      document.removeEventListener('mousemove', handlePlayheadMouseMove);
      document.removeEventListener('mouseup', handlePlayheadMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handlePlayheadMouseMove);
      document.removeEventListener('mouseup', handlePlayheadMouseUp);
    };
  }, [isDraggingPlayhead, handlePlayheadMouseMove, handlePlayheadMouseUp]);

  // Handle timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const newTime = pixelsToTime(x);
    setCurrentTime(newTime);
  }, [pixelsToTime, setCurrentTime]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  // Render element bar
  const renderElementBar = (element: any) => {
    const startX = timeToPixels(element.timing.startTime);
    
    // Calculate end time
    let endTime = element.timing.visibleUntil === 'end' 
      ? maxDuration 
      : element.timing.visibleUntil;
    
    const endX = timeToPixels(endTime);
    const width = endX - startX;

    // Check if element is selected
    const isSelected = getSelectedElements().some(e => e.id === element.id);

    return (
      <div
        key={element.id}
        className={`absolute h-6 rounded cursor-pointer transition-all ${
          isSelected ? 'bg-blue-500' : 'bg-gray-400 hover:bg-gray-500'
        }`}
        style={{
          left: `${startX}px`,
          width: `${Math.max(10, width)}px`,
          top: `${elements.indexOf(element) * 28}px`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectElement(element.id, e.ctrlKey || e.metaKey || e.shiftKey);
        }}
        onDoubleClick={() => {
          // Center on this element in the timeline
        }}
      >
        {/* Element name */}
        <div className="text-xs text-white truncate px-1 pt-0.5">
          {element.name}
        </div>
        
        {/* Resize handles */}
        <div
          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            // Start resizing
          }}
        />
      </div>
    );
  };

  // Render time markers
  const renderTimeMarkers = () => {
    const markers = [];
    const interval = maxDuration > 30 ? 5 : maxDuration > 10 ? 2 : 1;
    
    for (let i = 0; i <= maxDuration; i += interval) {
      const x = timeToPixels(i);
      markers.push(
        <div
          key={i}
          className="absolute text-xs text-gray-500"
          style={{ left: `${x}px` }}
        >
          {i}
        </div>
      );
    }
    
    return markers;
  };

  // Render grid lines
  const renderGridLines = () => {
    const lines = [];
    const interval = maxDuration > 30 ? 1 : maxDuration > 10 ? 0.5 : 0.25;
    
    for (let i = 0; i <= maxDuration; i += interval) {
      const x = timeToPixels(i);
      lines.push(
        <div
          key={i}
          className="absolute border-l border-gray-200"
          style={{ left: `${x}px`, height: '100%' }}
        />
      );
    }
    
    return lines;
  };

  // Get playhead position
  const playheadPosition = timeToPixels(editorState.currentTime);

  return (
    <div className="h-full flex flex-col">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded ${editorState.isPlaying ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {editorState.isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
          </button>
          
          <button
            onClick={handleStop}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <FiSquare size={16} />
          </button>
          
          <span className="text-sm text-gray-600">
            {formatTime(editorState.currentTime)} / {formatTime(maxDuration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
          >
            −
          </button>
          <span className="text-xs text-gray-600 w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded text-xs"
          >
            1:1
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onClick={handleTimelineClick}
      >
        {/* Grid */}
        <div className="absolute inset-0">
          {renderGridLines()}
        </div>

        {/* Element Bars */}
        <div className="absolute inset-0">
          {elements.map((element) => renderElementBar(element))}
        </div>

        {/* Time Markers */}
        <div className="absolute top-0 left-50 h-6 flex items-end">
          {renderTimeMarkers()}
        </div>

        {/* Playhead */}
        <div
          ref={playheadRef}
          className="absolute top-0 left-0 w-0.5 h-full bg-red-500 cursor-ew-resize"
          style={{ left: `${50 + playheadPosition}px` }}
          onMouseDown={handlePlayheadMouseDown}
        />

        {/* Playhead Handle */}
        <div
          className="absolute w-4 h-4 bg-red-500 rounded-full -ml-2 -mt-1"
          style={{ left: `${50 + playheadPosition}px`, top: '0px' }}
          onMouseDown={handlePlayheadMouseDown}
        />
      </div>

      {/* Element List */}
      <div className="w-48 bg-gray-50 border-l border-gray-200 overflow-auto">
        <div className="p-2">
          {elements.map((element) => {
            const isSelected = getSelectedElements().some(e => e.id === element.id);
            return (
              <div
                key={element.id}
                className={`px-2 py-1 text-sm truncate cursor-pointer ${
                  isSelected ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => selectElement(element.id, true)}
                style={{ height: '28px' }}
              >
                {element.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
