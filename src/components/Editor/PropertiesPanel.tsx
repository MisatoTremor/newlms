// ============================================
// NEWLMS - Properties Panel
// ============================================

import React, { useState, useEffect } from 'react';
import { useCourseStore } from '../../stores/useCourseStore';
import { FiChevronDown, FiChevronUp, FiTrash2, FiCopy, FiLock, FiUnlock, FiEye, FiEyeOff } from 'react-icons/fi';
import type { SlideElement, TextElement, ImageElement, RectangleElement, CircleElement, ButtonElement } from '../../types';

// ============================================
// PROPERTIES PANEL
// ============================================

export const PropertiesPanel: React.FC = () => {
  const {
    course,
    editorState,
    getCurrentSlide,
    getSelectedElements,
    updateElement,
    deleteElements,
    duplicateElement,
    setElementZIndex,
    reorderElements,
  } = useCourseStore();

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    appearance: true,
    timing: false,
    layout: true,
  });

  const slide = getCurrentSlide();
  const selectedElements = getSelectedElements();

  // Reset expanded sections when selection changes
  useEffect(() => {
    if (selectedElements.length === 0) {
      setExpandedSections({
        general: true,
        appearance: true,
        timing: false,
        layout: true,
      });
    }
  }, [selectedElements.length]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get common properties for multiple selection
  const getCommonProperties = () => {
    if (selectedElements.length === 0) return null;
    if (selectedElements.length === 1) return selectedElements[0];

    // For multiple selection, find common properties
    const first = selectedElements[0];
    const allSameType = selectedElements.every((e) => e.type === first.type);
    const allSameX = selectedElements.every((e) => e.x === first.x);
    const allSameY = selectedElements.every((e) => e.y === first.y);
    const allSameWidth = selectedElements.every((e) => e.width === first.width);
    const allSameHeight = selectedElements.every((e) => e.height === first.height);
    const allSameRotation = selectedElements.every((e) => e.rotation === first.rotation);
    const allSameOpacity = selectedElements.every((e) => e.opacity === first.opacity);
    const allSameZIndex = selectedElements.every((e) => e.zIndex === first.zIndex);

    return {
      type: allSameType ? first.type : 'mixed',
      x: allSameX ? first.x : null,
      y: allSameY ? first.y : null,
      width: allSameWidth ? first.width : null,
      height: allSameHeight ? first.height : null,
      rotation: allSameRotation ? first.rotation : null,
      opacity: allSameOpacity ? first.opacity : null,
      zIndex: allSameZIndex ? first.zIndex : null,
      locked: first.locked,
      isMultiple: true,
    };
  };

  const commonProps = getCommonProperties();

  // Render content based on selection
  const renderContent = () => {
    // No selection - show slide properties
    if (selectedElements.length === 0 && slide) {
      return renderSlideProperties();
    }

    // Multiple elements selected
    if (selectedElements.length > 1 && commonProps) {
      return renderMultipleElementProperties(commonProps);
    }

    // Single element selected
    if (selectedElements.length === 1 && commonProps) {
      return renderElementProperties(commonProps);
    }

    return (
      <div className="p-4 text-gray-500 text-center">
        Kein Element ausgewählt
      </div>
    );
  };

  // ============================================
  // SLIDE PROPERTIES
  // ============================================

  const renderSlideProperties = () => {
    if (!slide) return null;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Folieneinstellungen</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={slide.name}
              onChange={(e) => updateElement(slide.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hintergrundfarbe</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={slide.backgroundColor || '#FFFFFF'}
                onChange={(e) => updateElement(slide.id, { backgroundColor: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">{slide.backgroundColor || '#FFFFFF'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Sekunden)</label>
            <input
              type="number"
              value={slide.duration === 'auto' ? '' : slide.duration}
              onChange={(e) => {
                const value = e.target.value;
                updateElement(slide.id, {
                  duration: value === '' ? 'auto' : parseFloat(value) || 0,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <input
                type="checkbox"
                checked={slide.autoAdvance || false}
                onChange={(e) => updateElement(slide.id, { autoAdvance: e.target.checked })}
                className="mr-2"
              />
              Automatisch weiterblättern
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sprechertext</label>
            <textarea
              value={slide.speakerText || ''}
              onChange={(e) => updateElement(slide.id, { speakerText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="Sprechertext für diese Folie..."
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Audiodatei</label>
            <input
              type="file"
              accept=".mp3,.wav"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle audio upload
                  // In a real implementation, we'd read the file and store it
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const audioUrl = event.target?.result as string;
                    updateElement(slide.id, {
                      audioSrc: audioUrl,
                      audioDuration: null, // Would calculate duration
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-sm text-gray-600"
            />
            {slide.audioSrc && (
              <div className="mt-2 flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Play audio
                    const audio = new Audio(slide.audioSrc);
                    audio.play();
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Abspielen
                </button>
                <button
                  onClick={() => updateElement(slide.id, { audioSrc: null, audioDuration: null })}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MULTIPLE ELEMENT PROPERTIES
  // ============================================

  const renderMultipleElementProperties = (props: any) => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{selectedElements.length} Elemente ausgewählt</h3>
        </div>

        <div className="space-y-3">
          {/* Common properties */}
          <Section title="Position & Größe" expanded={expandedSections.layout} onToggle={() => toggleSection('layout')}>
            <div className="space-y-3">
              <NumberInput
                label="X Position"
                value={props.x !== null ? props.x : ''}
                onChange={(value) => {
                  selectedElements.forEach((e) => updateElement(e.id, { x: value }));
                }}
                disabled={props.x === null}
                placeholder="Gemischt"
              />
              <NumberInput
                label="Y Position"
                value={props.y !== null ? props.y : ''}
                onChange={(value) => {
                  selectedElements.forEach((e) => updateElement(e.id, { y: value }));
                }}
                disabled={props.y === null}
                placeholder="Gemischt"
              />
              <NumberInput
                label="Breite"
                value={props.width !== null ? props.width : ''}
                onChange={(value) => {
                  selectedElements.forEach((e) => updateElement(e.id, { width: value }));
                }}
                disabled={props.width === null}
                placeholder="Gemischt"
              />
              <NumberInput
                label="Höhe"
                value={props.height !== null ? props.height : ''}
                onChange={(value) => {
                  selectedElements.forEach((e) => updateElement(e.id, { height: value }));
                }}
                disabled={props.height === null}
                placeholder="Gemischt"
              />
            </div>
          </Section>

          <Section title="Transformation" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
            <div className="space-y-3">
              <NumberInput
                label="Rotation (Grad)"
                value={props.rotation !== null ? props.rotation : ''}
                onChange={(value) => {
                  selectedElements.forEach((e) => updateElement(e.id, { rotation: value }));
                }}
                disabled={props.rotation === null}
                placeholder="Gemischt"
              />
              <NumberInput
                label="Deckkraft"
                value={props.opacity !== null ? props.opacity * 100 : ''}
                onChange={(value) => {
                  selectedElements.forEach((e) => updateElement(e.id, { opacity: value / 100 }));
                }}
                disabled={props.opacity === null}
                placeholder="Gemischt"
                min={0}
                max={100}
              />
            </div>
          </Section>

          <Section title="Anordnung" expanded={expandedSections.general} onToggle={() => toggleSection('general')}>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    selectedElements.forEach((e, index) => {
                      setElementZIndex(e.id, selectedElements.length - index);
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                >
                  Nach vorne
                </button>
                <button
                  onClick={() => {
                    selectedElements.forEach((e, index) => {
                      setElementZIndex(e.id, index + 1);
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                >
                  Nach hinten
                </button>
              </div>
              <button
                onClick={() => {
                  if (slide) {
                    const currentOrder = [...slide.elements];
                    const selectedIds = selectedElements.map(e => e.id);
                    const newOrder = currentOrder.filter(e => !selectedIds.includes(e.id));
                    newOrder.push(...currentOrder.filter(e => selectedIds.includes(e.id)));
                    reorderElements(slide.id, newOrder.map(e => e.id));
                  }
                }}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                In den Vordergrund
              </button>
              <button
                onClick={() => {
                  if (slide) {
                    const currentOrder = [...slide.elements];
                    const selectedIds = selectedElements.map(e => e.id);
                    const newOrder = currentOrder.filter(e => !selectedIds.includes(e.id));
                    newOrder.unshift(...currentOrder.filter(e => selectedIds.includes(e.id)));
                    reorderElements(slide.id, newOrder.map(e => e.id));
                  }
                }}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                In den Hintergrund
              </button>
            </div>
          </Section>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => duplicateElement(selectedElements[0].id)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              <FiCopy size={16} />
              <span>Duplizieren</span>
            </button>
            <button
              onClick={() => deleteElements(selectedElements.map(e => e.id))}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              <FiTrash2 size={16} />
              <span>Löschen</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // SINGLE ELEMENT PROPERTIES
  // ============================================

  const renderElementProperties = (element: SlideElement) => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{getElementTypeLabel(element.type)}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => duplicateElement(element.id)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Duplizieren"
            >
              <FiCopy size={16} />
            </button>
            <button
              onClick={() => {
                updateElement(element.id, { locked: !element.locked });
              }}
              className={`p-2 rounded ${element.locked ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              title={element.locked ? 'Entsperren' : 'Sperren'}
            >
              {element.locked ? <FiLock size={16} /> : <FiUnlock size={16} />}
            </button>
            <button
              onClick={() => {
                updateElement(element.id, { opacity: element.opacity === 0 ? 1 : 0 });
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Sichtbarkeit umschalten"
            >
              {element.opacity === 0 ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
            <button
              onClick={() => deleteElements([element.id])}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
              title="Löschen"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={element.name}
              onChange={(e) => updateElement(element.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Position & Size */}
          <Section title="Position & Größe" expanded={expandedSections.layout} onToggle={() => toggleSection('layout')}>
            <div className="space-y-3">
              <NumberInput
                label="X Position"
                value={element.x}
                onChange={(value) => updateElement(element.id, { x: value })}
              />
              <NumberInput
                label="Y Position"
                value={element.y}
                onChange={(value) => updateElement(element.id, { y: value })}
              />
              <NumberInput
                label="Breite"
                value={element.width}
                onChange={(value) => updateElement(element.id, { width: value })}
              />
              <NumberInput
                label="Höhe"
                value={element.height}
                onChange={(value) => updateElement(element.id, { height: value })}
              />
            </div>
          </Section>

          {/* Transformation */}
          <Section title="Transformation" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
            <div className="space-y-3">
              <NumberInput
                label="Rotation (Grad)"
                value={element.rotation}
                onChange={(value) => updateElement(element.id, { rotation: value })}
                min={-360}
                max={360}
              />
              <NumberInput
                label="Deckkraft"
                value={element.opacity * 100}
                onChange={(value) => updateElement(element.id, { opacity: value / 100 })}
                min={0}
                max={100}
              />
              <NumberInput
                label="z-Index"
                value={element.zIndex}
                onChange={(value) => setElementZIndex(element.id, value)}
              />
            </div>
          </Section>

          {/* Type-specific properties */}
          {renderTypeSpecificProperties(element)}

          {/* Timing */}
          <Section title="Timing & Animation" expanded={expandedSections.timing} onToggle={() => toggleSection('timing')}>
            <div className="space-y-3">
              <NumberInput
                label="Startzeit (Sekunden)"
                value={element.timing.startTime}
                onChange={(value) => {
                  updateElement(element.id, {
                    timing: { ...element.timing, startTime: value },
                  });
                }}
                min={0}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sichtbar bis</label>
                <select
                  value={element.timing.visibleUntil === 'end' ? 'end' : element.timing.visibleUntil}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateElement(element.id, {
                      timing: {
                        ...element.timing,
                        visibleUntil: value === 'end' ? 'end' : parseFloat(value),
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="end">Bis Folienende</option>
                  <option value="5">5 Sekunden</option>
                  <option value="10">10 Sekunden</option>
                  <option value="15">15 Sekunden</option>
                  <option value="20">20 Sekunden</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Einblend-Animation</label>
                <select
                  value={element.timing.enterAnimation.type}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    updateElement(element.id, {
                      timing: {
                        ...element.timing,
                        enterAnimation: {
                          type,
                          duration: element.timing.enterAnimation.duration,
                        },
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Keine</option>
                  <option value="fade">Einblenden</option>
                  <option value="slide">Einschieben</option>
                </select>
              </div>
              
              {element.timing.enterAnimation.type !== 'none' && (
                <NumberInput
                  label="Animationsdauer (Sekunden)"
                  value={element.timing.enterAnimation.duration}
                  onChange={(value) => {
                    updateElement(element.id, {
                      timing: {
                        ...element.timing,
                        enterAnimation: {
                          ...element.timing.enterAnimation,
                          duration: value,
                        },
                      },
                    });
                  }}
                  min={0}
                  max={5}
                  step={0.1}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ausblend-Animation</label>
                <select
                  value={element.timing.exitAnimation.type}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    updateElement(element.id, {
                      timing: {
                        ...element.timing,
                        exitAnimation: {
                          type,
                          duration: element.timing.exitAnimation.duration,
                        },
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Keine</option>
                  <option value="fade">Ausblenden</option>
                  <option value="slide">Ausschieben</option>
                </select>
              </div>
            </div>
          </Section>
        </div>
      </div>
    );
  };

  // ============================================
  // TYPE-SPECIFIC PROPERTIES
  // ============================================

  const renderTypeSpecificProperties = (element: SlideElement) => {
    switch (element.type) {
      case 'text':
        return renderTextProperties(element as TextElement);
      case 'image':
        return renderImageProperties(element as ImageElement);
      case 'rectangle':
        return renderRectangleProperties(element as RectangleElement);
      case 'circle':
        return renderCircleProperties(element as CircleElement);
      case 'button':
        return renderButtonProperties(element as ButtonElement);
      default:
        return null;
    }
  };

  const renderTextProperties = (element: TextElement) => {
    return (
      <Section title="Text" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inhalt</label>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schriftart</label>
            <select
              value={element.fontFamily}
              onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter, system-ui, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Courier New, monospace">Courier New</option>
            </select>
          </div>
          <NumberInput
            label="Schriftgröße"
            value={element.fontSize}
            onChange={(value) => updateElement(element.id, { fontSize: value })}
            min={8}
            max={200}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schriftgewicht</label>
            <select
              value={element.fontWeight}
              onChange={(e) => updateElement(element.id, { fontWeight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="300">Dünn</option>
              <option value="400">Normal</option>
              <option value="500">Mittel</option>
              <option value="600">Halbfett</option>
              <option value="700">Fett</option>
              <option value="800">Extrafett</option>
              <option value="900">Schwer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schriftstil</label>
            <select
              value={element.fontStyle}
              onChange={(e) => updateElement(element.id, { fontStyle: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="italic">Kursiv</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ausrichtung</label>
            <select
              value={element.textAlign}
              onChange={(e) => updateElement(element.id, { textAlign: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={element.color}
              onChange={(e) => updateElement(element.id, { color: e.target.value })}
              className="w-8 h-8 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">{element.color}</span>
          </div>
        </div>
      </Section>
    );
  };

  const renderImageProperties = (element: ImageElement) => {
    const [imagePreview, setImagePreview] = useState<string | null>(element.src || null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          setImagePreview(url);
          updateElement(element.id, {
            src: url,
            naturalWidth: 0, // Would be set after image loads
            naturalHeight: 0,
          });
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <Section title="Bild" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bilddatei</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm text-gray-600"
            />
          </div>
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Vorschau"
                className="w-full max-h-40 object-contain border border-gray-300 rounded"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  updateElement(element.id, { src: '' });
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
              >
                ×
              </button>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alternativtext</label>
            <input
              type="text"
              value={element.altText || ''}
              onChange={(e) => updateElement(element.id, { altText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Beschreibung für Screenreader"
            />
          </div>
        </div>
      </Section>
    );
  };

  const renderRectangleProperties = (element: RectangleElement) => {
    return (
      <Section title="Rechteck" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Füllfarbe</span>
            <input
              type="color"
              value={element.fillColor}
              onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
              className="w-8 h-8 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">{element.fillColor}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Konturfarbe</span>
            <input
              type="color"
              value={element.strokeColor}
              onChange={(e) => updateElement(element.id, { strokeColor: e.target.value })}
              className="w-8 h-8 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">{element.strokeColor}</span>
          </div>
          <NumberInput
            label="Konturstärke"
            value={element.strokeWidth}
            onChange={(value) => updateElement(element.id, { strokeWidth: value })}
            min={0}
            max={50}
          />
          <NumberInput
            label="Eckenradius"
            value={element.cornerRadius}
            onChange={(value) => updateElement(element.id, { cornerRadius: value })}
            min={0}
            max={100}
          />
        </div>
      </Section>
    );
  };

  const renderCircleProperties = (element: CircleElement) => {
    return (
      <Section title="Kreis" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Füllfarbe</span>
            <input
              type="color"
              value={element.fillColor}
              onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
              className="w-8 h-8 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">{element.fillColor}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Konturfarbe</span>
            <input
              type="color"
              value={element.strokeColor}
              onChange={(e) => updateElement(element.id, { strokeColor: e.target.value })}
              className="w-8 h-8 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">{element.strokeColor}</span>
          </div>
          <NumberInput
            label="Konturstärke"
            value={element.strokeWidth}
            onChange={(value) => updateElement(element.id, { strokeWidth: value })}
            min={0}
            max={50}
          />
        </div>
      </Section>
    );
  };

  const renderButtonProperties = (element: ButtonElement) => {
    return (
      <>
        <Section title="Button" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschriftung</label>
              <input
                type="text"
                value={element.label}
                onChange={(e) => updateElement(element.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktion</label>
              <select
                value={element.action.type}
                onChange={(e) => {
                  const type = e.target.value as any;
                  updateElement(element.id, {
                    action: {
                      type,
                      targetId: type === 'specificChapter' || type === 'specificSlide' ? element.action.targetId : undefined,
                    },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="next">Nächste Folie</option>
                <option value="previous">Vorherige Folie</option>
                <option value="chapterOverview">Kapitelübersicht</option>
                <option value="specificChapter">Bestimmtes Kapitel</option>
                <option value="specificSlide">Bestimmte Folie</option>
              </select>
            </div>
            {(element.action.type === 'specificChapter' || element.action.type === 'specificSlide') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ziel</label>
                <select
                  value={element.action.targetId || ''}
                  onChange={(e) => {
                    updateElement(element.id, {
                      action: {
                        ...element.action,
                        targetId: e.target.value || undefined,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Auswählen...</option>
                  {course?.chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      Kapitel: {chapter.name}
                    </option>
                  ))}
                  {course?.slides.map((slide) => (
                    <option key={slide.id} value={slide.id}>
                      Folie: {slide.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Section>

        <Section title="Stil" expanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schriftart</label>
              <select
                value={element.fontFamily}
                onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter, system-ui, sans-serif">Inter</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
              </select>
            </div>
            <NumberInput
              label="Schriftgröße"
              value={element.fontSize}
              onChange={(value) => updateElement(element.id, { fontSize: value })}
              min={8}
              max={50}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Textfarbe</span>
              <input
                type="color"
                value={element.color}
                onChange={(e) => updateElement(element.id, { color: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Hintergrund</span>
              <input
                type="color"
                value={element.bgColor}
                onChange={(e) => updateElement(element.id, { bgColor: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Hover</span>
              <input
                type="color"
                value={element.hoverColor}
                onChange={(e) => updateElement(element.id, { hoverColor: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded"
              />
            </div>
            <NumberInput
              label="Eckenradius"
              value={element.cornerRadius}
              onChange={(value) => updateElement(element.id, { cornerRadius: value })}
              min={0}
              max={100}
            />
          </div>
        </Section>
      </>
    );
  };

  // ============================================
  // HELPER COMPONENTS
  // ============================================

  const Section: React.FC<{
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }> = ({ title, expanded, onToggle, children }) => {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full px-4 py-2 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
        >
          <span className="font-medium text-gray-700">{title}</span>
          {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
        {expanded && <div className="p-3">{children}</div>}
      </div>
    );
  };

  const NumberInput: React.FC<{
    label: string;
    value: number | string;
    onChange: (value: number) => void;
    disabled?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
  }> = ({ label, value, onChange, disabled, placeholder, min, max, step }) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const numValue = parseFloat(e.target.value);
            if (!isNaN(numValue)) {
              onChange(numValue);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>
    );
  };

  const getElementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      image: 'Bild',
      rectangle: 'Rechteck',
      circle: 'Kreis',
      button: 'Button',
    };
    return labels[type] || type;
  };

  return (
    <div className="h-full overflow-auto">
      {renderContent()}
    </div>
  );
};

export default PropertiesPanel;
