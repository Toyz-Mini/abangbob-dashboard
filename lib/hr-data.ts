import { StaffProfile, AttendanceRecord, PayrollEntry } from './types';

export const MOCK_STAFF: StaffProfile[] = [
  {
    id: '1',
    employeeNumber: 'EMP001',
    
    // Personal Information
    name: 'Ahmad Bin Hassan',
    icNumber: '01-123456',
    dateOfBirth: '1985-05-15',
    gender: 'male',
    nationality: 'Bruneian',
    religion: 'Islam',
    maritalStatus: 'married',
    address: 'No. 123, Simpang 456, Kampung Ayer, Brunei-Muara, BSB BE1234',
    email: 'ahmad.hassan@email.com',
    phone: '+6737123456',
    profilePhotoUrl: undefined,
    
    // Employment Details
    role: 'Manager',
    position: 'Outlet Manager',
    department: 'Operations',
    employmentType: 'permanent',
    joinDate: '2020-01-15',
    contractEndDate: undefined,
    probationEndDate: '2020-04-15',
    reportingTo: undefined,
    workLocation: 'Outlet Gadong',
    status: 'active',
    
    // Authentication
    pin: '1234',
    
    // Salary & Compensation
    salaryType: 'monthly',
    baseSalary: 2500,
    hourlyRate: 15,
    overtimeRate: 1.5,
    allowances: [
      { id: 'a1', name: 'Elaun Pengangkutan', amount: 150, type: 'fixed' },
      { id: 'a2', name: 'Elaun Makan', amount: 100, type: 'fixed' },
    ],
    fixedDeductions: [],
    paymentFrequency: 'monthly',
    
    // Bank Details
    bankDetails: {
      bankName: 'BIBD',
      accountNumber: '1234567890',
      accountName: 'Ahmad Bin Hassan',
    },
    
    // Statutory Contributions (TAP/SCP)
    statutoryContributions: {
      tapNumber: 'TAP-001234',
      tapEmployeeRate: 5,
      tapEmployerRate: 5,
      scpNumber: 'SCP-001234',
      scpEmployeeRate: 3.5,
      scpEmployerRate: 3.5,
    },
    
    // Emergency Contact
    emergencyContact: {
      name: 'Salmah Binti Abdullah',
      relation: 'Isteri',
      phone: '+6737123457',
      address: 'Sama seperti di atas',
    },
    
    // Leave Entitlement
    leaveEntitlement: {
      annual: 18,
      medical: 14,
      emergency: 3,
      maternity: 0,
      paternity: 7,
      compassionate: 3,
      carryForwardDays: 5,
    },
    
    // Permissions & Access
    accessLevel: 'manager',
    permissions: {
      canApproveLeave: true,
      canApproveClaims: true,
      canViewReports: true,
      canManageStaff: true,
      canAccessPOS: true,
      canGiveDiscount: true,
      maxDiscountPercent: 30,
      canVoidTransaction: true,
      canAccessInventory: true,
      canAccessFinance: true,
      canAccessKDS: true,
      canManageMenu: true,
    },
    
    // Schedule Preferences
    schedulePreferences: {
      defaultShiftId: 'morning',
      workDaysPerWeek: 6,
      preferredOffDays: [0], // Sunday
      maxOTHoursPerWeek: 20,
      isFlexibleSchedule: true,
    },
    
    // Documents
    documents: [
      { id: 'd1', type: 'ic_front', name: 'IC Depan', url: '/uploads/ic_front_1.jpg', uploadedAt: '2020-01-10' },
      { id: 'd2', type: 'ic_back', name: 'IC Belakang', url: '/uploads/ic_back_1.jpg', uploadedAt: '2020-01-10' },
      { id: 'd3', type: 'contract', name: 'Surat Kontrak', url: '/uploads/contract_1.pdf', uploadedAt: '2020-01-15' },
    ],
    
    // Skills & Training
    skills: ['Leadership', 'Customer Service', 'Inventory Management', 'Team Training'],
    certifications: ['Food Safety Level 2', 'First Aid'],
    
    // Additional Info
    uniformSize: 'L',
    shoeSize: '42',
    dietaryRestrictions: undefined,
    medicalConditions: undefined,
    bloodType: 'O+',
    notes: 'Pengurus outlet yang berpengalaman. Bertanggungjawab atas operasi harian.',
    
    // Performance
    performanceBadges: ['Top Manager'],
    
    // Metadata
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    employeeNumber: 'EMP002',
    
    // Personal Information
    name: 'Siti Nurhaliza',
    icNumber: '02-234567',
    dateOfBirth: '1995-08-20',
    gender: 'female',
    nationality: 'Bruneian',
    religion: 'Islam',
    maritalStatus: 'single',
    address: 'No. 45, Simpang 123, Kampung Kiarong, BSB BE2345',
    email: 'siti.nurhaliza@email.com',
    phone: '+6737234567',
    profilePhotoUrl: undefined,
    
    // Employment Details
    role: 'Staff',
    position: 'Cashier',
    department: 'Front of House',
    employmentType: 'permanent',
    joinDate: '2022-03-01',
    contractEndDate: undefined,
    probationEndDate: '2022-06-01',
    reportingTo: '1',
    workLocation: 'Outlet Gadong',
    status: 'active',
    
    // Authentication
    pin: '5678',
    
    // Salary & Compensation
    salaryType: 'monthly',
    baseSalary: 1200,
    hourlyRate: 8,
    overtimeRate: 1.5,
    allowances: [
      { id: 'a1', name: 'Elaun Makan', amount: 50, type: 'fixed' },
    ],
    fixedDeductions: [],
    paymentFrequency: 'monthly',
    
    // Bank Details
    bankDetails: {
      bankName: 'Baiduri Bank',
      accountNumber: '2345678901',
      accountName: 'Siti Nurhaliza Binti Abdullah',
    },
    
    // Statutory Contributions (TAP/SCP)
    statutoryContributions: {
      tapNumber: 'TAP-002345',
      tapEmployeeRate: 5,
      tapEmployerRate: 5,
      scpNumber: 'SCP-002345',
      scpEmployeeRate: 3.5,
      scpEmployerRate: 3.5,
    },
    
    // Emergency Contact
    emergencyContact: {
      name: 'Fatimah Binti Ibrahim',
      relation: 'Ibu',
      phone: '+6737234568',
    },
    
    // Leave Entitlement
    leaveEntitlement: {
      annual: 14,
      medical: 14,
      emergency: 3,
      maternity: 105,
      paternity: 0,
      compassionate: 3,
      carryForwardDays: 5,
    },
    
    // Permissions & Access
    accessLevel: 'staff',
    permissions: {
      canApproveLeave: false,
      canApproveClaims: false,
      canViewReports: false,
      canManageStaff: false,
      canAccessPOS: true,
      canGiveDiscount: true,
      maxDiscountPercent: 10,
      canVoidTransaction: false,
      canAccessInventory: false,
      canAccessFinance: false,
      canAccessKDS: false,
      canManageMenu: false,
    },
    
    // Schedule Preferences
    schedulePreferences: {
      defaultShiftId: 'morning',
      workDaysPerWeek: 6,
      preferredOffDays: [5], // Friday
      maxOTHoursPerWeek: 10,
      isFlexibleSchedule: false,
    },
    
    // Documents
    documents: [
      { id: 'd1', type: 'ic_front', name: 'IC Depan', url: '/uploads/ic_front_2.jpg', uploadedAt: '2022-02-28' },
      { id: 'd2', type: 'ic_back', name: 'IC Belakang', url: '/uploads/ic_back_2.jpg', uploadedAt: '2022-02-28' },
    ],
    
    // Skills & Training
    skills: ['Customer Service', 'POS Operation', 'Cash Handling'],
    certifications: ['Food Safety Level 1'],
    
    // Additional Info
    uniformSize: 'S',
    shoeSize: '37',
    dietaryRestrictions: undefined,
    medicalConditions: undefined,
    bloodType: 'A+',
    notes: undefined,
    
    // Performance
    performanceBadges: ['Top Upseller', 'Early Bird'],
    
    // Metadata
    createdAt: '2022-03-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    employeeNumber: 'EMP003',
    
    // Personal Information
    name: 'Rahman Ali',
    icNumber: '03-345678',
    dateOfBirth: '1998-12-10',
    gender: 'male',
    nationality: 'Bruneian',
    religion: 'Islam',
    maritalStatus: 'single',
    address: 'No. 78, Simpang 789, Kampung Rimba, BSB BE3456',
    email: 'rahman.ali@email.com',
    phone: '+6737345678',
    profilePhotoUrl: undefined,
    
    // Employment Details
    role: 'Staff',
    position: 'Kitchen Crew',
    department: 'Kitchen',
    employmentType: 'permanent',
    joinDate: '2023-01-15',
    contractEndDate: undefined,
    probationEndDate: '2023-04-15',
    reportingTo: '1',
    workLocation: 'Outlet Gadong',
    status: 'active',
    
    // Authentication
    pin: '9012',
    
    // Salary & Compensation
    salaryType: 'monthly',
    baseSalary: 1200,
    hourlyRate: 8,
    overtimeRate: 1.5,
    allowances: [
      { id: 'a1', name: 'Elaun Makan', amount: 50, type: 'fixed' },
    ],
    fixedDeductions: [],
    paymentFrequency: 'monthly',
    
    // Bank Details
    bankDetails: {
      bankName: 'Standard Chartered',
      accountNumber: '3456789012',
      accountName: 'Rahman Bin Ali',
    },
    
    // Statutory Contributions (TAP/SCP)
    statutoryContributions: {
      tapNumber: 'TAP-003456',
      tapEmployeeRate: 5,
      tapEmployerRate: 5,
      scpNumber: 'SCP-003456',
      scpEmployeeRate: 3.5,
      scpEmployerRate: 3.5,
    },
    
    // Emergency Contact
    emergencyContact: {
      name: 'Ali Bin Hamid',
      relation: 'Bapa',
      phone: '+6737345679',
    },
    
    // Leave Entitlement
    leaveEntitlement: {
      annual: 14,
      medical: 14,
      emergency: 3,
      maternity: 0,
      paternity: 3,
      compassionate: 3,
      carryForwardDays: 5,
    },
    
    // Permissions & Access
    accessLevel: 'staff',
    permissions: {
      canApproveLeave: false,
      canApproveClaims: false,
      canViewReports: false,
      canManageStaff: false,
      canAccessPOS: false,
      canGiveDiscount: false,
      maxDiscountPercent: 0,
      canVoidTransaction: false,
      canAccessInventory: false,
      canAccessFinance: false,
      canAccessKDS: true,
      canManageMenu: false,
    },
    
    // Schedule Preferences
    schedulePreferences: {
      defaultShiftId: 'evening',
      workDaysPerWeek: 6,
      preferredOffDays: [0], // Sunday
      maxOTHoursPerWeek: 15,
      isFlexibleSchedule: false,
    },
    
    // Documents
    documents: [
      { id: 'd1', type: 'ic_front', name: 'IC Depan', url: '/uploads/ic_front_3.jpg', uploadedAt: '2023-01-10' },
      { id: 'd2', type: 'ic_back', name: 'IC Belakang', url: '/uploads/ic_back_3.jpg', uploadedAt: '2023-01-10' },
    ],
    
    // Skills & Training
    skills: ['Cooking', 'Food Preparation', 'Kitchen Hygiene'],
    certifications: [],
    
    // Additional Info
    uniformSize: 'M',
    shoeSize: '40',
    dietaryRestrictions: undefined,
    medicalConditions: undefined,
    bloodType: 'B+',
    notes: 'Masih dalam latihan untuk sijil Food Safety.',
    
    // Performance
    performanceBadges: [],
    
    // Metadata
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    employeeNumber: 'EMP004',
    
    // Personal Information
    name: 'Fatimah Zahra',
    icNumber: '04-456789',
    dateOfBirth: '1992-03-25',
    gender: 'female',
    nationality: 'Bruneian',
    religion: 'Islam',
    maritalStatus: 'married',
    address: 'No. 90, Simpang 321, Kampung Berakas, BSB BE4567',
    email: 'fatimah.zahra@email.com',
    phone: '+6737456789',
    profilePhotoUrl: undefined,
    
    // Employment Details
    role: 'Staff',
    position: 'Senior Cashier',
    department: 'Front of House',
    employmentType: 'permanent',
    joinDate: '2021-06-01',
    contractEndDate: undefined,
    probationEndDate: '2021-09-01',
    reportingTo: '1',
    workLocation: 'Outlet Gadong',
    status: 'on-leave',
    
    // Authentication
    pin: '3456',
    
    // Salary & Compensation
    salaryType: 'monthly',
    baseSalary: 1200,
    hourlyRate: 8,
    overtimeRate: 1.5,
    allowances: [
      { id: 'a1', name: 'Elaun Makan', amount: 50, type: 'fixed' },
      { id: 'a2', name: 'Elaun Senioriti', amount: 100, type: 'fixed' },
    ],
    fixedDeductions: [],
    paymentFrequency: 'monthly',
    
    // Bank Details
    bankDetails: {
      bankName: 'BIBD',
      accountNumber: '4567890123',
      accountName: 'Fatimah Zahra Binti Hashim',
    },
    
    // Statutory Contributions (TAP/SCP)
    statutoryContributions: {
      tapNumber: 'TAP-004567',
      tapEmployeeRate: 5,
      tapEmployerRate: 5,
      scpNumber: 'SCP-004567',
      scpEmployeeRate: 3.5,
      scpEmployerRate: 3.5,
    },
    
    // Emergency Contact
    emergencyContact: {
      name: 'Zulkifli Bin Ahmad',
      relation: 'Suami',
      phone: '+6737456790',
    },
    
    // Leave Entitlement
    leaveEntitlement: {
      annual: 16,
      medical: 14,
      emergency: 3,
      maternity: 105,
      paternity: 0,
      compassionate: 3,
      carryForwardDays: 5,
    },
    
    // Permissions & Access
    accessLevel: 'staff',
    permissions: {
      canApproveLeave: false,
      canApproveClaims: false,
      canViewReports: false,
      canManageStaff: false,
      canAccessPOS: true,
      canGiveDiscount: true,
      maxDiscountPercent: 15,
      canVoidTransaction: false,
      canAccessInventory: true,
      canAccessFinance: false,
      canAccessKDS: false,
      canManageMenu: false,
    },
    
    // Schedule Preferences
    schedulePreferences: {
      defaultShiftId: 'morning',
      workDaysPerWeek: 5,
      preferredOffDays: [5, 6], // Friday, Saturday
      maxOTHoursPerWeek: 8,
      isFlexibleSchedule: true,
    },
    
    // Documents
    documents: [
      { id: 'd1', type: 'ic_front', name: 'IC Depan', url: '/uploads/ic_front_4.jpg', uploadedAt: '2021-05-28' },
      { id: 'd2', type: 'ic_back', name: 'IC Belakang', url: '/uploads/ic_back_4.jpg', uploadedAt: '2021-05-28' },
      { id: 'd3', type: 'certificate', name: 'Sijil Food Safety', url: '/uploads/cert_food_4.pdf', uploadedAt: '2021-08-15' },
    ],
    
    // Skills & Training
    skills: ['Customer Service', 'POS Operation', 'Cash Handling', 'Inventory Count'],
    certifications: ['Food Safety Level 2'],
    
    // Additional Info
    uniformSize: 'M',
    shoeSize: '38',
    dietaryRestrictions: undefined,
    medicalConditions: undefined,
    bloodType: 'AB+',
    notes: 'Sedang cuti bersalin. Dijangka kembali pada Mac 2025.',
    
    // Performance
    performanceBadges: ['Upsell King'],
    
    // Metadata
    createdAt: '2021-06-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: '1',
    staffId: '1',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '08:00',
    clockOutTime: undefined,
    breakDuration: 0,
  },
  {
    id: '2',
    staffId: '2',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '09:00',
    clockOutTime: undefined,
    breakDuration: 0,
  },
  {
    id: '3',
    staffId: '3',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '08:30',
    clockOutTime: undefined,
    breakDuration: 0,
  },
];

