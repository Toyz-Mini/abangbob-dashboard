'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Business Info Types
export interface BusinessInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  operatingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  taxRate: number;
  serviceCharge: number;
}

// Menu Setup Types
export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface SetupMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

// Staff Setup Types
export interface SetupStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Staff';
  pin: string;
}

// Payment Setup Types
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'ewallet' | 'qr';
  enabled: boolean;
  settings?: Record<string, string>;
}

// Setup State
export interface SetupState {
  businessInfo: BusinessInfo;
  menuCategories: MenuCategory[];
  menuItems: SetupMenuItem[];
  staffMembers: SetupStaffMember[];
  paymentMethods: PaymentMethod[];
}

// Tour State
export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  route?: string; // Navigate to this route before showing
}

export interface TourConfig {
  id: string;
  name: string;
  roles: ('Admin' | 'Manager' | 'Staff')[];
  steps: TourStep[];
}

interface SetupContextType {
  // Setup Wizard State
  isSetupComplete: boolean;
  currentStep: number;
  totalSteps: number;
  setupData: SetupState;
  
  // Setup Actions
  setCurrentStep: (step: number) => void;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => void;
  updateMenuCategories: (categories: MenuCategory[]) => void;
  updateMenuItems: (items: SetupMenuItem[]) => void;
  updateStaffMembers: (staff: SetupStaffMember[]) => void;
  updatePaymentMethods: (methods: PaymentMethod[]) => void;
  completeSetup: () => void;
  resetSetup: () => void;
  
  // Tour State
  isTourActive: boolean;
  currentTourStep: number;
  activeTour: TourConfig | null;
  hasCompletedTour: boolean;
  
  // Tour Actions
  startTour: (tourId: string) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  
  // Help Center
  showHelpCenter: boolean;
  setShowHelpCenter: (show: boolean) => void;
}

const SetupContext = createContext<SetupContextType | null>(null);

const SETUP_STORAGE_KEY = 'abangbob_setup_state';
const SETUP_COMPLETE_KEY = 'abangbob_setup_complete';
const TOUR_COMPLETE_KEY = 'abangbob_tour_complete';

const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  currency: 'MYR',
  timezone: 'Asia/Kuala_Lumpur',
  operatingHours: {
    monday: { open: '09:00', close: '22:00', closed: false },
    tuesday: { open: '09:00', close: '22:00', closed: false },
    wednesday: { open: '09:00', close: '22:00', closed: false },
    thursday: { open: '09:00', close: '22:00', closed: false },
    friday: { open: '09:00', close: '22:00', closed: false },
    saturday: { open: '09:00', close: '22:00', closed: false },
    sunday: { open: '09:00', close: '22:00', closed: false },
  },
  taxRate: 0,
  serviceCharge: 0,
};

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Tunai', type: 'cash', enabled: true },
  { id: 'card', name: 'Kad Kredit/Debit', type: 'card', enabled: false },
  { id: 'tng', name: 'Touch n Go eWallet', type: 'ewallet', enabled: false },
  { id: 'grabpay', name: 'GrabPay', type: 'ewallet', enabled: false },
  { id: 'boost', name: 'Boost', type: 'ewallet', enabled: false },
  { id: 'duitnow', name: 'DuitNow QR', type: 'qr', enabled: false },
];

const DEFAULT_SETUP_STATE: SetupState = {
  businessInfo: DEFAULT_BUSINESS_INFO,
  menuCategories: [],
  menuItems: [],
  staffMembers: [],
  paymentMethods: DEFAULT_PAYMENT_METHODS,
};

