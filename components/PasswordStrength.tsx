'use client';

import { useMemo } from 'react';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from '@/lib/password-policy';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
    password: string;
    showRequirements?: boolean;
}

export default function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
    const validation = useMemo(() => validatePassword(password), [password]);

    if (!password) return null;

    const requirements = [
        { label: 'Minimum 8 aksara', met: password.length >= 8 },
        { label: 'Huruf besar (A-Z)', met: /[A-Z]/.test(password) },
        { label: 'Huruf kecil (a-z)', met: /[a-z]/.test(password) },
        { label: 'Nombor (0-9)', met: /[0-9]/.test(password) },
        { label: 'Aksara khas (!@#$%)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    return (
        <div className="password-strength">
            {/* Strength bar */}
            <div className="strength-bar-container">
                <div
                    className="strength-bar"
                    style={{
                        width: `${(validation.score / 7) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(validation.strength)
                    }}
                />
            </div>

            {/* Strength label */}
            <div className="strength-label" style={{ color: getPasswordStrengthColor(validation.strength) }}>
                {getPasswordStrengthLabel(validation.strength)}
            </div>

            {/* Requirements checklist */}
            {showRequirements && (
                <ul className="requirements-list">
                    {requirements.map((req, index) => (
                        <li key={index} className={req.met ? 'met' : 'unmet'}>
                            {req.met ? <Check size={14} /> : <X size={14} />}
                            {req.label}
                        </li>
                    ))}
                </ul>
            )}

            <style jsx>{`
        .password-strength {
          margin-top: 0.5rem;
        }
        .strength-bar-container {
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }
        .strength-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s, background-color 0.3s;
        }
        .strength-label {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.25rem;
          text-align: right;
        }
        .requirements-list {
          list-style: none;
          padding: 0;
          margin: 0.75rem 0 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem;
        }
        .requirements-list li {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
        }
        .requirements-list li.met {
          color: #22c55e;
        }
        .requirements-list li.unmet {
          color: #9ca3af;
        }
      `}</style>
        </div>
    );
}
