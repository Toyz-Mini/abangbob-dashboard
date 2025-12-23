'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        turnstile: {
            render: (container: HTMLElement, options: TurnstileOptions) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad: () => void;
    }
}

interface TurnstileOptions {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: () => void;
    'expired-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
}

interface TurnstileProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpired?: () => void;
}

export default function Turnstile({ onVerify, onError, onExpired }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderWidget = useCallback(() => {
        if (!containerRef.current || widgetIdRef.current) return;

        // Use provided site key or fallback to Cloudflare Testing Key (always pass)
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

        if (!siteKey) {
            console.error('Turnstile site key not found');
            return;
        }

        try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: onVerify,
                'error-callback': onError,
                'expired-callback': onExpired,
                theme: 'light',
                size: 'normal',
            });
        } catch (error) {
            console.error('Turnstile render error:', error);
        }
    }, [onVerify, onError, onExpired]);

    useEffect(() => {
        // Check if script already loaded
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Load Turnstile script
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
        script.async = true;
        script.defer = true;

        window.onTurnstileLoad = renderWidget;
        document.head.appendChild(script);

        return () => {
            if (widgetIdRef.current) {
                try {
                    window.turnstile?.remove(widgetIdRef.current);
                } catch (e) { }
            }
        };
    }, [renderWidget]);

    return (
        <div
            ref={containerRef}
            className="turnstile-container"
            style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '1rem 0',
            }}
        />
    );
}
