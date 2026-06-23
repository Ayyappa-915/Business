import React from 'react';
import './common.css';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const areaId = id || 'area_' + Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={areaId} className="input-label">
          <span>{label}</span>
          {error && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{error}</span>}
        </label>
      )}
      <div className="input-container" style={error ? { borderColor: 'var(--danger)' } : {}}>
        <textarea
          id={areaId}
          className="textarea-field"
          {...props}
        />
      </div>
      {!error && helperText && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
export default TextArea;
