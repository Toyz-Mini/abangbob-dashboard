'use client';

import Link from 'next/link';
import { CheckCircle, UserCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VerificationSuccessPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="header-section">
          <div className="icon-wrapper bounce-in">
            <div className="icon-glow"></div>
            <CheckCircle size={80} className="check-icon" strokeWidth={2.5} />
          </div>
          <h1 className="fade-in-up">Email Berjaya Disahkan!</h1>
          <p className="subtitle fade-in-up">Akaun anda kini aktif dan selamat.</p>
        </div>

        <div className="action-card fade-in-up-delay">
          <div className="card-content">
            <div className="step-indicator">
              <span className="step-badge">PENTING</span>
            </div>
            <h2>Lengkapkan Profil Anda</h2>
            <p>Sila kemaskini maklumat peribadi dan pekerjaan anda untuk mula menggunakan sistem sepenuhnya.</p>

            <Link href="/complete-profile" className="primary-btn">
              <div className="btn-content">
                <UserCircle size={24} />
                <span>Kemaskini Profil Sekarang</span>
              </div>
              <ArrowRight size={20} className="arrow-icon" />
            </Link>
          </div>
        </div>

        <div className="footer-links fade-in-up-delay-2">
          <div className="security-note">
            <ShieldCheck size={14} />
            <span>Data anda dilindungi & selamat</span>
          </div>
        </div>
      </div>

      <style jsx>{`
                .page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    padding: 1.5rem;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .container {
                    width: 100%;
                    max-width: 520px; 
                    margin: 0 auto;
                }

                .header-section {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .icon-wrapper {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                }

                .icon-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    background: rgba(34, 197, 94, 0.2);
                    border-radius: 50%;
                    filter: blur(15px);
                    z-index: -1;
                    animation: pulse 2s infinite;
                }

                /* Using global selector for lucide icon within styled-jsx limitation */
                :global(.check-icon) {
                    color: #16a34a;
                    filter: drop-shadow(0 4px 6px rgba(22, 163, 74, 0.2));
                }

                h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0 0 0.5rem;
                    letter-spacing: -0.025em;
                }

                .subtitle {
                    color: #64748b;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .action-card {
                    background: white;
                    border-radius: 24px;
                    padding: 8px; /* Inner padding for border effect */
                    background: linear-gradient(145deg, #ffffff, #f8fafc);
                    box-shadow: 
                        0 20px 40px -5px rgba(0, 0, 0, 0.1), 
                        0 10px 20px -5px rgba(0, 0, 0, 0.04),
                        0 0 0 1px rgba(0,0,0,0.03);
                    margin-bottom: 2rem;
                    transition: transform 0.3s ease;
                }
                
                .action-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 
                        0 25px 50px -10px rgba(0, 0, 0, 0.15), 
                        0 10px 20px -5px rgba(0, 0, 0, 0.04);
                }

                .card-content {
                    background: white;
                    border-radius: 18px;
                    padding: 2.5rem 2rem;
                    text-align: center;
                    border: 1px solid #f1f5f9;
                }

                .step-indicator {
                    margin-bottom: 1.5rem;
                }

                .step-badge {
                    background: #fee2e2;
                    color: #991b1b;
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.35rem 1rem;
                    border-radius: 20px;
                    letter-spacing: 0.05em;
                }

                h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 0.75rem;
                }

                .card-content p {
                    color: #64748b;
                    margin: 0 0 2rem;
                    line-height: 1.6;
                    font-size: 1rem;
                }

                .primary-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 1.25rem 1.5rem;
                    background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 16px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    box-shadow: 0 10px 20px rgba(185, 28, 28, 0.25);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .primary-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(185, 28, 28, 0.35);
                }

                .primary-btn:active {
                    transform: translateY(0);
                }

                .btn-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .security-note {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    color: #94a3b8;
                    font-size: 0.85rem;
                }

                /* Animations */
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.5; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
                    100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.5; }
                }

                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { opacity: 1; transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .bounce-in {
                    animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }

                .fade-in-up {
                    opacity: 0;
                    animation: fadeInUp 0.8s ease-out 0.2s forwards;
                }

                .fade-in-up-delay {
                    opacity: 0;
                    animation: fadeInUp 0.8s ease-out 0.4s forwards;
                }

                .fade-in-up-delay-2 {
                    opacity: 0;
                    animation: fadeInUp 0.8s ease-out 0.6s forwards;
                }
            `}</style>
    </div>
  );
}

