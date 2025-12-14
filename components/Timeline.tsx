'use client';

import { ReactNode, useMemo } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ms } from 'date-fns/locale';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: 'success' | 'warning' | 'danger' | 'default';
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  groupByDate?: boolean;
  showRelativeTime?: boolean;
  locale?: 'ms' | 'en';
  className?: string;
}

export default function Timeline({
  items,
  groupByDate = true,
  showRelativeTime = true,
  locale = 'ms',
  className = '',
}: TimelineProps) {
  // Group items by date if enabled
  const groupedItems = useMemo(() => {
    if (!groupByDate) {
      return { 'All': items };
    }

    const groups: Record<string, TimelineItem[]> = {};

    items.forEach(item => {
      const date = typeof item.timestamp === 'string' ? new Date(item.timestamp) : item.timestamp;
      let groupKey: string;

      if (isToday(date)) {
        groupKey = locale === 'ms' ? 'Hari Ini' : 'Today';
      } else if (isYesterday(date)) {
        groupKey = locale === 'ms' ? 'Semalam' : 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = locale === 'ms' ? 'Minggu Ini' : 'This Week';
      } else {
        groupKey = format(date, 'd MMMM yyyy', { locale: locale === 'ms' ? ms : undefined });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [items, groupByDate, locale]);

  const formatTime = (timestamp: Date | string): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    if (showRelativeTime && isToday(date)) {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: locale === 'ms' ? ms : undefined 
      });
    }
    
    return format(date, 'HH:mm', { locale: locale === 'ms' ? ms : undefined });
  };

  return (
    <div className={`timeline ${className}`}>
      {Object.entries(groupedItems).map(([group, groupItems]) => (
        <div key={group}>
          {groupByDate && (
            <div className="timeline-group-header">{group}</div>
          )}
          
          {groupItems.map((item, index) => (
            <div key={item.id} className="timeline-item">
              <div className={`timeline-dot ${item.status || 'default'}`} />
              
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-title">
                    {item.icon && <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>}
                    {item.title}
                  </span>
                  <span className="timeline-time">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                
                {item.description && (
                  <p className="timeline-description">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Simple timeline variant without grouping
interface SimpleTimelineProps {
  items: Array<{
    id: string;
    content: ReactNode;
    timestamp?: Date | string;
    dot?: 'success' | 'warning' | 'danger' | 'default';
  }>;
  className?: string;
}

export function SimpleTimeline({ items, className = '' }: SimpleTimelineProps) {
  return (
    <div className={`timeline ${className}`}>
      {items.map(item => (
        <div key={item.id} className="timeline-item">
          <div className={`timeline-dot ${item.dot || 'default'}`} />
          <div className="timeline-content">
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}




