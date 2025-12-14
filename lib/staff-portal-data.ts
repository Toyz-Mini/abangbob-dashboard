import { 
  ChecklistItemTemplate, 
  ChecklistCompletion, 
  LeaveBalance, 
  LeaveRequest, 
  ClaimRequest, 
  StaffRequest,
  Announcement,
  Shift,
  ScheduleEntry
} from './types';

// ==================== DEFAULT CHECKLIST TEMPLATES ====================

export const DEFAULT_OPENING_CHECKLIST: Omit<ChecklistItemTemplate, 'id' | 'createdAt'>[] = [
  { type: 'opening', title: 'Buka pintu dan hidupkan lampu', requirePhoto: false, requireNotes: false, order: 1, isActive: true },
  { type: 'opening', title: 'Hidupkan aircond dan kipas', requirePhoto: false, requireNotes: false, order: 2, isActive: true },
  { type: 'opening', title: 'Cek suhu fridge (mesti 0-4°C)', description: 'Ambil gambar thermometer', requirePhoto: true, requireNotes: true, order: 3, isActive: true },
  { type: 'opening', title: 'Cek suhu freezer (mesti -18°C atau bawah)', description: 'Ambil gambar thermometer', requirePhoto: true, requireNotes: true, order: 4, isActive: true },
  { type: 'opening', title: 'Keluarkan bahan dari freezer untuk defrost', description: 'Tulis apa yang dikeluarkan', requirePhoto: false, requireNotes: true, order: 5, isActive: true },
  { type: 'opening', title: 'Setup cooking station', requirePhoto: false, requireNotes: false, order: 6, isActive: true },
  { type: 'opening', title: 'Count cash float dan confirm amount', description: 'Ambil gambar cash count', requirePhoto: true, requireNotes: true, order: 7, isActive: true },
  { type: 'opening', title: 'Bersihkan area display dan counter', requirePhoto: false, requireNotes: false, order: 8, isActive: true },
  { type: 'opening', title: 'Cek menu board dan harga', description: 'Report jika ada yang salah', requirePhoto: false, requireNotes: true, order: 9, isActive: true },
  { type: 'opening', title: 'Test semua equipment berfungsi', description: 'Report jika ada rosak', requirePhoto: false, requireNotes: true, order: 10, isActive: true },
];

export const DEFAULT_CLOSING_CHECKLIST: Omit<ChecklistItemTemplate, 'id' | 'createdAt'>[] = [
  { type: 'closing', title: 'Close register dan count cash', description: 'Ambil gambar cash count', requirePhoto: true, requireNotes: true, order: 1, isActive: true },
  { type: 'closing', title: 'Reconcile sales dengan POS', description: 'Tulis jika ada perbezaan', requirePhoto: false, requireNotes: true, order: 2, isActive: true },
  { type: 'closing', title: 'Bersihkan semua cooking equipment', requirePhoto: false, requireNotes: false, order: 3, isActive: true },
  { type: 'closing', title: 'Cuci dan sanitize semua surfaces', requirePhoto: false, requireNotes: false, order: 4, isActive: true },
  { type: 'closing', title: 'Simpan semua bahan dalam fridge/freezer', requirePhoto: false, requireNotes: false, order: 5, isActive: true },
  { type: 'closing', title: 'Cek suhu fridge sebelum tutup', description: 'Ambil gambar thermometer', requirePhoto: true, requireNotes: true, order: 6, isActive: true },
  { type: 'closing', title: 'Buang semua sampah', requirePhoto: false, requireNotes: false, order: 7, isActive: true },
  { type: 'closing', title: 'Tutup semua gas', description: 'Ambil gambar gas valve OFF', requirePhoto: true, requireNotes: false, order: 8, isActive: true },
  { type: 'closing', title: 'Matikan semua equipment kecuali fridge', requirePhoto: false, requireNotes: false, order: 9, isActive: true },
  { type: 'closing', title: 'Cek pintu belakang dan windows', requirePhoto: false, requireNotes: false, order: 10, isActive: true },
  { type: 'closing', title: 'Set alarm dan kunci pintu', requirePhoto: false, requireNotes: false, order: 11, isActive: true },
];

// ==================== MOCK DATA ====================

export const MOCK_CHECKLIST_TEMPLATES: ChecklistItemTemplate[] = [
  ...DEFAULT_OPENING_CHECKLIST.map((item, index) => ({
    ...item,
    id: `checklist_template_opening_${index + 1}`,
    createdAt: new Date().toISOString(),
  })),
  ...DEFAULT_CLOSING_CHECKLIST.map((item, index) => ({
    ...item,
    id: `checklist_template_closing_${index + 1}`,
    createdAt: new Date().toISOString(),
  })),
];

export const MOCK_CHECKLIST_COMPLETIONS: ChecklistCompletion[] = [];

