import React from 'react';

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  style?: React.CSSProperties;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  style
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, ...style }}>
      {label && (
        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        style={{
          width: '100%',
          height: '40px',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0 10px',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          outline: 'none',
          colorScheme: 'dark', // Native support for dark mode calendar picker
          boxSizing: 'border-box',
          transition: 'border-color var(--transition-fast)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
      />
    </div>
  );
};

export default DateInput;