export const MOCK_PAYROLL: PayrollEntry[] = [
  {
    id: '1',
    staffId: '1',
    month: '2024-01',
    totalHours: 160,
    otHours: 10,
    deductions: 250,
    baseSalary: 2500,
    finalPayout: 2750,
  },
  {
    id: '2',
    staffId: '2',
    month: '2024-01',
    totalHours: 160,
    otHours: 5,
    deductions: 150,
    baseSalary: 1200,
    finalPayout: 1330,
  },
];

export function getActiveStaff(): StaffProfile[] {
  return MOCK_STAFF.filter(s => s.status === 'active');
}

export function getOnDutyStaff(date: string = new Date().toISOString().split('T')[0]): StaffProfile[] {
  const todayAttendance = MOCK_ATTENDANCE.filter(a => a.date === date && a.clockInTime && !a.clockOutTime);
  return MOCK_STAFF.filter(s => todayAttendance.some(a => a.staffId === s.id));
}

// Helper: Get default values for new staff
export function getDefaultStaffProfile(): Partial<StaffProfile> {
  return {
    role: 'Staff',
    status: 'active',
    employmentType: 'probation',
    salaryType: 'monthly',
    baseSalary: 1200,
    hourlyRate: 8,
    overtimeRate: 1.5,
    paymentFrequency: 'monthly',
    accessLevel: 'staff',
    leaveEntitlement: {
      annual: 14,
      medical: 14,
      emergency: 3,
      maternity: 105,
      paternity: 3,
      compassionate: 3,
      carryForwardDays: 5,
    },
    permissions: {
      canApproveLeave: false,
      canApproveClaims: false,
      canViewReports: false,
      canManageStaff: false,
      canAccessPOS: true,
      canGiveDiscount: false,
      maxDiscountPercent: 0,
      canVoidTransaction: false,
      canAccessInventory: false,
      canAccessFinance: false,
      canAccessKDS: false,
      canManageMenu: false,
    },
    schedulePreferences: {
      workDaysPerWeek: 6,
      preferredOffDays: [0],
      maxOTHoursPerWeek: 10,
      isFlexibleSchedule: false,
    },
    statutoryContributions: {
      tapEmployeeRate: 5,
      tapEmployerRate: 5,
      scpEmployeeRate: 3.5,
      scpEmployerRate: 3.5,
    },
    allowances: [],
    fixedDeductions: [],
    documents: [],
    skills: [],
    certifications: [],
    performanceBadges: [],
  };
}

