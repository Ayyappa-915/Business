import React from 'react';
import ReactDOM from 'react-dom';
import './common.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left'
}) => {
  if (!isOpen) return null;

  const slideKeyframes = position === 'left' ? 'slideInLeft' : 'slideInRight';

  return ReactDOM.createPortal(
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={onClose}
      style={{ justifyContent: position === 'left' ? 'flex-start' : 'flex-end', padding: 0 }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          width: '285px',
          height: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: position === 'left' ? '1px solid var(--border-color)' : 'none',
          borderLeft: position === 'right' ? '1px solid var(--border-color)' : 'none',
          transform: 'translateX(0)',
          animation: `${slideKeyframes} var(--transition-normal) forwards`
        }}
      >
        <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        {children}
      </div>
    </div>,
    document.body
  );
};
export default Drawer;
