// ============================================
// NEWLMS - Slide Overview Component
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiCopy, FiMoreVertical, FiEye, FiEyeOff } from 'react-icons/fi';

// ============================================
// SLIDE OVERVIEW COMPONENT
// ============================================

export const SlideOverview: React.FC = () => {
  const {
    course,
    editorState,
    setCurrentSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,
    addChapter,
    deleteChapter,
    updateChapter,
    moveSlideToChapter,
    reorderSlidesInChapter,
    reorderChapters,
    duplicateChapter,
  } = useCourseStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null);
  const [showChapterMenu, setShowChapterMenu] = useState<string | null>(null);
  const [showSlideMenu, setShowSlideMenu] = useState<string | null>(null);

  // Initialize expanded chapters
  useEffect(() => {
    if (course) {
      const initialExpanded: Record<string, boolean> = {};
      course.chapters.forEach((chapter) => {
        initialExpanded[chapter.id] = true;
      });
      setExpandedChapters(initialExpanded);
    }
  }, [course]);

  // Scroll to current slide
  useEffect(() => {
    if (editorState.currentSlideId && containerRef.current) {
      const slideElement = containerRef.current.querySelector(
        `[data-slide-id="${editorState.currentSlideId}"]`
      );
      if (slideElement) {
        slideElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [editorState.currentSlideId]);

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Handle slide selection
  const handleSlideClick = (slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide(slideId);
  };

  // Handle chapter menu
  const handleChapterMenu = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChapterMenu(showChapterMenu === chapterId ? null : chapterId);
    setShowSlideMenu(null);
  };

  // Handle slide menu
  const handleSlideMenu = (slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSlideMenu(showSlideMenu === slideId ? null : slideId);
    setShowChapterMenu(null);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowChapterMenu(null);
        setShowSlideMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    e.dataTransfer.setData('text/plain', slideId);
    setDraggedSlideId(slideId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDraggedOverId(targetId);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDraggedOverId(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetId: string, targetType: 'chapter' | 'slide') => {
    e.preventDefault();
    setDraggedOverId(null);
    
    if (!draggedSlideId || !course) return;

    const sourceSlideId = draggedSlideId;
    const sourceChapter = course.chapters.find((c) => c.slides.includes(sourceSlideId));
    const targetChapter = targetType === 'chapter'
      ? course.chapters.find((c) => c.id === targetId)
      : course.chapters.find((c) => c.slides.includes(targetId));

    if (!sourceChapter || !targetChapter) return;

    // Move slide to target chapter
    if (targetType === 'chapter') {
      moveSlideToChapter(sourceSlideId, targetChapter.id);
    } else {
      // Move slide to position before target slide
      const targetIndex = targetChapter.slides.indexOf(targetId);
      moveSlideToChapter(sourceSlideId, targetChapter.id, targetIndex);
    }

    setDraggedSlideId(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedSlideId(null);
    setDraggedOverId(null);
  };

  // Render chapter
  const renderChapter = (chapter: any) => {
    const isExpanded = expandedChapters[chapter.id];
    const isCurrentChapter = course?.chapters.find(
      (c) => c.slides.includes(editorState.currentSlideId || '')
    )?.id === chapter.id;

    return (
      <div
        key={chapter.id}
        className={`border border-gray-200 rounded-lg mb-4 overflow-hidden ${
          isCurrentChapter ? 'bg-blue-50 border-blue-300' : ''
        }`}
        draggable={false}
      >
        {/* Chapter Header */}
        <div
          className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
          onClick={() => toggleChapter(chapter.id)}
        >
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleChapter(chapter.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: chapter.color || '#4F46E5' }}
              />
              <input
                type="text"
                value={chapter.name}
                onChange={(e) => updateChapter(chapter.id, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-none outline-none font-medium text-gray-800"
              />
              <span className="text-sm text-gray-500">({chapter.slides.length} Folien)</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => handleChapterMenu(chapter.id, e)}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded"
            >
              <FiMoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Chapter Menu */}
        {showChapterMenu === chapter.id && (
          <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addSlide({}, chapter.id);
                setShowChapterMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Neue Folie
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateChapter(chapter.id);
                setShowChapterMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Kapitel duplizieren
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateChapter(chapter.id, { color: '#' + Math.floor(Math.random() * 16777215).toString(16) });
                setShowChapterMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Farbe ändern
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteChapter(chapter.id);
                setShowChapterMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
            >
              Kapitel löschen
            </button>
          </div>
        )}

        {/* Slides */}
        {isExpanded && (
          <div className="p-2">
            {chapter.slides.map((slideId) => {
              const slide = course?.slides.find((s) => s.id === slideId);
              if (!slide) return null;

              const isCurrent = editorState.currentSlideId === slideId;

              return (
                <div
                  key={slideId}
                  data-slide-id={slideId}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, slideId)}
                  onDragOver={(e) => handleDragOver(e, slideId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slideId, 'slide')}
                  onDragEnd={handleDragEnd}
                  className={`mb-2 p-2 rounded cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-blue-500 text-white'
                      : draggedOverId === slideId
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'hover:bg-gray-100'
                  } ${
                    draggedSlideId === slideId ? 'opacity-50' : ''
                  }`}
                  onClick={(e) => handleSlideClick(slideId, e)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-6 bg-gray-200 rounded overflow-hidden flex-shrink-0"
                      >
                        {slide.backgroundImage ? (
                          <img
                            src={slide.backgroundImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: slide.backgroundColor || '#FFFFFF' }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <input
                          type="text"
                          value={slide.name}
                          onChange={(e) => {
                            // Update slide name
                            useCourseStore.getState().updateSlide(slideId, { name: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-none outline-none text-sm w-full truncate"
                        />
                        <div className="text-xs text-gray-500 truncate">
                          {slide.type === 'title' && 'Titelfolie'}
                          {slide.type === 'instruction' && 'Bedienungsfolie'}
                          {slide.type === 'chapterOverview' && 'Kapitelübersicht'}
                          {slide.type === 'content' && 'Inhaltsfolie'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleSlideMenu(slideId, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-inherit hover:bg-black hover:bg-opacity-10 rounded"
                    >
                      <FiMoreVertical size={14} />
                    </button>
                  </div>

                  {/* Slide Menu */}
                  {showSlideMenu === slideId && (
                    <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlide(slideId);
                          duplicateSlide(slideId);
                          setShowSlideMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Duplizieren
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slideId);
                          setShowSlideMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render add chapter button
  const renderAddChapterButton = () => {
    return (
      <button
        onClick={() => addChapter()}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
      >
        <FiPlus size={18} />
        <span>Neues Kapitel hinzufügen</span>
      </button>
    );
  };

  // Handle chapter reordering
  const handleChapterDragStart = (e: React.DragEvent, chapterId: string) => {
    e.dataTransfer.setData('text/plain', `chapter:${chapterId}`);
  };

  const handleChapterDrop = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    
    if (data.startsWith('chapter:')) {
      const sourceChapterId = data.replace('chapter:', '');
      if (sourceChapterId !== targetChapterId && course) {
        const sourceIndex = course.chapters.findIndex(c => c.id === sourceChapterId);
        const targetIndex = course.chapters.findIndex(c => c.id === targetChapterId);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          const newOrder = [...course.chapters];
          const [removed] = newOrder.splice(sourceIndex, 1);
          newOrder.splice(targetIndex, 0, removed);
          reorderChapters(newOrder.map(c => c.id));
        }
      }
    }
  };

  // Get all chapters
  const chapters = course?.chapters || [];

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-auto p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Kursstruktur</h3>
        <button
          onClick={() => addSlide()}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Neue Folie
        </button>
      </div>

      <div className="space-y-2">
        {chapters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Keine Kapitel vorhanden</p>
        ) : (
          chapters.map((chapter) => (
            <div
              key={chapter.id}
              draggable={true}
              onDragStart={(e) => handleChapterDragStart(e, chapter.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleChapterDrop(e, chapter.id)}
            >
              {renderChapter(chapter)}
            </div>
          ))
        )}

        {renderAddChapterButton()}
      </div>
    </div>
  );
};

export default SlideOverview;