// Helper: Generate next employee number
export function generateEmployeeNumber(existingStaff: StaffProfile[]): string {
  const maxNum = existingStaff.reduce((max, s) => {
    const match = s.employeeNumber?.match(/EMP(\d+)/);
    const num = match ? parseInt(match[1]) : 0;
    return Math.max(max, num);
  }, 0);
  return `EMP${String(maxNum + 1).padStart(3, '0')}`;
}

// Bank list for Brunei
export const BRUNEI_BANKS = [
  'BIBD',
  'Baiduri Bank',
  'Standard Chartered Bank',
  'Maybank',
  'Bank Islam Brunei Darussalam',
  'HSBC',
  'RHB Bank',
  'UOB',
];

// Relation options for emergency contact
export const RELATION_OPTIONS = [
  'Bapa',
  'Ibu',
  'Suami',
  'Isteri',
  'Anak',
  'Adik-beradik',
  'Datuk',
  'Nenek',
  'Pakcik',
  'Makcik',
  'Sepupu',
  'Kawan',
  'Lain-lain',
];

// Nationality options
export const NATIONALITY_OPTIONS = [
  'Bruneian',
  'Malaysian',
  'Filipino',
  'Indonesian',
  'Bangladeshi',
  'Indian',
  'Thai',
  'Vietnamese',
  'Other',
];

// Religion options
export const RELIGION_OPTIONS = [
  'Islam',
  'Christian',
  'Buddhist',
  'Hindu',
  'Other',
];

// Department options
export const DEPARTMENT_OPTIONS = [
  'Operations',
  'Front of House',
  'Kitchen',
  'Delivery',
  'Admin',
  'Finance',
  'Marketing',
];

// Position options based on role
export const POSITION_OPTIONS = {
  Manager: [
    'Outlet Manager',
    'Assistant Manager',
    'Shift Supervisor',
    'Kitchen Manager',
  ],
  Staff: [
    'Cashier',
    'Senior Cashier',
    'Kitchen Crew',
    'Cook',
    'Runner',
    'Cleaner',
    'Delivery Rider',
    'Trainee',
  ],
};

