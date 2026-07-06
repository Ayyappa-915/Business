import React, { useState } from 'react';
import { Edit2, Trash2, Layers } from 'lucide-react';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { Category } from '../../types/category.types';
import { Subcategory } from '../../types/subcategory.types';
import { Unit } from '../../types/unit.types';
import Badge from '../common/Badge';

interface ProductCardProps {
  product: Product;
  variants: ProductVariant[];
  category?: Category;
  subcategory?: Subcategory;
  unit?: Unit;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variants,
  category,
  subcategory,
  unit,
  onEdit,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalStock = product.hasSharedStock
    ? (variants[0] ? variants[0].stock * (variants[0].conversionFactor || 1) : 0)
    : variants.reduce((sum, v) => sum + v.stock, 0);

  const totalStockDisplay = (() => {
    if (product.hasSharedStock) {
      const baseStock = variants[0] ? variants[0].stock * (variants[0].conversionFactor || 1) : 0;
      return `${baseStock.toFixed(2)} ${unit?.abbreviation || 'pcs'}`;
    }
    if (product.hasVariants) {
      return variants.map(v => {
        const isHens = v.name.toLowerCase().includes('hen') || 
                       v.name.toLowerCase().includes('live') ||
                       product.name.toLowerCase().includes('hen') ||
                       product.name.toLowerCase().includes('live') ||
                       v.variantUnit?.toLowerCase() === 'pcs' ||
                       unit?.abbreviation?.toLowerCase() === 'pcs';
        const vUnit = isHens ? 'pcs' : (v.variantUnit || unit?.abbreviation || 'pcs');
        const weightStr = (isHens && v.weightStock !== undefined && v.weightStock > 0)
          ? ` (${v.weightStock.toFixed(2)} kg)`
          : '';
        return `${v.stock.toFixed(2)} ${vUnit}${weightStr}`;
      }).join('  |  ');
    } else {
      const v = variants[0];
      const isHens = v && (v.name.toLowerCase().includes('hen') || 
                     v.name.toLowerCase().includes('live') ||
                     product.name.toLowerCase().includes('hen') ||
                     product.name.toLowerCase().includes('live') ||
                     v.variantUnit?.toLowerCase() === 'pcs' ||
                     unit?.abbreviation?.toLowerCase() === 'pcs');
      const vUnit = isHens ? 'pcs' : (unit?.abbreviation || 'pcs');
      const weightStr = (isHens && v && v.weightStock !== undefined && v.weightStock > 0)
        ? ` (${v.weightStock.toFixed(2)} kg)`
        : '';
      return `${totalStock.toFixed(2)} ${vUnit}${weightStr}`;
    }
  })();
  const minPrice = Math.min(...variants.map(v => v.price));
  const maxPrice = Math.max(...variants.map(v => v.price));
  const priceDisplay = minPrice === maxPrice ? `₹${minPrice.toFixed(2)}` : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;

  // Check if any variant is running low on stock
  const isAnyLow = variants.some(v => {
    const isHens = v.name.toLowerCase().includes('hen') || 
                   v.name.toLowerCase().includes('live') ||
                   product.name.toLowerCase().includes('hen') ||
                   product.name.toLowerCase().includes('live') ||
                   v.variantUnit?.toLowerCase() === 'pcs';
    if (isHens && v.weightStock !== undefined) {
      return v.weightStock <= v.lowStockThreshold;
    }
    if (product.hasSharedStock && v.purpose === 'buy') {
      const baseStock = v.stock * (v.conversionFactor || 1);
      return baseStock <= v.lowStockThreshold;
    }
    return v.stock <= v.lowStockThreshold;
  });
  const isAllOut = totalStock === 0;

  const displayedVariants = isExpanded ? variants : variants.slice(0, 3);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="flex-between">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>{product.name}</h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {category?.name || 'Uncategorized'}
            {subcategory ? ` › ${subcategory.name}` : ''}
            {product.description ? ` • ${product.description}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onEdit} className="interactive" style={{ padding: '6px', color: 'var(--text-secondary)' }}>
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="interactive" style={{ padding: '6px', color: 'var(--danger)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Variants list summary */}
      {product.hasVariants && (
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-tertiary)',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} /> Variants ({variants.length})
          </span>
          {displayedVariants.map(v => {
            const variantLabel = v.name.toLowerCase().startsWith(product.name.toLowerCase())
              ? v.name.slice(product.name.length).trim()
              : v.name;
            return (
              <div key={v.id} className="flex-between" style={{ paddingLeft: '4px', gap: '8px', flexWrap: 'wrap', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', paddingTop: '2px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{variantLabel}</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  {product.isStockTracked !== false ? (() => {
                    const isHens = v.name.toLowerCase().includes('hen') || 
                                   v.name.toLowerCase().includes('live') ||
                                   product.name.toLowerCase().includes('hen') ||
                                   product.name.toLowerCase().includes('live') ||
                                   v.variantUnit?.toLowerCase() === 'pcs' ||
                                   unit?.abbreviation?.toLowerCase() === 'pcs';
                    const displayUnit = isHens ? 'pcs' : (v.variantUnit || unit?.abbreviation || 'pcs');
                    const baseStock = v.stock * (v.conversionFactor || 1);
                    const weightStockStr = (isHens && v.weightStock !== undefined && v.weightStock > 0) 
                      ? ` (${v.weightStock.toFixed(2)} kg)` 
                      : '';
                    if (product.hasSharedStock) {
                      return `Stock: ${v.stock.toFixed(2)} ${displayUnit} (Shared) • `;
                    }
                    return `Stock: ${v.stock.toFixed(2)} ${displayUnit}${weightStockStr} • `;
                  })() : ''}
                  Price: ₹{v.price.toFixed(2)}
                  {product.isStockTracked !== false ? ` • Cost: ₹${v.cost.toFixed(2)}` : ''}
                  {product.hasSharedStock && v.conversionFactor !== undefined && ` • Contains: ${v.conversionFactor.toFixed(2)} ${unit?.abbreviation || 'pcs'}`}
                </span>
              </div>
            );
          })}
          {variants.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                textAlign: 'left',
                padding: '4px 0 0 4px',
                cursor: 'pointer'
              }}
              className="interactive"
            >
              {isExpanded ? 'Show less' : `+ ${variants.length - 3} more variants`}
            </button>
          )}
        </div>
      )}

      <div className="flex-between" style={{ marginTop: '4px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price</span>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-title)' }}>
            {priceDisplay}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {product.isStockTracked !== false ? (
            <>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Stock</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {totalStockDisplay}
                </span>
                {isAllOut ? (
                  <Badge variant="danger">Out of stock</Badge>
                ) : isAnyLow ? (
                  <Badge variant="warning">Low stock</Badge>
                ) : (
                  <Badge variant="success">In stock</Badge>
                )}
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inventory</span>
              <div style={{ marginTop: '2px' }}>
                <Badge variant="success">Prepared / Unlimited</Badge>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
