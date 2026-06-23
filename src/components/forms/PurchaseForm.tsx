import React, { useState } from 'react';
import { Trash2, Plus, Package, ChefHat, BookOpen, PenLine } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addPurchase } from '../../features/db/dbSlice';
import { Purchase, PurchaseItem, FreePurchaseItem } from '../../types/purchase.types';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import TextArea from '../common/TextArea';

interface PurchaseFormProps {
  onSuccess: () => void;
}

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'ltr', label: 'Litres (ltr)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'box', label: 'Box' },
  { value: 'pkt', label: 'Packet (pkt)' },
  { value: 'doz', label: 'Dozen (doz)' },
  { value: 'bag', label: 'Bag' },
  { value: 'bundle', label: 'Bundle' },
];

// Combined cart item that can be either catalog-linked or free-form
type CartEntry =
  | { mode: 'catalog'; item: PurchaseItem; label: string; costPerUnit: number }
  | { mode: 'free'; item: FreePurchaseItem };

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSuccess }) => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.db.products);
  const variants = useAppSelector(state => state.db.variants);
  const categories = useAppSelector(state => state.db.categories);

  // ── Top-level type toggle ───────────────────────────────────────────────
  const [purchaseType, setPurchaseType] = useState<'exchanged' | 'prepared'>('exchanged');

  // ── For exchanged: sub-mode ─────────────────────────────────────────────
  const [exchangedMode, setExchangedMode] = useState<'catalog' | 'free'>('catalog');

  // ── Catalog-linked entry fields ─────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [catalogQty, setCatalogQty] = useState('1');
  const [catalogCost, setCatalogCost] = useState('');

  // ── Free-form entry fields ──────────────────────────────────────────────
  const [freeItemName, setFreeItemName] = useState('');
  const [freeQty, setFreeQty] = useState('1');
  const [freeUnit, setFreeUnit] = useState('pcs');
  const [freeCost, setFreeCost] = useState('');

  // ── Unified cart ────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartEntry[]>([]);

  // ── Prepared: ingredient list + category ───────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [preparedItems, setPreparedItems] = useState<{ name: string; cost: number }[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCost, setIngredientCost] = useState('');

  // ── Payment info ────────────────────────────────────────────────────────
  const [supplierName, setSupplierName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // ── Derived options ─────────────────────────────────────────────────────
  // Only exchanged, stock-tracked products
  const catalogProducts = products.filter(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    return cat?.type === 'exchanged' && p.isStockTracked !== false;
  });
  const productOptions = catalogProducts.map(p => ({ value: p.id, label: p.name }));

  // Variants for selected product
  const productVariants = variants.filter(v => v.productId === selectedProductId && v.purpose !== 'sell');
  const product = products.find(p => p.id === selectedProductId);
  const variantOptions = productVariants.map(v => {
    const cleanedVarName = product && v.name.toLowerCase().startsWith(product.name.toLowerCase())
      ? v.name.slice(product.name.length).trim()
      : v.name;
    return {
      value: v.id,
      label: `${cleanedVarName}  (Stock: ${v.stock}  |  Cost: ₹${v.cost})`,
    };
  });

  const preparedCategoryOptions = categories
    .filter(c => c.type === 'prepared')
    .map(c => ({ value: c.id, label: c.name }));

  // When product changes, reset variant
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    setSelectedVariantId('');
    setCatalogCost('');
  };

  // When variant changes, pre-fill cost
  const handleVariantChange = (id: string) => {
    setSelectedVariantId(id);
    const v = variants.find(v => v.id === id);
    if (v) setCatalogCost(v.cost.toString());
  };

  // ── Add catalog item to cart ────────────────────────────────────────────
  const handleAddCatalogItem = () => {
    if (!selectedProductId) { setError('Please select a product.'); return; }
    if (!selectedVariantId) { setError('Please select a variant (size/type).'); return; }
    const qty = parseFloat(catalogQty);
    const cpu = parseFloat(catalogCost);
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be > 0.'); return; }
    if (isNaN(cpu) || cpu < 0) { setError('Cost must be 0 or more.'); return; }

    const variant = variants.find(v => v.id === selectedVariantId);
    if (variant && variant.purpose === 'sell') {
      setError('Cannot purchase a "Sell Only" variant.');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    const label = `${product?.name} — ${variant?.name}`;

    // Check if same variant already in cart → update qty instead
    const existing = cart.findIndex(e => e.mode === 'catalog' && e.item.variantId === selectedVariantId);
    if (existing !== -1) {
      const updated = [...cart];
      const entry = updated[existing] as { mode: 'catalog'; item: PurchaseItem; label: string; costPerUnit: number };
      entry.item = { ...entry.item, quantity: entry.item.quantity + qty, costPrice: cpu };
      entry.costPerUnit = cpu;
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          mode: 'catalog',
          item: { productId: selectedProductId, variantId: selectedVariantId, quantity: qty, costPrice: cpu },
          label,
          costPerUnit: cpu,
        },
      ]);
    }

    setSelectedVariantId('');
    setCatalogQty('1');
    setCatalogCost('');
    setError('');
  };

  // ── Add free-form item to cart ──────────────────────────────────────────
  const handleAddFreeItem = () => {
    if (!freeItemName.trim()) { setError('Item name is required.'); return; }
    const qty = parseFloat(freeQty);
    const cpu = parseFloat(freeCost);
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be > 0.'); return; }
    if (isNaN(cpu) || cpu < 0) { setError('Cost must be 0 or more.'); return; }

    setCart(prev => [
      ...prev,
      {
        mode: 'free',
        item: { name: freeItemName.trim(), quantity: qty, unit: freeUnit, costPerUnit: cpu, totalCost: qty * cpu },
      },
    ]);
    setFreeItemName('');
    setFreeQty('1');
    setFreeCost('');
    setError('');
  };

  const handleRemoveCartItem = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Prepared handlers ───────────────────────────────────────────────────
  const handleAddIngredient = () => {
    if (!ingredientName.trim()) { setError('Ingredient name is required.'); return; }
    const costVal = parseFloat(ingredientCost);
    if (isNaN(costVal) || costVal <= 0) { setError('Cost must be > 0.'); return; }
    setPreparedItems(prev => [...prev, { name: ingredientName.trim(), cost: costVal }]);
    setIngredientName('');
    setIngredientCost('');
    setError('');
  };

  const handleRemoveIngredient = (idx: number) => {
    setPreparedItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (purchaseType === 'exchanged') {
      if (cart.length === 0) { setError('Add at least one item to the bill.'); return; }

      const catalogItems = cart
        .filter((e): e is { mode: 'catalog'; item: PurchaseItem; label: string; costPerUnit: number } => e.mode === 'catalog')
        .map(e => e.item);

      const freeItems = cart
        .filter((e): e is { mode: 'free'; item: FreePurchaseItem } => e.mode === 'free')
        .map(e => e.item);

      const catalogTotal = catalogItems.reduce((s, i) => s + i.quantity * i.costPrice, 0);
      const freeTotal = freeItems.reduce((s, i) => s + i.totalCost, 0);

      const newPurchase: Purchase = {
        id: 'pur_' + Math.random().toString(36).substr(2, 9),
        type: 'exchanged',
        items: catalogItems,             // catalog-linked → triggers stock auto-update
        exchangedItems: freeItems,       // free-form → just expense tracking
        supplierName: supplierName.trim() || undefined,
        purchaseDate: new Date().toISOString(),
        totalAmount: catalogTotal + freeTotal,
        paymentStatus,
        paymentMethod,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(addPurchase(newPurchase));
      onSuccess();
    } else {
      if (!selectedCategoryId) { setError('Please select a prepared category.'); return; }
      if (preparedItems.length === 0) { setError('Add at least one ingredient.'); return; }
      const totalAmount = preparedItems.reduce((s, i) => s + i.cost, 0);
      const newPurchase: Purchase = {
        id: 'pur_' + Math.random().toString(36).substr(2, 9),
        type: 'prepared',
        categoryId: selectedCategoryId,
        preparedItems,
        supplierName: supplierName.trim() || undefined,
        purchaseDate: new Date().toISOString(),
        items: [],
        totalAmount,
        paymentStatus,
        paymentMethod,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(addPurchase(newPurchase));
      onSuccess();
    }
  };

  // ── Totals ──────────────────────────────────────────────────────────────
  const cartTotal = cart.reduce((s, e) => {
    if (e.mode === 'catalog') return s + e.item.quantity * e.item.costPrice;
    return s + e.item.totalCost;
  }, 0);
  const preparedTotal = preparedItems.reduce((s, i) => s + i.cost, 0);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '76vh' }}>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, padding: '8px 12px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {/* ── Purchase type top tabs ── */}
      <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
        {([
          { value: 'exchanged', label: '📦 Stock Purchase' },
          { value: 'prepared', label: '🍽️ Ingredients' },
        ] as const).map(tab => (
          <button key={tab.value} type="button"
            onClick={() => { setPurchaseType(tab.value); setError(''); }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 'var(--radius-full)', border: 'none',
              backgroundColor: purchaseType === tab.value ? 'var(--primary)' : 'transparent',
              color: purchaseType === tab.value ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >{tab.label}</button>
        ))}
      </div>

      <Input
        label="Supplier / Shop Name (Optional)"
        placeholder="e.g. Balaji Distributors"
        value={supplierName}
        onChange={(e) => setSupplierName(e.target.value)}
      />

      {/* ══════════════════ EXCHANGED SECTION ══════════════════ */}
      {purchaseType === 'exchanged' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Sub-mode switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button"
              onClick={() => { setExchangedMode('catalog'); setError(''); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                borderColor: exchangedMode === 'catalog' ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: exchangedMode === 'catalog' ? 'var(--primary-soft)' : 'transparent',
                color: exchangedMode === 'catalog' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <BookOpen size={14} /> From Catalog
            </button>
            <button type="button"
              onClick={() => { setExchangedMode('free'); setError(''); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                borderColor: exchangedMode === 'free' ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: exchangedMode === 'free' ? 'var(--primary-soft)' : 'transparent',
                color: exchangedMode === 'free' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <PenLine size={14} /> Free Entry
            </button>
          </div>

          {/* ── CATALOG MODE ── */}
          {exchangedMode === 'catalog' && (
            <div style={{ padding: '12px', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={12} /> Pick from your product catalog
              </div>

              {/* Helper tip */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                ✅ Stock will auto-update & cost price will sync when saved
              </div>

              <Select
                label="Product"
                options={productOptions}
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                placeholder="Select product..."
              />

              {selectedProductId && (
                <Select
                  label="Variant (Size / Type)"
                  options={variantOptions}
                  value={selectedVariantId}
                  onChange={(e) => handleVariantChange(e.target.value)}
                  placeholder="Select variant..."
                  helperText={productVariants.length === 0 ? 'No variants found for this product' : undefined}
                />
              )}

              {selectedVariantId && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    label="Quantity"
                    type="number"
                    placeholder="1"
                    value={catalogQty}
                    onChange={(e) => setCatalogQty(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0' }}>
                    <Input
                      label="Cost per Unit (₹)"
                      type="number"
                      placeholder="0.00"
                      value={catalogCost}
                      onChange={(e) => setCatalogCost(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Item subtotal preview */}
              {selectedVariantId && catalogQty && catalogCost && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {catalogQty} × ₹{catalogCost}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    = ₹{(parseFloat(catalogQty) * parseFloat(catalogCost) || 0).toFixed(2)}
                  </span>
                </div>
              )}

              <Button type="button" variant="outline" size="sm" onClick={handleAddCatalogItem} leftIcon={<Plus size={14} />}>
                Add to Bill
              </Button>
            </div>
          )}

          {/* ── FREE ENTRY MODE ── */}
          {exchangedMode === 'free' && (
            <div style={{ padding: '12px', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PenLine size={12} /> Item not in your catalog
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}>
                ⚠️ Only for expense tracking — no stock update. Add the product to your catalog first to track stock.
              </div>

              <Input
                label="Item / Product Name"
                placeholder="e.g. Motor Oil, Cleaning Soap"
                value={freeItemName}
                onChange={(e) => setFreeItemName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="1"
                  value={freeQty}
                  onChange={(e) => setFreeQty(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Select
                  label="Unit"
                  options={UNIT_OPTIONS}
                  value={freeUnit}
                  onChange={(e) => setFreeUnit(e.target.value)}
                  style={{ flex: 1.5 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <Input
                  label="Cost per Unit (₹)"
                  type="number"
                  placeholder="0.00"
                  value={freeCost}
                  onChange={(e) => setFreeCost(e.target.value)}
                  style={{ flex: 1 }}
                />
                <div style={{ flex: 1, height: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px', backgroundColor: 'var(--bg-tertiary)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Item Total</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    ₹{((parseFloat(freeQty) || 0) * (parseFloat(freeCost) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFreeItem} leftIcon={<Plus size={14} />}>
                Add to Bill
              </Button>
            </div>
          )}

          {/* ── Cart ── */}
          {cart.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Bill Items ({cart.length})
              </span>

              {cart.map((entry, idx) => {
                const isLinked = entry.mode === 'catalog';
                const total = isLinked
                  ? (entry.item.quantity * entry.item.costPrice).toFixed(2)
                  : entry.item.totalCost.toFixed(2);
                const desc = isLinked
                  ? `${entry.item.quantity} unit${entry.item.quantity !== 1 ? 's' : ''} × ₹${entry.item.costPrice}`
                  : `${entry.item.quantity} ${entry.item.unit} × ₹${entry.item.costPerUnit}`;
                const name = isLinked ? entry.label : entry.item.name;

                return (
                  <div key={idx} style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: `1px solid ${isLinked ? 'var(--success)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{isLinked ? '📦' : '📝'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{name}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {desc} = <strong style={{ color: 'var(--text-primary)' }}>₹{total}</strong>
                        {isLinked && (
                          <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>
                            ✓ Stock syncs
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveCartItem(idx)} style={{ color: 'var(--danger)', padding: '4px', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              {/* Bill total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', backgroundColor: 'var(--primary-soft)',
                border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, fontSize: '0.95rem',
              }}>
                <span>📋 Total Bill</span>
                <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ PREPARED SECTION ══════════════════ */}
      {purchaseType === 'prepared' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Select
            label="Prepared Food Category"
            options={preparedCategoryOptions}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            placeholder="Select category..."
            helperText="This cost will be linked to the selected food category"
          />
          <div style={{ padding: '12px', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Add Ingredient
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input label="Ingredient Name" placeholder="e.g. Milk, Rice, Vegetables" value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} style={{ flex: 1.5 }} />
              <Input label="Cost (₹)" type="number" placeholder="0" value={ingredientCost} onChange={(e) => setIngredientCost(e.target.value)} style={{ flex: 1 }} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} leftIcon={<Plus size={14} />}>
              Add Ingredient
            </Button>
          </div>
          {preparedItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Ingredients ({preparedItems.length})</span>
              {preparedItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>₹{item.cost}</div>
                  </div>
                  <button type="button" onClick={() => handleRemoveIngredient(idx)} style={{ color: 'var(--danger)', padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--primary-soft)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.95rem' }}>
                <span>🧾 Total Cost</span>
                <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{preparedTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Shared payment fields ── */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Select label="Status" options={[{ value: 'paid', label: '✅ Paid' }, { value: 'partial', label: '⏳ Partial' }, { value: 'unpaid', label: '❌ Unpaid' }]} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} style={{ flex: 1 }} />
          <Select label="Method" options={[{ value: 'cash', label: '💵 Cash' }, { value: 'upi', label: '📱 UPI' }, { value: 'card', label: '💳 Card' }, { value: 'credit', label: '📒 Credit' }]} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} style={{ flex: 1 }} />
        </div>
        <TextArea label="Notes / Remarks" placeholder="Invoice number, remarks..." value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" fullWidth>
        {purchaseType === 'exchanged'
          ? `💾 Record Purchase${cartTotal > 0 ? ` — ₹${cartTotal.toFixed(2)}` : ''}`
          : `💾 Record Ingredients${preparedTotal > 0 ? ` — ₹${preparedTotal.toFixed(2)}` : ''}`}
      </Button>
    </form>
  );
};
export default PurchaseForm;
