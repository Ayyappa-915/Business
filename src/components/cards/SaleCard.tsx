import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { Sale } from '../../types/sale.types';
import { useAppSelector } from '../../app/hooks';
import Badge from '../common/Badge';

interface SaleCardProps {
  sale: Sale;
  onViewDetails?: () => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({
  sale,
  onViewDetails
}) => {
  const products = useAppSelector(state => state.db.products);
  const variants = useAppSelector(state => state.db.variants);

  const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  const itemNames = sale.items
    .map(item => {
      const prod = products.find(p => p.id === item.productId);
      const variant = variants.find(v => v.id === item.variantId);
      if (!prod) return '';
      return variant ? `${prod.name} (${variant.name})` : prod.name;
    })
    .filter(Boolean);

  const previewText = itemNames.length > 0
    ? itemNames.slice(0, 2).join(', ') + (itemNames.length > 2 ? '...' : '')
    : 'No items';

  return (
    <div className="card interactive" onClick={onViewDetails} style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: onViewDetails ? 'pointer' : 'default' }}>
      <div className="flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--success-soft)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>
            📤
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {sale.customerName || 'Walk-in Customer'}
            </h5>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {previewText} ({totalQty} {totalQty === 1 ? 'item' : 'items'})
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--success)',
            fontFamily: 'var(--font-title)'
          }}>
            + ₹{sale.totalAmount}
          </span>
          <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
            {sale.paymentStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {new Date(sale.saleDate).toLocaleDateString()}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={12} /> {sale.paymentMethod.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
export default SaleCard;
