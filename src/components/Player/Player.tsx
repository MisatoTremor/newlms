// ============================================
// NEWLMS - Player Component
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { FiPlay, FiPause, FiStepBackward, FiStepForward, FiVolume2, FiVolumeX, FiList, FiX } from 'react-icons/fi';
import { renderElement } from '../Editor/ElementRenderer';
import type { Slide, SlideElement } from '../../types';

// ============================================
// PLAYER COMPONENT
// ============================================

export const Player: React.FC = () => {
  const { course, editorState, setMode } = useCourseStore();
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showChapterOverview, setShowChapterOverview] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get current slide
  const currentSlide = course?.slides[currentSlideIndex];

  // Initialize
  useEffect(() => {
    if (course) {
      // Find the first content slide
      const firstContentIndex = course.slides.findIndex(
        (s) => s.type !== 'title' && s.type !== 'instruction'
      );
      if (firstContentIndex !== -1) {
        setCurrentSlideIndex(firstContentIndex);
      }
    }
  }, [course]);

  // Handle audio
  useEffect(() => {
    if (currentSlide?.audioSrc) {
      // Create audio element
      const audioEl = new Audio(currentSlide.audioSrc);
      audioEl.volume = isMuted ? 0 : 1;
      audioEl.currentTime = currentTime;
      
      if (isPlaying) {
        audioEl.play().catch((e) => {
          console.log('Audio playback failed:', e);
        });
      }
      
      audioRef.current = audioEl;
      setAudio(audioEl);

      return () => {
        audioEl.pause();
        audioEl.currentTime = 0;
      };
    } else {
      setAudio(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [currentSlide, isMuted, currentTime, isPlaying]);

  // Handle playback
  useEffect(() => {
    if (isPlaying && currentSlide) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newTime = currentTime + elapsed;
        
        // Check if we should advance to next slide
        const slideDuration = typeof currentSlide.duration === 'number' 
          ? currentSlide.duration 
          : currentSlide.audioDuration || 10;
        
        if (currentSlide.autoAdvance && newTime >= slideDuration) {
          handleNextSlide();
          return;
        }
        
        setCurrentTime(newTime);
        setAnimationFrame(requestAnimationFrame(animate));
      };
      
      setAnimationFrame(requestAnimationFrame(animate));
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    } else {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    }
  }, [isPlaying, currentTime, currentSlide]);

  // Handle audio time sync
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      const onTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      audioRef.current.addEventListener('timeupdate', onTimeUpdate);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        }
      };
    }
  }, [isPlaying]);

  // Calculate visible elements based on time
  const getVisibleElements = useCallback(() => {
    if (!currentSlide) return [];
    
    const visibleElements: (SlideElement & { progress: number })[] = [];
    
    for (const element of currentSlide.elements) {
      const startTime = element.timing.startTime;
      const endTime = element.timing.visibleUntil === 'end' 
        ? (typeof currentSlide.duration === 'number' ? currentSlide.duration : 10)
        : element.timing.visibleUntil;
      
      // Check if element is visible at current time
      if (currentTime >= startTime && currentTime <= endTime) {
        // Calculate animation progress
        let progress = 1;
        
        // Enter animation
        if (element.timing.enterAnimation.type !== 'none' && 
            currentTime < startTime + element.timing.enterAnimation.duration) {
          progress = (currentTime - startTime) / element.timing.enterAnimation.duration;
        }
        
        // Exit animation
        if (element.timing.exitAnimation.type !== 'none' && 
            currentTime > endTime - element.timing.exitAnimation.duration) {
          progress = 1 - ((currentTime - (endTime - element.timing.exitAnimation.duration)) / 
                         element.timing.exitAnimation.duration);
        }
        
        visibleElements.push({ ...element, progress });
      }
    }
    
    return visibleElements;
  }, [currentSlide, currentTime]);

  // Handle next slide
  const handleNextSlide = useCallback(() => {
    if (course && currentSlideIndex < course.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setCurrentTime(0);
    } else if (course) {
      // End of course
      setIsPlaying(false);
    }
  }, [course, currentSlideIndex]);

  // Handle previous slide
  const handlePreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setCurrentTime(0);
    }
  }, [currentSlideIndex]);

  // Handle toggle play
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle toggle mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 1 : 0;
    }
  }, [isMuted]);

  // Handle chapter overview
  const handleChapterOverview = useCallback(() => {
    setShowChapterOverview(!showChapterOverview);
  }, [showChapterOverview]);

  // Handle chapter selection
  const handleChapterSelect = useCallback((chapterIndex: number) => {
    if (course) {
      const chapter = course.chapters[chapterIndex];
      if (chapter && chapter.slides.length > 0) {
        const firstSlideIndex = course.slides.findIndex(
          (s) => s.id === chapter.slides[0]
        );
        if (firstSlideIndex !== -1) {
          setCurrentSlideIndex(firstSlideIndex);
          setCurrentTime(0);
          setShowChapterOverview(false);
        }
      }
    }
  }, [course, showChapterOverview]);

  // Handle exit player
  const handleExit = useCallback(() => {
    setMode('edit');
  }, [setMode]);

  // Get slide duration
  const getSlideDuration = useCallback(() => {
    if (!currentSlide) return 10;
    if (typeof currentSlide.duration === 'number') return currentSlide.duration;
    if (currentSlide.audioDuration) return currentSlide.audioDuration;
    return 10;
  }, [currentSlide]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate canvas size
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Calculate display size
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
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

  // Calculate scale
  const scale = Math.min(
    containerSize.width / canvasWidth,
    containerSize.height / canvasHeight
  );

  // Render chapter overview
  const renderChapterOverview = () => {
    if (!course || !showChapterOverview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Kapitelübersicht</h2>
            <button
              onClick={() => setShowChapterOverview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.chapters.map((chapter, index) => {
              const firstSlide = course.slides.find((s) => 
                chapter.slides.includes(s.id)
              );
              
              return (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(index)}
                  className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: chapter.color || '#4F46E5' }}
                    />
                    <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{chapter.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {chapter.slides.length} Folien
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render element with animation
  const renderAnimatedElement = (element: any) => {
    const { progress, ...elementProps } = element;
    
    // Apply animation based on progress and animation type
    const style: React.CSSProperties = {
      ...elementProps,
    };

    // Enter animation
    if (element.timing.enterAnimation.type === 'fade') {
      style.opacity = element.opacity * progress;
    } else if (element.timing.enterAnimation.type === 'slide') {
      // Slide from direction
      const direction = element.timing.enterAnimation.direction || 'left';
      const distance = 50 * (1 - progress);
      
      switch (direction) {
        case 'left':
          style.transform = `translateX(${-distance}px) rotate(${element.rotation}deg)`;
          break;
        case 'right':
          style.transform = `translateX(${distance}px) rotate(${element.rotation}deg)`;
          break;
        case 'top':
          style.transform = `translateY(${-distance}px) rotate(${element.rotation}deg)`;
          break;
        case 'bottom':
          style.transform = `translateY(${distance}px) rotate(${element.rotation}deg)`;
          break;
      }
    }

    // Exit animation
    if (element.timing.exitAnimation.type === 'fade') {
      style.opacity = element.opacity * progress;
    } else if (element.timing.exitAnimation.type === 'slide') {
      const direction = element.timing.exitAnimation.direction || 'right';
      const distance = 50 * (1 - progress);
      
      switch (direction) {
        case 'left':
          style.transform = `translateX(${-distance}px) rotate(${element.rotation}deg)`;
          break;
        case 'right':
          style.transform = `translateX(${distance}px) rotate(${element.rotation}deg)`;
          break;
        case 'top':
          style.transform = `translateY(${-distance}px) rotate(${element.rotation}deg)`;
          break;
        case 'bottom':
          style.transform = `translateY(${distance}px) rotate(${element.rotation}deg)`;
          break;
      }
    }

    return renderElement(elementProps, { style });
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-50">
        <button
          onClick={handleExit}
          className="text-white hover:text-gray-300 text-sm"
        >
          Zurück zum Editor
        </button>
        
        <h1 className="text-white font-semibold truncate max-w-md">
          {course?.name || 'Kurs'}
        </h1>
        
        <button
          onClick={handleChapterOverview}
          className="text-white hover:text-gray-300"
        >
          <FiList size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div
          ref={canvasRef}
          className="relative overflow-hidden"
          style={{
            width: `${canvasWidth * scale}px`,
            height: `${canvasHeight * scale}px`,
          }}
        >
          {/* Slide Background */}
          {currentSlide && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: currentSlide.backgroundColor || '#FFFFFF',
                backgroundImage: currentSlide.backgroundImage ? `url(${currentSlide.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          {/* Elements */}
          <div className="absolute inset-0" style={{ transform: `scale(${1 / scale})` }}>
            {getVisibleElements().map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`,
                }}
              >
                {renderAnimatedElement(element)}
              </div>
            ))}
          </div>

          {/* Speaker text overlay (for accessibility) */}
          {currentSlide?.speakerText && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded max-w-xs">
              <p className="text-sm">{currentSlide.speakerText}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-4xl mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(currentTime / getSlideDuration()) * 100}%` }}
              />
            </div>
            <span className="text-white text-sm">{formatTime(getSlideDuration())}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 py-6">
        <button
          onClick={handlePreviousSlide}
          className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <FiStepBackward size={20} />
        </button>
        
        <button
          onClick={handleTogglePlay}
          className="p-4 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-colors"
        >
          {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
        </button>
        
        <button
          onClick={handleNextSlide}
          className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <FiStepForward size={20} />
        </button>
        
        <button
          onClick={handleToggleMute}
          className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
        </button>
      </div>

      {/* Chapter Overview */}
      {renderChapterOverview()}
    </div>
  );
};

export default Player;
