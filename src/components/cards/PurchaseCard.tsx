import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { Purchase } from '../../types/purchase.types';
import Badge from '../common/Badge';

interface PurchaseCardProps {
  purchase: Purchase;
  onViewDetails?: () => void;
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({
  purchase,
  onViewDetails
}) => {
  const isPrepared = purchase.type === 'prepared';

  // Count items: new free-form exchangedItems, or legacy variant items
  const exchangedCount = purchase.exchangedItems?.length || purchase.items?.length || 0;
  const totalQty = isPrepared
    ? purchase.preparedItems?.length || 0
    : exchangedCount;

  // Build a short item name preview
  const itemPreview = isPrepared
    ? purchase.preparedItems?.slice(0, 2).map(i => i.name).join(', ')
    : purchase.exchangedItems?.slice(0, 2).map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ')
    || purchase.items?.slice(0, 2).map(i => `Item ×${i.quantity}`).join(', ')
    || '';

  return (
    <div className="card interactive" onClick={onViewDetails} style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: onViewDetails ? 'pointer' : 'default' }}>
      <div className="flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isPrepared ? 'var(--info-soft)' : 'var(--primary-soft)',
            color: isPrepared ? 'var(--info)' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>
            {isPrepared ? '🍳' : '📥'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {purchase.supplierName || (isPrepared ? 'Raw Ingredients' : 'Stock Purchase')}
            </h5>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {totalQty} {isPrepared ? (totalQty === 1 ? 'ingredient' : 'ingredients') : (totalQty === 1 ? 'item' : 'items')} purchased
            </span>
            {itemPreview && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {itemPreview}{totalQty > 2 ? ` +${totalQty - 2} more` : ''}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--primary)',
            fontFamily: 'var(--font-title)'
          }}>
            ₹{purchase.totalAmount.toFixed(2)}
          </span>
          <Badge variant={purchase.paymentStatus === 'paid' ? 'success' : purchase.paymentStatus === 'partial' ? 'warning' : 'danger'}>
            {purchase.paymentStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {new Date(purchase.purchaseDate).toLocaleDateString()}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={12} /> {purchase.paymentMethod.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
export default PurchaseCard;
