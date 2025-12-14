'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useKPI } from '@/lib/store';
import { KPI_METRICS_CONFIG, getRankTier, getScoreColor, DEFAULT_KPI_CONFIG } from '@/lib/kpi-data';
import Link from 'next/link';
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
  Crown,
  Award,
  Target
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';

export default function KPIDashboardPage() {
  const { staffKPI, staff, getKPILeaderboard, isInitialized } = useKPI();
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth);
  
  const leaderboard = getKPILeaderboard(selectedPeriod);
  
  // Get staff info for display
  const getStaffInfo = (staffId: string) => {
    return staff.find(s => s.id === staffId);
  };
  
  // Calculate average KPI score
  const avgScore = leaderboard.length > 0 
    ? Math.round(leaderboard.reduce((sum, k) => sum + k.overallScore, 0) / leaderboard.length)
    : 0;
  
  // Total bonus payout
  const totalBonus = leaderboard.reduce((sum, k) => sum + k.bonusAmount, 0);
  
  // Top performer
  const topPerformer = leaderboard[0];
  const topPerformerInfo = topPerformer ? getStaffInfo(topPerformer.staffId) : null;

  // Generate period options (last 6 months)
  const periodOptions = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Trophy size={32} color="var(--warning)" />
              KPI & Leaderboard
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Prestasi staf dan ranking bulanan
            </p>
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

        {/* Stats Overview */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Purata KPI"
            value={`${avgScore}%`}
            change={avgScore >= 80 ? "cemerlang" : avgScore >= 60 ? "baik" : "perlu ditingkatkan"}
            changeType={avgScore >= 80 ? "positive" : avgScore >= 60 ? "neutral" : "negative"}
            icon={Target}
            gradient="primary"
          />
          <StatCard
            label="Jumlah Staf"
            value={leaderboard.length}
            change="dengan data KPI"
            changeType="neutral"
            icon={Users}
            gradient="coral"
          />
          <StatCard
            label="Jumlah Bonus"
            value={`RM${totalBonus}`}
            change="bulan ini"
            changeType="positive"
            icon={DollarSign}
            gradient="warning"
          />
          <StatCard
            label="Top Performer"
            value={topPerformerInfo?.name || '-'}
            change={topPerformer ? `${topPerformer.overallScore}%` : '-'}
            changeType="positive"
            icon={Crown}
          />
        </div>

        {/* Main Content - Leaderboard & Top 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
          {/* Top 3 Podium */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--warning)" />
                Top 3 Bulan Ini
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
              {leaderboard.slice(0, 3).map((kpi, idx) => {
                const staffInfo = getStaffInfo(kpi.staffId);
                const tier = getRankTier(kpi.overallScore);
                const medals = ['🥇', '🥈', '🥉'];
                const podiumColors = ['#fbbf24', '#94a3b8', '#d97706'];
                
                return (
                  <Link 
                    key={kpi.id} 
                    href={`/hr/kpi/${kpi.staffId}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '1rem',
                        background: idx === 0 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))' : 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        border: idx === 0 ? '2px solid #fbbf24' : '1px solid var(--gray-200)',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      className="hover-lift"
                    >
                      <div style={{ 
                        fontSize: '2rem',
                        minWidth: '48px',
                        textAlign: 'center'
                      }}>
                        {medals[idx]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{staffInfo?.name}</div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: tier.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {tier.icon} {tier.tier}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 700,
                          color: getScoreColor(kpi.overallScore)
                        }}>
                          {kpi.overallScore}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                          +RM{kpi.bonusAmount}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {leaderboard.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: 'var(--text-secondary)'
                }}>
                  <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>Tiada data KPI untuk bulan ini</p>
                </div>
              )}
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Medal size={20} color="var(--primary)" />
                Ranking Penuh
              </div>
              <div className="card-subtitle">
                {leaderboard.length} staf aktif
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Nama</th>
                    <th style={{ textAlign: 'center' }}>Tier</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                    <th style={{ textAlign: 'right' }}>Bonus</th>
                    <th style={{ width: '80px' }}>Trend</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((kpi) => {
                    const staffInfo = getStaffInfo(kpi.staffId);
                    const tier = getRankTier(kpi.overallScore);
                    
                    // Get last month score for trend
                    const lastMonthKPI = staffKPI.find(k => k.staffId === kpi.staffId && k.period === lastMonth);
                    const scoreDiff = lastMonthKPI ? kpi.overallScore - lastMonthKPI.overallScore : 0;
                    
                    return (
                      <tr key={kpi.id}>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: kpi.rank <= 3 
                              ? kpi.rank === 1 ? '#fef3c7' 
                              : kpi.rank === 2 ? '#f1f5f9' 
                              : '#fef3c7'
                              : 'var(--gray-100)',
                            fontWeight: 700,
                            fontSize: kpi.rank <= 3 ? '0.875rem' : '0.75rem',
                            color: kpi.rank <= 3 ? '#92400e' : 'var(--text-secondary)'
                          }}>
                            {kpi.rank}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{staffInfo?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {staffInfo?.role}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${tier.color}20`,
                            color: tier.color
                          }}>
                            {tier.icon} {tier.tier}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: '1.1rem',
                            color: getScoreColor(kpi.overallScore)
                          }}>
                            {kpi.overallScore}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            RM{kpi.bonusAmount}
                          </span>
                        </td>
                        <td>
                          {scoreDiff !== 0 && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              color: scoreDiff > 0 ? 'var(--success)' : 'var(--danger)',
                              fontSize: '0.875rem'
                            }}>
                              {scoreDiff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              {Math.abs(scoreDiff)}%
                            </div>
                          )}
                        </td>
                        <td>
                          <Link href={`/hr/kpi/${kpi.staffId}`} className="btn btn-ghost btn-sm">
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {leaderboard.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem',
                  color: 'var(--text-secondary)'
                }}>
                  <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>Tiada data KPI untuk tempoh ini</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Metrics Legend */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Metrik KPI</div>
            <div className="card-subtitle">8 metrik yang dinilai untuk setiap staf</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1rem' }}>
            {KPI_METRICS_CONFIG.map((metric) => (
              <div 
                key={metric.key}
                style={{ 
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--gray-200)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    background: metric.color
                  }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{metric.labelBM}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {metric.description}
                </p>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-secondary)',
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--gray-100)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block'
                }}>
                  Berat: {metric.weight}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Base Bonus Info */}
        <div className="card" style={{ marginTop: '1.5rem', background: 'var(--gray-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <DollarSign size={24} color="var(--success)" />
            <div>
              <div style={{ fontWeight: 600 }}>Formula Bonus</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Bonus = RM{DEFAULT_KPI_CONFIG.baseBonus} × (KPI Score / 100)
              </div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '0.5rem 1rem', background: 'var(--success)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
              Base: RM{DEFAULT_KPI_CONFIG.baseBonus}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

