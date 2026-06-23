import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateVariant } from '../../features/db/dbSlice';
import { ProductVariant } from '../../types/variant.types';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

interface VariantFormProps {
  onSuccess: () => void;
  variantToEdit: ProductVariant;
  productName: string;
}

export const VariantForm: React.FC<VariantFormProps> = ({
  onSuccess,
  variantToEdit,
  productName
}) => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.db.products);
  const units = useAppSelector(state => state.db.units);

  const product = products.find(p => p.id === variantToEdit.productId);
  const isStockTracked = product?.isStockTracked !== false;

  const [name, setName] = useState(variantToEdit.name);
  const [price, setPrice] = useState(variantToEdit.price.toString());
  const [cost, setCost] = useState(variantToEdit.cost.toString());
  const [stock, setStock] = useState(variantToEdit.stock.toString());
  const [purpose, setPurpose] = useState<'both' | 'buy' | 'sell'>(variantToEdit.purpose || 'both');
  const [lowStockThreshold, setLowStockThreshold] = useState(variantToEdit.lowStockThreshold.toString());
  const [sku, setSku] = useState(variantToEdit.sku || '');
  const [barcode, setBarcode] = useState(variantToEdit.barcode || '');
  const [unitId, setUnitId] = useState(product?.unitId || 'pcs');
  const [error, setError] = useState('');
  const [conversionFactor, setConversionFactor] = useState(variantToEdit.conversionFactor?.toString() || '1');
  const [variantUnit, setVariantUnit] = useState(variantToEdit.variantUnit || '');

  const unitOptions = units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }));

  const selectedUnit = units.find(u => u.id === unitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pVal = purpose === 'buy' ? 0 : parseFloat(price);
    const cVal = (isStockTracked && purpose !== 'sell') ? parseFloat(cost) : 0;
    const isDecimalAllowed = selectedUnit ? selectedUnit.isDecimalAllowed : false;
    const sVal = isStockTracked ? ((isDecimalAllowed ? parseFloat(stock) : parseInt(stock)) || 0) : 0;
    const lVal = isStockTracked ? ((isDecimalAllowed ? parseFloat(lowStockThreshold) : parseInt(lowStockThreshold)) || 5) : 0;

    if (purpose !== 'buy' && (isNaN(pVal) || pVal <= 0)) {
      setError('Please enter a valid selling price.');
      return;
    }
    if (isStockTracked && purpose !== 'sell' && (isNaN(cVal) || cVal < 0)) {
      setError('Please enter a valid cost price.');
      return;
    }
    if (!name.trim()) {
      setError('Variant label is required.');
      return;
    }

    const factorVal = product?.hasSharedStock ? parseFloat(conversionFactor) : 1;
    if (product?.hasSharedStock && (isNaN(factorVal) || factorVal <= 0)) {
      setError('Conversion factor must be greater than zero.');
      return;
    }

    dispatch(updateVariant({
      ...variantToEdit,
      name: name.trim(),
      price: pVal,
      cost: cVal,
      stock: sVal,
      lowStockThreshold: lVal,
      conversionFactor: factorVal,
      variantUnit: variantUnit.trim() || undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      purpose,
      updatedAt: new Date().toISOString(),
    }));

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Product reference header */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        borderLeft: '3px solid var(--primary)',
        marginBottom: '4px',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Editing variant for</span>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{productName}</div>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, padding: '8px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {/* Variant Name */}
      <Input
        label="Variant Label"
        placeholder="e.g. 500ml, Red / Large, 1kg"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label="Variant Purpose / Strategy"
        options={[
          { value: 'both', label: '🛒 Both Buy & Sell' },
          { value: 'buy', label: '📥 Buy Only (Bulk / Raw Ingredient)' },
          { value: 'sell', label: '📤 Sell Only (Retail / Packaged Product)' }
        ]}
        value={purpose}
        onChange={(e) => setPurpose(e.target.value as any)}
      />

      {product?.hasSharedStock && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input
            label="Unit Label (e.g. Can, Bottle)"
            placeholder="e.g. Can"
            value={variantUnit}
            onChange={(e) => setVariantUnit(e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            label={`Contains Qty (in ${selectedUnit?.abbreviation || 'units'})`}
            type="number"
            placeholder="e.g. 20"
            value={conversionFactor}
            onChange={(e) => setConversionFactor(e.target.value)}
            style={{ flex: 1 }}
            required
          />
        </div>
      )}

      {/* Measurement Unit (Read-only) */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Measurement Unit (Product Level)
        </label>
        <div style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0 12px',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          cursor: 'not-allowed'
        }}>
          {selectedUnit ? `${selectedUnit.name} (${selectedUnit.abbreviation})` : 'None'}
        </div>
        {selectedUnit && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Quantities recorded in {selectedUnit.name} {selectedUnit.isDecimalAllowed ? '(decimals allowed)' : '(whole units only)'}. To change this, edit the main product details.
          </span>
        )}
      </div>

      {/* Price Row */}
      {isStockTracked ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {purpose !== 'buy' && (
            <Input
              label="Selling Price (₹)"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          )}
          {purpose !== 'sell' && (
            <Input
              label="Cost / Purchase Price (₹)"
              type="number"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          )}
        </div>
      ) : (
        purpose !== 'buy' && (
          <Input
            label="Selling Price (₹)"
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        )
      )}

      {/* Stock fields — only for stock-tracked products */}
      {isStockTracked && (
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Input
              label={`Current Stock (${selectedUnit?.abbreviation || 'units'})`}
              type="number"
              placeholder="0"
              value={stock}
              disabled
              helperText="Stock can only be adjusted via Purchases or Adjustments."
            />
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              placeholder="5"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />
          </div>

          {/* Profit margin indicator */}
          {price && cost && parseFloat(price) > 0 && parseFloat(cost) >= 0 && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: parseFloat(price) > parseFloat(cost) ? 'var(--success-soft)' : 'var(--danger-soft)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: parseFloat(price) > parseFloat(cost) ? 'var(--success)' : 'var(--danger)',
            }}>
              {parseFloat(price) > parseFloat(cost)
                ? `✓ Margin: ₹${(parseFloat(price) - parseFloat(cost)).toFixed(2)} (${Math.round(((parseFloat(price) - parseFloat(cost)) / parseFloat(price)) * 100)}%)`
                : '⚠️ Cost is higher than selling price — check pricing'}
            </div>
          )}
        </>
      )}

      {/* Identification */}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Input
          label="SKU Code"
          placeholder="e.g. ITEM-001"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
        <Input
          label="Barcode"
          placeholder="Scan or type"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
      </div>

      <Button type="submit" fullWidth style={{ marginTop: '16px' }}>
        💾 Save Variant Changes
      </Button>
    </form>
  );
};
export default VariantForm;
