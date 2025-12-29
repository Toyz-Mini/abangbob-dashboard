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
    CreditCard,
    Shirt,
    ArrowLeft
} from 'lucide-react';

interface ProfileFormData {
    phone: string;
    icNumber: string;
    dateOfBirth: string;
    address: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountHolder: string;
    tshirtSize: string;
    shoeSize: string;
}

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const BANKS = [
    'Maybank',
    'CIMB Bank',
    'Public Bank',
    'RHB Bank',
    'Hong Leong Bank',
    'AmBank',
    'Bank Islam',
    'Bank Rakyat',
    'BSN',
    'HSBC',
    'OCBC',
    'Standard Chartered',
    'UOB',
    'Alliance Bank',
    'Affin Bank',
    'MBSB Bank'
];

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
        bankName: '',
        bankAccountNo: '',
        bankAccountHolder: '',
        tshirtSize: '',
        shoeSize: '',
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
        setError(''); // Clear error on change
    };

    const validateStep1 = () => {
        if (!formData.phone || !formData.icNumber || !formData.dateOfBirth || !formData.address) {
            setError('Sila isi semua maklumat peribadi (Telefon, No. KP, Tarikh Lahir, Alamat)');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.emergencyContactName || !formData.emergencyContactPhone || !formData.emergencyContactRelation) {
            setError('Sila isi semua maklumat kenalan kecemasan');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!formData.bankName || !formData.bankAccountNo || !formData.bankAccountHolder || !formData.tshirtSize || !formData.shoeSize) {
            setError('Sila isi semua maklumat bank dan saiz');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2);
        } else if (step === 2) {
            if (validateStep2()) setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

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

            // Redirect to pending approval page (force reload to update auth context)
            window.location.href = '/pending-approval';
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
                    <p>Selamat datang, {user?.name}! Sila isikan maklumat lengkap anda.</p>
                </div>

                {/* Progress Steps */}
                <div className="profile-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <span className="step-label">Peribadi</span>
                    </div>
                    <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <span className="step-label">Waris</span>
                    </div>
                    <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <span className="step-label">Lain-lain</span>
                    </div>
                </div>

                {/* Form */}
                <div className="profile-form">
                    {step === 1 && (
                        <div className="form-step fade-in">
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
                                    placeholder="+60 1X-XXXXXXX"
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
                                    placeholder="XXXXXX-XX-XXXX"
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
                                    Alamat Rumah *
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Alamat penuh surat-menyurat"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-step fade-in">
                            <h2>
                                <Users size={20} />
                                Kenalan Kecemasan
                            </h2>

                            <div className="form-group">
                                <label>Nama Waris *</label>
                                <input
                                    type="text"
                                    value={formData.emergencyContactName}
                                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                                    placeholder="Nama penuh"
                                />
                            </div>

                            <div className="form-group">
                                <label>Hubungan *</label>
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
                                    <option value="Lain-lain">Lain-lain</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    <Phone size={16} />
                                    No. Telefon Waris *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.emergencyContactPhone}
                                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                                    placeholder="+60 1X-XXXXXXX"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="form-step fade-in">
                            <h2>
                                <CreditCard size={20} />
                                Maklumat Bank & Saiz
                            </h2>

                            <div className="form-group">
                                <label>Nama Bank *</label>
                                <select
                                    value={formData.bankName}
                                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                                >
                                    <option value="">Pilih Bank</option>
                                    {BANKS.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Nombor Akaun *</label>
                                <input
                                    type="text"
                                    value={formData.bankAccountNo}
                                    onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
                                    placeholder="Nombor akaun bank anda"
                                />
                            </div>

                            <div className="form-group">
                                <label>Nama Pemegang Akaun *</label>
                                <input
                                    type="text"
                                    value={formData.bankAccountHolder}
                                    onChange={(e) => handleInputChange('bankAccountHolder', e.target.value)}
                                    placeholder="Nama seperti dalam buku bank"
                                />
                            </div>

                            <div className="grid-2-cols">
                                <div className="form-group">
                                    <label>
                                        <Shirt size={16} />
                                        Saiz Baju *
                                    </label>
                                    <select
                                        value={formData.tshirtSize}
                                        onChange={(e) => handleInputChange('tshirtSize', e.target.value)}
                                    >
                                        <option value="">Pilih</option>
                                        {SHIRT_SIZES.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>
                                        <AlertCircle size={16} />
                                        Saiz Kasut *
                                    </label>
                                    <select
                                        value={formData.shoeSize}
                                        onChange={(e) => handleInputChange('shoeSize', e.target.value)}
                                    >
                                        <option value="">Pilih</option>
                                        {SHOE_SIZES.map(size => (
                                            <option key={size} value={size}>EU {size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="form-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="form-buttons">
                        {step > 1 && (
                            <button
                                className="btn-back"
                                onClick={() => setStep(step - 1)}
                            >
                                <ArrowLeft size={16} />
                                Kembali
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                className="btn-next"
                                onClick={handleNext}
                            >
                                Seterusnya
                                <ChevronRight size={20} />
                            </button>
                        ) : (
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
                                        Hantar Profil
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .profile-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 1rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .profile-container {
          width: 100%;
          max-width: 550px;
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }

        .profile-header {
          text-align: center;
          margin-bottom: 2.5rem;
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
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2);
        }

        .profile-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 0.5rem;
          letter-spacing: -0.025em;
        }

        .profile-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .profile-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          padding: 0 1rem;
          position: relative;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          z-index: 1;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        
        .step.active {
          opacity: 1;
        }

        .step-number {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background: #CC1512;
          border-color: #CC1512;
          color: white;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .step.active .step-label {
          color: #CC1512;
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: #e2e8f0;
          margin: 0 10px;
          margin-bottom: 20px; /* Align with number */
          transition: all 0.3s ease;
        }
        
        .step-line.active {
          background: #CC1512;
        }

        .form-step h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .grid-2-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: #f8fafc;
          color: #1e293b;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #CC1512;
          background: white;
          box-shadow: 0 0 0 4px rgba(204, 21, 18, 0.1);
        }
        
        .form-group input::placeholder {
           color: #94a3b8;
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .form-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-next,
        .btn-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex: 2;
          padding: 1rem;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(185, 28, 28, 0.2);
        }

        .btn-back {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-next:hover,
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(185, 28, 28, 0.3);
        }
        
        .btn-back:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

