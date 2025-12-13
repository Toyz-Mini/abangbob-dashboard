'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useKPI } from '@/lib/store';
import { KPI_METRICS_CONFIG, getRankTier, getScoreColor, DEFAULT_KPI_CONFIG } from '@/lib/kpi-data';
import Link from 'next/link';
import { 
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Star,
  Award,
  Clock,
  ChefHat,
  Users,
  GraduationCap,
  Recycle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { KPIMetricKey } from '@/lib/types';

// Simple Radar Chart Component (CSS-based)
function RadarChart({ metrics }: { metrics: Record<KPIMetricKey, number> }) {
  const config = KPI_METRICS_CONFIG;
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  
  // Calculate points for the polygon
  const points = config.map((metric, index) => {
    const angle = (index / config.length) * 2 * Math.PI - Math.PI / 2;
    const value = metrics[metric.key] / 100;
    const radius = value * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      labelX: centerX + (maxRadius + 25) * Math.cos(angle),
      labelY: centerY + (maxRadius + 25) * Math.sin(angle),
      metric,
      value: metrics[metric.key]
    };
  });
  
  // Create polygon path
  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  // Grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(scale => ({
    radius: maxRadius * scale,
    label: `${Math.round(scale * 100)}%`
  }));
  
  // Grid lines (spokes)
  const gridLines = config.map((_, index) => {
    const angle = (index / config.length) * 2 * Math.PI - Math.PI / 2;
    return {
      x2: centerX + maxRadius * Math.cos(angle),
      y2: centerY + maxRadius * Math.sin(angle)
    };
  });
  
  return (
    <svg width="300" height="300" style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid Circles */}
      {gridCircles.map((circle, i) => (
        <circle 
          key={i}
          cx={centerX} 
          cy={centerY} 
          r={circle.radius}
          fill="none"
          stroke="var(--gray-200)"
          strokeWidth="1"
          strokeDasharray={i < 3 ? "4 4" : "0"}
        />
      ))}
      
      {/* Grid Lines (Spokes) */}
      {gridLines.map((line, i) => (
        <line 
          key={i}
          x1={centerX} 
          y1={centerY} 
          x2={line.x2} 
          y2={line.y2}
          stroke="var(--gray-200)"
          strokeWidth="1"
        />
      ))}
      
      {/* Data Polygon */}
      <path 
        d={polygonPath}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      
      {/* Data Points */}
      {points.map((point, i) => (
        <circle 
          key={i}
          cx={point.x} 
          cy={point.y} 
          r="5"
          fill="var(--primary)"
          stroke="white"
          strokeWidth="2"
        />
      ))}
      
      {/* Labels */}
      {points.map((point, i) => (
        <text 
          key={i}
          x={point.labelX} 
          y={point.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="var(--text-secondary)"
        >
          {point.metric.labelBM.split(' ')[0]}
        </text>
      ))}
    </svg>
  );
}

