'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Moon, Sun, Globe } from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

export default function BrandHeader() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { showToast } = useToast();

  return (
    <header className="brand-header">
      <div className="brand-header-content">
        {/* Brand / Logo */}
        <div className="brand-logo">
          <div className="brand-logo-icon">AB</div>
          <span className="brand-name">AbangBob</span>
        </div>

        {/* Toggles */}
        <div className="brand-actions">
          <button
            type="button"
            onClick={() => {
              console.log('Language toggle clicked');
              toggleLanguage();
              showToast(language === 'ms' ? 'Switched to English' : 'Tukar ke Bahasa Melayu', 'success');
            }}
            className="brand-action-btn"
            aria-label="Toggle Language"
          >
            <Globe size={18} />
            <span className="lang-text">{language ? language.toUpperCase() : 'MS'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              console.log('Theme toggle clicked');
              toggleTheme();
            }}
            className="brand-action-btn"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .brand-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--bg-card); /* Adaptive background */
          border-top: 4px solid #CC1512; /* Brand Red Top Border */
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.1); /* Premium Shadow */
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.1); /* Premium Shadow */
          transition: background 0.3s ease, color 0.3s ease;
        }

        @media (min-width: 769px) {
          .brand-header {
            display: none;
          }
        }

        .brand-header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .brand-logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 900;
        }

        .brand-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .brand-action-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.75rem;
          border-radius: 20px; /* Pill shape */
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .brand-action-btn:hover {
          background: var(--bg-secondary); /* Slightly darker or different in proper theme */
          color: var(--primary);
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        .brand-action-btn:active {
          transform: translateY(0);
        }

        /* Mobile Adjustments */
        @media (max-width: 640px) {
          .brand-header-content {
            padding: 0.75rem 1rem;
          }
          
          .brand-name {
            display: auto; /* Keep name visible as requested "ada logo" usually implies brand presence */
          }
        }
      `}</style>
    </header>
  );
}
