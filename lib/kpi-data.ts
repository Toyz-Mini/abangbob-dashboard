import { KPIConfig, KPIMetricConfig, StaffKPI, LeaveRecord, TrainingRecord, OTRecord, CustomerReview } from './types';

// ==================== KPI CONFIGURATION ====================

export const KPI_METRICS_CONFIG: KPIMetricConfig[] = [
  {
    key: 'mealPrepTime',
    label: 'Meal Prep Time',
    labelBM: 'Masa Penyediaan',
    description: 'Purata masa untuk menyediakan pesanan',
    weight: 15,
    icon: 'ChefHat',
    color: '#f59e0b',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    labelBM: 'Kehadiran',
    description: 'Ketepatan masa clock in/out',
    weight: 20,
    icon: 'Clock',
    color: '#10b981',
  },
  {
    key: 'emergencyLeave',
    label: 'Leave Management',
    labelBM: 'Pengurusan Cuti',
    description: 'Kekerapan emergency leave/MC',
    weight: 10,
    icon: 'Calendar',
    color: '#ef4444',
  },
  {
    key: 'upselling',
    label: 'Upselling',
    labelBM: 'Jualan Tambahan',
    description: 'Prestasi upselling per order',
    weight: 15,
    icon: 'TrendingUp',
    color: '#8b5cf6',
  },
  {
    key: 'customerRating',
    label: 'Customer Rating',
    labelBM: 'Rating Pelanggan',
    description: 'Purata rating dari pelanggan',
    weight: 15,
    icon: 'Star',
    color: '#eab308',
  },
  {
    key: 'wasteReduction',
    label: 'Waste Reduction',
    labelBM: 'Kurangkan Pembaziran',
    description: 'Peratus pengurangan pembaziran',
    weight: 10,
    icon: 'Recycle',
    color: '#22c55e',
  },
  {
    key: 'trainingComplete',
    label: 'Training',
    labelBM: 'Latihan',
    description: 'Latihan yang diselesaikan',
    weight: 5,
    icon: 'GraduationCap',
    color: '#3b82f6',
  },
  {
    key: 'otWillingness',
    label: 'OT Willingness',
    labelBM: 'Kesanggupan OT',
    description: 'Kesanggupan untuk kerja lebih masa',
    weight: 10,
    icon: 'Clock4',
    color: '#6366f1',
  },
];

export const DEFAULT_KPI_CONFIG: KPIConfig = {
  baseBonus: 200, // RM 200 base bonus
  metricsConfig: KPI_METRICS_CONFIG,
};

// ==================== MOCK DATA ====================

const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

export const MOCK_STAFF_KPI: StaffKPI[] = [
  {
    id: 'kpi_1',
    staffId: '1',
    period: currentMonth,
    metrics: {
      mealPrepTime: 92,
      attendance: 100,
      emergencyLeave: 100,
      upselling: 85,
      customerRating: 95,
      wasteReduction: 88,
      trainingComplete: 100,
      otWillingness: 90,
    },
    overallScore: 93,
    bonusAmount: 186,
    rank: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi_2',
    staffId: '2',
    period: currentMonth,
    metrics: {
      mealPrepTime: 88,
      attendance: 95,
      emergencyLeave: 70,
      upselling: 92,
      customerRating: 90,
      wasteReduction: 75,
      trainingComplete: 80,
      otWillingness: 85,
    },
    overallScore: 86,
    bonusAmount: 172,
    rank: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi_3',
    staffId: '3',
    period: currentMonth,
    metrics: {
      mealPrepTime: 75,
      attendance: 80,
      emergencyLeave: 100,
      upselling: 70,
      customerRating: 85,
      wasteReduction: 80,
      trainingComplete: 60,
      otWillingness: 70,
    },
    overallScore: 78,
    bonusAmount: 156,
    rank: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi_4',
    staffId: '4',
    period: currentMonth,
    metrics: {
      mealPrepTime: 65,
      attendance: 70,
      emergencyLeave: 40,
      upselling: 60,
      customerRating: 75,
      wasteReduction: 70,
      trainingComplete: 40,
      otWillingness: 50,
    },
    overallScore: 62,
    bonusAmount: 124,
    rank: 4,
    updatedAt: new Date().toISOString(),
  },
  // Last month data for trend comparison
  {
    id: 'kpi_5',
    staffId: '1',
    period: lastMonth,
    metrics: {
      mealPrepTime: 88,
      attendance: 95,
      emergencyLeave: 100,
      upselling: 80,
      customerRating: 90,
      wasteReduction: 85,
      trainingComplete: 80,
      otWillingness: 85,
    },
    overallScore: 88,
    bonusAmount: 176,
    rank: 1,
    updatedAt: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
  },
  {
    id: 'kpi_6',
    staffId: '2',
    period: lastMonth,
    metrics: {
      mealPrepTime: 82,
      attendance: 90,
      emergencyLeave: 100,
      upselling: 88,
      customerRating: 85,
      wasteReduction: 70,
      trainingComplete: 60,
      otWillingness: 80,
    },
    overallScore: 83,
    bonusAmount: 166,
    rank: 2,
    updatedAt: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
  },
];

