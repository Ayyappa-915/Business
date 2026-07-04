import React from 'react';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';

interface QuickSaleCardProps {
  product: Product;
  variant: ProductVariant;
  quantityInCart: number;
  onTap: () => void;
}

export const QuickSaleCard: React.FC<QuickSaleCardProps> = ({
  product,
  variant,
  quantityInCart,
  onTap
}) => {
  const isOutOfStock = variant.stock <= 0;
  const isSelected = quantityInCart > 0;

  return (
    <div
      onClick={isOutOfStock ? undefined : onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: isSelected ? 'var(--primary-soft)' : 'var(--bg-secondary)',
        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        opacity: isOutOfStock ? 0.5 : 1,
        minHeight: '105px',
        position: 'relative',
        transition: 'transform 0.1s, border-color 0.1s, background-color 0.1s'
      }}
      className="interactive card-clickable"
    >
      {isSelected && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          fontSize: '0.72rem',
          fontWeight: 700,
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {quantityInCart}
        </span>
      )}

      <div>
        <h5 style={{ 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          lineHeight: '1.2',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {product.name}
        </h5>
        {product.hasVariants && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
            {variant.name}
          </span>
        )}
      </div>

      <div className="flex-between" style={{ marginTop: '8px', alignItems: 'flex-end' }}>
        <div>
          {product.isStockTracked !== false ? (() => {
            const isHens = variant.name.toLowerCase().includes('hen') || 
                           variant.name.toLowerCase().includes('live') ||
                           product.name.toLowerCase().includes('hen') ||
                           product.name.toLowerCase().includes('live') ||
                           variant.variantUnit?.toLowerCase() === 'pcs';
            
            const displayUnit = isHens ? 'pcs' : (variant.variantUnit || '');
            const baseStock = variant.stock * (variant.conversionFactor || 1);
            const weightStockStr = (isHens && variant.weightStock !== undefined && variant.weightStock > 0)
              ? ` (${variant.weightStock.toFixed(2)} kg)`
              : '';
            return (
              <>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Stock: {product.hasSharedStock ? `${baseStock.toFixed(2)} kg` : `${variant.stock.toFixed(2)} ${displayUnit}${weightStockStr}`}
                </span>
                {isOutOfStock && <span style={{ color: 'var(--danger)', fontSize: '0.65rem', display: 'block', fontWeight: 600 }}>OUT</span>}
              </>
            );
          })() : (
            <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 600 }}>Fresh / Unlimited</span>
          )}
        </div>
        <span style={{ 
          fontSize: '0.98rem', 
          fontWeight: 800, 
          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
          fontFamily: 'var(--font-title)'
        }}>
          ₹{variant.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
export default QuickSaleCard;
