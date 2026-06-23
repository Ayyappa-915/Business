import React from 'react';
import './common.css';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  message
}) => {
  const dim = size === 'sm' ? 24 : size === 'md' ? 36 : 48;
  return (
    <div className="loader-container" style={{ flexDirection: 'column' }}>
      <div 
        className="loader-spinner" 
        style={{ width: dim, height: dim, borderWidth: size === 'sm' ? '2px' : '3.5px' }}
      ></div>
      {message && (
        <span style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {message}
        </span>
      )}
    </div>
  );
};
export default Loader;
