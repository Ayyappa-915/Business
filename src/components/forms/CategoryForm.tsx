import React, { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { addCategory, updateCategory } from '../../features/db/dbSlice';
import { Category } from '../../types/category.types';
import { CATEGORY_COLORS } from '../../constants/theme';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Button from '../common/Button';

interface CategoryFormProps {
  onSuccess: () => void;
  categoryToEdit?: Category;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ 
  onSuccess,
  categoryToEdit
}) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [selectedColor, setSelectedColor] = useState(categoryToEdit?.color || CATEGORY_COLORS[0]);
  const [type, setType] = useState<'prepared' | 'exchanged'>(categoryToEdit?.type || 'exchanged');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    const payload: Category = {
      id: categoryToEdit?.id || 'cat_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      type,
      createdAt: categoryToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (categoryToEdit) {
      dispatch(updateCategory(payload));
    } else {
      dispatch(addCategory(payload));
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

      <Input
        label="Category Name"
        placeholder="Enter category name (e.g. Dairy, Spices)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label="Category Type"
        options={[
          { value: 'exchanged', label: '📦 Exchanged (Retail / Stock tracked)' },
          { value: 'prepared', label: '🍽️ Prepared (Tiffins / Cooked food)' }
        ]}
        value={type}
        onChange={(e) => setType(e.target.value as 'prepared' | 'exchanged')}
        helperText={
          type === 'exchanged'
            ? 'Stock-tracked products sold as-is (e.g. Rice, Biscuits)'
            : 'Freshly prepared items with no stock tracking (e.g. Tiffin, Tea)'
        }
      />

      <TextArea
        label="Description (Optional)"
        placeholder="Brief note about items in this group"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Dynamic Color Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Accent Badge Color</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORY_COLORS.map(color => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: color,
                cursor: 'pointer',
                border: selectedColor === color ? '3px solid var(--text-primary)' : '1px solid transparent',
                boxShadow: selectedColor === color ? 'var(--shadow-md)' : 'none',
                transition: 'all 0.15s'
              }}
              className="interactive"
            ></div>
          ))}
        </div>
      </div>

      <Button type="submit" fullWidth style={{ marginTop: '12px' }}>
        {categoryToEdit ? 'Save Changes' : 'Create Category'}
      </Button>
    </form>
  );
};
export default CategoryForm;
