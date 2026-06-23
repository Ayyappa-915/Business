import React from 'react';
import ReactDOM from 'react-dom';
import './common.css';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay animate-fade-in" onClick={onCancel}>
      <div className="confirm-dialog-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {cancelLabel !== '' && (
            <Button onClick={onCancel} variant="secondary" size="sm" style={{ flex: 1 }}>
              {cancelLabel}
            </Button>
          )}
          <Button 
            onClick={onConfirm} 
            variant={isDanger ? 'danger' : 'primary'} 
            size="sm" 
            style={{ flex: 1 }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
export default ConfirmDialog;