export default function StaffKPIProfilePage() {
  const params = useParams();
  const staffId = params.staffId as string;
  
  const { 
    staff, 
    getStaffKPI, 
    getStaffKPIHistory, 
    leaveRecords, 
    trainingRecords, 
    otRecords,
    customerReviews,
    isInitialized 
  } = useKPI();
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth);
  
  const staffInfo = staff.find(s => s.id === staffId);
  const currentKPI = getStaffKPI(staffId, selectedPeriod);
  const lastMonthKPI = getStaffKPI(staffId, lastMonth);
  const kpiHistory = getStaffKPIHistory(staffId);
  
  // Staff-specific records
  const staffLeaves = leaveRecords.filter(l => l.staffId === staffId);
  const staffTraining = trainingRecords.filter(t => t.staffId === staffId);
  const staffOT = otRecords.filter(o => o.staffId === staffId);
  const staffReviews = customerReviews.filter(r => r.staffId === staffId);
  
  // Calculate stats
  const emergencyLeaveCount = staffLeaves.filter(l => 
    (l.type === 'emergency' || l.type === 'medical') && 
    l.startDate.startsWith(selectedPeriod.slice(0, 7))
  ).length;
  
  const completedTrainingCount = staffTraining.filter(t => t.status === 'completed').length;
  const totalTrainingCount = staffTraining.length;
  
  const acceptedOTCount = staffOT.filter(o => o.accepted).length;
  const totalOTRequests = staffOT.length;
  
  const avgRating = staffReviews.length > 0 
    ? staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length 
    : 0;

  // Period options
  const periodOptions = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });
  
  // Get tier info
  const tier = currentKPI ? getRankTier(currentKPI.overallScore) : null;
  
  // Score difference from last month
  const scoreDiff = currentKPI && lastMonthKPI 
    ? currentKPI.overallScore - lastMonthKPI.overallScore 
    : 0;

  // Icon mapping for metrics
  const getMetricIcon = (key: KPIMetricKey) => {
    const icons: Record<KPIMetricKey, React.ReactNode> = {
      mealPrepTime: <ChefHat size={18} />,
      attendance: <Clock size={18} />,
      emergencyLeave: <Calendar size={18} />,
      upselling: <TrendingUp size={18} />,
      customerRating: <Star size={18} />,
      wasteReduction: <Recycle size={18} />,
      trainingComplete: <GraduationCap size={18} />,
      otWillingness: <Users size={18} />
    };
    return icons[key];
  };

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!staffInfo) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h2>Staf Tidak Dijumpai</h2>
          <Link href="/hr/kpi" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Kembali ke Leaderboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/hr/kpi" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
            <ArrowLeft size={18} />
            Kembali ke Leaderboard
          </Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 700
              }}>
                {staffInfo.name.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {staffInfo.name}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{staffInfo.role}</p>
              </div>
            </div>
            
            {/* Period Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--text-secondary)" />
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input"
                style={{ minWidth: '160px' }}
              >
                {periodOptions.map(period => (
                  <option key={period} value={period}>
                    {new Date(period + '-01').toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
          {/* Overall Score */}
          <div className="card" style={{ 
            background: tier ? `linear-gradient(135deg, ${tier.color}20, ${tier.color}10)` : 'var(--gray-50)',
            border: tier ? `2px solid ${tier.color}40` : '1px solid var(--gray-200)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {tier?.icon || '⭐'}
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 700,
                color: currentKPI ? getScoreColor(currentKPI.overallScore) : 'var(--text-secondary)'
              }}>
                {currentKPI?.overallScore || 0}%
              </div>
              <div style={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                color: tier?.color || 'var(--text-secondary)'
              }}>
                {tier?.tier || 'Tiada Data'}
              </div>
              {scoreDiff !== 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '0.25rem',
                  marginTop: '0.5rem',
                  color: scoreDiff > 0 ? 'var(--success)' : 'var(--danger)',
                  fontSize: '0.875rem'
                }}>
                  {scoreDiff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff}% dari bulan lepas
                </div>
              )}
            </div>
          </div>

          {/* Rank */}
          <div className="card">
            <div style={{ textAlign: 'center' }}>
              <Trophy size={32} color="var(--warning)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                #{currentKPI?.rank || '-'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Ranking
              </div>
            </div>
          </div>

          {/* Bonus */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
            <div style={{ textAlign: 'center' }}>
              <DollarSign size={32} style={{ marginBottom: '0.5rem', opacity: 0.9 }} />
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                RM{currentKPI?.bonusAmount || 0}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Bonus Bulan Ini
              </div>
            </div>
          </div>

          {/* Customer Rating */}
          <div className="card">
            <div style={{ textAlign: 'center' }}>
              <Star size={32} color="#eab308" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {avgRating.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Rating Purata ({staffReviews.length} reviews)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Radar Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--primary)" />
                Prestasi Metrics
              </div>
            </div>
            
            {currentKPI ? (
              <div style={{ padding: '1rem 0' }}>
                <RadarChart metrics={currentKPI.metrics} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>Tiada data KPI untuk bulan ini</p>
              </div>
            )}
          </div>

          {/* Detailed Metrics */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Skor Terperinci</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {KPI_METRICS_CONFIG.map((metric) => {
                const score = currentKPI?.metrics[metric.key] || 0;
                return (
                  <div key={metric.key} style={{ 
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gray-50)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ color: metric.color }}>
                          {getMetricIcon(metric.key)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{metric.labelBM}</span>
                      </div>
                      <span style={{ 
                        fontWeight: 700, 
                        color: getScoreColor(score)
                      }}>
                        {score}%
                      </span>
                    </div>
                    <div style={{ 
                      height: '6px', 
                      background: 'var(--gray-200)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${score}%`,
                        background: metric.color,
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Training */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={18} color="var(--primary)" />
                Latihan
              </div>
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>Selesai</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{completedTrainingCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>Dalam Progress</span>
                <span style={{ fontWeight: 600, color: 'var(--warning)' }}>
                  {staffTraining.filter(t => t.status === 'in_progress').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {staffTraining.filter(t => t.status === 'pending').length}
                </span>
              </div>
            </div>
            {staffTraining.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                {staffTraining.slice(0, 3).map(t => (
                  <div key={t.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem'
                  }}>
                    {t.status === 'completed' 
                      ? <CheckCircle size={14} color="var(--success)" />
                      : t.status === 'in_progress'
                      ? <Clock size={14} color="var(--warning)" />
                      : <AlertCircle size={14} color="var(--text-secondary)" />
                    }
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Records */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--danger)" />
                Cuti Bulan Ini
              </div>
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>Emergency Leave</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                  {staffLeaves.filter(l => l.type === 'emergency').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>Medical (MC)</span>
                <span style={{ fontWeight: 600, color: 'var(--warning)' }}>
                  {staffLeaves.filter(l => l.type === 'medical').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Annual Leave</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {staffLeaves.filter(l => l.type === 'annual').length}
                </span>
              </div>
            </div>
          </div>

          {/* OT Willingness */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--success)" />
                Overtime
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>
                {totalOTRequests > 0 ? Math.round((acceptedOTCount / totalOTRequests) * 100) : 0}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Acceptance Rate
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {acceptedOTCount} accepted / {totalOTRequests} requests
              </div>
            </div>
            {staffOT.length > 0 && (
              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                {staffOT.slice(0, 3).map(o => (
                  <div key={o.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem'
                  }}>
                    {o.accepted 
                      ? <CheckCircle size={14} color="var(--success)" />
                      : <XCircle size={14} color="var(--danger)" />
                    }
                    <span>{o.date} - {o.hoursRequested}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI History */}
        {kpiHistory.length > 1 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Sejarah KPI</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th style={{ textAlign: 'center' }}>Rank</th>
                  <th style={{ textAlign: 'right' }}>Score</th>
                  <th style={{ textAlign: 'right' }}>Bonus</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {kpiHistory.map(kpi => {
                  const kpiTier = getRankTier(kpi.overallScore);
                  return (
                    <tr key={kpi.id}>
                      <td>
                        {new Date(kpi.period + '-01').toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: kpi.rank <= 3 ? '#fef3c7' : 'var(--gray-100)',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}>
                          {kpi.rank}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: getScoreColor(kpi.overallScore) }}>
                          {kpi.overallScore}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                        RM{kpi.bonusAmount}
                      </td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${kpiTier.color}20`,
                          color: kpiTier.color
                        }}>
                          {kpiTier.icon} {kpiTier.tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

