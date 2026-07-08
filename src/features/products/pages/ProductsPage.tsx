import React, { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { useInventory } from '../../../hooks/useInventory';
import { useAuth } from '../../../hooks/useAuth';
import ProductCard from '../../../components/cards/ProductCard';
import ProductForm from '../../../components/forms/ProductForm';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import SegmentedControl from '../../../components/common/SegmentedControl';
import { Product } from '../../../types/product.types';

import { useNotification } from '../../../context/NotificationContext';

export const ProductsPage: React.FC = () => {
  const { products, variants, categories, subcategories, units, removeProduct } = useInventory();
  const { user } = useAuth();
  const notification = useNotification();
  
  const sales = useAppSelector(state => state.db.sales);
  const purchases = useAppSelector(state => state.db.purchases);
  
  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('all');
  
  // Modals / sheets states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const filteredCategoriesPills = categories.filter(c => c.type === activeTab);

  // Filter products list
  const filteredProducts = products.filter(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    const catType = cat ? cat.type : 'exchanged';
    if (catType !== activeTab) return false;

    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
                          
    const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
    
    return matchesSearch && matchesCat;
  });

  const handleTabChange = (tab: 'exchanged' | 'prepared') => {
    setActiveTab(tab);
    setSelectedCatId('all');
  };

  const isProductLinked = (prodId: string) => {
    const inSales = sales.some(sale => sale.items.some(item => item.productId === prodId));
    const inPurchases = purchases.some(purchase => purchase.items.some(item => item.productId === prodId));
    return inSales || inPurchases;
  };

  const handleDeleteConfirm = () => {
    if (deletingProductId) {
      removeProduct(deletingProductId);
      setDeletingProductId(null);
    }
  };

  const handleAttemptDelete = (prodId: string) => {
    if (user?.role !== 'owner') {
      notification.alert('🔒 Access Denied: Only the owner is authorized to delete products.');
      return;
    }
    const prodVariants = getProductVariants(prodId);
    const totalStock = prodVariants.reduce((sum, v) => sum + v.stock, 0);
    if (totalStock > 0) {
      notification.alert('❌ Cannot Delete Product: This product still has active inventory stock. All variant stock for this product must be 0 first.');
      return;
    }
    setDeletingProductId(prodId);
  };

  const getProductVariants = (prodId: string) => {
    return variants.filter(v => v.productId === prodId);
  };

  return (
    <div className="responsive-page-container animate-fade-in">
      
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Store Inventory</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Catalog Items</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Add Product
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Catalog' },
          { value: 'prepared', label: 'Prepared Catalog' }
        ]}
        value={activeTab}
        onChange={(val) => handleTabChange(val as any)}
      />

      {/* Horizontal categories pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', whiteSpace: 'nowrap' }}>
        <button
          onClick={() => setSelectedCatId('all')}
          style={{
            padding: '8px 14px',
            backgroundColor: selectedCatId === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: selectedCatId === 'all' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
          className="interactive"
        >
          All Categories
        </button>
        {filteredCategoriesPills.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCatId(cat.id)}
            style={{
              padding: '8px 14px',
              backgroundColor: selectedCatId === cat.id ? 'var(--primary)' : 'var(--bg-secondary)',
              color: selectedCatId === cat.id ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
            className="interactive"
          >
            {cat.name}
          </button>
        ))}
      </div>

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Search catalog items..."
      />

      {/* Products list cards */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No products found in catalog
        </div>
      ) : (
        <div className="responsive-list-grid">
          {filteredProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              variants={getProductVariants(p.id)}
              category={categories.find(c => c.id === p.categoryId)}
              subcategory={subcategories.find(s => s.id === p.subcategoryId)}
              unit={units.find(u => u.id === p.unitId)}
              onEdit={() => setEditingProduct(p)}
              onDelete={() => handleAttemptDelete(p.id)}
            />
          ))}
        </div>
      )}

      {/* Add Product Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Catalog Item"
      >
        <ProductForm onSuccess={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* Edit Product Sheet */}
      <BottomSheet
        isOpen={editingProduct !== null}
        onClose={() => setEditingProduct(null)}
        title="Edit Product Details"
      >
        {editingProduct && (
          <ProductForm
            productToEdit={editingProduct}
            variantsToEdit={getProductVariants(editingProduct.id)}
            onSuccess={() => setEditingProduct(null)}
          />
        )}
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingProductId !== null}
        title={deletingProductId && isProductLinked(deletingProductId) ? "Cannot Delete Product" : "Delete Catalog Item?"}
        message={
          deletingProductId && isProductLinked(deletingProductId)
            ? "This product has associated sales or purchase records. It cannot be deleted to preserve transaction history."
            : "This action will permanently delete this product and all associated variants from the shop database. This cannot be undone."
        }
        onConfirm={deletingProductId && isProductLinked(deletingProductId) ? () => setDeletingProductId(null) : handleDeleteConfirm}
        onCancel={() => setDeletingProductId(null)}
        confirmLabel={deletingProductId && isProductLinked(deletingProductId) ? "Close" : "Yes, Delete"}
        cancelLabel={deletingProductId && isProductLinked(deletingProductId) ? "" : "Cancel"}
        isDanger={!(deletingProductId && isProductLinked(deletingProductId))}
      />

    </div>
  );
};
export default ProductsPage;