export const MOCK_LEAVE_RECORDS: LeaveRecord[] = [
  {
    id: 'leave_1',
    staffId: '2',
    type: 'emergency',
    startDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    reason: 'Anak sakit',
    status: 'approved',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
  },
  {
    id: 'leave_2',
    staffId: '4',
    type: 'medical',
    startDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString().split('T')[0],
    reason: 'Demam',
    status: 'approved',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 11)).toISOString(),
  },
  {
    id: 'leave_3',
    staffId: '4',
    type: 'emergency',
    startDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
    reason: 'Urusan keluarga',
    status: 'approved',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
  },
];

export const MOCK_TRAINING_RECORDS: TrainingRecord[] = [
  {
    id: 'train_1',
    staffId: '1',
    name: 'Food Safety Certification',
    description: 'Sijil keselamatan makanan',
    completedAt: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    status: 'completed',
    certificateUrl: '/certificates/food-safety.pdf',
  },
  {
    id: 'train_2',
    staffId: '1',
    name: 'Customer Service Excellence',
    description: 'Latihan khidmat pelanggan',
    completedAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    status: 'completed',
  },
  {
    id: 'train_3',
    staffId: '2',
    name: 'Food Safety Certification',
    description: 'Sijil keselamatan makanan',
    completedAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
    status: 'completed',
  },
  {
    id: 'train_4',
    staffId: '2',
    name: 'POS System Training',
    description: 'Latihan sistem POS',
    status: 'in_progress',
  },
  {
    id: 'train_5',
    staffId: '3',
    name: 'Food Safety Certification',
    description: 'Sijil keselamatan makanan',
    status: 'pending',
  },
];

export const MOCK_OT_RECORDS: OTRecord[] = [
  {
    id: 'ot_1',
    staffId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    requestedBy: 'Manager',
    hoursRequested: 3,
    accepted: true,
    reason: 'Rush hour coverage',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
  {
    id: 'ot_2',
    staffId: '2',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    requestedBy: 'Manager',
    hoursRequested: 2,
    accepted: true,
    reason: 'Staff shortage',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
  },
  {
    id: 'ot_3',
    staffId: '3',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    requestedBy: 'Manager',
    hoursRequested: 4,
    accepted: false,
    reason: 'Weekend coverage',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(),
  },
  {
    id: 'ot_4',
    staffId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    requestedBy: 'Manager',
    hoursRequested: 2,
    accepted: true,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 11)).toISOString(),
  },
];

