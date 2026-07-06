import React, { useState } from 'react';
import { Edit2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { updateVariant, addVariant, deleteVariant } from '../../db/dbSlice';
import VariantForm from '../../../components/forms/VariantForm';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SegmentedControl from '../../../components/common/SegmentedControl';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import { ProductVariant } from '../../../types/variant.types';

export const VariantsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const variants = useAppSelector(state => state.db.variants);
  const products = useAppSelector(state => state.db.products);
  const categories = useAppSelector(state => state.db.categories);
  const units = useAppSelector(state => state.db.units);
  const sales = useAppSelector(state => state.db.sales);
  const purchases = useAppSelector(state => state.db.purchases);

  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deletingVariantItem, setDeletingVariantItem] = useState<ProductVariant | null>(null);
  
  // Controls for Add Variant Bottom Sheet
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isProductPreselected, setIsProductPreselected] = useState(false);
  const [newVarProductId, setNewVarProductId] = useState('');
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarCost, setNewVarCost] = useState('');
  const [newVarStock, setNewVarStock] = useState('0');
  const [newVarLowStock, setNewVarLowStock] = useState('5');
  const [newVarSku, setNewVarSku] = useState('');
  const [newVarBarcode, setNewVarBarcode] = useState('');
  const [newVarConversionFactor, setNewVarConversionFactor] = useState('1');
  const [newVarUnit, setNewVarUnit] = useState('');
  const [newVarPurpose, setNewVarPurpose] = useState<'both' | 'buy' | 'sell'>('both');
  const [addError, setAddError] = useState('');

  // Expand/collapse state for each product group
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Helper selectors
  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const getUnitAbbr = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return 'pcs';
    const unit = units.find(u => u.id === prod.unitId);
    return unit?.abbreviation || 'pcs';
  };

  // Filter products by tab (exchanged or prepared)
  const tabProducts = products.filter(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    const catType = cat ? cat.type : 'exchanged';
    return catType === activeTab;
  });

  // Filter variants belonging to this tab's products
  const tabVariants = variants.filter(v => {
    const p = products.find(prod => prod.id === v.productId);
    if (!p) return false;
    const cat = categories.find(c => c.id === p.categoryId);
    const catType = cat ? cat.type : 'exchanged';
    return catType === activeTab;
  });

  // Apply search and product dropdown filters
  const filteredVariants = tabVariants.filter(v => {
    const p = products.find(prod => prod.id === v.productId);
    if (!p) return false;

    // Filter by product dropdown
    if (selectedProductId !== 'all' && v.productId !== selectedProductId) {
      return false;
    }

    // Filter by search bar query
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchProduct = p.name.toLowerCase().includes(query);
      const matchVariant = v.name.toLowerCase().includes(query);
      const matchSku = v.sku ? v.sku.toLowerCase().includes(query) : false;
      return matchProduct || matchVariant || matchSku;
    }

    return true;
  });

  // Group variants by productId
  const groupedVariants: Record<string, ProductVariant[]> = {};
  filteredVariants.forEach(v => {
    if (!groupedVariants[v.productId]) {
      groupedVariants[v.productId] = [];
    }
    groupedVariants[v.productId].push(v);
  });

  // Product options for select filters and forms
  const productFilterOptions = [
    { value: 'all', label: '🔍 All Products' },
    ...tabProducts.map(p => ({ value: p.id, label: p.name }))
  ];

  const newVarProductOptions = [
    { value: '', label: 'Select a product...' },
    ...tabProducts.map(p => ({ value: p.id, label: p.name }))
  ];

  const handleToggleGroup = (productId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const isVariantLinked = (variantId: string) => {
    const hasSales = sales.some(s => s.items.some(item => item.variantId === variantId));
    const hasPurchases = purchases.some(p => p.items.some(item => item.variantId === variantId));
    return hasSales || hasPurchases;
  };

  const handleDelete = () => {
    if (deletingVariantItem) {
      dispatch(deleteVariant(deletingVariantItem.id));
      setDeletingVariantItem(null);
    }
  };

  const handleOpenAddSheet = (prodId?: string) => {
    setNewVarProductId(prodId || (tabProducts[0]?.id || ''));
    setIsProductPreselected(!!prodId);
    setNewVarName('');
    setNewVarPrice('');
    setNewVarCost('');
    setNewVarStock('0');
    setNewVarLowStock('5');
    setNewVarSku('');
    setNewVarBarcode('');
    setNewVarConversionFactor('1');
    setNewVarUnit('');
    setNewVarPurpose('both');
    setAddError('');
    setIsAddingVariant(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newVarProductId) {
      setAddError('Please select a product.');
      return;
    }

    const prod = products.find(p => p.id === newVarProductId);
    if (!prod) {
      setAddError('Invalid product selection.');
      return;
    }

    const isStockTracked = prod.isStockTracked !== false;

    if (!newVarName.trim()) {
      setAddError('Variant label is required (e.g. 500ml, XL).');
      return;
    }

    const priceVal = newVarPurpose === 'buy' ? 0 : parseFloat(newVarPrice);
    if (newVarPurpose !== 'buy' && (isNaN(priceVal) || priceVal < 0)) {
      setAddError('Please enter a valid price.');
      return;
    }

    const costVal = (isStockTracked && newVarPurpose !== 'sell') ? parseFloat(newVarCost) : 0;
    if (isStockTracked && newVarPurpose !== 'sell' && (isNaN(costVal) || costVal < 0)) {
      setAddError('Please enter a valid cost price.');
      return;
    }

    const stockVal = isStockTracked ? parseFloat(newVarStock) : 0;
    const lowStockVal = isStockTracked ? parseFloat(newVarLowStock) : 0;

    const factorVal = prod.hasSharedStock ? parseFloat(newVarConversionFactor) : 1;
    if (prod.hasSharedStock && (isNaN(factorVal) || factorVal <= 0)) {
      setAddError('Conversion factor must be greater than zero.');
      return;
    }

    const newVariant: ProductVariant = {
      id: `v-${Date.now()}`,
      productId: newVarProductId,
      name: newVarName.trim(),
      price: priceVal,
      cost: costVal,
      stock: stockVal,
      lowStockThreshold: lowStockVal,
      conversionFactor: factorVal,
      variantUnit: newVarUnit.trim() || undefined,
      sku: newVarSku.trim() || undefined,
      barcode: newVarBarcode.trim() || undefined,
      purpose: newVarPurpose,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch(addVariant(newVariant));
    setIsAddingVariant(false);
  };

  // Determine if a selected product has stock tracking active
  const selectedNewProduct = products.find(p => p.id === newVarProductId);
  const isNewProductStockTracked = selectedNewProduct?.isStockTracked !== false;
  const newProductUnit = selectedNewProduct ? units.find(u => u.id === selectedNewProduct.unitId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '80vh', paddingBottom: '90px', paddingTop: '6px' }} className="animate-fade-in">
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Catalog Administration</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Product Variants</h3>
        </div>
        <button
          onClick={() => handleOpenAddSheet()}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: 'var(--radius-full)' }}
        >
          <Plus size={16} /> Add Variant
        </button>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Items' },
          { value: 'prepared', label: 'Prepared / Cooked' }
        ]}
        value={activeTab}
        onChange={(val) => {
          setActiveTab(val as any);
          setSelectedProductId('all'); // Reset product filter on tab change
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by product name, variant or SKU..."
        />
        <Select
          options={productFilterOptions}
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          style={{ borderRadius: '10px', width: '100%' }}
        />
      </div>

      {Object.keys(groupedVariants).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          No variants found matching criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(groupedVariants).map(([productId, vars]) => {
            const prodName = getProductName(productId);
            const isCollapsed = !!collapsedGroups[productId];
            const unitAbbr = getUnitAbbr(productId);
            const prod = products.find(p => p.id === productId);

            return (
              <div
                key={productId}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'all var(--transition-normal)'
                }}
              >
                {/* Product Header */}
                <div
                  onClick={() => handleToggleGroup(productId)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {prodName}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {vars.length} variant{vars.length > 1 ? 's' : ''} configured
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAddSheet(productId);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={12} /> Add new
                  </button>
                </div>

                {/* Variants List for Product */}
                {!isCollapsed && (
                  <div style={{ padding: '8px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {vars.map(v => {
                      const isHens = v.name.toLowerCase().includes('hen') || 
                                     v.name.toLowerCase().includes('live') ||
                                     prodName.toLowerCase().includes('hen') ||
                                     prodName.toLowerCase().includes('live');
                      const prod = products.find(p => p.id === v.productId);
                      const isLowStock = activeTab === 'exchanged' && (() => {
                        if (isHens && v.weightStock !== undefined) {
                          return v.weightStock <= v.lowStockThreshold;
                        }
                        if (prod && prod.hasSharedStock && v.purpose === 'buy') {
                          const baseStock = v.stock * (v.conversionFactor || 1);
                          return baseStock <= v.lowStockThreshold;
                        }
                        return v.stock <= v.lowStockThreshold;
                      })();
                      const isOutOfStock = activeTab === 'exchanged' && 
                        (isHens && v.weightStock !== undefined ? v.weightStock <= 0 : v.stock <= 0);

                      // Clean variant label by removing parent product name prefix if it starts with it
                      const variantLabel = v.name.toLowerCase().startsWith(prodName.toLowerCase())
                        ? v.name.slice(prodName.length).trim()
                        : v.name;

                      return (
                        <div
                          key={v.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '12px 14px',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            gap: '10px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          {/* Line 1: Title/SKU (Left) & Badge + Actions (Right) */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '0', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.name}>
                                  {variantLabel}
                                </span>
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: v.purpose === 'buy' ? 'var(--info-soft)' : v.purpose === 'sell' ? 'var(--success-soft)' : 'var(--bg-secondary)',
                                  color: v.purpose === 'buy' ? 'var(--info)' : v.purpose === 'sell' ? 'var(--success)' : 'var(--text-muted)',
                                  fontWeight: 700
                                }}>
                                  {v.purpose === 'buy' ? 'Buy Only' : v.purpose === 'sell' ? 'Sell Only' : 'Buy & Sell'}
                                </span>
                              </div>
                              {v.sku && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  SKU: {v.sku}
                                </span>
                              )}
                              {prod && prod.hasSharedStock && v.conversionFactor !== undefined && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--info)', fontWeight: 600, marginTop: '2px' }}>
                                  Linked Stock Ratio: 1 unit = {v.conversionFactor} {unitAbbr}
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              {activeTab === 'exchanged' && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  {isOutOfStock ? (
                                    <span style={{ display: 'inline-block', padding: '3px 6px', fontSize: '0.68rem', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '4px', fontWeight: 700 }}>Out</span>
                                  ) : isLowStock ? (
                                    <span style={{ display: 'inline-block', padding: '3px 6px', fontSize: '0.68rem', backgroundColor: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: '4px', fontWeight: 700 }}>Low</span>
                                  ) : (
                                    <span style={{ display: 'inline-block', padding: '3px 6px', fontSize: '0.68rem', backgroundColor: 'var(--success-soft)', color: 'var(--success)', borderRadius: '4px', fontWeight: 700 }}>OK</span>
                                  )}
                                </div>
                              )}
                              
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => setEditingVariant(v)}
                                  className="interactive"
                                  style={{ padding: '6px', color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                 <button
                                   onClick={() => setDeletingVariantItem(v)}
                                   className="interactive"
                                   style={{ padding: '6px', color: 'var(--danger)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                                 >
                                   <Trash2 size={15} />
                                 </button>
                              </div>
                            </div>
                          </div>

                          {/* Line 2: Prices (Left) & Stock Count (Right) */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            borderTop: '1px dashed var(--border-color)', 
                            paddingTop: '8px',
                            marginTop: '2px'
                          }}>
                            <div>
                              {activeTab === 'exchanged' ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {v.purpose !== 'buy' && (
                                    <>
                                      Price: <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{v.price}</span>
                                    </>
                                  )}
                                  {v.purpose !== 'buy' && v.purpose !== 'sell' && (
                                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>•</span>
                                  )}
                                  {v.purpose !== 'sell' && (
                                    <>
                                      Cost: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>₹{v.cost}</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                v.purpose !== 'buy' && (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Price: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{v.price}</span>
                                  </div>
                                )
                              )}
                            </div>

                            {activeTab === 'exchanged' && (() => {
                              const isHens = v.name.toLowerCase().includes('hen') || 
                                             v.name.toLowerCase().includes('live') ||
                                             (prod && prod.name.toLowerCase().includes('hen')) ||
                                             (prod && prod.name.toLowerCase().includes('live')) ||
                                             v.variantUnit?.toLowerCase() === 'pcs' ||
                                             unitAbbr?.toLowerCase() === 'pcs';
                              const displayUnit = isHens ? 'pcs' : (v.variantUnit || unitAbbr || 'pcs');
                              const weightStockStr = (isHens && v.weightStock !== undefined && v.weightStock > 0)
                                ? ` (${v.weightStock.toFixed(2)} kg)`
                                : '';
                              return (
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  Stock: <span style={{ 
                                    color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--text-primary)',
                                    fontWeight: 700
                                  }}>{v.stock}</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{displayUnit}{weightStockStr}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit standalone variant sheet */}
      <BottomSheet
        isOpen={editingVariant !== null}
        onClose={() => setEditingVariant(null)}
        title="Edit Variant Specification"
      >
        {editingVariant && (
          <VariantForm
            variantToEdit={editingVariant}
            productName={getProductName(editingVariant.productId)}
            onSuccess={() => setEditingVariant(null)}
          />
        )}
      </BottomSheet>

      {/* Add variant sheet */}
      <BottomSheet
        isOpen={isAddingVariant}
        onClose={() => setIsAddingVariant(false)}
        title="Add Variant Specification"
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {addError && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, padding: '8px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-sm)' }}>
              {addError}
            </div>
          )}

          {isProductPreselected && selectedNewProduct ? (
            <div style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--primary)',
              marginBottom: '4px',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adding variant for product</span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedNewProduct.name}</div>
            </div>
          ) : (
            <Select
              label="Target Product"
              options={newVarProductOptions}
              value={newVarProductId}
              onChange={(e) => setNewVarProductId(e.target.value)}
              required
            />
          )}

          <Input
            label="Variant Label"
            placeholder="e.g. 500ml, Red / XL, 1kg"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            required
          />

          <Select
            label="Variant Purpose / Strategy"
            options={[
              { value: 'both', label: '🛒 Both Buy & Sell' },
              { value: 'buy', label: '📥 Buy Only (Bulk / Raw Ingredient)' },
              { value: 'sell', label: '📤 Sell Only (Retail / Packaged Product)' }
            ]}
            value={newVarPurpose}
            onChange={(e) => setNewVarPurpose(e.target.value as any)}
          />

          {isNewProductStockTracked ? (
            <>
              {newVarPurpose !== 'buy' && (
                <Input
                  label="Selling Price (₹)"
                  type="number"
                  placeholder="0.00"
                  value={newVarPrice}
                  onChange={(e) => setNewVarPrice(e.target.value)}
                  required
                />
              )}
              {newVarPurpose !== 'sell' && (
                <Input
                  label="Cost / Purchase Price (₹)"
                  type="number"
                  placeholder="0.00"
                  value={newVarCost}
                  onChange={(e) => setNewVarCost(e.target.value)}
                  required
                />
              )}
               {selectedNewProduct?.hasSharedStock && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    label="Unit Label (e.g. Can, Bottle)"
                    placeholder="e.g. Can"
                    value={newVarUnit}
                    onChange={(e) => setNewVarUnit(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Input
                    label={`Contains Qty (in ${newProductUnit?.abbreviation || 'pcs'})`}
                    type="number"
                    placeholder="e.g. 20"
                    value={newVarConversionFactor}
                    onChange={(e) => setNewVarConversionFactor(e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                </div>
              )}
            </>
          ) : (
            newVarPurpose !== 'buy' && (
              <Input
                label="Selling Price (₹)"
                type="number"
                placeholder="0.00"
                value={newVarPrice}
                onChange={(e) => setNewVarPrice(e.target.value)}
                required
              />
            )
          )}

          {isNewProductStockTracked && (
            <>
              <div style={{
                padding: '8px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderTop: '1px solid var(--border-color)',
                marginTop: '4px',
              }}>
                📦 Inventory Settings
              </div>

              <Input
                label={`Initial Stock (${newProductUnit?.abbreviation || 'pcs'})`}
                type="number"
                placeholder="0"
                value={newVarStock}
                onChange={(e) => setNewVarStock(e.target.value)}
              />
              <Input
                label="Low Stock Alert Threshold"
                type="number"
                placeholder="5"
                value={newVarLowStock}
                onChange={(e) => setNewVarLowStock(e.target.value)}
              />
            </>
          )}

          <div style={{
            padding: '8px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderTop: '1px solid var(--border-color)',
            marginTop: '4px',
          }}>
            🏷️ Identification (Optional)
          </div>

          <Input
            label="SKU Code"
            placeholder="e.g. ITEM-001"
            value={newVarSku}
            onChange={(e) => setNewVarSku(e.target.value)}
          />
          <Input
            label="Barcode"
            placeholder="Scan or type"
            value={newVarBarcode}
            onChange={(e) => setNewVarBarcode(e.target.value)}
          />

          <Button type="submit" fullWidth style={{ marginTop: '16px' }}>
            💾 Create New Variant
          </Button>
        </form>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingVariantItem !== null}
        title={deletingVariantItem && isVariantLinked(deletingVariantItem.id) ? "Cannot Delete Variant" : "Delete Variant?"}
        message={
          deletingVariantItem && isVariantLinked(deletingVariantItem.id)
            ? `Cannot delete variant "${deletingVariantItem.name}" because it has associated sale or purchase transaction records. ERP database rules require preserving these records for audit compliance.`
            : `Are you sure you want to permanently delete the variant "${deletingVariantItem?.name}"? This action cannot be undone.`
        }
        onConfirm={deletingVariantItem && isVariantLinked(deletingVariantItem.id) ? () => setDeletingVariantItem(null) : handleDelete}
        onCancel={() => setDeletingVariantItem(null)}
        confirmLabel={deletingVariantItem && isVariantLinked(deletingVariantItem.id) ? "Close" : "Yes, Delete"}
        cancelLabel={deletingVariantItem && isVariantLinked(deletingVariantItem.id) ? "" : "Cancel"}
        isDanger={!(deletingVariantItem && isVariantLinked(deletingVariantItem.id))}
      />
    </div>
  );
};

export default VariantsPage;
