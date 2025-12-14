'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaff } from '@/lib/store';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import { 
  ArrowLeft,
  GraduationCap,
  Award,
  Clock,
  CheckCircle,
  PlayCircle,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Star,
  BookOpen,
  FileText
} from 'lucide-react';

const CURRENT_STAFF_ID = '2';

interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  status: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
  completedDate?: string;
  mandatory: boolean;
  expiryDate?: string;
}

interface Certificate {
  id: string;
  name: string;
  issuedDate: string;
  expiryDate?: string;
  issuer: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

// Mock data
const mockTrainings: Training[] = [
  {
    id: '1',
    title: 'Food Safety & Hygiene',
    description: 'Asas keselamatan makanan dan kebersihan di dapur',
    category: 'Mandatory',
    duration: 60,
    status: 'completed',
    completedDate: '2024-10-15',
    mandatory: true,
    expiryDate: '2025-10-15'
  },
  {
    id: '2',
    title: 'Customer Service Excellence',
    description: 'Teknik melayan pelanggan dengan cemerlang',
    category: 'Skills',
    duration: 45,
    status: 'in_progress',
    progress: 60,
    mandatory: false
  },
  {
    id: '3',
    title: 'Fire Safety Training',
    description: 'Prosedur keselamatan kebakaran dan evakuasi',
    category: 'Mandatory',
    duration: 30,
    status: 'not_started',
    mandatory: true
  },
  {
    id: '4',
    title: 'POS System Training',
    description: 'Cara menggunakan sistem POS dengan berkesan',
    category: 'Technical',
    duration: 90,
    status: 'completed',
    completedDate: '2024-09-20',
    mandatory: false
  },
  {
    id: '5',
    title: 'Barista Basics',
    description: 'Asas membuat kopi dan minuman',
    category: 'Skills',
    duration: 120,
    status: 'not_started',
    mandatory: false
  }
];

const mockCertificates: Certificate[] = [
  {
    id: '1',
    name: 'Food Handler Certificate',
    issuedDate: '2024-10-15',
    expiryDate: '2025-10-15',
    issuer: 'Ministry of Health',
    status: 'valid'
  },
  {
    id: '2',
    name: 'First Aid Certificate',
    issuedDate: '2023-06-01',
    expiryDate: '2024-06-01',
    issuer: 'Red Crescent',
    status: 'expired'
  }
];

export default function TrainingPage() {
  const { staff, isInitialized } = useStaff();
  const [activeTab, setActiveTab] = useState<'training' | 'certificates'>('training');
  
  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);

  const completedCount = mockTrainings.filter(t => t.status === 'completed').length;
  const inProgressCount = mockTrainings.filter(t => t.status === 'in_progress').length;
  const mandatoryPending = mockTrainings.filter(t => t.mandatory && t.status !== 'completed').length;

  if (!isInitialized || !currentStaff) {
    return (
      <MainLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="staff-portal animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/staff-portal" className="btn btn-outline btn-sm" style={{ marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} />
            Kembali
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
            Latihan & Sijil
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track progress latihan dan sijil anda
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 staff-stagger" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="staff-stat-card success">
            <div className="staff-stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="staff-stat-value">{completedCount}</div>
            <div className="staff-stat-label">Selesai</div>
          </div>
          
          <div className="staff-stat-card primary">
            <div className="staff-stat-icon primary">
              <PlayCircle size={24} />
            </div>
            <div className="staff-stat-value">{inProgressCount}</div>
            <div className="staff-stat-label">Sedang Berjalan</div>
          </div>
          
          {mandatoryPending > 0 && (
            <div className="staff-stat-card warm">
              <div className="staff-stat-icon warm">
                <AlertTriangle size={24} />
              </div>
              <div className="staff-stat-value">{mandatoryPending}</div>
              <div className="staff-stat-label">Wajib Belum Selesai</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            className={`btn ${activeTab === 'training' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('training')}
            style={{ flex: 1 }}
          >
            <GraduationCap size={18} />
            Latihan
          </button>
          <button
            className={`btn ${activeTab === 'certificates' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('certificates')}
            style={{ flex: 1 }}
          >
            <Award size={18} />
            Sijil
          </button>
        </div>

        {/* Training List */}
        {activeTab === 'training' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} />
                Senarai Latihan
              </div>
            </div>

            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockTrainings.map(training => (
                <div key={training.id} className="training-card">
                  <div className="training-header">
                    <div className="training-info">
                      <div className="training-title">
                        {training.title}
                        {training.mandatory && (
                          <span className="badge badge-danger" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>WAJIB</span>
                        )}
                      </div>
                      <div className="training-description">{training.description}</div>
                      <div className="training-meta">
                        <span><Clock size={12} /> {training.duration} minit</span>
                        <span className="training-category">{training.category}</span>
                      </div>
                    </div>
                    
                    <div className="training-status">
                      {training.status === 'completed' ? (
                        <div className="status-completed">
                          <CheckCircle size={24} />
                          <span>Selesai</span>
                          <span className="status-date">{training.completedDate}</span>
                        </div>
                      ) : training.status === 'in_progress' ? (
                        <div className="status-progress">
                          <div className="progress-circle">
                            <svg viewBox="0 0 36 36">
                              <path
                                className="progress-bg"
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="progress-fill"
                                strokeDasharray={`${training.progress}, 100`}
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span>{training.progress}%</span>
                          </div>
                          <span>Sedang Berjalan</span>
                        </div>
                      ) : (
                        <button className="btn btn-primary btn-sm">
                          <PlayCircle size={16} />
                          Mula
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {training.status === 'in_progress' && (
                    <div className="training-progress-bar">
                      <div className="progress-bar" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${training.progress}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {activeTab === 'certificates' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} />
                Sijil Saya
              </div>
            </div>

            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockCertificates.map(cert => (
                <div 
                  key={cert.id} 
                  className={`certificate-card ${cert.status}`}
                >
                  <div className="certificate-icon">
                    <Award size={28} />
                  </div>
                  <div className="certificate-info">
                    <div className="certificate-name">{cert.name}</div>
                    <div className="certificate-issuer">{cert.issuer}</div>
                    <div className="certificate-dates">
                      <span>Dikeluarkan: {new Date(cert.issuedDate).toLocaleDateString('ms-MY')}</span>
                      {cert.expiryDate && (
                        <span>Tamat: {new Date(cert.expiryDate).toLocaleDateString('ms-MY')}</span>
                      )}
                    </div>
                  </div>
                  <div className="certificate-status">
                    <span className={`badge badge-${cert.status === 'valid' ? 'success' : cert.status === 'expiring_soon' ? 'warning' : 'danger'}`}>
                      {cert.status === 'valid' ? 'Sah' : cert.status === 'expiring_soon' ? 'Hampir Tamat' : 'Tamat Tempoh'}
                    </span>
                  </div>
                </div>
              ))}

              {mockCertificates.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <Award size={40} color="var(--gray-300)" style={{ marginBottom: '0.75rem' }} />
                  <div>Tiada sijil</div>
                </div>
              )}
            </div>
          </div>
        )}

        <StaffPortalNav />
      </div>
    </MainLayout>
  );
}




