'use client';

import { useMemo } from 'react';

interface TimeHeatmapProps {
  data: Array<{
    dayOfWeek: number; // 0 = Sunday
    hour: number; // 0-23
    value: number;
  }>;
  valueLabel?: string;
}

const DAYS = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

export default function TimeHeatmap({ data, valueLabel = 'pesanan' }: TimeHeatmapProps) {
  const { heatmapData, maxValue } = useMemo(() => {
    // Create a 7x17 grid (days x hours)
    const grid: Record<string, number> = {};
    let max = 0;

    data.forEach(item => {
      const key = `${item.dayOfWeek}-${item.hour}`;
      grid[key] = (grid[key] || 0) + item.value;
      if (grid[key] > max) max = grid[key];
    });

    return { heatmapData: grid, maxValue: max };
  }, [data]);

  const getColor = (value: number) => {
    if (maxValue === 0) return 'var(--gray-100)';
    const intensity = value / maxValue;
    
    if (intensity === 0) return 'var(--gray-100)';
    if (intensity < 0.2) return '#d1fae5'; // green-100
    if (intensity < 0.4) return '#6ee7b7'; // green-300
    if (intensity < 0.6) return '#34d399'; // green-400
    if (intensity < 0.8) return '#10b981'; // green-500
    return '#059669'; // green-600
  };

  return (
    <div className="time-heatmap">
      {/* Hour labels */}
      <div className="heatmap-row heatmap-header">
        <div className="heatmap-label" />
        {HOURS.map(hour => (
          <div key={hour} className="heatmap-hour-label">
            {hour}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {DAYS.map((day, dayIndex) => (
        <div key={day} className="heatmap-row">
          <div className="heatmap-label">{day}</div>
          {HOURS.map(hour => {
            const value = heatmapData[`${dayIndex}-${hour}`] || 0;
            return (
              <div
                key={hour}
                className="heatmap-cell"
                style={{ backgroundColor: getColor(value) }}
                title={`${day} ${hour}:00 - ${value} ${valueLabel}`}
              >
                {value > 0 && maxValue > 0 && value === maxValue && (
                  <span className="heatmap-peak">★</span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="heatmap-legend">
        <span>Kurang</span>
        <div className="heatmap-legend-colors">
          <div style={{ backgroundColor: 'var(--gray-100)' }} />
          <div style={{ backgroundColor: '#d1fae5' }} />
          <div style={{ backgroundColor: '#6ee7b7' }} />
          <div style={{ backgroundColor: '#34d399' }} />
          <div style={{ backgroundColor: '#10b981' }} />
          <div style={{ backgroundColor: '#059669' }} />
        </div>
        <span>Banyak</span>
      </div>
    </div>
  );
}


