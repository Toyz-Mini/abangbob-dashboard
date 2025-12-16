'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Moon } from 'lucide-react';

interface LivePageHeaderProps {
    title: string;
    subtitle?: string;
    rightContent?: React.ReactNode;
    showWeather?: boolean;
}

export default function LivePageHeader({
    title,
    subtitle,
    rightContent,
    showWeather = false
}: LivePageHeaderProps) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 18) return 'Selamat Petang';
        return 'Selamat Malam';
    };

    return (
        <div
            className="living-header glass-panel"
            style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Texture Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }} />

            <div style={{ zIndex: 1, position: 'relative' }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    marginBottom: '0.25rem',
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {title}
                </h1>
                {subtitle ? (
                    <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>{subtitle}</p>
                ) : showWeather ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.9, fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 600 }}>{getGreeting()}</span>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Sun size={14} />
                            <span>{time.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ) : null}
            </div>

            {rightContent && (
                <div style={{ zIndex: 1, position: 'relative' }}>
                    {rightContent}
                </div>
            )}
        </div>
    );
}
