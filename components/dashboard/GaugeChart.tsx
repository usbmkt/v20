// C:\Users\ADM\Desktop\USB MKT PRO V3\components\dashboard\GaugeChart.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  baseColor?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  label,
  color = '#1E90FF',
  baseColor = '#374151',
}) => {
  const validMax = max > 0 ? max : 1;
  const clampedValue = Math.min(validMax, Math.max(0, value));
  const valuePercentage = (clampedValue / validMax) * 100;

  // --- Keep Increased Radius ---
  const baseRadius = 55;
  const radius = baseRadius * 1.2; // 66
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const progressOffset = circumference * (1 - valuePercentage / 100);
  const viewBoxSize = (radius + strokeWidth) * 2; // 148
  const center = viewBoxSize / 2; // 74
  const glowId = `gaugeGlow-${label.replace(/\s+/g, '-')}`;
  const neonColor = '#1E90FF';

  return (
    // Simple flex column, center items horizontally
    <div className="flex flex-col items-center w-full h-full"> {/* Removed justify and padding */}
      {/* --- SVG container --- */}
      <div className={cn("relative w-[148px] h-[148px]")}> {/* Keep size */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          overflow="visible"
        >
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="glowBlur" />
               <feFlood floodColor={color} result="glowColor"/>
               <feComposite in="glowColor" in2="glowBlur" operator="in" result="coloredGlow"/>
              <feMerge>
                <feMergeNode in="coloredGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={center} cy={center} r={radius} fill="none" stroke={baseColor} strokeWidth={strokeWidth} />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: 'stroke-dashoffset 0.4s ease-out' }}
            filter={`url(#${glowId})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
             className="text-xl font-bold text-white"
             style={{ textShadow: `0 0 5px ${neonColor}, 0 0 8px ${neonColor}`}}
            >
                 {clampedValue.toFixed(1)}%
             </span>
        </div>
      </div>
       {/* --- Label with Top Margin --- */}
       <span
        className={cn(
            "text-[11px] text-gray-300 text-center leading-tight max-w-[100px]",
            "mt-2" // Add margin-top to create space below the circle container
        )}
        style={{ textShadow: `0 0 4px ${neonColor}`}}
       >
         {label}
       </span>
    </div>
  );
};

export default GaugeChart;