// Tour Configurations
export const TOUR_CONFIGS: TourConfig[] = [
  {
    id: 'admin-full-tour',
    name: 'Admin Full Tour',
    roles: ['Admin'],
    steps: [
      {
        id: 'welcome',
        target: '[data-tour="dashboard"]',
        title: 'Selamat Datang ke AbangBob!',
        content: 'Ini adalah dashboard utama anda. Di sini anda boleh lihat ringkasan perniagaan anda.',
        placement: 'bottom',
        route: '/',
      },
      {
        id: 'pos',
        target: '[data-tour="pos"]',
        title: 'Sistem POS',
        content: 'Buat pesanan pelanggan, terima bayaran, dan urus transaksi harian.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'kds',
        target: '[data-tour="kds"]',
        title: 'Kitchen Display System',
        content: 'Pantau pesanan yang perlu disediakan di dapur.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'inventory',
        target: '[data-tour="inventory"]',
        title: 'Inventori',
        content: 'Urus stok bahan mentah dan pantau paras inventori.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'hr',
        target: '[data-tour="hr"]',
        title: 'Pengurusan HR',
        content: 'Urus jadual staf, kehadiran, gaji, dan prestasi.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'finance',
        target: '[data-tour="finance"]',
        title: 'Kewangan',
        content: 'Pantau pendapatan, perbelanjaan, dan laporan kewangan.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'analytics',
        target: '[data-tour="analytics"]',
        title: 'Analitik',
        content: 'Lihat insight dan trend perniagaan anda.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'settings',
        target: '[data-tour="settings"]',
        title: 'Tetapan',
        content: 'Konfigurasi sistem mengikut keperluan perniagaan anda.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'help',
        target: '[data-tour="help-center"]',
        title: 'Pusat Bantuan',
        content: 'Klik di sini bila-bila masa untuk akses panduan dan FAQ.',
        placement: 'left',
        route: '/',
      },
    ],
  },
  {
    id: 'manager-tour',
    name: 'Manager Tour',
    roles: ['Manager'],
    steps: [
      {
        id: 'welcome',
        target: '[data-tour="dashboard"]',
        title: 'Selamat Datang!',
        content: 'Ini adalah dashboard anda untuk pantau operasi harian.',
        placement: 'bottom',
        route: '/',
      },
      {
        id: 'pos',
        target: '[data-tour="pos"]',
        title: 'Sistem POS',
        content: 'Buat pesanan dan terima bayaran pelanggan.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'kds',
        target: '[data-tour="kds"]',
        title: 'Kitchen Display',
        content: 'Pantau status pesanan di dapur.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'hr',
        target: '[data-tour="hr"]',
        title: 'HR Module',
        content: 'Urus kehadiran staf dan jadual kerja.',
        placement: 'right',
        route: '/',
      },
      {
        id: 'help',
        target: '[data-tour="help-center"]',
        title: 'Pusat Bantuan',
        content: 'Akses panduan dan FAQ bila-bila masa.',
        placement: 'left',
        route: '/',
      },
    ],
  },
  {
    id: 'staff-tour',
    name: 'Staff Basic Tour',
    roles: ['Staff'],
    steps: [
      {
        id: 'welcome',
        target: '[data-tour="staff-portal"]',
        title: 'Selamat Datang!',
        content: 'Ini adalah portal staf anda.',
        placement: 'bottom',
        route: '/staff-portal',
      },
      {
        id: 'schedule',
        target: '[data-tour="schedule"]',
        title: 'Jadual Kerja',
        content: 'Lihat jadual kerja anda di sini.',
        placement: 'right',
        route: '/staff-portal',
      },
      {
        id: 'leave',
        target: '[data-tour="leave"]',
        title: 'Permohonan Cuti',
        content: 'Mohon cuti dan lihat baki cuti anda.',
        placement: 'right',
        route: '/staff-portal',
      },
      {
        id: 'checklist',
        target: '[data-tour="checklist"]',
        title: 'Senarai Tugas',
        content: 'Lengkapkan tugas harian anda di sini.',
        placement: 'right',
        route: '/staff-portal',
      },
      {
        id: 'payslip',
        target: '[data-tour="payslip"]',
        title: 'Slip Gaji',
        content: 'Lihat dan muat turun slip gaji anda.',
        placement: 'right',
        route: '/staff-portal',
      },
      {
        id: 'help',
        target: '[data-tour="help-center"]',
        title: 'Pusat Bantuan',
        content: 'Klik untuk akses panduan.',
        placement: 'left',
        route: '/staff-portal',
      },
    ],
  },
];

