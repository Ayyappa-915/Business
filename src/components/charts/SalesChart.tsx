import React from 'react';
import { ChartDataPoint } from '../../types/analytics.types';

interface SalesChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string;
  height?: number;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  title = 'Sales Trend',
  color = 'var(--success)',
  height = 160
}) => {
  if (data.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data available</div>;
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1000); // minimum scale limit
  
  // Chart dimensions
  const width = 500;
  const paddingX = 40;
  const paddingY = 20;
  
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates for points
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth;
    // Invert Y axis for SVG (0,0 is top-left)
    const y = paddingY + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, label: d.label, val: d.value };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Create gradient fill underneath line
  const fillPoints = `${paddingX},${paddingY + chartHeight} ` + 
                     polylinePoints + 
                     ` ${paddingX + chartWidth},${paddingY + chartHeight}`;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {title && <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h5>}
      
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((r, i) => (
            <line
              key={i}
              x1={paddingX}
              y1={paddingY + chartHeight * r}
              x2={paddingX + chartWidth}
              y2={paddingY + chartHeight * r}
              stroke="var(--border-color)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area under the line */}
          <polygon points={fillPoints} fill="url(#chartGradient)" />

          {/* Trend line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="var(--bg-secondary)"
                stroke={color}
                strokeWidth="2.5"
              />
              {/* Tooltip value */}
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="700"
              >
                ₹{p.val >= 1000 ? `${(p.val / 1000).toFixed(1)}k` : p.val}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontWeight="500"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
export default SalesChart;
