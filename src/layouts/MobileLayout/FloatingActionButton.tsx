import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  visible?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  visible = true
}) => {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fab interactive"
      aria-label="Quick action shortcut"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
};
export default FloatingActionButton;
