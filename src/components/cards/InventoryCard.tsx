import React from 'react';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { Unit } from '../../types/unit.types';
import Button from '../common/Button';
import Badge from '../common/Badge';

interface InventoryCardProps {
  product: Product;
  variant: ProductVariant;
  unit?: Unit;
  onAdjust: () => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({
  product,
  variant,
  unit,
  onAdjust
}) => {
  const isStockTracked = product.isStockTracked !== false;
  const isLowStock = isStockTracked && variant.stock <= variant.lowStockThreshold;
  const isOutOfStock = isStockTracked && variant.stock === 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="flex-between">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {product.name}
          </h5>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {product.hasVariants ? `Variant: ${variant.name}` : 'Base Variant'}
            {product.hasVariants && product.hasSharedStock && variant.conversionFactor !== undefined && (
              <span style={{ color: 'var(--info)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                Linked Stock Ratio: 1 unit = {variant.conversionFactor} {unit?.abbreviation || 'pcs'}
              </span>
            )}
          </span>
          {variant.sku && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              SKU: {variant.sku}
            </span>
          )}
        </div>
        <div>
          {!isStockTracked ? (
            <Badge variant="info">Prepared Item</Badge>
          ) : isOutOfStock ? (
            <Badge variant="danger">Out of Stock</Badge>
          ) : isLowStock ? (
            <Badge variant="warning">Low Stock</Badge>
          ) : (
            <Badge variant="success">Normal</Badge>
          )}
        </div>
      </div>

      <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
        {isStockTracked ? (
          <>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Count</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: isLowStock ? 'var(--warning)' : 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                {variant.stock} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{variant.variantUnit || unit?.abbreviation || 'pcs'}</span>
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {variant.purpose !== 'buy' && (
                  <span>Price: <strong style={{ color: 'var(--success)' }}>₹{variant.price}</strong></span>
                )}
                {variant.purpose !== 'sell' && (
                  <span>Cost: <strong style={{ color: 'var(--text-primary)' }}>₹{variant.cost}</strong></span>
                )}
                <span>Threshold: {variant.lowStockThreshold}</span>
              </div>
            </div>
            <Button onClick={onAdjust} variant="secondary" size="sm">
              Adjust Stock
            </Button>
          </>
        ) : (
          <>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Selling Price</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                ₹{variant.price} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ {unit?.abbreviation || 'pcs'}</span>
              </p>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Fresh / Unlimited Stock</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default InventoryCard;
