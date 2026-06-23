import React from 'react';
import { CategoryContribution } from '../../types/analytics.types';
import { CATEGORY_COLORS } from '../../constants/theme';

interface CategoryChartProps {
  data: CategoryContribution[];
  title?: string;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  title = 'Category Performance'
}) => {
  const total = data.reduce((sum, item) => sum + item.salesAmount, 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="card" style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No category sales recorded yet
      </div>
    );
  }

  // Ring dimension settings
  const size = 160;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  const segments = data.map((item, index) => {
    const percentage = item.percentage;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = currentOffset;
    
    // Accumulate offset (note: we subtract since SVG circles draw clockwise but offset works backward)
    currentOffset -= (percentage / 100) * circumference;
    
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

    return {
      ...item,
      color,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h5>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-around' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                transform={`rotate(-90 ${center} ${center})`}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Sales</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>₹{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {segments.slice(0, 4).map((seg, i) => (
            <div key={i} className="flex-align-center" style={{ gap: '8px', fontSize: '0.8rem' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: seg.color,
                display: 'inline-block'
              }}></span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{seg.categoryName}</span>
                <span style={{ fontWeight: 700 }}>{seg.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default CategoryChart;
