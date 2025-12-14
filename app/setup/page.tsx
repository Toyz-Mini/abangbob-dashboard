'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetup } from '@/lib/contexts/SetupContext';
import { 
  Building2, 
  UtensilsCrossed, 
  Users, 
  CreditCard, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Store
} from 'lucide-react';

// Step components
import BusinessInfoStep from '@/components/setup/BusinessInfoStep';
import MenuSetupStep from '@/components/setup/MenuSetupStep';
import StaffSetupStep from '@/components/setup/StaffSetupStep';
import PaymentSetupStep from '@/components/setup/PaymentSetupStep';
import ReviewStep from '@/components/setup/ReviewStep';

const STEPS = [
  { id: 1, name: 'Maklumat Perniagaan', icon: Building2 },
  { id: 2, name: 'Menu & Harga', icon: UtensilsCrossed },
  { id: 3, name: 'Staf & Peranan', icon: Users },
  { id: 4, name: 'Kaedah Bayaran', icon: CreditCard },
  { id: 5, name: 'Semak & Selesai', icon: CheckCircle2 },
];

export default function SetupPage() {
  const router = useRouter();
  const { 
    isSetupComplete, 
    currentStep, 
    setCurrentStep, 
    totalSteps,
    completeSetup,
    setupData
  } = useSetup();
  
  const [isValidStep, setIsValidStep] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if setup is already complete
    const checkSetup = () => {
      const setupComplete = localStorage.getItem('abangbob_setup_complete');
      if (setupComplete === 'true') {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    };
    
    checkSetup();
  }, [router]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setIsValidStep(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeSetup();
    router.push('/?tour=start');
  };

  const handleSkipSetup = () => {
    completeSetup();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const CurrentStepIcon = STEPS[currentStep - 1]?.icon || Building2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AbangBob Setup</h1>
                <p className="text-sm text-slate-400">Persediaan Perniagaan Anda</p>
              </div>
            </div>
            <button
              onClick={handleSkipSetup}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Langkau Buat Masa Ini
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div 
                  key={step.id} 
                  className="relative flex flex-col items-center z-10"
                >
                  <button
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    disabled={step.id > currentStep}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white ring-4 ring-teal-500/30 scale-110' 
                        : isCompleted 
                          ? 'bg-teal-500 text-white cursor-pointer hover:scale-105' 
                          : 'bg-slate-700 text-slate-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </button>
                  <span className={`
                    mt-2 text-xs font-medium text-center max-w-[100px] hidden sm:block
                    ${isActive ? 'text-teal-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'}
                  `}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400">Langkah {currentStep} daripada {totalSteps}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {STEPS[currentStep - 1]?.name}
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            {currentStep === 1 && 'Masukkan maklumat asas perniagaan anda'}
            {currentStep === 2 && 'Tambah kategori dan item menu anda'}
            {currentStep === 3 && 'Daftarkan staf dan tetapkan peranan mereka'}
            {currentStep === 4 && 'Pilih kaedah bayaran yang anda terima'}
            {currentStep === 5 && 'Semak semula dan sahkan tetapan anda'}
          </p>
        </div>

        {/* Step Content Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 sm:p-8 mb-8">
          {currentStep === 1 && <BusinessInfoStep onValidChange={setIsValidStep} />}
          {currentStep === 2 && <MenuSetupStep onValidChange={setIsValidStep} />}
          {currentStep === 3 && <StaffSetupStep onValidChange={setIsValidStep} />}
          {currentStep === 4 && <PaymentSetupStep onValidChange={setIsValidStep} />}
          {currentStep === 5 && <ReviewStep onValidChange={setIsValidStep} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${currentStep === 1 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx + 1 === currentStep 
                    ? 'w-6 bg-teal-500' 
                    : idx + 1 < currentStep 
                      ? 'bg-teal-500' 
                      : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/25"
            >
              <span className="hidden sm:inline">Seterusnya</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/25"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Selesai Setup</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}