export const MOCK_LEAVE_BALANCES: LeaveBalance[] = [
  {
    id: 'lb_1',
    staffId: '1',
    year: 2024,
    annual: { entitled: 14, taken: 3, pending: 1, balance: 10 },
    medical: { entitled: 14, taken: 2, pending: 0, balance: 12 },
    emergency: { entitled: 3, taken: 1, pending: 0, balance: 2 },
    maternity: { entitled: 105, taken: 0, pending: 0, balance: 105 },
    paternity: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    compassionate: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    unpaid: { taken: 0 },
    replacement: { entitled: 2, taken: 0, pending: 0, balance: 2 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lb_2',
    staffId: '2',
    year: 2024,
    annual: { entitled: 14, taken: 5, pending: 0, balance: 9 },
    medical: { entitled: 14, taken: 1, pending: 0, balance: 13 },
    emergency: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    maternity: { entitled: 105, taken: 0, pending: 0, balance: 105 },
    paternity: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    compassionate: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    unpaid: { taken: 1 },
    replacement: { entitled: 0, taken: 0, pending: 0, balance: 0 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lb_3',
    staffId: '3',
    year: 2024,
    annual: { entitled: 14, taken: 2, pending: 2, balance: 10 },
    medical: { entitled: 14, taken: 3, pending: 0, balance: 11 },
    emergency: { entitled: 3, taken: 1, pending: 0, balance: 2 },
    maternity: { entitled: 105, taken: 0, pending: 0, balance: 105 },
    paternity: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    compassionate: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    unpaid: { taken: 0 },
    replacement: { entitled: 1, taken: 0, pending: 0, balance: 1 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lb_4',
    staffId: '4',
    year: 2024,
    annual: { entitled: 14, taken: 7, pending: 0, balance: 7 },
    medical: { entitled: 14, taken: 0, pending: 0, balance: 14 },
    emergency: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    maternity: { entitled: 105, taken: 0, pending: 0, balance: 105 },
    paternity: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    compassionate: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    unpaid: { taken: 0 },
    replacement: { entitled: 0, taken: 0, pending: 0, balance: 0 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr_1',
    staffId: '2',
    staffName: 'Siti Nurhaliza',
    type: 'annual',
    startDate: '2024-12-20',
    endDate: '2024-12-22',
    duration: 3,
    isHalfDay: false,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: '2024-12-10T08:00:00Z',
  },
  {
    id: 'lr_2',
    staffId: '3',
    staffName: 'Rahman Ali',
    type: 'medical',
    startDate: '2024-12-05',
    endDate: '2024-12-05',
    duration: 1,
    isHalfDay: false,
    reason: 'Demam dan selsema',
    attachments: ['mc_document.pdf'],
    status: 'approved',
    approvedBy: '1',
    approverName: 'Ahmad Bin Hassan',
    approvedAt: '2024-12-05T09:00:00Z',
    createdAt: '2024-12-05T07:00:00Z',
  },
];

export const MOCK_CLAIM_REQUESTS: ClaimRequest[] = [
  {
    id: 'cr_1',
    staffId: '2',
    staffName: 'Siti Nurhaliza',
    type: 'transport',
    amount: 25.50,
    description: 'Petrol claim untuk delivery urgent ke customer',
    receiptUrls: ['receipt_petrol.jpg'],
    claimDate: '2024-12-08',
    status: 'pending',
    createdAt: '2024-12-08T18:00:00Z',
  },
  {
    id: 'cr_2',
    staffId: '3',
    staffName: 'Rahman Ali',
    type: 'medical',
    amount: 45.00,
    description: 'Ubat dari klinik',
    receiptUrls: ['clinic_receipt.jpg'],
    claimDate: '2024-12-05',
    status: 'approved',
    approvedBy: '1',
    approverName: 'Ahmad Bin Hassan',
    approvedAt: '2024-12-06T10:00:00Z',
    createdAt: '2024-12-05T14:00:00Z',
  },
];

export const MOCK_STAFF_REQUESTS: StaffRequest[] = [
  {
    id: 'sr_1',
    staffId: '2',
    staffName: 'Siti Nurhaliza',
    category: 'letter',
    title: 'Surat Pengesahan Kerja',
    description: 'Perlukan surat pengesahan untuk mohon pinjaman bank',
    priority: 'medium',
    status: 'pending',
    createdAt: '2024-12-09T10:00:00Z',
  },
  {
    id: 'sr_2',
    staffId: '3',
    staffName: 'Rahman Ali',
    category: 'equipment',
    title: 'Request kasut kerja baru',
    description: 'Kasut lama sudah rosak, perlu kasut baru saiz 42',
    priority: 'low',
    status: 'in_progress',
    assignedTo: '1',
    assigneeName: 'Ahmad Bin Hassan',
    createdAt: '2024-12-07T09:00:00Z',
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Mesyuarat Staff Bulanan',
    message: 'Mesyuarat staff akan diadakan pada hari Jumaat, 20 Dis 2024 jam 5 petang. Semua staff wajib hadir.',
    priority: 'high',
    targetRoles: ['Manager', 'Staff'],
    isActive: true,
    startDate: '2024-12-15',
    endDate: '2024-12-20',
    createdBy: '1',
    createdAt: '2024-12-13T08:00:00Z',
  },
  {
    id: 'ann_2',
    title: 'Menu Baru Minggu Depan',
    message: 'Kita akan launch menu baru minggu depan. Sila attend training pada hari Khamis untuk belajar cara buat.',
    priority: 'medium',
    targetRoles: ['Manager', 'Staff'],
    isActive: true,
    startDate: '2024-12-13',
    createdBy: '1',
    createdAt: '2024-12-13T09:00:00Z',
  },
];

// ==================== SHIFTS & SCHEDULES ====================

export const MOCK_SHIFTS: Shift[] = [
  {
    id: 'shift_pagi',
    name: 'Pagi',
    startTime: '07:00',
    endTime: '15:00',
    breakDuration: 60,
    color: '#f59e0b', // amber/orange for morning
  },
  {
    id: 'shift_petang',
    name: 'Petang',
    startTime: '14:00',
    endTime: '22:00',
    breakDuration: 60,
    color: '#3b82f6', // blue for afternoon/evening
  },
  {
    id: 'shift_malam',
    name: 'Malam',
    startTime: '21:00',
    endTime: '05:00',
    breakDuration: 60,
    color: '#6366f1', // indigo for night
  },
];

// Helper to generate future dates for schedules
const generateFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Generate schedules for today and the next 14 days for all staff (15 days total)
export const generateMockSchedules = (): ScheduleEntry[] => {
  const schedules: ScheduleEntry[] = [];
  const staffMembers = [
    { id: '1', name: 'Ahmad Bin Hassan' },
    { id: '2', name: 'Siti Nurhaliza' },
    { id: '3', name: 'Rahman Ali' },
    { id: '4', name: 'Fatimah Binti Omar' },
  ];
  
  // Pattern: rotate shifts among staff (including today as day 0)
  for (let day = 0; day <= 14; day++) {
    const date = generateFutureDate(day);
    
    staffMembers.forEach((staff, index) => {
      // Skip some days to simulate off days
      if ((day + index) % 7 === 0) return; // Every 7th day is off for each staff
      
      // Rotate shifts based on day and staff index
      const shiftIndex = (day + index) % 3;
      const shift = MOCK_SHIFTS[shiftIndex];
      
      schedules.push({
        id: `schedule_${staff.id}_${date}`,
        staffId: staff.id,
        staffName: staff.name,
        shiftId: shift.id,
        shiftName: shift.name,
        date: date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: 'scheduled',
      });
    });
  }
  
  return schedules;
};

export const MOCK_SCHEDULES: ScheduleEntry[] = generateMockSchedules();

// ==================== HELPER FUNCTIONS ====================

export function getDefaultLeaveEntitlement(): Omit<LeaveBalance, 'id' | 'staffId' | 'createdAt' | 'updatedAt'> {
  return {
    year: new Date().getFullYear(),
    annual: { entitled: 14, taken: 0, pending: 0, balance: 14 },
    medical: { entitled: 14, taken: 0, pending: 0, balance: 14 },
    emergency: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    maternity: { entitled: 105, taken: 0, pending: 0, balance: 105 },
    paternity: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    compassionate: { entitled: 3, taken: 0, pending: 0, balance: 3 },
    unpaid: { taken: 0 },
    replacement: { entitled: 0, taken: 0, pending: 0, balance: 0 },
  };
}

export function calculateLeaveDays(startDate: string, endDate: string, isHalfDay: boolean): number {
  if (isHalfDay) return 0.5;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

export function getLeaveTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    annual: 'Cuti Tahunan',
    medical: 'Cuti Sakit (MC)',
    emergency: 'Cuti Kecemasan',
    unpaid: 'Cuti Tanpa Gaji',
    maternity: 'Cuti Bersalin',
    paternity: 'Cuti Paterniti',
    compassionate: 'Cuti Ehsan',
    replacement: 'Cuti Ganti',
    study: 'Cuti Belajar',
  };
  return labels[type] || type;
}

export function getClaimTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    medical: 'Tuntutan Perubatan',
    transport: 'Tuntutan Pengangkutan',
    meal: 'Tuntutan Makan',
    training: 'Tuntutan Latihan',
    phone: 'Tuntutan Telefon',
    uniform: 'Tuntutan Uniform',
    equipment: 'Tuntutan Peralatan',
    other: 'Tuntutan Lain',
  };
  return labels[type] || type;
}

export function getRequestCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    shift_swap: 'Tukar Shift',
    off_day: 'Permohonan Cuti',
    ot_request: 'Permohonan OT',
    schedule_change: 'Tukar Jadual',
    salary_advance: 'Pinjaman Gaji',
    payslip: 'Salinan Payslip',
    letter: 'Permohonan Surat',
    training: 'Permohonan Latihan',
    equipment: 'Permohonan Peralatan',
    complaint: 'Aduan',
    resignation: 'Notis Berhenti',
    bank_change: 'Tukar Akaun Bank',
    other: 'Lain-lain',
  };
  return labels[category] || category;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Diluluskan',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    paid: 'Dibayar',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'secondary',
    in_progress: 'info',
    completed: 'success',
    paid: 'success',
  };
  return colors[status] || 'secondary';
}

