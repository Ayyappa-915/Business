import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addProduct, updateProduct } from '../../features/db/dbSlice';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

interface ProductFormProps {
  onSuccess: () => void;
  productToEdit?: Product;
  variantsToEdit?: ProductVariant[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  onSuccess,
  productToEdit,
  variantsToEdit
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(state => state.db.categories);
  const subcategories = useAppSelector(state => state.db.subcategories);
  const units = useAppSelector(state => state.db.units);

  const [name, setName] = useState(productToEdit?.name || '');
  const [categoryId, setCategoryId] = useState(productToEdit?.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(productToEdit?.subcategoryId || '');
  const [unitId, setUnitId] = useState(productToEdit?.unitId || 'pcs');
  const [hasVariants, setHasVariants] = useState(productToEdit?.hasVariants || false);
  const [isStockTracked, setIsStockTracked] = useState(productToEdit?.isStockTracked !== false);
  const [hasSharedStock, setHasSharedStock] = useState(productToEdit?.hasSharedStock || false);
  const [varConversionFactor, setVarConversionFactor] = useState('1');
  const [varUnit, setVarUnit] = useState('');
  const [varPurpose, setVarPurpose] = useState<'both' | 'buy' | 'sell'>('both');

  // Single Variant fields (if no variants toggled)
  const [price, setPrice] = useState(variantsToEdit?.[0]?.price.toString() || '');
  const [cost, setCost] = useState(variantsToEdit?.[0]?.cost.toString() || '');
  const [stock, setStock] = useState(variantsToEdit?.[0]?.stock.toString() || '0');
  const [lowStock, setLowStock] = useState(variantsToEdit?.[0]?.lowStockThreshold.toString() || '5');
  const [sku, setSku] = useState(variantsToEdit?.[0]?.sku || '');

  // Multi Variant builder list
  const [variantsList, setVariantsList] = useState<Partial<ProductVariant>[]>(
    (productToEdit?.hasVariants && variantsToEdit) ? variantsToEdit : []
  );

  // Multi-variant temporary form inputs
  const [varName, setVarName] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varCost, setVarCost] = useState('');
  const [varStock, setVarStock] = useState('0');
  const [varLowStock, setVarLowStock] = useState('5');

  const [error, setError] = useState('');

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  // Filter subcategories dynamically by selected category
  const filteredSubcategories = subcategories.filter(s => s.categoryId === categoryId);
  const subcategoryOptions = filteredSubcategories.map(s => ({ value: s.id, label: s.name }));

  const unitOptions = units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }));

  const handleAddVariant = () => {
    if (!varName.trim()) {
      setError('Variant label is required (e.g. Size, Pack, Color).');
      return;
    }
    const pVal = varPurpose === 'buy' ? 0 : parseFloat(varPrice);
    const cVal = (isStockTracked && varPurpose !== 'sell') ? parseFloat(varCost) : 0;
    if (varPurpose !== 'buy' && (isNaN(pVal) || pVal <= 0)) {
      setError('Please enter variant price.');
      return;
    }
    if (isStockTracked && varPurpose !== 'sell' && (isNaN(cVal) || cVal < 0)) {
      setError('Please enter variant cost.');
      return;
    }

    const factorVal = hasSharedStock ? parseFloat(varConversionFactor) : 1;
    if (hasSharedStock && (isNaN(factorVal) || factorVal <= 0)) {
      setError('Conversion factor must be greater than zero.');
      return;
    }

    const selectedUnit = units.find(u => u.id === unitId);
    const isDecimalAllowed = selectedUnit ? selectedUnit.isDecimalAllowed : false;

    setVariantsList([
      ...variantsList,
      {
        id: 'var_' + Math.random().toString(36).substr(2, 9),
        name: varName.trim(),
        price: pVal,
        cost: cVal,
        stock: isStockTracked ? ((isDecimalAllowed ? parseFloat(varStock) : parseInt(varStock)) || 0) : 0,
        lowStockThreshold: isStockTracked ? ((isDecimalAllowed ? parseFloat(varLowStock) : parseInt(varLowStock)) || 5) : 0,
        conversionFactor: factorVal,
        variantUnit: varUnit.trim() || undefined,
        sku: 'SKU-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        purpose: varPurpose
      }
    ]);

    // reset fields
    setVarName('');
    setVarPrice('');
    setVarCost('');
    setVarStock('0');
    setVarLowStock('5');
    setVarConversionFactor('1');
    setVarUnit('');
    setVarPurpose('both');
    setError('');
  };

  const handleRemoveVariant = (tempId?: string) => {
    setVariantsList(variantsList.filter(v => v.id !== tempId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!categoryId) {
      setError('Please choose a category.');
      return;
    }

    const productId = productToEdit?.id || 'prod_' + Math.random().toString(36).substr(2, 9);
    let finalVariants: ProductVariant[] = [];

    const selectedUnit = units.find(u => u.id === unitId);
    const isDecimalAllowed = selectedUnit ? selectedUnit.isDecimalAllowed : false;

    if (!hasVariants) {
      const pVal = parseFloat(price);
      const cVal = isStockTracked ? parseFloat(cost) : 0;
      if (isNaN(pVal) || pVal <= 0 || (isStockTracked && (isNaN(cVal) || cVal < 0))) {
        setError(isStockTracked ? 'Please enter valid prices and costs.' : 'Please enter a valid price.');
        return;
      }
      finalVariants = [
        {
          id: variantsToEdit?.[0]?.id || 'var_' + Math.random().toString(36).substr(2, 9),
          productId,
          name: 'Standard',
          price: pVal,
          cost: cVal,
          stock: isStockTracked ? ((isDecimalAllowed ? parseFloat(stock) : parseInt(stock)) || 0) : 0,
          lowStockThreshold: isStockTracked ? ((isDecimalAllowed ? parseFloat(lowStock) : parseInt(lowStock)) || 5) : 0,
          sku: sku.trim() || undefined,
          createdAt: variantsToEdit?.[0]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    } else {
      if (variantsList.length === 0) {
        setError('Please add at least one product variant.');
        return;
      }

      if (hasSharedStock) {
        // Find base variant (conversionFactor = 1) or fallback to first variant with stock
        const baseVariant = variantsList.find(v => v.conversionFactor === 1) || variantsList.find(v => (v.stock || 0) > 0) || variantsList[0];
        const totalBaseStock = baseVariant ? ((baseVariant.stock || 0) * (baseVariant.conversionFactor || 1)) : 0;

        finalVariants = variantsList.map(v => {
          const factor = v.conversionFactor || 1;
          return {
            id: v.id || 'var_' + Math.random().toString(36).substr(2, 9),
            productId,
            name: v.name || 'Default',
            price: v.price || 0,
            cost: v.cost || 0,
            stock: totalBaseStock / factor,
            conversionFactor: factor,
            variantUnit: v.variantUnit,
            lowStockThreshold: v.lowStockThreshold || 5,
            sku: v.sku,
            purpose: v.purpose || 'both',
            createdAt: v.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      } else {
        finalVariants = variantsList.map(v => ({
          id: v.id || 'var_' + Math.random().toString(36).substr(2, 9),
          productId,
          name: v.name || 'Default',
          price: v.price || 0,
          cost: v.cost || 0,
          stock: v.stock || 0,
          variantUnit: v.variantUnit,
          lowStockThreshold: v.lowStockThreshold || 5,
          sku: v.sku,
          purpose: v.purpose || 'both',
          createdAt: v.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }
    }

    const newProduct: Product = {
      id: productId,
      name: name.trim(),
      categoryId,
      subcategoryId: subcategoryId || undefined,
      unitId,
      hasVariants,
      isStockTracked,
      hasSharedStock: hasVariants ? hasSharedStock : false,
      createdAt: productToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (productToEdit) {
      dispatch(updateProduct({ product: newProduct, variants: finalVariants }));
    } else {
      dispatch(addProduct({ product: newProduct, variants: finalVariants }));
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '72vh' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

      <Input
        label="Product Name"
        placeholder="Enter product title (e.g. Cola)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label="Category"
        options={categoryOptions}
        value={categoryId}
        onChange={(e) => {
          const catId = e.target.value;
          setCategoryId(catId);
          setSubcategoryId('');
          
          // Auto-detect default stockMode from selected Category
          const selectedCat = categories.find(c => c.id === catId);
          if (selectedCat) {
            if (selectedCat.stockMode === 'shared') {
              setHasSharedStock(true);
            } else if (selectedCat.stockMode === 'independent') {
              setHasSharedStock(false);
            }
          }
        }}
        placeholder="Choose Category..."
      />

      {categoryId && subcategoryOptions.length > 0 && (
        <Select
          label="Subcategory (Optional)"
          options={subcategoryOptions}
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
          placeholder="Choose Subcategory..."
        />
      )}

      <Select
        label="Measurement Unit"
        options={unitOptions}
        value={unitId}
        onChange={(e) => setUnitId(e.target.value)}
      />

      {/* Stock Tracking Toggler */}
      <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Track Inventory Stock</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Enable for packed goods, disable for prepared items (tiffin, tea)</span>
        </div>
        <input
          type="checkbox"
          checked={isStockTracked}
          onChange={(e) => setIsStockTracked(e.target.checked)}
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
      </div>

      {/* Variants Toggler */}
      <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>This product has multiple variants (e.g., sizes/colors)</span>
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => setHasVariants(e.target.checked)}
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
      </div>

      {hasVariants && (
        <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Link Variant Stock (Shared Pool)</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Enable if variants are packaging sizes of a single bulk product (e.g. 1000L vs 20L water)
            </span>
          </div>
          <input
            type="checkbox"
            checked={hasSharedStock}
            onChange={(e) => setHasSharedStock(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* SINGLE VARIANT FORM */}
      {!hasVariants ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
          {isStockTracked ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                label="Selling Price (₹)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <Input
                label="Purchase Cost (₹)"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
          ) : (
            <Input
              label="Selling Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          )}
          {isStockTracked && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                label="Opening Stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                style={{ flex: 1 }}
              />
              <Input
                label="Low Alert Margin"
                type="number"
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          )}
          <Input
            label="SKU / Barcode (Optional)"
            placeholder="Scan barcode or type SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>
      ) : (
        /* MULTI VARIANT BUILDER */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Variant Configurator</h5>

          {/* Active variant list */}
          {variantsList.map((v, i) => (
            <div key={v.id || i} className="flex-between" style={{
              padding: '10px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem'
            }}>
              <div>
                <strong>{v.name}</strong>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: v.purpose === 'buy' ? 'var(--info-soft)' : v.purpose === 'sell' ? 'var(--success-soft)' : 'var(--bg-secondary)',
                  color: v.purpose === 'buy' ? 'var(--info)' : v.purpose === 'sell' ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: 700,
                  marginLeft: '6px'
                }}>
                  {v.purpose === 'buy' ? 'Buy Only' : v.purpose === 'sell' ? 'Sell Only' : 'Buy & Sell'}
                </span>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {v.purpose !== 'buy' && <span>Price: ₹{v.price}</span>}
                  {v.purpose !== 'buy' && v.purpose !== 'sell' && <span> • </span>}
                  {v.purpose !== 'sell' && <span>Cost: ₹{v.cost}</span>}
                  {isStockTracked ? ` • Stock: ${v.stock}` : ''}
                  {hasSharedStock && v.conversionFactor !== undefined && (
                    <span> • Contains: {v.conversionFactor} {units.find(u => u.id === unitId)?.abbreviation || 'units'}{v.variantUnit ? ` (${v.variantUnit})` : ''}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveVariant(v.id)}
                style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Quick Variant Creator */}
          <div style={{
            padding: '12px',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <Input
              label="Variant Label"
              placeholder="e.g. 500ml, Red Large"
              value={varName}
              onChange={(e) => setVarName(e.target.value)}
            />
            <Select
              label="Variant Purpose / Strategy"
              options={[
                { value: 'both', label: '🛒 Both Buy & Sell' },
                { value: 'buy', label: '📥 Buy Only (Bulk / Raw Ingredient)' },
                { value: 'sell', label: '📤 Sell Only (Retail / Packaged Product)' }
              ]}
              value={varPurpose}
              onChange={(e) => setVarPurpose(e.target.value as any)}
            />
            {hasSharedStock && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  label="Unit Label (e.g. Can, Bottle)"
                  placeholder="e.g. Can"
                  value={varUnit}
                  onChange={(e) => setVarUnit(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Input
                  label={`Contains Qty (in ${units.find(u => u.id === unitId)?.abbreviation || 'units'})`}
                  type="number"
                  placeholder="e.g. 20"
                  value={varConversionFactor}
                  onChange={(e) => setVarConversionFactor(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            )}
            {isStockTracked ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                {varPurpose !== 'buy' && (
                  <Input
                    label="Price (₹)"
                    type="number"
                    value={varPrice}
                    onChange={(e) => setVarPrice(e.target.value)}
                    style={{ flex: 1 }}
                  />
                )}
                {varPurpose !== 'sell' && (
                  <Input
                    label="Cost (₹)"
                    type="number"
                    value={varCost}
                    onChange={(e) => setVarCost(e.target.value)}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            ) : (
              varPurpose !== 'buy' && (
                <Input
                  label="Price (₹)"
                  type="number"
                  value={varPrice}
                  onChange={(e) => setVarPrice(e.target.value)}
                />
              )
            )}
            {isStockTracked && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  label="Stock"
                  type="number"
                  value={varStock}
                  onChange={(e) => setVarStock(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Low Threshold"
                  type="number"
                  value={varLowStock}
                  onChange={(e) => setVarLowStock(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
              + Add Variant Configuration
            </Button>
          </div>
        </div>
      )}

      <Button type="submit" fullWidth style={{ marginTop: '16px' }}>
        {productToEdit ? 'Save Changes' : 'Create Product Catalog'}
      </Button>
    </form>
  );
};
export default ProductForm;
