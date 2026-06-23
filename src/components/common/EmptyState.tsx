import React from 'react';
import './common.css';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string; // Text emoji icon or unicode
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '📦',
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-container">
      <div className="empty-icon" style={{ fontSize: '3.5rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '300px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
