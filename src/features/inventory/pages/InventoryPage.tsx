import React, { useState } from 'react';
import { useInventory } from '../../../hooks/useInventory';
import InventoryCard from '../../../components/cards/InventoryCard';
import BottomSheet from '../../../components/common/BottomSheet';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import SearchBar from '../../../components/common/SearchBar';
import Badge from '../../../components/common/Badge';
import SegmentedControl from '../../../components/common/SegmentedControl';
import { ProductVariant } from '../../../types/variant.types';

export const InventoryPage: React.FC = () => {
  const { 
    products, variants, units, valuation, lowStockAlerts, adjustStockLevel, categories
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [selectedCatId, setSelectedCatId] = useState('all');
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  
  // Adjustment form states
  const [adjustingVariantId, setAdjustingVariantId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustReason, setAdjustReason] = useState('Manual Correction');

  const [error, setError] = useState('');

  // Find target variant and parent product for form
  const activeVariant = variants.find(v => v.id === adjustingVariantId);
  const activeProduct = activeVariant ? products.find(p => p.id === activeVariant.productId) : null;

  const catMap = new Map(categories.map(c => [c.id, c]));
  const prodMap = new Map(products.map(p => [p.id, p]));

  // Mode specific calculations for valuation (exchanged only)
  const exchangedVariants = variants.filter(v => {
    const p = prodMap.get(v.productId);
    if (!p) return false;
    const cat = catMap.get(p.categoryId);
    return cat ? cat.type === 'exchanged' : true;
  });

  // Group by product to avoid double counting shared stock
  const variantsByProduct: { [productId: string]: ProductVariant[] } = {};
  exchangedVariants.forEach(v => {
    if (!variantsByProduct[v.productId]) {
      variantsByProduct[v.productId] = [];
    }
    variantsByProduct[v.productId].push(v);
  });

  let totalValueAtCost = 0;
  let totalValueAtRetail = 0;

  Object.entries(variantsByProduct).forEach(([productId, prodVariants]) => {
    const prod = prodMap.get(productId);
    if (prod && prod.hasSharedStock) {
      if (prodVariants.length > 0) {
        const anyVar = prodVariants[0];
        const baseStock = anyVar.stock * (anyVar.conversionFactor || 1);
        const costVar = prodVariants.find(v => v.purpose === 'buy' || v.purpose === 'both') || anyVar;
        const priceVar = prodVariants.find(v => v.purpose === 'sell' || v.purpose === 'both') || anyVar;
        totalValueAtCost += baseStock * (costVar.cost / (costVar.conversionFactor || 1));
        totalValueAtRetail += baseStock * (priceVar.price / (priceVar.conversionFactor || 1));
      }
    } else {
      prodVariants.forEach(v => {
        totalValueAtCost += v.cost * v.stock;
        totalValueAtRetail += v.price * v.stock;
      });
    }
  });

  const potentialProfit = totalValueAtRetail - totalValueAtCost;

  // Filtered variants to display
  const filteredVariants = variants.filter(v => {
    const p = prodMap.get(v.productId);
    if (!p) return false;
    const cat = catMap.get(p.categoryId);
    const catType = cat ? cat.type : 'exchanged';
    
    if (catType !== activeTab) return false;

    // Search matches product name, variant name or SKU
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.name.toLowerCase().includes(search.toLowerCase()) ||
                          (v.sku && v.sku.toLowerCase().includes(search.toLowerCase()));

    // Filter by Category
    const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;

    const isLow = v.stock <= v.lowStockThreshold;
    const matchesFilter = activeTab === 'prepared' || !filterLowStock || isLow;

    return matchesSearch && matchesFilter && matchesCat;
  });

  // Count low stock alert variants for exchanged items only
  const activeLowStockAlertsCount = lowStockAlerts.filter(alert => {
    const cat = catMap.get(products.find(p => p.id === alert.productId)?.categoryId || '');
    return cat?.type === 'exchanged';
  }).length;

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariantId) return;

    const activeProd = activeVariant ? products.find(p => p.id === activeVariant.productId) : null;
    const activeUnit = activeProd ? units.find(u => u.id === activeProd.unitId) : null;
    const isDecimalAllowed = activeUnit ? activeUnit.isDecimalAllowed : false;

    const qtyVal = isDecimalAllowed ? parseFloat(adjustQty) : parseInt(adjustQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError(isDecimalAllowed ? 'Please enter a valid quantity.' : 'Please enter a valid whole number count.');
      return;
    }

    adjustStockLevel({
      id: 'adj_' + Math.random().toString(36).substr(2, 9),
      productId: activeVariant?.productId || '',
      variantId: adjustingVariantId,
      type: adjustType,
      quantity: qtyVal,
      reason: adjustReason,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Reset
    setAdjustingVariantId(null);
    setAdjustQty('1');
    setAdjustReason('Manual Correction');
    setAdjustType('add');
    setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      
      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Inventory' },
          { value: 'prepared', label: 'Prepared Menu' }
        ]}
        value={activeTab}
        onChange={(val) => {
          setActiveTab(val as any);
          setFilterLowStock(false);
          setSelectedCatId('all');
        }}
      />

      {/* Horizontal categories pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', whiteSpace: 'nowrap', marginTop: '-4px' }}>
        <button
          onClick={() => setSelectedCatId('all')}
          style={{
            padding: '8px 14px',
            backgroundColor: selectedCatId === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: selectedCatId === 'all' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        >
          All Categories
        </button>
        {categories.filter(c => c.type === activeTab).map(cat => (
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
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Inventory Valuation Header Card (Exchanged Only) */}
      {activeTab === 'exchanged' ? (
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--success-soft) 100%)',
          borderColor: 'var(--primary)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stock Capital at Cost</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              ₹{totalValueAtCost}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Expected Profit</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-title)' }}>
              ₹{potentialProfit}
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--info-soft) 100%)',
          borderColor: 'var(--primary)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Prepared Categories</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              {categories.filter(c => c.type === 'prepared').length}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Menu Products</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--info)', fontFamily: 'var(--font-title)' }}>
              {filteredVariants.length} items
            </p>
          </div>
        </div>
      )}

      {/* Filter pills (Exchanged Only) */}
      {activeTab === 'exchanged' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterLowStock(false)}
            style={{
              padding: '8px 14px',
              backgroundColor: !filterLowStock ? 'var(--primary)' : 'var(--bg-secondary)',
              color: !filterLowStock ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              flex: 1
            }}
            className="interactive"
          >
            All Items ({exchangedVariants.length})
          </button>
          <button
            onClick={() => setFilterLowStock(true)}
            style={{
              padding: '8px 14px',
              backgroundColor: filterLowStock ? 'var(--warning)' : 'var(--bg-secondary)',
              color: filterLowStock ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            className="interactive"
          >
            ⚠️ Low Alerts ({activeLowStockAlertsCount})
          </button>
        </div>
      )}

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Type product or SKU code..."
      />

      {/* Inventory listing */}
      {filteredVariants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No inventory stock rows match filters
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredVariants.map(v => {
            const p = products.find(prod => prod.id === v.productId);
            if (!p) return null;
            return (
              <InventoryCard
                key={v.id}
                product={p}
                variant={v}
                unit={units.find(u => u.id === p.unitId)}
                onAdjust={() => setAdjustingVariantId(v.id)}
              />
            );
          })}
        </div>
      )}

      {/* Adjust Stock Bottom Sheet Form */}
      <BottomSheet
        isOpen={adjustingVariantId !== null}
        onClose={() => setAdjustingVariantId(null)}
        title="Adjust Variant Stock Level"
      >
        {activeVariant && activeProduct && (
          <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <strong>Product:</strong> {activeProduct.name}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                Variant: {activeVariant.name} • SKU: {activeVariant.sku || 'None'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                Current Count: {activeVariant.stock} {units.find(u => u.id === activeProduct.unitId)?.abbreviation || 'pcs'}
              </span>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

            <Select
              label="Adjustment Action"
              options={[
                { value: 'add', label: '➕ Add Units to Stock' },
                { value: 'subtract', label: '➖ Subtract (Loss / Sale)' },
                { value: 'set', label: '📝 Overwrite Count (Audit check)' }
              ]}
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
            />

            <Input
              label="Quantity Amount"
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              min="1"
              required
            />

            <Select
              label="Correction Reason"
              options={[
                { value: 'Manual Correction', label: 'Manual Audit Check' },
                { value: 'Damage Log', label: 'Item Damaged / Expired' },
                { value: 'Restock Adjustment', label: 'Internal Restock' },
                { value: 'Initial Import', label: 'Opening balance setup' }
              ]}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />

            <Button type="submit" fullWidth style={{ marginTop: '14px' }}>
              Apply Stock Correction
            </Button>
          </form>
        )}
      </BottomSheet>

    </div>
  );
};
export default InventoryPage;
