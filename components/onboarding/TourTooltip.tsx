'use client';

import { useEffect, useState, useRef } from 'react';
import { TourStep } from '@/lib/contexts/SetupContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface Props {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  targetElement: HTMLElement | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export default function TourTooltip({
  step,
  currentStep,
  totalSteps,
  targetElement,
  onNext,
  onPrev,
  onSkip,
}: Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [adjustedPlacement, setAdjustedPlacement] = useState(step.placement);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    if (!targetElement || !tooltipRef.current) {
      // Center in viewport if no target
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 16;
    const arrowOffset = 12;

    let placement = step.placement;
    let top = 0;
    let left = 0;

    // Calculate initial position based on placement
    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - arrowOffset;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + arrowOffset;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - arrowOffset;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + arrowOffset;
        break;
    }

    // Adjust if out of viewport
    if (top < padding) {
      if (placement === 'top') {
        placement = 'bottom';
        top = targetRect.bottom + arrowOffset;
      } else {
        top = padding;
      }
    }

    if (top + tooltipRect.height > window.innerHeight - padding) {
      if (placement === 'bottom') {
        placement = 'top';
        top = targetRect.top - tooltipRect.height - arrowOffset;
      } else {
        top = window.innerHeight - tooltipRect.height - padding;
      }
    }

    if (left < padding) {
      if (placement === 'left') {
        placement = 'right';
        left = targetRect.right + arrowOffset;
      } else {
        left = padding;
      }
    }

    if (left + tooltipRect.width > window.innerWidth - padding) {
      if (placement === 'right') {
        placement = 'left';
        left = targetRect.left - tooltipRect.width - arrowOffset;
      } else {
        left = window.innerWidth - tooltipRect.width - padding;
      }
    }

    setPosition({ top, left });
    setAdjustedPlacement(placement);
  }, [targetElement, step.placement]);

  // Get arrow position styles
  const getArrowStyles = () => {
    const base = 'absolute w-3 h-3 bg-slate-800 transform rotate-45 border-slate-700';
    switch (adjustedPlacement) {
      case 'top':
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r`;
      case 'bottom':
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-t border-l`;
      case 'left':
        return `${base} -right-1.5 top-1/2 -translate-y-1/2 border-t border-r`;
      case 'right':
        return `${base} -left-1.5 top-1/2 -translate-y-1/2 border-b border-l`;
      default:
        return base;
    }
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10000] w-80 animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Arrow */}
      {targetElement && <div className={getArrowStyles()} />}
      
      {/* Tooltip Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">
              Langkah {currentStep + 1} / {totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{step.content}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-6 bg-teal-500' 
                  : idx < currentStep 
                    ? 'w-1.5 bg-teal-500/50' 
                    : 'w-1.5 bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 p-4 pt-2 border-t border-slate-700">
          <button
            onClick={onPrev}
            disabled={isFirstStep}
            className={`
              flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${isFirstStep 
                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>

          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Langkau
          </button>

          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-teal-400 hover:to-emerald-400 transition-all"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Selesai
              </>
            ) : (
              <>
                Seterusnya
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

