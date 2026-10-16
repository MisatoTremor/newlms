// ============================================
// NEWLMS - Main Application
// ============================================

import React from 'react';
import { EditorLayout } from './components/Editor/EditorLayout';

// ============================================
// APP COMPONENT
// ============================================

const App: React.FC = () => {
  return (
    <div className="App">
      <EditorLayout />
    </div>
  );
};

export default App;
