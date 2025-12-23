'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    User,
    Phone,
    FileText,
    Calendar,
    MapPin,
    AlertCircle,
    Users,
    CheckCircle,
    ChevronRight,
} from 'lucide-react';

interface ProfileFormData {
    phone: string;
    icNumber: string;
    dateOfBirth: string;
    address: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState<ProfileFormData>({
        phone: '',
        icNumber: '',
        dateOfBirth: '',
        address: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleInputChange = (field: keyof ProfileFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep1 = () => {
        if (!formData.phone || !formData.icNumber || !formData.dateOfBirth) {
            setError('Sila isi semua maklumat yang diperlukan');
            return false;
        }
        setError('');
        return true;
    };

    const validateStep2 = () => {
        if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
            setError('Sila isi maklumat kenalan kecemasan');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        setLoading(true);
        setError('');

        try {
            // Update user profile via API
            const response = await fetch('/api/user/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    ...formData,
                    emergencyContact: {
                        name: formData.emergencyContactName,
                        relation: formData.emergencyContactRelation,
                        phone: formData.emergencyContactPhone,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Gagal menyimpan profil');
            }

            // Redirect to pending approval page
            router.push('/pending-approval');
        } catch (err) {
            setError('Ralat berlaku. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="profile-page">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <h1>Lengkapkan Profil Anda</h1>
                    <p>Selamat datang, {user?.name}! Sila lengkapkan maklumat anda.</p>
                </div>

                {/* Progress Steps */}
                <div className="profile-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <span>Maklumat Peribadi</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <span>Kenalan Kecemasan</span>
                    </div>
                </div>

                {/* Form */}
                <div className="profile-form">
                    {step === 1 && (
                        <div className="form-step">
                            <h2>
                                <User size={20} />
                                Maklumat Peribadi
                            </h2>

                            <div className="form-group">
                                <label>
                                    <Phone size={16} />
                                    Nombor Telefon *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="+673 XXXXXXX"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <FileText size={16} />
                                    No. Kad Pengenalan *
                                </label>
                                <input
                                    type="text"
                                    value={formData.icNumber}
                                    onChange={(e) => handleInputChange('icNumber', e.target.value)}
                                    placeholder="00-XXXXXX"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Calendar size={16} />
                                    Tarikh Lahir *
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <MapPin size={16} />
                                    Alamat Rumah
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Alamat penuh anda"
                                    rows={3}
                                />
                            </div>

                            {error && (
                                <div className="form-error">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                className="btn-next"
                                onClick={() => {
                                    if (validateStep1()) setStep(2);
                                }}
                            >
                                Seterusnya
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-step">
                            <h2>
                                <Users size={20} />
                                Kenalan Kecemasan
                            </h2>

                            <div className="form-group">
                                <label>Nama Kenalan *</label>
                                <input
                                    type="text"
                                    value={formData.emergencyContactName}
                                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                                    placeholder="Nama penuh"
                                />
                            </div>

                            <div className="form-group">
                                <label>Hubungan</label>
                                <select
                                    value={formData.emergencyContactRelation}
                                    onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                                >
                                    <option value="">Pilih hubungan</option>
                                    <option value="Ibu/Bapa">Ibu/Bapa</option>
                                    <option value="Suami/Isteri">Suami/Isteri</option>
                                    <option value="Adik-beradik">Adik-beradik</option>
                                    <option value="Anak">Anak</option>
                                    <option value="Saudara">Saudara</option>
                                    <option value="Kawan">Kawan</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    <Phone size={16} />
                                    Nombor Telefon *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.emergencyContactPhone}
                                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                                    placeholder="+673 XXXXXXX"
                                />
                            </div>

                            {error && (
                                <div className="form-error">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="form-buttons">
                                <button
                                    className="btn-back"
                                    onClick={() => setStep(1)}
                                >
                                    Kembali
                                </button>
                                <button
                                    className="btn-submit"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Hantar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .profile-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 1rem;
        }

        .profile-container {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .profile-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 2rem;
          margin: 0 auto 1rem;
        }

        .profile-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
        }

        .profile-header p {
          color: #666;
          font-size: 0.9rem;
        }

        .profile-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.4;
        }

        .step.active {
          opacity: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .step.active .step-number {
          background: #CC1512;
          color: white;
        }

        .step span {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .step-line {
          width: 40px;
          height: 2px;
          background: #e5e7eb;
          margin: 0 0.5rem;
        }

        .form-step h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: #fafafa;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #CC1512;
          background: white;
          box-shadow: 0 0 0 4px rgba(204, 21, 18, 0.1);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .btn-next,
        .btn-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-next:hover,
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(204, 21, 18, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .form-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-back {
          flex: 1;
          padding: 1rem;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-submit {
          flex: 2;
        }
      `}</style>
        </div>
    );
}
