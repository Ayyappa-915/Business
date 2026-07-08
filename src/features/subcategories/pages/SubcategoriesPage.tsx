import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addSubcategory, updateSubcategory, deleteSubcategory } from '../../db/dbSlice';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import SegmentedControl from '../../../components/common/SegmentedControl';
import { Subcategory } from '../../../types/subcategory.types';

export const SubcategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const subcategories = useAppSelector(state => state.db.subcategories);
  const categories = useAppSelector(state => state.db.categories);
  const products = useAppSelector(state => state.db.products);
  
  const [search, setSearch] = useState('');
  
  // Sheet states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  
  // Form input fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');

  const filteredCategories = categories.filter(c => c.type === activeTab);
  const catOptions = filteredCategories.map(c => ({ value: c.id, label: c.name }));

  const handleTabChange = (tab: 'exchanged' | 'prepared') => {
    setActiveTab(tab);
    setCategoryId('');
    setError('');
  };

  const filtered = subcategories.filter(s => {
    const parentCat = categories.find(c => c.id === s.categoryId);
    const catType = parentCat ? parentCat.type : 'exchanged';
    if (catType !== activeTab) return false;

    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      setError('Please fill in subcategory title and parent category.');
      return;
    }
    
    dispatch(addSubcategory({
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      categoryId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setName('');
    setCategoryId('');
    setIsAddOpen(false);
    setError('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSub) {
      dispatch(updateSubcategory(editingSub));
      setEditingSub(null);
    }
  };

  const getProductCountForSub = (subId: string) => {
    return products.filter(p => p.subcategoryId === subId).length;
  };

  const handleDelete = () => {
    if (deletingSubId) {
      dispatch(deleteSubcategory(deletingSubId));
      setDeletingSubId(null);
    }
  };

  return (
    <div className="responsive-page-container animate-fade-in">
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Catalog Grouping</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Subcategories</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Add Subcategory
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Subcategories' },
          { value: 'prepared', label: 'Prepared Subcategories' }
        ]}
        value={activeTab}
        onChange={(val) => handleTabChange(val as any)}
      />

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Search subcategories..."
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No subcategories found
        </div>
      ) : (
        <div className="responsive-list-grid">
          {filtered.map(sub => {
            const cat = categories.find(c => c.id === sub.categoryId);
            return (
              <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="flex-between">
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{sub.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Parent Category: {cat ? cat.name : 'Unknown'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditingSub(sub)} className="interactive" style={{ padding: '4px', color: 'var(--text-secondary)' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeletingSubId(sub.id)} className="interactive" style={{ padding: '4px', color: 'var(--danger)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Subcategory">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}
          <Input label="Subcategory Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label="Parent Category" options={catOptions} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Select Parent..." />
          <Button type="submit" fullWidth style={{ marginTop: '12px' }}>Save Subcategory</Button>
        </form>
      </BottomSheet>

      {/* Edit Sheet */}
      <BottomSheet isOpen={editingSub !== null} onClose={() => setEditingSub(null)} title="Edit Subcategory Details">
        {editingSub && (
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Input label="Subcategory Name" value={editingSub.name} onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })} required />
            <Select label="Parent Category" options={catOptions} value={editingSub.categoryId} onChange={(e) => setEditingSub({ ...editingSub, categoryId: e.target.value })} />
            <Button type="submit" fullWidth style={{ marginTop: '12px' }}>Save Changes</Button>
          </form>
        )}
      </BottomSheet>

      {/* Delete dialog */}
      <ConfirmDialog
        isOpen={deletingSubId !== null}
        title={deletingSubId && getProductCountForSub(deletingSubId) > 0 ? "Cannot Delete Subcategory" : "Delete Subcategory?"}
        message={
          deletingSubId && getProductCountForSub(deletingSubId) > 0
            ? `This subcategory contains ${getProductCountForSub(deletingSubId)} product(s). You must reassign or delete these products first.`
            : "Are you sure you want to permanently delete this subcategory? This action cannot be undone."
        }
        onConfirm={deletingSubId && getProductCountForSub(deletingSubId) > 0 ? () => setDeletingSubId(null) : handleDelete}
        onCancel={() => setDeletingSubId(null)}
        confirmLabel={deletingSubId && getProductCountForSub(deletingSubId) > 0 ? "Close" : "Yes, Delete"}
        cancelLabel={deletingSubId && getProductCountForSub(deletingSubId) > 0 ? "" : "Cancel"}
        isDanger={!(deletingSubId && getProductCountForSub(deletingSubId) > 0)}
      />
    </div>
  );
};
export default SubcategoriesPage;
