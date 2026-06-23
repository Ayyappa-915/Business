import React from 'react';
import './common.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconClick,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || 'input_' + Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          <span>{label}</span>
          {error && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{error}</span>}
        </label>
      )}
      <div className="input-container" style={error ? { borderColor: 'var(--danger)' } : {}}>
        {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
        <input
          id={inputId}
          className="input-field"
          {...props}
        />
        {rightIcon && (
          <span className="input-icon-right" onClick={onRightIconClick}>
            {rightIcon}
          </span>
        )}
      </div>
      {!error && helperText && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
export default Input;
