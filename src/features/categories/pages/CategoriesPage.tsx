import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { deleteCategory } from '../../db/dbSlice';
import { useAuth } from '../../../hooks/useAuth';
import CategoryForm from '../../../components/forms/CategoryForm';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { Category } from '../../../types/category.types';

import { useNotification } from '../../../context/NotificationContext';

export const CategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(state => state.db.categories);
  const products = useAppSelector(state => state.db.products);
  const variants = useAppSelector(state => state.db.variants);
  const { user } = useAuth();
  const notification = useNotification();
  
  const [search, setSearch] = useState('');
  
  // Sheet toggles
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getProductCount = (catId: string) => {
    return products.filter(p => p.categoryId === catId).length;
  };

  const getCategoryStock = (catId: string) => {
    const catProducts = products.filter(p => p.categoryId === catId);
    const catProductIds = catProducts.map(p => p.id);
    const catVariants = variants.filter(v => catProductIds.includes(v.productId));
    return catVariants.reduce((sum, v) => sum + v.stock, 0);
  };

  const handleAttemptDelete = (catId: string) => {
    if (user?.role !== 'owner') {
      notification.alert('🔒 Access Denied: Only the owner is authorized to delete categories.');
      return;
    }
    const catStock = getCategoryStock(catId);
    if (catStock > 0) {
      notification.alert('❌ Cannot Delete Category: Some products in this category still have active inventory stock. All products in this category must have 0 stock first.');
      return;
    }
    setDeletingCatId(catId);
  };

  const handleDelete = () => {
    if (deletingCatId) {
      dispatch(deleteCategory(deletingCatId));
      setDeletingCatId(null);
    }
  };

  return (
    <div className="responsive-page-container animate-fade-in">
      
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Catalog Grouping</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Categories</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Add Category
        </Button>
      </div>

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Search categories..."
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No categories found
        </div>
      ) : (
        <div className="responsive-list-grid">
          {filtered.map(cat => (
            <div key={cat.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: cat.color || 'var(--primary)',
                    display: 'inline-block'
                  }}></span>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 700 }}>{cat.name}</h4>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setEditingCat(cat)} className="interactive" style={{ padding: '4px', color: 'var(--text-secondary)' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleAttemptDelete(cat.id)} className="interactive" style={{ padding: '4px', color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{cat.description}</p>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                <Badge variant="primary">{getProductCount(cat.id)} Products</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Category">
        <CategoryForm onSuccess={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* Edit Sheet */}
      <BottomSheet isOpen={editingCat !== null} onClose={() => setEditingCat(null)} title="Edit Category Details">
        {editingCat && <CategoryForm categoryToEdit={editingCat} onSuccess={() => setEditingCat(null)} />}
      </BottomSheet>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deletingCatId !== null}
        title={deletingCatId && getProductCount(deletingCatId) > 0 ? "Cannot Delete Category" : "Delete Category?"}
        message={
          deletingCatId && getProductCount(deletingCatId) > 0
            ? `This category contains ${getProductCount(deletingCatId)} product(s). You must reassign or delete these products first.`
            : "Are you sure you want to permanently delete this category? This action cannot be undone."
        }
        onConfirm={deletingCatId && getProductCount(deletingCatId) > 0 ? () => setDeletingCatId(null) : handleDelete}
        onCancel={() => setDeletingCatId(null)}
        confirmLabel={deletingCatId && getProductCount(deletingCatId) > 0 ? "Close" : "Yes, Delete"}
        cancelLabel={deletingCatId && getProductCount(deletingCatId) > 0 ? "" : "Cancel"}
        isDanger={!(deletingCatId && getProductCount(deletingCatId) > 0)}
      />

    </div>
  );
};
export default CategoriesPage;
