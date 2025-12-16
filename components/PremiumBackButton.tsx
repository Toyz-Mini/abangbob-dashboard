'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PremiumBackButtonProps {
    href: string;
    label?: string;
    className?: string;
}

export default function PremiumBackButton({ href, label = "Kembali", className = "" }: PremiumBackButtonProps) {
    return (
        <Link
            href={href}
            className={`premium-back-btn group ${className}`}
        >
            <div className="premium-back-icon-wrapper">
                <ArrowLeft size={20} className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="premium-back-label">
                <span className="premium-back-label-text">{label}</span>
            </span>

            <style jsx>{`
        .premium-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 1rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          color: var(--text-primary);
        }

        .premium-back-btn:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }

        .premium-back-btn:active {
          transform: translateY(0);
        }

        .premium-back-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          transition: background 0.3s ease;
        }

        .premium-back-btn:hover .premium-back-icon-wrapper {
          background: var(--primary);
          color: white;
        }

        .premium-back-label-text {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-secondary);
          transition: color 0.3s ease;
        }

        .premium-back-btn:hover .premium-back-label-text {
          color: var(--text-primary);
        }
      `}</style>
        </Link>
    );
}
