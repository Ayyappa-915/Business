import React from 'react';
import './common.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`search-container ${className}`}>
      <span style={{ marginRight: '8px', color: 'var(--text-muted)', fontSize: '1rem' }}>
        🔍
      </span>
      <input
        type="text"
        className="search-field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '4px' }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
export default SearchBar;
