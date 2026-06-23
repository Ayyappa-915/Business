import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './common.css';
import { SelectOption } from '../../types/common.types';

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  leftIcon?: React.ReactNode;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  leftIcon,
  helperText,
  className = '',
  id,
  placeholder = 'Select option',
  value = '',
  onChange,
  required,
  disabled,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = id || 'select_' + Math.random().toString(36).substr(2, 9);

  const selectedOption = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    if (disabled) return;
    // Simulate a native change event
    const fakeEvent = {
      target: { value: optValue }
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(fakeEvent);
    setIsOpen(false);
  };

  return (
    <div className={`input-group ${className}`} ref={containerRef} style={{ position: 'relative', ...style }}>
      {label && (
        <label htmlFor={selectId} className="input-label" onClick={() => !disabled && setIsOpen(o => !o)} style={{ cursor: 'pointer' }}>
          <span>{label}{required && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}</span>
          {error && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{error}</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={selectId}
        className="input-container custom-select-trigger"
        onClick={() => !disabled && setIsOpen(o => !o)}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          borderColor: isOpen ? 'var(--primary)' : error ? 'var(--danger)' : undefined,
          boxShadow: isOpen ? '0 0 0 3px var(--primary-soft)' : undefined,
          opacity: disabled ? 0.6 : 1,
          borderRadius: style?.borderRadius,
        }}
      >
        {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
        <span style={{
          flex: 1,
          fontSize: '0.95rem',
          fontWeight: selectedOption ? 500 : 400,
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '48px',
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          flexShrink: 0,
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <ChevronDown size={18} />
        </span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-secondary)',
            border: '1.5px solid var(--primary)',
            borderRadius: style?.borderRadius || 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'dropdownSlideIn 0.15s ease forwards',
          }}
        >
          {/* Placeholder option */}
          {placeholder && (
            <div
              style={{
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-color)',
                fontStyle: 'italic',
              }}
            >
              {placeholder}
            </div>
          )}
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  backgroundColor: isSelected ? 'var(--primary-soft)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  borderBottom: '1px solid var(--border-color)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={15} strokeWidth={2.5} />}
              </div>
            );
          })}
        </div>
      )}

      {!error && helperText && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
export default Select;
