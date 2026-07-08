import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import PurchaseCard from '../../../components/cards/PurchaseCard';
import PurchaseForm from '../../../components/forms/PurchaseForm';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import Button from '../../../components/common/Button';
import SegmentedControl from '../../../components/common/SegmentedControl';
import Select from '../../../components/common/Select';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { Purchase } from '../../../types/purchase.types';
import { deletePurchase } from '../../db/dbSlice';

export const PurchasesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const purchases = useAppSelector(state => state.db.purchases);
  const products = useAppSelector(state => state.db.products);
  const variants = useAppSelector(state => state.db.variants);
  
  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'upi' | 'card' | 'credit'>('all');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDeletePurchase = async () => {
    if (!selectedPurchase) return;
    await dispatch(deletePurchase(selectedPurchase.id));
    setSelectedPurchase(null);
    setIsDeleteConfirmOpen(false);
  };

  const categories = useAppSelector(state => state.db.categories);

  const filtered = purchases.filter(p => {
    // 1. Filter by purchase type tab
    const pType = p.type || 'exchanged';
    if (pType !== activeTab) return false;

    // 2. Filter by date preset
    const purchaseDate = new Date(p.purchaseDate);
    const now = new Date();
    if (dateFilter === 'today') {
      if (purchaseDate.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (purchaseDate < sevenDaysAgo) return false;
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      if (purchaseDate < thirtyDaysAgo) return false;
    }

    // 3. Search filter
    const matchesSupplier = p.supplierName?.toLowerCase().includes(search.toLowerCase());

    const matchesSearch = activeTab === 'prepared' ? (() => {
      const catName = categories.find(c => c.id === p.categoryId)?.name || '';
      const matchesCat = catName.toLowerCase().includes(search.toLowerCase());
      const matchesIng = p.preparedItems?.some(ing => ing.name.toLowerCase().includes(search.toLowerCase()));
      return matchesSupplier || matchesCat || matchesIng;
    })() : (() => {
      // Search in free-form exchangedItems (new format)
      const matchesExchanged = p.exchangedItems?.some(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
      // Also search legacy variant-linked items
      const matchesLegacy = p.items?.some(item => {
        const prod = products.find(pr => pr.id === item.productId);
        return prod ? prod.name.toLowerCase().includes(search.toLowerCase()) : false;
      });
      return matchesSupplier || matchesExchanged || matchesLegacy;
    })();

    // 4. Filter by payment method
    const matchesPayment = paymentFilter === 'all' || p.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expenses & Invoices</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Purchases Log</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Record Purchase
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Items' },
          { value: 'prepared', label: 'Prepared Items' }
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
      />

      <SegmentedControl
        options={[
          { value: 'all', label: 'All Time' },
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' }
        ]}
        value={dateFilter}
        onChange={(val) => setDateFilter(val as any)}
        style={{ marginTop: '-4px' }}
      />

      <div style={{ display: 'flex', gap: '8px', marginTop: '-4px' }}>
        <Select
          options={[
            { value: 'all', label: '💳 All Payment Methods' },
            { value: 'upi', label: '📱 UPI / QR Code' },
            { value: 'cash', label: '💵 Cash' },
            { value: 'card', label: '💳 Card' },
            { value: 'credit', label: '📒 Credit / Unpaid' }
          ]}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as any)}
          style={{ flex: 1, height: '42px', padding: '0 8px', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={activeTab === 'prepared' ? "Search ingredients or categories..." : "Search supplier or product restocked..."}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No purchase logs found for this filter
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(p => (
            <PurchaseCard
              key={p.id}
              purchase={p}
              onViewDetails={() => setSelectedPurchase(p)}
            />
          ))}
        </div>
      )}

      {/* Add purchase sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Purchase Order">
        <PurchaseForm onSuccess={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* Purchase details sheet */}
      <BottomSheet
        isOpen={selectedPurchase !== null}
        onClose={() => setSelectedPurchase(null)}
        title="Purchase Details Summary"
      >
        {selectedPurchase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <strong>Supplier:</strong> {selectedPurchase.supplierName || (selectedPurchase.type === 'prepared' ? 'Ingredient Raw Materials' : 'N/A')}
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Date: {new Date(selectedPurchase.purchaseDate).toLocaleString()}
              </span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Payment Method: {selectedPurchase.paymentMethod.toUpperCase()} | Status: {selectedPurchase.paymentStatus.toUpperCase()}
              </span>
              {selectedPurchase.type === 'prepared' && (
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Category: {categories.find(c => c.id === selectedPurchase.categoryId)?.name || 'Unknown Category'}
                </span>
              )}
            </div>

            {selectedPurchase.type === 'prepared' ? (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Prepared Ingredients Cost:</span>
                {selectedPurchase.preparedItems?.map((item, idx) => (
                  <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                    <span>{item.name}</span>
                    <span>₹{item.cost}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>📦 Items Purchased:</span>

                {/* New free-form exchangedItems */}
                {selectedPurchase.exchangedItems && selectedPurchase.exchangedItems.length > 0 ? (
                  selectedPurchase.exchangedItems.map((item, idx) => (
                    <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '7px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                      <span style={{ fontWeight: 600 }}>
                        {item.name}
                        {item.pieces !== undefined && (
                          <span style={{ fontWeight: 500, color: 'var(--info)', fontSize: '0.75rem', marginLeft: '6px' }}>
                            ({item.pieces} pcs)
                          </span>
                        )}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.quantity} {item.unit} × ₹{item.costPerUnit} = <strong style={{ color: 'var(--text-primary)' }}>₹{item.totalCost.toFixed(2)}</strong></span>
                    </div>
                  ))
                ) : (
                  /* Legacy variant-linked items */
                  selectedPurchase.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    const variant = variants.find(v => v.id === item.variantId);
                    return (
                      <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <span>
                          {prod ? prod.name : 'Unknown Product'} ({variant?.name})
                          {item.pieces !== undefined && (
                            <span style={{ fontWeight: 500, color: 'var(--info)', fontSize: '0.75rem', marginLeft: '6px' }}>
                              ({item.pieces} pcs)
                            </span>
                          )}
                        </span>
                        <span>{item.quantity} units @ ₹{item.costPrice}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {(() => {
              const itemsCost = selectedPurchase.type === 'prepared'
                ? (selectedPurchase.preparedItems?.reduce((s, i) => s + i.cost, 0) || 0)
                : (selectedPurchase.exchangedItems && selectedPurchase.exchangedItems.length > 0
                    ? selectedPurchase.exchangedItems.reduce((s, i) => s + i.totalCost, 0)
                    : selectedPurchase.items?.reduce((s, i) => s + i.quantity * i.costPrice, 0) || 0);
              
              return (
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Items Total: ₹{itemsCost.toFixed(2)}</span>
                  {selectedPurchase.additionalCost && (
                    <span>
                      + {selectedPurchase.additionalCostReason || 'Petrol / Transport'}: ₹{selectedPurchase.additionalCost.toFixed(2)}
                    </span>
                  )}
                  <strong style={{ fontSize: '1.1rem', color: 'var(--success)', marginTop: '2px' }}>
                    Total Paid Amount: ₹{selectedPurchase.totalAmount.toFixed(2)}
                  </strong>
                </div>
              );
            })()}
            {selectedPurchase.notes && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                Notes: {selectedPurchase.notes}
              </div>
            )}
            {user?.role === 'owner' && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <Button 
                  type="button" 
                  variant="danger" 
                  fullWidth 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  🗑️ Delete Purchase (Admin Only)
                </Button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeletePurchase}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase? This will revert stocks and cannot be undone."
        confirmLabel="Delete"
        isDanger={true}
      />
    </div>
  );
};
export default PurchasesPage;
