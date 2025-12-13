'use client';

import { useState } from 'react';
import { 
  Award, 
  Clock, 
  Calendar, 
  Star, 
  Zap, 
  Trophy,
  Target,
  Heart,
  Shield,
  Coffee,
  Sparkles,
  Medal
} from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'attendance' | 'performance' | 'milestone' | 'special';
  earnedDate?: string;
  progress?: number;
  target?: number;
  locked: boolean;
}

// Mock achievements
export const staffAchievements: Achievement[] = [
  {
    id: '1',
    name: 'Perfect Week',
    description: '7 hari berturut-turut clock in tepat waktu',
    icon: 'clock',
    category: 'attendance',
    earnedDate: '2024-12-01',
    locked: false
  },
  {
    id: '2',
    name: 'Early Bird',
    description: 'Clock in 15 minit awal sebanyak 10 kali',
    icon: 'zap',
    category: 'attendance',
    progress: 8,
    target: 10,
    locked: false
  },
  {
    id: '3',
    name: 'Team Player',
    description: 'Bantu 5 kali swap shift dengan rakan',
    icon: 'heart',
    category: 'special',
    progress: 3,
    target: 5,
    locked: false
  },
  {
    id: '4',
    name: 'One Year Strong',
    description: 'Setahun bersama syarikat',
    icon: 'trophy',
    category: 'milestone',
    earnedDate: '2024-06-15',
    locked: false
  },
  {
    id: '5',
    name: 'Checklist Champion',
    description: 'Selesaikan checklist 30 hari berturut-turut',
    icon: 'shield',
    category: 'performance',
    progress: 15,
    target: 30,
    locked: false
  },
  {
    id: '6',
    name: '5 Star Rating',
    description: 'Dapat rating 5 bintang dari pelanggan',
    icon: 'star',
    category: 'performance',
    locked: true
  },
  {
    id: '7',
    name: 'Training Master',
    description: 'Selesaikan semua latihan wajib',
    icon: 'medal',
    category: 'special',
    locked: true
  },
  {
    id: '8',
    name: 'Coffee Expert',
    description: 'Lulus ujian barista dengan cemerlang',
    icon: 'coffee',
    category: 'special',
    locked: true
  }
];

const iconMap: Record<string, React.ReactNode> = {
  clock: <Clock size={24} />,
  zap: <Zap size={24} />,
  star: <Star size={24} />,
  trophy: <Trophy size={24} />,
  target: <Target size={24} />,
  heart: <Heart size={24} />,
  shield: <Shield size={24} />,
  coffee: <Coffee size={24} />,
  sparkles: <Sparkles size={24} />,
  medal: <Medal size={24} />,
  award: <Award size={24} />
};

const categoryColors: Record<string, string> = {
  attendance: '#3b82f6',
  performance: '#10b981',
  milestone: '#f59e0b',
  special: '#8b5cf6'
};

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function AchievementBadge({ 
  achievement, 
  size = 'md',
  showDetails = true 
}: AchievementBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };

  const color = categoryColors[achievement.category];
  const isInProgress = achievement.progress !== undefined && !achievement.earnedDate;
  const progressPercent = achievement.target 
    ? (achievement.progress! / achievement.target) * 100 
    : 0;

  return (
    <div 
      className={`achievement-badge ${sizeClasses[size]} ${achievement.locked ? 'locked' : ''} ${achievement.earnedDate ? 'earned' : ''}`}
      style={{ 
        '--badge-color': color,
        '--badge-bg': `${color}15`
      } as React.CSSProperties}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="badge-icon">
        {iconMap[achievement.icon] || <Award size={24} />}
        {achievement.earnedDate && (
          <div className="badge-earned-check">✓</div>
        )}
      </div>
      
      {showDetails && (
        <div className="badge-content">
          <div className="badge-name">{achievement.name}</div>
          {isInProgress && (
            <div className="badge-progress">
              <div className="badge-progress-bar">
                <div 
                  className="badge-progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="badge-progress-text">
                {achievement.progress}/{achievement.target}
              </span>
            </div>
          )}
        </div>
      )}

      {showTooltip && (
        <div className="badge-tooltip">
          <div className="tooltip-name">{achievement.name}</div>
          <div className="tooltip-description">{achievement.description}</div>
          {achievement.earnedDate && (
            <div className="tooltip-date">
              Diperoleh: {new Date(achievement.earnedDate).toLocaleDateString('ms-MY')}
            </div>
          )}
          {achievement.locked && (
            <div className="tooltip-locked">🔒 Belum dibuka</div>
          )}
        </div>
      )}
    </div>
  );
}

// Achievement Grid Component
interface AchievementGridProps {
  achievements: Achievement[];
  columns?: number;
}

export function AchievementGrid({ achievements, columns = 4 }: AchievementGridProps) {
  const earned = achievements.filter(a => a.earnedDate);
  const inProgress = achievements.filter(a => !a.earnedDate && !a.locked);
  const locked = achievements.filter(a => a.locked);

  return (
    <div className="achievement-grid-container">
      {earned.length > 0 && (
        <div className="achievement-section">
          <h4 className="achievement-section-title">
            <Trophy size={16} />
            Diperoleh ({earned.length})
          </h4>
          <div className="achievement-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {earned.map(a => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="achievement-section">
          <h4 className="achievement-section-title">
            <Target size={16} />
            Sedang Progress ({inProgress.length})
          </h4>
          <div className="achievement-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {inProgress.map(a => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className="achievement-section">
          <h4 className="achievement-section-title">
            <Sparkles size={16} />
            Belum Dibuka ({locked.length})
          </h4>
          <div className="achievement-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {locked.map(a => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

