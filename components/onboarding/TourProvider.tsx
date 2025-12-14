'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import TourOverlay from './TourOverlay';
import TourTooltip from './TourTooltip';
import { TOUR_CONFIGS, TourConfig, TourStep } from '@/lib/contexts/SetupContext';

interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | null;
  activeTour: TourConfig | null;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  restartTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

const TOUR_COMPLETE_KEY = 'abangbob_tour_complete';
const TOUR_ID_KEY = 'abangbob_last_tour_id';

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const currentStepData = activeTour?.steps[currentStep] || null;
  const totalSteps = activeTour?.steps.length || 0;

  // Find and highlight target element
  useEffect(() => {
    if (!isTourActive || !currentStepData) {
      setTargetElement(null);
      return;
    }

    // Navigate if needed
    if (currentStepData.route && pathname !== currentStepData.route) {
      router.push(currentStepData.route);
      return;
    }

    // Find target element with retry
    const findTarget = () => {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetElement(null);
      }
    };

    // Delay to allow DOM to settle after navigation
    const timer = setTimeout(findTarget, 300);
    return () => clearTimeout(timer);
  }, [isTourActive, currentStepData, pathname, router]);

  const startTour = useCallback((tourId: string) => {
    const tour = TOUR_CONFIGS.find(t => t.id === tourId);
    if (tour) {
      setActiveTour(tour);
      setCurrentStep(0);
      setIsTourActive(true);
      
      // Save tour ID for restart
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOUR_ID_KEY, tourId);
      }
    }
  }, []);

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    
    if (currentStep < activeTour.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [activeTour, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setActiveTour(null);
    setCurrentStep(0);
    setTargetElement(null);
  }, []);

  const endTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_COMPLETE_KEY, 'true');
    }
    setIsTourActive(false);
    setActiveTour(null);
    setCurrentStep(0);
    setTargetElement(null);
  }, []);

  const restartTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      const lastTourId = localStorage.getItem(TOUR_ID_KEY);
      if (lastTourId) {
        startTour(lastTourId);
      } else {
        // Default to admin tour
        startTour('admin-full-tour');
      }
    }
  }, [startTour]);

  // Check for tour query param on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tour') === 'start') {
        // Start appropriate tour based on role (default to admin)
        startTour('admin-full-tour');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [startTour]);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        totalSteps,
        currentStepData,
        activeTour,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        endTour,
        restartTour,
      }}
    >
      {children}
      
      {/* Tour Overlay */}
      {isTourActive && <TourOverlay targetElement={targetElement} />}
      
      {/* Tour Tooltip */}
      {isTourActive && currentStepData && (
        <TourTooltip
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={totalSteps}
          targetElement={targetElement}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
}