export function SetupProvider({ children }: { children: ReactNode }) {
  const [isSetupComplete, setIsSetupComplete] = useState(true); // Default to true, check on mount
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupState>(DEFAULT_SETUP_STATE);
  
  // Tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  
  // Help center state
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  
  const totalSteps = 5;

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const setupComplete = localStorage.getItem(SETUP_COMPLETE_KEY);
    const tourComplete = localStorage.getItem(TOUR_COMPLETE_KEY);
    const savedSetup = localStorage.getItem(SETUP_STORAGE_KEY);
    
    setIsSetupComplete(setupComplete === 'true');
    setHasCompletedTour(tourComplete === 'true');
    
    if (savedSetup) {
      try {
        setSetupData(JSON.parse(savedSetup));
      } catch {
        // Invalid data, use defaults
      }
    }
  }, []);

  // Save setup data to localStorage
  const saveSetupData = useCallback((data: SetupState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(data));
    }
  }, []);

  // Update business info
  const updateBusinessInfo = useCallback((info: Partial<BusinessInfo>) => {
    setSetupData(prev => {
      const updated = {
        ...prev,
        businessInfo: { ...prev.businessInfo, ...info },
      };
      saveSetupData(updated);
      return updated;
    });
  }, [saveSetupData]);

  // Update menu categories
  const updateMenuCategories = useCallback((categories: MenuCategory[]) => {
    setSetupData(prev => {
      const updated = { ...prev, menuCategories: categories };
      saveSetupData(updated);
      return updated;
    });
  }, [saveSetupData]);

  // Update menu items
  const updateMenuItems = useCallback((items: SetupMenuItem[]) => {
    setSetupData(prev => {
      const updated = { ...prev, menuItems: items };
      saveSetupData(updated);
      return updated;
    });
  }, [saveSetupData]);

  // Update staff members
  const updateStaffMembers = useCallback((staff: SetupStaffMember[]) => {
    setSetupData(prev => {
      const updated = { ...prev, staffMembers: staff };
      saveSetupData(updated);
      return updated;
    });
  }, [saveSetupData]);

  // Update payment methods
  const updatePaymentMethods = useCallback((methods: PaymentMethod[]) => {
    setSetupData(prev => {
      const updated = { ...prev, paymentMethods: methods };
      saveSetupData(updated);
      return updated;
    });
  }, [saveSetupData]);

  // Complete setup
  const completeSetup = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    }
    setIsSetupComplete(true);
  }, []);

  // Reset setup (for testing or re-configuration)
  const resetSetup = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SETUP_COMPLETE_KEY);
      localStorage.removeItem(SETUP_STORAGE_KEY);
      localStorage.removeItem(TOUR_COMPLETE_KEY);
    }
    setIsSetupComplete(false);
    setHasCompletedTour(false);
    setSetupData(DEFAULT_SETUP_STATE);
    setCurrentStep(1);
  }, []);

  // Start tour
  const startTour = useCallback((tourId: string) => {
    const tour = TOUR_CONFIGS.find(t => t.id === tourId);
    if (tour) {
      setActiveTour(tour);
      setCurrentTourStep(0);
      setIsTourActive(true);
    }
  }, []);

  // Next tour step
  const nextTourStep = useCallback(() => {
    if (!activeTour) return;
    
    if (currentTourStep < activeTour.steps.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [activeTour, currentTourStep]);

  // Previous tour step
  const prevTourStep = useCallback(() => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1);
    }
  }, [currentTourStep]);

  // Skip tour
  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setActiveTour(null);
    setCurrentTourStep(0);
  }, []);

  // End tour (complete)
  const endTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_COMPLETE_KEY, 'true');
    }
    setIsTourActive(false);
    setActiveTour(null);
    setCurrentTourStep(0);
    setHasCompletedTour(true);
  }, []);

  return (
    <SetupContext.Provider
      value={{
        isSetupComplete,
        currentStep,
        totalSteps,
        setupData,
        setCurrentStep,
        updateBusinessInfo,
        updateMenuCategories,
        updateMenuItems,
        updateStaffMembers,
        updatePaymentMethods,
        completeSetup,
        resetSetup,
        isTourActive,
        currentTourStep,
        activeTour,
        hasCompletedTour,
        startTour,
        nextTourStep,
        prevTourStep,
        skipTour,
        endTour,
        showHelpCenter,
        setShowHelpCenter,
      }}
    >
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup() {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within SetupProvider');
  }
  return context;
}