export const MOCK_CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: 'review_1',
    orderId: 'order_1',
    staffId: '1',
    rating: 5,
    comment: 'Makanan sedap dan cepat!',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: 'review_2',
    orderId: 'order_2',
    staffId: '1',
    rating: 5,
    comment: 'Layanan terbaik',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
  {
    id: 'review_3',
    orderId: 'order_3',
    staffId: '2',
    rating: 4,
    comment: 'Good service',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
  {
    id: 'review_4',
    orderId: 'order_4',
    staffId: '2',
    rating: 5,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
  },
  {
    id: 'review_5',
    orderId: 'order_5',
    staffId: '3',
    rating: 4,
    comment: 'Okay',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate overall KPI score based on weighted metrics
 */
export function calculateOverallScore(metrics: StaffKPI['metrics']): number {
  const totalWeight = KPI_METRICS_CONFIG.reduce((sum, m) => sum + m.weight, 0);
  
  let weightedSum = 0;
  for (const config of KPI_METRICS_CONFIG) {
    weightedSum += metrics[config.key] * config.weight;
  }
  
  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate bonus amount based on KPI score
 */
export function calculateBonus(overallScore: number, baseBonus: number = DEFAULT_KPI_CONFIG.baseBonus): number {
  return Math.round(baseBonus * (overallScore / 100));
}

/**
 * Get rank tier based on score
 */
export function getRankTier(score: number): { tier: string; color: string; icon: string } {
  if (score >= 90) return { tier: 'Platinum', color: '#a855f7', icon: '👑' };
  if (score >= 80) return { tier: 'Gold', color: '#eab308', icon: '🥇' };
  if (score >= 70) return { tier: 'Silver', color: '#94a3b8', icon: '🥈' };
  if (score >= 60) return { tier: 'Bronze', color: '#d97706', icon: '🥉' };
  return { tier: 'Starter', color: '#6b7280', icon: '⭐' };
}

/**
 * Get score color for visual display
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 80) return '#22c55e'; // light green
  if (score >= 70) return '#eab308'; // yellow
  if (score >= 60) return '#f59e0b'; // orange
  return '#ef4444'; // red
}

/**
 * Calculate attendance score based on attendance records
 */
export function calculateAttendanceScore(
  totalDays: number,
  onTimeDays: number,
  lateDays: number,
  absentDays: number
): number {
  if (totalDays === 0) return 100;
  
  const onTimeScore = (onTimeDays / totalDays) * 100;
  const lateScore = (lateDays / totalDays) * 80; // Late gets 80%
  const absentScore = 0; // Absent gets 0%
  
  return Math.round(onTimeScore + lateScore);
}

/**
 * Calculate emergency leave score
 */
export function calculateEmergencyLeaveScore(emergencyLeaveCount: number): number {
  if (emergencyLeaveCount <= 1) return 100;
  if (emergencyLeaveCount <= 2) return 85;
  if (emergencyLeaveCount <= 3) return 70;
  if (emergencyLeaveCount <= 4) return 50;
  return 40;
}

/**
 * Calculate meal prep time score based on average prep time in minutes
 */
export function calculateMealPrepScore(avgPrepTimeMinutes: number): number {
  if (avgPrepTimeMinutes <= 8) return 100;
  if (avgPrepTimeMinutes <= 10) return 90;
  if (avgPrepTimeMinutes <= 12) return 80;
  if (avgPrepTimeMinutes <= 15) return 70;
  if (avgPrepTimeMinutes <= 18) return 60;
  return 50;
}

/**
 * Calculate waste reduction score
 */
export function calculateWasteScore(wastePercentage: number): number {
  if (wastePercentage <= 2) return 100;
  if (wastePercentage <= 5) return 90;
  if (wastePercentage <= 8) return 75;
  if (wastePercentage <= 10) return 60;
  return 40;
}

/**
 * Calculate training completion score
 */
export function calculateTrainingScore(completedCount: number, totalAssigned: number): number {
  if (totalAssigned === 0) return 100;
  return Math.round((completedCount / totalAssigned) * 100);
}

/**
 * Calculate OT willingness score
 */
export function calculateOTScore(acceptedCount: number, requestedCount: number): number {
  if (requestedCount === 0) return 80; // Neutral if no requests
  return Math.round((acceptedCount / requestedCount) * 100);
}

/**
 * Calculate customer rating score (converts 1-5 rating to 0-100)
 */
export function calculateCustomerRatingScore(avgRating: number): number {
  return Math.round((avgRating / 5) * 100);
}




