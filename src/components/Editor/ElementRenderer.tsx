// ============================================
// NEWLMS - Element Renderer
// ============================================

import React from 'react';
import type { SlideElement } from '../../types';

interface RenderOptions {
  isSelected?: boolean;
  isHovered?: boolean;
}

export const renderElement = (element: SlideElement, options: RenderOptions = {}): React.ReactNode => {
  const { isSelected = false, isHovered = false } = options;

  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: '0 0',
    opacity: element.opacity,
    zIndex: element.zIndex,
    cursor: element.locked ? 'not-allowed' : 'move',
    pointerEvents: element.locked ? 'none' : 'auto',
  };

  switch (element.type) {
    case 'text':
      return renderTextElement(element, { ...commonStyle, ...options });
    case 'image':
      return renderImageElement(element, { ...commonStyle, ...options });
    case 'rectangle':
      return renderRectangleElement(element, { ...commonStyle, ...options });
    case 'circle':
      return renderCircleElement(element, { ...commonStyle, ...options });
    case 'button':
      return renderButtonElement(element, { ...commonStyle, ...options });
    default:
      return <div style={commonStyle}>Unbekanntes Element</div>;
  }
};

// ============================================
// TEXT ELEMENT
// ============================================

const renderTextElement = (element: any, style: React.CSSProperties & RenderOptions) => {
  const { isSelected, isHovered, ...restStyle } = style;

  return (
    <div
      style={restStyle}
      className={`overflow-wrap break-words ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isHovered ? 'ring-1 ring-gray-300' : ''}`}
      contentEditable={!element.locked}
      suppressContentEditableWarning
      onInput={(e) => {
        // Update content
        const newContent = e.currentTarget.textContent || '';
        // In a real implementation, we'd update the store here
      }}
      onBlur={(e) => {
        const newContent = e.currentTarget.textContent || '';
        // Update in store
      }}
      dangerouslySetInnerHTML={{ __html: element.content || 'Neuer Text' }}
      style={{
        ...restStyle,
        fontFamily: element.fontFamily,
        fontSize: `${element.fontSize}px`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        textAlign: element.textAlign,
        color: element.color,
        lineHeight: element.lineHeight,
        letterSpacing: `${element.letterSpacing}px`,
        textDecoration: element.textDecoration === 'underline' ? 'underline' :
                        element.textDecoration === 'line-through' ? 'line-through' : 'none',
        padding: '4px',
        outline: 'none',
      }}
    />
  );
};

// ============================================
// IMAGE ELEMENT
// ============================================

const renderImageElement = (element: any, style: React.CSSProperties & RenderOptions) => {
  const { isSelected, isHovered, ...restStyle } = style;

  return (
    <div
      style={restStyle}
      className={`overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isHovered ? 'ring-1 ring-gray-300' : ''}`}
    >
      {element.src ? (
        <img
          src={element.src}
          alt={element.altText || 'Bild'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm"
        >
          Kein Bild
        </div>
      )}
    </div>
  );
};

// ============================================
// RECTANGLE ELEMENT
// ============================================

const renderRectangleElement = (element: any, style: React.CSSProperties & RenderOptions) => {
  const { isSelected, isHovered, ...restStyle } = style;

  return (
    <div
      style={{
        ...restStyle,
        backgroundColor: element.fillColor,
        border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none',
        borderRadius: `${element.cornerRadius}px`,
      }}
      className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${isHovered ? 'ring-1 ring-gray-300' : ''}`}
    />
  );
};

// ============================================
// CIRCLE ELEMENT
// ============================================

const renderCircleElement = (element: any, style: React.CSSProperties & RenderOptions) => {
  const { isSelected, isHovered, ...restStyle } = style;

  return (
    <div
      style={{
        ...restStyle,
        backgroundColor: element.fillColor,
        border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none',
        borderRadius: '50%',
      }}
      className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${isHovered ? 'ring-1 ring-gray-300' : ''}`}
    />
  );
};

// ============================================
// BUTTON ELEMENT
// ============================================

const renderButtonElement = (element: any, style: React.CSSProperties & RenderOptions) => {
  const { isSelected, isHovered, ...restStyle } = style;
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <div
      style={restStyle}
      className={`flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: isHovering ? element.hoverColor : element.bgColor,
          color: element.color,
          border: element.borderWidth > 0 ? `${element.borderWidth}px solid ${element.borderColor}` : 'none',
          borderRadius: `${element.cornerRadius}px`,
          fontFamily: element.fontFamily,
          fontSize: `${element.fontSize}px`,
          fontWeight: element.fontWeight,
          cursor: 'pointer',
        }}
        className="w-full h-full flex items-center justify-center outline-none"
      >
        {element.label}
      </button>
    </div>
  );
};

// ============================================
// EXPORT
// ============================================

export default renderElement;
