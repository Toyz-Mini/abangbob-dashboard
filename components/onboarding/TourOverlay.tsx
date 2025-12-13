'use client';

import { useEffect, useState } from 'react';

interface Props {
  targetElement: HTMLElement | null;
}

export default function TourOverlay({ targetElement }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetElement) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      setRect(targetElement.getBoundingClientRect());
    };

    updateRect();

    // Update on scroll/resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetElement]);

  if (!rect) {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />
    );
  }

  const padding = 8;
  const borderRadius = 12;

  return (
    <>
      {/* Dark overlay with cutout */}
      <svg
        className="fixed inset-0 z-[9998] w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#tour-spotlight)"
        />
      </svg>

      {/* Highlight border around target */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: borderRadius,
          border: '2px solid #14b8a6',
          boxShadow: '0 0 0 4px rgba(20, 184, 166, 0.3), 0 0 20px rgba(20, 184, 166, 0.4)',
          animation: 'pulse-border 2s infinite',
        }}
      />

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.3), 0 0 20px rgba(20, 184, 166, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(20, 184, 166, 0.1), 0 0 30px rgba(20, 184, 166, 0.6);
          }
        }
      `}</style>
    </>
  );
}

