import React from 'react';
import ReactDOM from 'react-dom';
import './common.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="bottom-sheet-overlay animate-fade-in" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" onClick={onClose}></div>
        <div className="bottom-sheet-header flex-between">
          <h3 style={{ fontSize: '1.15rem' }}>{title}</h3>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: '4px' }}>
            ✕
          </button>
        </div>
        <div className="bottom-sheet-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
export default BottomSheet;
