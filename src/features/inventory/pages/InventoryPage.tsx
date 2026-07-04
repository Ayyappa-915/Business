import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../../../hooks/useInventory';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAdjustment, updateVariant, slaughterConversion } from '../../db/dbSlice';
import InventoryCard from '../../../components/cards/InventoryCard';
import BottomSheet from '../../../components/common/BottomSheet';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import SearchBar from '../../../components/common/SearchBar';
import SegmentedControl from '../../../components/common/SegmentedControl';
import { ProductVariant } from '../../../types/variant.types';

import { useNotification } from '../../../context/NotificationContext';

export const InventoryPage: React.FC = () => {
  const { 
    products, variants, units, lowStockAlerts, adjustStockLevel, categories
  } = useInventory();
  const notification = useNotification();

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
    return p ? p.isStockTracked !== false : true;
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
        
        if (priceVar.purpose !== 'buy') {
          totalValueAtRetail += baseStock * (priceVar.price / (priceVar.conversionFactor || 1));
        } else {
          // Estimate yield sale price (40% markup on live cost)
          totalValueAtRetail += baseStock * ((costVar.cost * 1.4) / (costVar.conversionFactor || 1));
        }
      }
    } else {
      prodVariants.forEach(v => {
        const isHens = v.name.toLowerCase().includes('hen') || 
                       v.name.toLowerCase().includes('live') ||
                       prod?.name.toLowerCase().includes('hen') ||
                       prod?.name.toLowerCase().includes('live');
        
        if (isHens && v.weightStock !== undefined && v.weightStock > 0) {
          totalValueAtCost += v.cost * v.weightStock;
          totalValueAtRetail += (v.cost * 1.4) * v.weightStock;
        } else {
          totalValueAtCost += v.cost * v.stock;
          if (v.purpose !== 'buy') {
            totalValueAtRetail += v.price * v.stock;
          } else {
            // Estimate yield sale price (40% markup on live cost)
            totalValueAtRetail += (v.cost * 1.4) * v.stock;
          }
        }
      });
    }
  });

  const potentialProfit = totalValueAtRetail - totalValueAtCost;

  // Filtered variants to display
  const filteredVariants = variants.filter(v => {
    const p = prodMap.get(v.productId);
    if (!p) return false;
    
    // Group by whether the product tracks stock or not
    const isTracked = p.isStockTracked !== false;
    const tabMatch = activeTab === 'exchanged' ? isTracked : !isTracked;
    if (!tabMatch) return false;

    // Search matches product name, variant name or SKU
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.name.toLowerCase().includes(search.toLowerCase()) ||
                          (v.sku && v.sku.toLowerCase().includes(search.toLowerCase()));

    // Filter by Category
    const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;

    const isHens = v.name.toLowerCase().includes('hen') || 
                   v.name.toLowerCase().includes('live') ||
                   p.name.toLowerCase().includes('hen') ||
                   p.name.toLowerCase().includes('live');
    const isLow = isHens && v.weightStock !== undefined ? v.weightStock <= v.lowStockThreshold : v.stock <= v.lowStockThreshold;
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

  // Slaughter form states
  const [slaughterVariantId, setSlaughterVariantId] = useState<string | null>(null);
  const [hensCount, setHensCount] = useState('1');
  const [fleshWeight, setFleshWeight] = useState('');
  const [selectedFleshProductId, setSelectedFleshProductId] = useState<string>('');

  const dispatch = useAppDispatch();
  const purchases = useAppSelector(state => state.db.purchases);

  const activeSlaughterVariant = variants.find(v => v.id === slaughterVariantId);
  const activeSlaughterProduct = activeSlaughterVariant ? products.find(p => p.id === activeSlaughterVariant.productId) : null;

  // Find latest purchase of this Live Hens variant
  const latestPurchase = useMemo(() => {
    if (!slaughterVariantId) return null;
    return [...purchases]
      .reverse()
      .find(pur => pur.items?.some(item => item.variantId === slaughterVariantId));
  }, [purchases, slaughterVariantId]);

  const purchaseItem = useMemo(() => {
    if (!slaughterVariantId || !latestPurchase) return null;
    return latestPurchase.items?.find(item => item.variantId === slaughterVariantId);
  }, [latestPurchase, slaughterVariantId]);

  // Average live weight per hen (e.g. 50 kg / 15 hens = 3.33 kg)
  const avgHenWeight = useMemo(() => {
    if (purchaseItem && purchaseItem.weight && purchaseItem.pieces && purchaseItem.pieces > 0 && purchaseItem.weight > 0) {
      return purchaseItem.weight / purchaseItem.pieces;
    }
    if (activeSlaughterVariant && activeSlaughterVariant.stock > 0 && activeSlaughterVariant.weightStock && activeSlaughterVariant.weightStock > 0) {
      return activeSlaughterVariant.weightStock / activeSlaughterVariant.stock;
    }
    return 3.33; // Default fallback
  }, [purchaseItem, activeSlaughterVariant]);

  // Find all possible target flesh products (Product Types) in the same category (e.g. CHICKEN CENTER)
  const potentialFleshProducts = useMemo(() => {
    if (!slaughterVariantId || !activeSlaughterProduct) return [];
    
    return products.filter(p => 
      p.categoryId === activeSlaughterProduct.categoryId && 
      p.id !== activeSlaughterProduct.id
    );
  }, [slaughterVariantId, activeSlaughterProduct, products]);

  // Set the default selected flesh product type when options change
  useEffect(() => {
    if (potentialFleshProducts.length > 0) {
      const isValid = potentialFleshProducts.some(p => p.id === selectedFleshProductId);
      if (!isValid) {
        setSelectedFleshProductId(potentialFleshProducts[0].id);
      }
    } else {
      setSelectedFleshProductId('');
    }
  }, [potentialFleshProducts, selectedFleshProductId]);

  // Auto-calculate estimated flesh weight when hensCount or avgHenWeight changes
  useEffect(() => {
    const count = parseFloat(hensCount);
    if (!isNaN(count) && count > 0) {
      // 70% yield
      const estFlesh = count * avgHenWeight * 0.70;
      setFleshWeight(estFlesh.toFixed(2));
    } else {
      setFleshWeight('');
    }
  }, [hensCount, avgHenWeight, slaughterVariantId]);

  // Check if flesh variant exists when slaughter modal is opened
  useEffect(() => {
    if (slaughterVariantId && activeSlaughterProduct && activeSlaughterVariant) {
      if (potentialFleshProducts.length === 0) {
        setError('Chicken Flesh product not found in database. Create a sell-only flesh product first.');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [slaughterVariantId, activeSlaughterProduct, activeSlaughterVariant, potentialFleshProducts]);

  const handleSlaughterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slaughterVariantId || !activeSlaughterVariant || !activeSlaughterProduct) return;

    const countVal = parseInt(hensCount);
    const weightVal = parseFloat(fleshWeight);

    if (isNaN(countVal) || countVal <= 0) {
      setError('Please enter a valid count of hens to slaughter.');
      return;
    }
    if (countVal > activeSlaughterVariant.stock) {
      setError(`Cannot slaughter more hens than available in the cage. Available: ${activeSlaughterVariant.stock.toFixed(2)} pcs.`);
      return;
    }
    if (isNaN(weightVal) || weightVal <= 0) {
      setError('Please enter a valid flesh weight.');
      return;
    }

    const targetProductVariants = variants.filter(v => v.productId === selectedFleshProductId);
    if (targetProductVariants.length === 0) {
      setError('Selected target product does not have any variants configured.');
      return;
    }
    // Find base variant (conversionFactor === 1) or fallback to first variant
    const fleshVariant = targetProductVariants.find(v => v.conversionFactor === 1) || targetProductVariants[0];

    const henCost = activeSlaughterVariant.cost || 120;
    const totalHenCost = countVal * henCost;
    const newFleshCost = totalHenCost / weightVal;

    // Use atomic slaughterConversion action to update both live hens and chicken flesh safely
    dispatch(slaughterConversion({
      liveVariantId: activeSlaughterVariant.id,
      fleshVariantId: fleshVariant.id,
      hensCount: countVal,
      hensWeight: countVal * avgHenWeight,
      fleshWeight: weightVal,
      fleshCost: newFleshCost,
      logReason: `Slaughtered ${countVal} Hens`
    }));

    // Reset and close
    setSlaughterVariantId(null);
    setHensCount('1');
    setFleshWeight('');
    setError('');
    
    notification.alert('🎉 Hens slaughtered and flesh stock updated successfully!');
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
              ₹{totalValueAtCost.toFixed(2)}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Expected Profit</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: potentialProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-title)' }}>
              ₹{potentialProfit.toFixed(2)}
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
            
            const unit = units.find(u => u.id === p.unitId);
            const isHens = v.name.toLowerCase().includes('hen') || 
                           p.name.toLowerCase().includes('hen') || 
                           v.name.toLowerCase().includes('live') ||
                           p.name.toLowerCase().includes('live') ||
                           (v.variantUnit || unit?.abbreviation || '').toLowerCase() === 'pcs';

            return (
              <InventoryCard
                key={v.id}
                product={p}
                variant={v}
                unit={units.find(u => u.id === p.unitId)}
                onAdjust={() => setAdjustingVariantId(v.id)}
                onSlaughter={isHens ? () => setSlaughterVariantId(v.id) : undefined}
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

      {/* Slaughter Conversion Bottom Sheet */}
      <BottomSheet
        isOpen={slaughterVariantId !== null}
        onClose={() => { setSlaughterVariantId(null); setError(''); }}
        title="🐔 Slaughter / Process Hens"
      >
        {activeSlaughterVariant && activeSlaughterProduct && (
          <form onSubmit={handleSlaughterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <strong>Product:</strong> {activeSlaughterProduct.name}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                Variant: {activeSlaughterVariant.name}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                Hens in Cage: {activeSlaughterVariant.stock.toFixed(2)} pieces
                {activeSlaughterVariant.weightStock !== undefined && activeSlaughterVariant.weightStock > 0 && ` (${activeSlaughterVariant.weightStock.toFixed(2)} kg)`}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Average weight per hen (latest purchase): <strong>{avgHenWeight.toFixed(2)} kg</strong>
              </span>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

            <Input
              label="Hens Count to Slaughter"
              type="number"
              value={hensCount}
              onChange={(e) => setHensCount(e.target.value)}
              min="1"
              required
            />

            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--info)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Estimated Live Weight: <strong>{(parseFloat(hensCount) * avgHenWeight || 0).toFixed(2)} kg</strong>
              <br />
              Estimated Flesh Yield (70%): <strong>{(parseFloat(hensCount) * avgHenWeight * 0.70 || 0).toFixed(2)} kg</strong>
            </div>

            {potentialFleshProducts.length > 0 && (
              <Select
                label="Target Product Type"
                options={potentialFleshProducts.map(p => ({
                  value: p.id,
                  label: p.name
                }))}
                value={selectedFleshProductId}
                onChange={(e) => setSelectedFleshProductId(e.target.value)}
                required
              />
            )}

            <Input
              label="Actual Flesh Weight Obtained (kg)"
              type="number"
              step="0.01"
              value={fleshWeight}
              onChange={(e) => setFleshWeight(e.target.value)}
              required
              helperText="Pre-filled with average yield estimate. Modify to match your scale weight."
            />

            <Button 
              type="submit" 
              fullWidth 
              style={{ marginTop: '14px', backgroundColor: 'var(--danger)' }}
              disabled={!!error}
            >
              Confirm Slaughter & Update Stocks
            </Button>
          </form>
        )}
      </BottomSheet>

    </div>
  );
};
export default InventoryPage;
