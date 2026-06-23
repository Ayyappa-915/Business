import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // e.g. +12 or -5 percentage
  trendLabel?: string;
  color?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel = 'vs yesterday',
  color = 'var(--primary)'
}) => {
  const isPositive = trend && trend >= 0;

  return (
    <div className="card interactive" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative accent background blob */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: `${color}08`,
        pointerEvents: 'none'
      }}></div>

      <div className="flex-between">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {title}
        </span>
        <div style={{
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
          {value}
        </span>
        {trend !== undefined && (
          <div className="flex-align-center" style={{ gap: '4px', fontSize: '0.78rem' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              color: isPositive ? 'var(--success)' : 'var(--danger)'
            }}>
              {isPositive ? <ArrowUp size={12} style={{ marginRight: '2px' }} /> : <ArrowDown size={12} style={{ marginRight: '2px' }} />}
              {Math.abs(trend)}%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardCard;
