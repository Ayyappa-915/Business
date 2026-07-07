import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { deleteSale, updateSale } from '../../db/dbSlice';
import SaleCard from '../../../components/cards/SaleCard';
import SaleForm from '../../../components/forms/SaleForm';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import SegmentedControl from '../../../components/common/SegmentedControl';
import Select from '../../../components/common/Select';
import { Sale } from '../../../types/sale.types';

export const SalesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector(state => state.db.sales);
  const products = useAppSelector(state => state.db.products);
  const variants = useAppSelector(state => state.db.variants);
  const categories = useAppSelector(state => state.db.categories);

  const user = useAppSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid' | 'cash' | 'upi' | 'card' | 'credit'>('all');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDeleteSale = async () => {
    if (!selectedSale) return;
    await dispatch(deleteSale(selectedSale.id));
    setSelectedSale(null);
    setIsDeleteConfirmOpen(false);
  };

  const filtered = sales.filter(s => {
    // 1. Filter by category type
    const hasActiveTabItem = s.items.some(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return false;
      const cat = categories.find(c => c.id === prod.categoryId);
      const cType = cat ? cat.type : 'exchanged';
      return cType === activeTab;
    });

    if (!hasActiveTabItem && s.items.length > 0) return false;

    // 2. Filter by date preset
    const saleDate = new Date(s.saleDate);
    const now = new Date();
    if (dateFilter === 'today') {
      if (saleDate.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (saleDate < sevenDaysAgo) return false;
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      if (saleDate < thirtyDaysAgo) return false;
    }

      // 3. Filter by search query
      const matchesSearch = (
        (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (s.customerPhone && s.customerPhone.includes(search)) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      );

      // 4. Filter by payment method/status
      let matchesPayment = true;
      if (paymentFilter === 'paid') {
        matchesPayment = s.paymentStatus === 'paid';
      } else if (paymentFilter === 'unpaid') {
        matchesPayment = s.paymentStatus !== 'paid';
      } else if (paymentFilter !== 'all') {
        matchesPayment = s.paymentMethod === paymentFilter;
      }

      return matchesSearch && matchesPayment;
  });

  const handleSettle = (method: 'cash' | 'upi' | 'card') => {
    if (!selectedSale) return;
    const updated: Sale = {
      ...selectedSale,
      paymentStatus: 'paid',
      paymentMethod: method,
      updatedAt: new Date().toISOString()
    };
    dispatch(updateSale(updated));
    setSelectedSale(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Store Transactions</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Sales Logs</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Record Sale
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Sales' },
          { value: 'prepared', label: 'Prepared Sales' }
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
            { value: 'all', label: '🧾 All Invoices' },
            { value: 'paid', label: '✅ Paid Invoices Only' },
            { value: 'unpaid', label: '❌ Unpaid Invoices Only' },
            { value: 'upi', label: '📱 Paid via UPI / QR' },
            { value: 'cash', label: '💵 Paid via Cash' },
            { value: 'card', label: '💳 Paid via Card' },
            { value: 'credit', label: '📒 Credit Payment Method' }
          ]}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as any)}
          style={{ flex: 1, height: '42px', padding: '0 8px', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by customer name, phone, or invoice ID..."
      />

      {filtered.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--primary-soft)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid var(--primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginTop: '-4px'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Showing {filtered.length} {filtered.length === 1 ? 'sale' : 'sales'}
          </span>
          <span style={{ color: 'var(--primary)', fontSize: '0.92rem' }}>
            Total Value: <strong>₹{filtered.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}</strong>
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No sale transactions recorded
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(s => (
            <SaleCard
              key={s.id}
              sale={s}
              onViewDetails={() => setSelectedSale(s)}
            />
          ))}
        </div>
      )}

      {/* Add sale sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Customer Invoice">
        <SaleForm onSuccess={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* Sale details sheet */}
      <BottomSheet
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        title="Invoice Receipt Details"
      >
        {selectedSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ paddingBottom: '4px' }}>
              <strong>Customer:</strong> {selectedSale.customerName || 'Walk-in'}
              {selectedSale.customerPhone && <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Phone: {selectedSale.customerPhone}</span>}
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {selectedSale.id}</span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Date: {new Date(selectedSale.saleDate).toLocaleString()}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Invoice items list:</span>
              {selectedSale.items.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                const variant = variants.find(v => v.id === item.variantId);
                return (
                  <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                    <span>{prod ? prod.name : 'Unknown Product'} ({variant?.name})</span>
                    <span>{item.quantity} units x ₹{item.unitPrice}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subtotal: ₹{selectedSale.subtotal}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Discount: -₹{selectedSale.discount}</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--success)', fontFamily: 'var(--font-title)' }}>
                Paid Amount: ₹{selectedSale.totalAmount}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Method: {selectedSale.paymentMethod.toUpperCase()} | Status: {selectedSale.paymentStatus.toUpperCase()}</span>
            </div>

            {selectedSale.notes && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                Notes: {selectedSale.notes}
              </div>
            )}

            {selectedSale.paymentStatus !== 'paid' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)', display: 'block' }}>
                  📒 Invoice has Unpaid Debt / Credit
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    onClick={() => handleSettle('cash')} 
                    style={{ 
                      flex: 1, 
                      backgroundColor: 'var(--success-soft)', 
                      color: 'var(--success)', 
                      border: '1.5px solid var(--success)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '8px 0', 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      cursor: 'pointer' 
                    }}
                  >
                    💵 Settle Cash
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSettle('upi')} 
                    style={{ 
                      flex: 1, 
                      backgroundColor: 'var(--primary-soft)', 
                      color: 'var(--primary)', 
                      border: '1.5px solid var(--primary)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '8px 0', 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      cursor: 'pointer' 
                    }}
                  >
                    📱 Settle UPI
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSettle('card')} 
                    style={{ 
                      flex: 1, 
                      backgroundColor: 'var(--bg-tertiary)', 
                      color: 'var(--text-secondary)', 
                      border: '1.5px solid var(--border-color)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '8px 0', 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      cursor: 'pointer' 
                    }}
                  >
                    💳 Settle Card
                  </button>
                </div>
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
                  🗑️ Delete Invoice (Admin Only)
                </Button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSale}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This will refund stocks and cannot be undone."
        confirmText="Delete"
        type="danger"
      />


    </div>
  );
};
export default SalesPage;
