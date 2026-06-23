import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: React.CSSProperties;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  style
}: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
        padding: '4px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-color)',
        width: '100%',
        margin: '4px 0 12px 0',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              outline: 'none',
              boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
