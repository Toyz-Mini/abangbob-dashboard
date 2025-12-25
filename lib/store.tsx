'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { StockItem, StaffProfile, AttendanceRecord, Order, ProductionLog, DeliveryOrder, Expense, DailyCashFlow, Customer, Supplier, PurchaseOrder, Recipe, Shift, ScheduleEntry, Promotion, Notification, MenuItem, ModifierGroup, ModifierOption, StaffKPI, LeaveRecord, TrainingRecord, OTRecord, CustomerReview, KPIMetrics, ChecklistItemTemplate, ChecklistCompletion, LeaveBalance, LeaveRequest, ClaimRequest, StaffRequest, Announcement, OrderHistoryItem, VoidRefundRequest, VoidRefundType, OrderHistoryFilters, RefundItem, OilTracker, OilChangeRequest, OilActionHistory, OilActionType, Equipment, MaintenanceSchedule, MaintenanceLog, WasteLog, MenuCategory, PaymentMethodConfig, TaxRate, CashRegister, InventoryLog, StockSuggestion, DEFAULT_MENU_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_TAX_RATES, OTClaim, SalaryAdvance, DisciplinaryAction, StaffTraining } from './types';
import { MOCK_ORDER_HISTORY, MOCK_VOID_REFUND_REQUESTS, ORDER_HISTORY_STORAGE_KEYS } from './order-history-data';
import { MOCK_STOCK } from './inventory-data';
import { MOCK_STAFF, MOCK_ATTENDANCE, MOCK_PAYROLL } from './hr-data';
import { MOCK_PRODUCTION_LOGS, MOCK_OIL_TRACKERS } from './production-data';
import { MOCK_DELIVERY_ORDERS } from './delivery-data';
import { MOCK_EXPENSES, MOCK_CASH_FLOWS } from './finance-data';
import { MOCK_MENU, MOCK_MODIFIER_GROUPS, MOCK_MODIFIER_OPTIONS } from './menu-data';
import { MOCK_STAFF_KPI, MOCK_LEAVE_RECORDS, MOCK_TRAINING_RECORDS, MOCK_OT_RECORDS, MOCK_CUSTOMER_REVIEWS, calculateOverallScore, calculateBonus, DEFAULT_KPI_CONFIG } from './kpi-data';
import { MOCK_CHECKLIST_TEMPLATES, MOCK_CHECKLIST_COMPLETIONS, MOCK_LEAVE_BALANCES, MOCK_LEAVE_REQUESTS, MOCK_CLAIM_REQUESTS, MOCK_STAFF_REQUESTS, MOCK_ANNOUNCEMENTS, MOCK_SHIFTS, MOCK_SCHEDULES, generateMockSchedules } from './staff-portal-data';
import * as SupabaseSync from './supabase-sync';
import { isSupabaseConfigured, getConnectionState, checkSupabaseConnection, getSupabaseClient } from './supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logSyncError, logSyncSuccess } from './utils/sync-logger';
import * as PaymentTaxSync from './supabase/payment-tax-sync';
import * as VoidRefundOps from './supabase/operations';
import { useCashRegistersRealtime } from './supabase/realtime-hooks';
import { getNextDayForecast, WeatherForecast } from './services/weather';


// Helper function to generate UUID for Supabase compatibility
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Data source tracking for debugging
export type DataSource = 'supabase' | 'localStorage' | 'mock' | 'unknown';

interface DataSourceInfo {
  menuItems: DataSource;
  modifierGroups: DataSource;
  modifierOptions: DataSource;
  inventory: DataSource;
  staff: DataSource;
  orders: DataSource;
  lastLoadTime: Date | null;
  supabaseConnected: boolean;
}

let dataSourceInfo: DataSourceInfo = {
  menuItems: 'unknown',
  modifierGroups: 'unknown',
  modifierOptions: 'unknown',
  inventory: 'unknown',
  staff: 'unknown',
  orders: 'unknown',
  lastLoadTime: null,
  supabaseConnected: false,
};

export function getDataSourceInfo(): DataSourceInfo {
  return { ...dataSourceInfo };
}

// Storage keys
const STORAGE_KEYS = {
  INVENTORY: 'abangbob_inventory',
  STAFF: 'abangbob_staff',
  ATTENDANCE: 'abangbob_attendance',
  ORDERS: 'abangbob_orders',
  PRODUCTION_LOGS: 'abangbob_production_logs',
  DELIVERY_ORDERS: 'abangbob_delivery_orders',
  INVENTORY_LOGS: 'abangbob_inventory_logs',
  EXPENSES: 'abangbob_expenses',
  CASH_FLOWS: 'abangbob_cash_flows',
  CUSTOMERS: 'abangbob_customers',
  SUPPLIERS: 'abangbob_suppliers',
  PURCHASE_ORDERS: 'abangbob_purchase_orders',
  RECIPES: 'abangbob_recipes',
  SHIFTS: 'abangbob_shifts',
  SCHEDULES: 'abangbob_schedules',
  PROMOTIONS: 'abangbob_promotions',
  NOTIFICATIONS: 'abangbob_notifications',
  MENU_ITEMS: 'abangbob_menu_items',
  MODIFIER_GROUPS: 'abangbob_modifier_groups',
  MODIFIER_OPTIONS: 'abangbob_modifier_options',
  // KPI & Gamification
  STAFF_KPI: 'abangbob_staff_kpi',
  LEAVE_RECORDS: 'abangbob_leave_records',
  TRAINING_RECORDS: 'abangbob_training_records',
  OT_RECORDS: 'abangbob_ot_records',
  CUSTOMER_REVIEWS: 'abangbob_customer_reviews',
  // Staff Portal
  CHECKLIST_TEMPLATES: 'abangbob_checklist_templates',
  CHECKLIST_COMPLETIONS: 'abangbob_checklist_completions',
  LEAVE_BALANCES: 'abangbob_leave_balances',
  LEAVE_REQUESTS: 'abangbob_leave_requests',
  CLAIM_REQUESTS: 'abangbob_claim_requests',
  STAFF_REQUESTS: 'abangbob_staff_requests',
  ANNOUNCEMENTS: 'abangbob_announcements',
  // Order History & Void/Refund
  ORDER_HISTORY: 'abangbob_order_history',
  VOID_REFUND_REQUESTS: 'abangbob_void_refund_requests',
  // Oil Tracker / Equipment
  OIL_TRACKERS: 'abangbob_oil_trackers',
  OIL_CHANGE_REQUESTS: 'abangbob_oil_change_requests',
  OIL_ACTION_HISTORY: 'abangbob_oil_action_history',
  // Menu Categories, Payment Methods, Tax Rates
  MENU_CATEGORIES: 'abangbob_menu_categories',
  PAYMENT_METHODS: 'abangbob_payment_methods',
  TAX_RATES: 'abangbob_tax_rates',
  CASH_REGISTERS: 'abangbob_cash_registers',
  // Equipment
  EQUIPMENT: 'abangbob_equipment',
  MAINTENANCE_SCHEDULE: 'abangbob_maintenance_schedule',
  MAINTENANCE_LOGS: 'abangbob_maintenance_logs',
  WASTE_LOGS: 'abangbob_waste_logs',
  // OT Claims
  OT_CLAIMS: 'abangbob_ot_claims',
  // Salary Advances
  SALARY_ADVANCES: 'abangbob_salary_advances',
  // Disciplinary Actions
  DISCIPLINARY_ACTIONS: 'abangbob_disciplinary_actions',
  // Staff Training
  STAFF_TRAINING: 'abangbob_staff_training',
};

// Inventory log type for tracking stock changes


interface StoreState {
  // Inventory
  inventory: StockItem[];
  inventoryLogs: InventoryLog[];
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  adjustStock: (id: string, quantity: number, type: 'in' | 'out', reason: string) => void;
  refreshInventory: () => Promise<void>;
  getRestockSuggestions: () => StockSuggestion[];
  weatherForecast: WeatherForecast | null;

  // Waste Tracking
  wasteLogs: WasteLog[];
  addWasteLog: (log: Omit<WasteLog, 'id' | 'createdAt' | 'totalLoss'>) => Promise<{ success: boolean; error?: string }>;
  refreshWasteLogs: () => Promise<void>;

  // Staff
  staff: StaffProfile[];
  attendance: AttendanceRecord[];
  addStaff: (staffData: Omit<StaffProfile, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<StaffProfile>) => void;
  deleteStaff: (id: string) => void;
  clockIn: (staffId: string, pin: string, photo?: Blob, latitude?: number, longitude?: number) => Promise<{ success: boolean; message: string }>;
  clockOut: (staffId: string, pin?: string, photo?: Blob, latitude?: number, longitude?: number) => Promise<{ success: boolean; message: string }>;
  getStaffAttendanceToday: (staffId: string) => AttendanceRecord | undefined;
  refreshStaff: () => Promise<void>;
  refreshAttendance: () => Promise<void>;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status'], staffId?: string) => void;
  getTodayOrders: () => Order[];
  refreshOrders: () => Promise<void>;

  // Production Logs
  productionLogs: ProductionLog[];
  addProductionLog: (log: Omit<ProductionLog, 'id'>) => void;
  refreshProductionLogs: () => Promise<void>;

  // Delivery Orders
  deliveryOrders: DeliveryOrder[];
  updateDeliveryStatus: (orderId: string, status: DeliveryOrder['status']) => void;
  refreshDeliveryOrders: () => Promise<void>;

  // Finance
  expenses: Expense[];
  cashFlows: DailyCashFlow[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateCashFlow: (date: string, data: Partial<DailyCashFlow>) => void;
  getTodayCashFlow: () => DailyCashFlow | undefined;
  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyRevenue: (month: string) => number;
  refreshExpenses: () => Promise<void>;
  refreshCashFlows: () => Promise<void>;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalSpent' | 'totalOrders' | 'segment'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addLoyaltyPoints: (customerId: string, points: number, orderId?: string) => void;
  redeemLoyaltyPoints: (customerId: string, points: number) => boolean;
  refreshCustomers: () => Promise<void>;

  // Suppliers
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'rating'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseOrder>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
  markPurchaseOrderAsPaid: (id: string, amount?: number) => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  refreshPurchaseOrders: () => Promise<void>;

  // Recipes
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'totalCost' | 'profitMargin'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  refreshRecipes: () => Promise<void>;

  // Shifts & Schedules
  shifts: Shift[];
  schedules: ScheduleEntry[];
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  updateScheduleEntry: (id: string, updates: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
  getWeekSchedule: (startDate: string) => ScheduleEntry[];
  refreshSchedules: () => Promise<void>;

  // Promotions
  promotions: Promotion[];
  addPromotion: (promo: Omit<Promotion, 'id' | 'createdAt' | 'usageCount'>) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  validatePromoCode: (code: string) => Promotion | null;
  refreshPromotions: () => Promise<void>;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  getUnreadCount: () => number;
  refreshNotifications: () => Promise<void>;
  refreshAnnouncements: () => Promise<void>;

  // Menu Items
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuItemAvailability: (id: string) => void;
  getMenuCategories: () => string[];
  refreshMenu: () => Promise<void>;

  // Modifier Groups
  modifierGroups: ModifierGroup[];
  addModifierGroup: (group: Omit<ModifierGroup, 'id'>) => void;
  updateModifierGroup: (id: string, updates: Partial<ModifierGroup>) => void;
  deleteModifierGroup: (id: string) => void;

  // Modifier Options
  modifierOptions: ModifierOption[];
  addModifierOption: (option: Omit<ModifierOption, 'id'>) => void;
  updateModifierOption: (id: string, updates: Partial<ModifierOption>) => void;
  deleteModifierOption: (id: string) => void;
  getOptionsForGroup: (groupId: string) => ModifierOption[];

  // KPI & Gamification
  staffKPI: StaffKPI[];
  leaveRecords: LeaveRecord[];
  trainingRecords: TrainingRecord[];
  otRecords: OTRecord[];
  customerReviews: CustomerReview[];
  getStaffKPI: (staffId: string, period?: string) => StaffKPI | undefined;
  getStaffKPIHistory: (staffId: string) => StaffKPI[];
  updateStaffKPI: (staffId: string, period: string, metrics: Partial<KPIMetrics>) => void;
  recalculateKPIRankings: (period: string) => void;
  getKPILeaderboard: (period?: string) => StaffKPI[];
  addLeaveRecord: (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
  updateLeaveRecord: (id: string, updates: Partial<LeaveRecord>) => void;
  addTrainingRecord: (training: Omit<TrainingRecord, 'id'>) => void;
  updateTrainingRecord: (id: string, updates: Partial<TrainingRecord>) => void;
  addOTRecord: (ot: Omit<OTRecord, 'id' | 'createdAt'>) => void;
  updateOTRecord: (id: string, updates: Partial<OTRecord>) => void;
  addCustomerReview: (review: Omit<CustomerReview, 'id' | 'createdAt'>) => void;
  getStaffReviews: (staffId: string) => CustomerReview[];
  getStaffBonus: (staffId: string, period?: string) => number;

  // Staff Portal - Checklist
  checklistTemplates: ChecklistItemTemplate[];
  checklistCompletions: ChecklistCompletion[];
  addChecklistTemplate: (template: Omit<ChecklistItemTemplate, 'id' | 'createdAt'>) => void;
  updateChecklistTemplate: (id: string, updates: Partial<ChecklistItemTemplate>) => void;
  deleteChecklistTemplate: (id: string) => void;
  getChecklistTemplatesByType: (type: 'opening' | 'closing') => ChecklistItemTemplate[];
  startChecklist: (type: 'opening' | 'closing', staffId: string, staffName: string, shiftId: string) => ChecklistCompletion;
  updateChecklistItem: (completionId: string, templateId: string, updates: Partial<ChecklistCompletion['items'][0]>) => void;
  completeChecklist: (completionId: string) => void;
  getTodayChecklist: (type: 'opening' | 'closing') => ChecklistCompletion | undefined;

  // Staff Portal - Leave
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  getLeaveBalance: (staffId: string, year?: number) => LeaveBalance | undefined;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt'>) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  approveLeaveRequest: (id: string, approverId: string, approverName: string) => void;
  rejectLeaveRequest: (id: string, approverId: string, approverName: string, reason: string) => void;
  getStaffLeaveRequests: (staffId: string) => LeaveRequest[];
  getPendingLeaveRequests: () => LeaveRequest[];
  refreshLeaveRequests: () => Promise<void>;

  // Staff Portal - Claims
  claimRequests: ClaimRequest[];
  addClaimRequest: (claim: Omit<ClaimRequest, 'id' | 'createdAt'>) => void;
  updateClaimRequest: (id: string, updates: Partial<ClaimRequest>) => void;
  approveClaimRequest: (id: string, approverId: string, approverName: string) => void;
  rejectClaimRequest: (id: string, approverId: string, approverName: string, reason: string) => void;
  markClaimAsPaid: (id: string) => void;
  getStaffClaimRequests: (staffId: string) => ClaimRequest[];
  getPendingClaimRequests: () => ClaimRequest[];
  refreshClaimRequests: () => Promise<void>;

  // Staff Portal - OT Claims
  otClaims: OTClaim[];
  addOTClaim: (claim: Omit<OTClaim, 'id' | 'createdAt'>) => void;
  updateOTClaim: (id: string, updates: Partial<OTClaim>) => void;
  approveOTClaim: (id: string, approverId: string, approverName: string) => void;
  rejectOTClaim: (id: string, approverId: string, approverName: string, reason: string) => void;
  markOTClaimAsPaid: (id: string) => void;
  getStaffOTClaims: (staffId: string) => OTClaim[];
  getPendingOTClaims: () => OTClaim[];

  // Staff Portal - Salary Advances
  salaryAdvances: SalaryAdvance[];
  addSalaryAdvance: (advance: Omit<SalaryAdvance, 'id' | 'createdAt'>) => void;
  approveSalaryAdvance: (id: string, approverId: string, approverName: string) => void;
  rejectSalaryAdvance: (id: string, approverId: string, approverName: string, reason: string) => void;
  markSalaryAdvanceAsDeducted: (id: string, month: string) => void;
  getStaffSalaryAdvances: (staffId: string) => SalaryAdvance[];
  getPendingSalaryAdvances: () => SalaryAdvance[];
  getApprovedSalaryAdvances: (staffId?: string) => SalaryAdvance[];

  // HR - Disciplinary Actions
  disciplinaryActions: DisciplinaryAction[];
  addDisciplinaryAction: (action: Omit<DisciplinaryAction, 'id' | 'createdAt'>) => void;
  updateDisciplinaryAction: (id: string, updates: Partial<DisciplinaryAction>) => void;
  deleteDisciplinaryAction: (id: string) => void;
  getStaffDisciplinaryActions: (staffId: string) => DisciplinaryAction[];
  refreshDisciplinaryActions: () => Promise<void>;

  // HR - Staff Training & Certifications
  staffTraining: StaffTraining[];
  addStaffTraining: (training: Omit<StaffTraining, 'id' | 'createdAt'>) => void;
  updateStaffTraining: (id: string, updates: Partial<StaffTraining>) => void;
  deleteStaffTraining: (id: string) => void;
  getStaffTrainingRecords: (staffId: string) => StaffTraining[];
  getExpiringTraining: (daysAhead?: number) => StaffTraining[];
  refreshStaffTraining: () => Promise<void>;

  // Staff Portal - General Requests
  staffRequests: StaffRequest[];
  addStaffRequest: (request: Omit<StaffRequest, 'id' | 'createdAt'>) => void;
  updateStaffRequest: (id: string, updates: Partial<StaffRequest>) => void;
  completeStaffRequest: (id: string, responseNote?: string) => void;
  rejectStaffRequest: (id: string, responseNote: string) => void;
  getStaffRequestsByStaff: (staffId: string) => StaffRequest[];
  getPendingStaffRequests: () => StaffRequest[];
  refreshStaffRequests: () => Promise<void>;
  refreshChecklistTemplates: () => Promise<void>;
  refreshChecklistCompletions: () => Promise<void>;

  // Staff Portal - Announcements
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  getActiveAnnouncements: (role?: 'Manager' | 'Staff') => Announcement[];

  // Order History & Void/Refund
  orderHistory: OrderHistoryItem[];
  voidRefundRequests: VoidRefundRequest[];
  getOrderHistory: (filters?: Partial<OrderHistoryFilters>) => OrderHistoryItem[];
  getOrderById: (orderId: string) => OrderHistoryItem | undefined;
  requestVoid: (orderId: string, reason: string, requestedBy: string, requestedByName: string) => Promise<{ success: boolean; error?: string }>;
  requestRefund: (orderId: string, amount: number, reason: string, requestedBy: string, requestedByName: string, items?: RefundItem[]) => Promise<{ success: boolean; error?: string }>;
  approveVoidRefund: (requestId: string, approvedBy: string, approvedByName: string) => Promise<{ success: boolean; error?: string }>;
  rejectVoidRefund: (requestId: string, rejectedBy: string, rejectedByName: string, reason: string) => Promise<void>;
  getPendingVoidRefundRequests: () => VoidRefundRequest[];
  getVoidRefundRequestsByStaff: (staffId: string) => VoidRefundRequest[];
  getPendingVoidRefundCount: () => number;
  refreshVoidRefundRequests: () => Promise<void>;

  // Oil Tracker / Equipment
  oilTrackers: OilTracker[];
  oilChangeRequests: OilChangeRequest[];
  oilActionHistory: OilActionHistory[];
  addOilTracker: (tracker: Omit<OilTracker, 'fryerId'>) => void;
  updateOilTracker: (fryerId: string, updates: Partial<OilTracker>) => void;
  deleteOilTracker: (fryerId: string) => void;
  submitOilRequest: (fryerId: string, actionType: OilActionType, photoUrl: string, requestedBy: string, requestedByName: string, topupPercentage?: number, notes?: string) => { success: boolean; error?: string };
  approveOilRequest: (requestId: string, approvedBy: string, approvedByName: string) => { success: boolean; error?: string };
  rejectOilRequest: (requestId: string, rejectedBy: string, rejectedByName: string, reason: string) => void;
  getPendingOilRequests: () => OilChangeRequest[];
  getOilRequestsByStaff: (staffId: string) => OilChangeRequest[];
  getPendingOilRequestCount: () => number;
  getOilActionHistory: (fryerId: string) => OilActionHistory[];
  refreshOilTrackers: () => Promise<void>;

  // Equipment & Maintenance (New)
  equipment: Equipment[];
  maintenanceSchedules: MaintenanceSchedule[];
  maintenanceLogs: MaintenanceLog[];
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  addMaintenanceSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>) => void;
  updateMaintenanceSchedule: (id: string, updates: Partial<MaintenanceSchedule>) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  updateMaintenanceLog: (id: string, updates: Partial<MaintenanceLog>) => void;
  refreshEquipment: () => Promise<void>;

  // Inventory
  bulkUpsertStock: (items: Partial<StockItem>[]) => void;

  // Menu Categories
  menuCategories: MenuCategory[];
  addMenuCategory: (category: Omit<MenuCategory, 'id' | 'createdAt'>) => void;
  updateMenuCategory: (id: string, updates: Partial<MenuCategory>) => void;
  deleteMenuCategory: (id: string) => void;
  getActiveCategories: () => MenuCategory[];

  // Payment Methods
  paymentMethods: PaymentMethodConfig[];
  addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id' | 'createdAt'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
  getEnabledPaymentMethods: () => PaymentMethodConfig[];

  // Tax Rates
  taxRates: TaxRate[];
  addTaxRate: (rate: Omit<TaxRate, 'id' | 'createdAt'>) => void;
  updateTaxRate: (id: string, updates: Partial<TaxRate>) => void;
  deleteTaxRate: (id: string) => void;
  getDefaultTaxRate: () => TaxRate | undefined;
  getActiveTaxRates: () => TaxRate[];

  // Cash Register (Shift)
  cashRegisters: CashRegister[]; // History of registers
  currentRegister: CashRegister | null; // Currently open register
  openRegister: (startCash: number, staffId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  closeRegister: (actualCash: number, staffId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;

  checkRegisterStatus: (staffId: string) => void;
  refreshCashRegisters: () => Promise<void>;

  // Utility
  isInitialized: boolean;
}

const StoreContext = createContext<StoreState | null>(null);

// Helper to safely access localStorage
const getFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Inventory state
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);

  // Staff state
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Production logs state
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);

  // Delivery orders state
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);

  // Finance state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashFlows, setCashFlows] = useState<DailyCashFlow[]>([]);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Supplier state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Recipe state
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Shift & Schedule state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  // Promotion state
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifierOptions, setModifierOptions] = useState<ModifierOption[]>([]);

  // KPI & Gamification state
  const [staffKPI, setStaffKPI] = useState<StaffKPI[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [otRecords, setOTRecords] = useState<OTRecord[]>([]);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);

  // Staff Portal state
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistItemTemplate[]>([]);
  const [checklistCompletions, setChecklistCompletions] = useState<ChecklistCompletion[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [otClaims, setOTClaims] = useState<OTClaim[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [staffTraining, setStaffTraining] = useState<StaffTraining[]>([]);
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Order History & Void/Refund state
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [voidRefundRequests, setVoidRefundRequests] = useState<VoidRefundRequest[]>([]);

  // Oil Tracker / Equipment state
  const [oilTrackers, setOilTrackers] = useState<OilTracker[]>([]);
  const [oilChangeRequests, setOilChangeRequests] = useState<OilChangeRequest[]>([]);
  const [oilActionHistory, setOilActionHistory] = useState<OilActionHistory[]>([]);

  // Equipment & Maintenance state
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);

  // Menu Categories, Payment Methods, Tax Rates state
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);

  // Cash Register state
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);

  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);

  // Weather State
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);

  // Fetch weather on mount
  useEffect(() => {
    getNextDayForecast().then(forecast => {
      if (forecast) {
        console.log('[Weather] Forecast loaded:', forecast.description);
        setWeatherForecast(forecast);
      }
    });
  }, []);

  // Initialize from Supabase first, fallback to localStorage
  useEffect(() => {
    const initializeData = async () => {
      // Check if Supabase is configured
      const supabaseConfigured = isSupabaseConfigured();
      let supabaseConnected = false;

      if (supabaseConfigured) {
        // Verify connection is actually working
        const connectionCheck = await checkSupabaseConnection();
        supabaseConnected = connectionCheck.connected;

        if (!supabaseConnected) {
          console.warn('[Data Init] Supabase configured but connection failed:', connectionCheck.error);
          logSyncError('initial_load', 'unknown', connectionCheck.error || 'Connection failed');
        } else {
          console.log('[Data Init] Supabase connection verified');
        }
      } else {
        console.warn('[Data Init] Supabase not configured - using offline mode');
      }

      // Try to load from Supabase first
      const supabaseData = await SupabaseSync.loadAllDataFromSupabase();

      // IMPORTANT: Improved fallback logic
      // - If Supabase is connected and returns data (even empty), use it (trust the source)
      // - If Supabase is NOT connected, prefer localStorage over mock data
      // - Only use mock data for first-time installations (no localStorage data exists)

      // Helper function to determine data source
      const getDataWithSource = <T,>(
        supabaseArr: T[] | undefined,
        storageKey: string,
        mockData: T[],
        entityName: string
      ): { data: T[]; source: DataSource } => {
        // If Supabase is connected and returns data (even empty), trust the source
        if (supabaseConnected && supabaseArr !== undefined) {
          if (supabaseArr.length > 0) {
            console.log(`[Data Init] ${entityName}: Loaded ${supabaseArr.length} items from Supabase`);
            return { data: supabaseArr, source: 'supabase' };
          }
          // Supabase connected but empty - check if localStorage has data
          const localData = getFromStorage<T[]>(storageKey, []);
          if (localData.length > 0) {
            // User has local data but Supabase is empty - this might be a migration scenario
            console.log(`[Data Init] ${entityName}: Supabase empty, using ${localData.length} items from localStorage`);
            return { data: localData, source: 'localStorage' };
          }
          // Both empty - return empty (not mock data!)
          console.log(`[Data Init] ${entityName}: No data in Supabase or localStorage`);
          return { data: [], source: 'supabase' };
        }

        // Supabase not connected - try localStorage first
        const localData = getFromStorage<T[]>(storageKey, []);
        if (localData.length > 0) {
          console.log(`[Data Init] ${entityName}: Loaded ${localData.length} items from localStorage (Supabase offline)`);
          return { data: localData, source: 'localStorage' };
        }

        // No localStorage data - check if this is first install (use mock) or data loss
        // Only use mock data if localStorage is completely empty (first install scenario)
        const hasAnyLocalData = typeof window !== 'undefined' && localStorage.getItem(storageKey) !== null;
        if (!hasAnyLocalData && mockData.length > 0) {
          console.log(`[Data Init] ${entityName}: First install - using ${mockData.length} mock items`);
          return { data: mockData, source: 'mock' };
        }

        console.log(`[Data Init] ${entityName}: No data available`);
        return { data: [], source: 'localStorage' };
      };

      // Update data source tracking
      dataSourceInfo.supabaseConnected = supabaseConnected;
      dataSourceInfo.lastLoadTime = new Date();

      // Core data with proper source tracking
      const inventoryResult = getDataWithSource(supabaseData.inventory, STORAGE_KEYS.INVENTORY, MOCK_STOCK, 'Inventory');
      setInventory(inventoryResult.data);
      dataSourceInfo.inventory = inventoryResult.source;

      const staffResult = getDataWithSource(supabaseData.staff, STORAGE_KEYS.STAFF, MOCK_STAFF, 'Staff');
      setStaff(staffResult.data);
      dataSourceInfo.staff = staffResult.source;

      const menuResult = getDataWithSource(supabaseData.menuItems, STORAGE_KEYS.MENU_ITEMS, MOCK_MENU, 'Menu Items');
      setMenuItems(menuResult.data);
      dataSourceInfo.menuItems = menuResult.source;

      const modGroupResult = getDataWithSource(supabaseData.modifierGroups, STORAGE_KEYS.MODIFIER_GROUPS, MOCK_MODIFIER_GROUPS, 'Modifier Groups');
      setModifierGroups(modGroupResult.data);
      dataSourceInfo.modifierGroups = modGroupResult.source;

      const modOptResult = getDataWithSource(supabaseData.modifierOptions, STORAGE_KEYS.MODIFIER_OPTIONS, MOCK_MODIFIER_OPTIONS, 'Modifier Options');
      setModifierOptions(modOptResult.data);
      dataSourceInfo.modifierOptions = modOptResult.source;

      const ordersResult = getDataWithSource(supabaseData.orders, STORAGE_KEYS.ORDERS, [], 'Orders');
      setOrders(ordersResult.data);
      dataSourceInfo.orders = ordersResult.source;

      // Other core data (using simplified logic for non-critical entities)
      setCustomers(supabaseConnected && supabaseData.customers?.length > 0 ? supabaseData.customers : getFromStorage(STORAGE_KEYS.CUSTOMERS, []));
      setExpenses(supabaseConnected && supabaseData.expenses?.length > 0 ? supabaseData.expenses : getFromStorage(STORAGE_KEYS.EXPENSES, MOCK_EXPENSES));
      setAttendance(supabaseConnected && supabaseData.attendance?.length > 0 ? supabaseData.attendance : getFromStorage(STORAGE_KEYS.ATTENDANCE, MOCK_ATTENDANCE));
      setSuppliers(supabaseConnected && supabaseData.suppliers?.length > 0 ? supabaseData.suppliers : getFromStorage(STORAGE_KEYS.SUPPLIERS, []));
      setPurchaseOrders(supabaseConnected && supabaseData.purchaseOrders?.length > 0 ? supabaseData.purchaseOrders : getFromStorage(STORAGE_KEYS.PURCHASE_ORDERS, []));

      // Extended data - now also from Supabase (using supabaseConnected flag for consistency)
      setInventoryLogs(getFromStorage(STORAGE_KEYS.INVENTORY_LOGS, [])); // TODO: Add to Supabase later

      // Load Cash Registers
      const registersResult = getDataWithSource(supabaseData.cashRegisters as CashRegister[], STORAGE_KEYS.CASH_REGISTERS, [], 'Cash Registers');
      setCashRegisters(registersResult.data);

      // Check for open register
      const openReg = registersResult.data.find((r: CashRegister) => r.status === 'open');
      if (openReg) {
        console.log('[Data Init] Found open register session:', openReg.id);
        setCurrentRegister(openReg);
      }

      setProductionLogs(supabaseConnected && supabaseData.productionLogs?.length > 0 ? supabaseData.productionLogs : getFromStorage(STORAGE_KEYS.PRODUCTION_LOGS, MOCK_PRODUCTION_LOGS));
      setDeliveryOrders(supabaseConnected && supabaseData.deliveryOrders?.length > 0 ? supabaseData.deliveryOrders : getFromStorage(STORAGE_KEYS.DELIVERY_ORDERS, MOCK_DELIVERY_ORDERS));
      setCashFlows(supabaseConnected && supabaseData.cashFlows?.length > 0 ? supabaseData.cashFlows : getFromStorage(STORAGE_KEYS.CASH_FLOWS, MOCK_CASH_FLOWS));
      setRecipes(supabaseConnected && supabaseData.recipes?.length > 0 ? supabaseData.recipes : getFromStorage(STORAGE_KEYS.RECIPES, []));
      setShifts(supabaseConnected && supabaseData.shifts?.length > 0 ? supabaseData.shifts : getFromStorage(STORAGE_KEYS.SHIFTS, MOCK_SHIFTS));

      // Load schedules from Supabase or check if local needs refreshing
      const supabaseSchedules = supabaseData.schedules || [];
      if (supabaseConnected && supabaseSchedules.length > 0) {
        setSchedules(supabaseSchedules);
      } else {
        const loadedSchedules = getFromStorage(STORAGE_KEYS.SCHEDULES, MOCK_SCHEDULES);
        const today = new Date().toISOString().split('T')[0];
        const hasToday = loadedSchedules.some((s: ScheduleEntry) => s.date === today);

        if (!hasToday && loadedSchedules.length > 0) {
          console.log('[Schedule Refresh] Stale schedules detected, regenerating...');
          const freshSchedules = generateMockSchedules();
          setSchedules(freshSchedules);
          setToStorage(STORAGE_KEYS.SCHEDULES, freshSchedules);
        } else {
          setSchedules(loadedSchedules);
        }
      }

      setPromotions(supabaseConnected && supabaseData.promotions?.length > 0 ? supabaseData.promotions : getFromStorage(STORAGE_KEYS.PROMOTIONS, []));
      setNotifications(supabaseConnected && supabaseData.notifications?.length > 0 ? supabaseData.notifications : getFromStorage(STORAGE_KEYS.NOTIFICATIONS, []));

      // KPI & Gamification
      setStaffKPI(supabaseConnected && supabaseData.staffKPI?.length > 0 ? supabaseData.staffKPI : getFromStorage(STORAGE_KEYS.STAFF_KPI, MOCK_STAFF_KPI));
      setLeaveRecords(supabaseConnected && supabaseData.leaveRecords?.length > 0 ? supabaseData.leaveRecords : getFromStorage(STORAGE_KEYS.LEAVE_RECORDS, MOCK_LEAVE_RECORDS));
      setTrainingRecords(supabaseConnected && supabaseData.trainingRecords?.length > 0 ? supabaseData.trainingRecords : getFromStorage(STORAGE_KEYS.TRAINING_RECORDS, MOCK_TRAINING_RECORDS));
      setOTRecords(supabaseConnected && supabaseData.otRecords?.length > 0 ? supabaseData.otRecords : getFromStorage(STORAGE_KEYS.OT_RECORDS, MOCK_OT_RECORDS));
      setCustomerReviews(supabaseConnected && supabaseData.customerReviews?.length > 0 ? supabaseData.customerReviews : getFromStorage(STORAGE_KEYS.CUSTOMER_REVIEWS, MOCK_CUSTOMER_REVIEWS));

      // Staff Portal
      setChecklistTemplates(supabaseConnected && supabaseData.checklistTemplates?.length > 0 ? supabaseData.checklistTemplates : getFromStorage(STORAGE_KEYS.CHECKLIST_TEMPLATES, MOCK_CHECKLIST_TEMPLATES));
      setChecklistCompletions(supabaseConnected && supabaseData.checklistCompletions?.length > 0 ? supabaseData.checklistCompletions : getFromStorage(STORAGE_KEYS.CHECKLIST_COMPLETIONS, MOCK_CHECKLIST_COMPLETIONS));
      setLeaveBalances(supabaseConnected && supabaseData.leaveBalances?.length > 0 ? supabaseData.leaveBalances : getFromStorage(STORAGE_KEYS.LEAVE_BALANCES, MOCK_LEAVE_BALANCES));
      setLeaveRequests(supabaseConnected && supabaseData.leaveRequests?.length > 0 ? supabaseData.leaveRequests : getFromStorage(STORAGE_KEYS.LEAVE_REQUESTS, MOCK_LEAVE_REQUESTS));
      setClaimRequests(supabaseConnected && supabaseData.claimRequests?.length > 0 ? supabaseData.claimRequests : getFromStorage(STORAGE_KEYS.CLAIM_REQUESTS, MOCK_CLAIM_REQUESTS));
      setOTClaims(getFromStorage(STORAGE_KEYS.OT_CLAIMS, []));
      setSalaryAdvances(getFromStorage(STORAGE_KEYS.SALARY_ADVANCES, []));
      setDisciplinaryActions(getFromStorage(STORAGE_KEYS.DISCIPLINARY_ACTIONS, []));
      setStaffTraining(getFromStorage(STORAGE_KEYS.STAFF_TRAINING, []));
      setStaffRequests(supabaseConnected && supabaseData.staffRequests?.length > 0 ? supabaseData.staffRequests : getFromStorage(STORAGE_KEYS.STAFF_REQUESTS, MOCK_STAFF_REQUESTS));
      setAnnouncements(supabaseConnected && supabaseData.announcements?.length > 0 ? supabaseData.announcements : getFromStorage(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS));

      // Order History (void refund uses orders table)
      setOrderHistory(getFromStorage(STORAGE_KEYS.ORDER_HISTORY, MOCK_ORDER_HISTORY));

      // Load Void Refund Requests from Supabase
      if (supabaseConnected) {
        try {
          const voidRefundData = await VoidRefundOps.fetchVoidRefundRequests();
          // Trust Supabase data if it exists (even if empty array)
          if (Array.isArray(voidRefundData)) {
            setVoidRefundRequests(voidRefundData);
          } else {
            setVoidRefundRequests(getFromStorage(STORAGE_KEYS.VOID_REFUND_REQUESTS, MOCK_VOID_REFUND_REQUESTS));
          }
        } catch (error) {
          console.error('Failed to load void refund requests from Supabase:', error);
          setVoidRefundRequests(getFromStorage(STORAGE_KEYS.VOID_REFUND_REQUESTS, MOCK_VOID_REFUND_REQUESTS));
        }
      } else {
        setVoidRefundRequests(getFromStorage(STORAGE_KEYS.VOID_REFUND_REQUESTS, MOCK_VOID_REFUND_REQUESTS));
      }

      // Oil Trackers / Equipment
      // Oil Tracker Data
      setOilTrackers(supabaseConnected && supabaseData.oilTrackers?.length > 0 ? supabaseData.oilTrackers : getFromStorage(STORAGE_KEYS.OIL_TRACKERS, MOCK_OIL_TRACKERS));

      // Equipment & Maintenance Data
      // For now, load empty or waiting for implementation of MOCK data if needed
      setEquipment(getFromStorage(STORAGE_KEYS.EQUIPMENT, []));
      setMaintenanceSchedules(getFromStorage(STORAGE_KEYS.MAINTENANCE_SCHEDULE, []));
      setMaintenanceLogs(getFromStorage(STORAGE_KEYS.MAINTENANCE_LOGS, []));
      setOilChangeRequests(supabaseConnected && supabaseData.oilChangeRequests?.length > 0 ? supabaseData.oilChangeRequests : getFromStorage(STORAGE_KEYS.OIL_CHANGE_REQUESTS, []));
      setOilActionHistory(supabaseConnected && supabaseData.oilActionHistory?.length > 0 ? supabaseData.oilActionHistory : getFromStorage(STORAGE_KEYS.OIL_ACTION_HISTORY, []));

      // Menu Categories, Payment Methods, Tax Rates
      // Load Menu Categories from Supabase
      if (supabaseConnected) {
        const menuCategoriesResult = await PaymentTaxSync.getAllMenuCategories();
        if (menuCategoriesResult.success && menuCategoriesResult.data && menuCategoriesResult.data.length > 0) {
          setMenuCategories(menuCategoriesResult.data);
        } else {
          setMenuCategories(getFromStorage(STORAGE_KEYS.MENU_CATEGORIES, DEFAULT_MENU_CATEGORIES));
        }
      } else {
        setMenuCategories(getFromStorage(STORAGE_KEYS.MENU_CATEGORIES, DEFAULT_MENU_CATEGORIES));
      }

      // Load Payment Methods from Supabase
      if (supabaseConnected) {
        const paymentMethodsResult = await PaymentTaxSync.getAllPaymentMethods();
        if (paymentMethodsResult.success && paymentMethodsResult.data && paymentMethodsResult.data.length > 0) {
          setPaymentMethods(paymentMethodsResult.data);
        } else {
          setPaymentMethods(getFromStorage(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS));
        }
      } else {
        setPaymentMethods(getFromStorage(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS));
      }

      // Load Tax Rates from Supabase
      if (supabaseConnected) {
        const taxRatesResult = await PaymentTaxSync.getAllTaxRates();
        if (taxRatesResult.success && taxRatesResult.data && taxRatesResult.data.length > 0) {
          setTaxRates(taxRatesResult.data);
        } else {
          setTaxRates(getFromStorage(STORAGE_KEYS.TAX_RATES, DEFAULT_TAX_RATES));
        }
      } else {
        setTaxRates(getFromStorage(STORAGE_KEYS.TAX_RATES, DEFAULT_TAX_RATES));
      }

      // Log initialization summary
      const sourceInfo = supabaseConnected ? 'Supabase (primary)' : 'localStorage (offline mode)';
      console.log(`[Data Init] Complete - Source: ${sourceInfo}`);
      console.log('[Data Init] Data sources:', dataSourceInfo);

      if (supabaseConnected) {
        logSyncSuccess('initial_load', 'unknown');
      }

      setIsInitialized(true);
    };

    initializeData();
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    // Only subscribe if Supabase is configured
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    console.log('[Realtime] Setting up subscriptions...');

    const channels: RealtimeChannel[] = [];

    // Generic subscription helper
    const subscribeToTable = <T extends { id: string }>(
      tableName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const channel = supabase.channel(`${tableName}_global_sync`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
          // console.log(`[Realtime] ${tableName} event:`, payload.eventType);

          if (payload.eventType === 'INSERT') {
            const newItem = VoidRefundOps.toCamelCase(payload.new) as T;
            setter(prev => [...prev, newItem]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = VoidRefundOps.toCamelCase(payload.new) as T;
            setter(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setter(prev => prev.filter(item => item.id !== deletedId));
          }
        })
        .subscribe();
      channels.push(channel);
    };

    // Subscriptions
    subscribeToTable('orders', setOrders);
    subscribeToTable('inventory', setInventory);
    subscribeToTable('staff', setStaff);
    subscribeToTable('attendance', setAttendance);
    subscribeToTable('menu_items', setMenuItems);
    subscribeToTable('shifts', setShifts);
    subscribeToTable('schedules', setSchedules);
    subscribeToTable('customers', setCustomers);
    subscribeToTable('checklist_templates', setChecklistTemplates);
    subscribeToTable('checklist_completions', setChecklistCompletions);
    subscribeToTable('leave_requests', setLeaveRequests);
    subscribeToTable('claim_requests', setClaimRequests);
    subscribeToTable('staff_requests', setStaffRequests);
    subscribeToTable('staff_kpi', setStaffKPI);
    subscribeToTable('announcements', setAnnouncements);

    // Cleanup
    return () => {
      console.log('[Realtime] Cleaning up subscriptions...');
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.INVENTORY, inventory);
    }
  }, [inventory, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.INVENTORY_LOGS, inventoryLogs);
    }
  }, [inventoryLogs, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.STAFF, staff);
    }
  }, [staff, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
    }
  }, [attendance, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.ORDERS, orders);
    }
  }, [orders, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.PRODUCTION_LOGS, productionLogs);
    }
  }, [productionLogs, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.DELIVERY_ORDERS, deliveryOrders);
    }
  }, [deliveryOrders, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.EXPENSES, expenses);
    }
  }, [expenses, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CASH_FLOWS, cashFlows);
    }
  }, [cashFlows, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }
  }, [customers, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    }
  }, [suppliers, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.PURCHASE_ORDERS, purchaseOrders);
    }
  }, [purchaseOrders, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.RECIPES, recipes);
    }
  }, [recipes, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.SHIFTS, shifts);
    }
  }, [shifts, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.SCHEDULES, schedules);
    }
  }, [schedules, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.PROMOTIONS, promotions);
    }
  }, [promotions, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  }, [notifications, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.MENU_ITEMS, menuItems);
    }
  }, [menuItems, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.MODIFIER_GROUPS, modifierGroups);
    }
  }, [modifierGroups, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.MODIFIER_OPTIONS, modifierOptions);
    }
  }, [modifierOptions, isInitialized]);

  // KPI persistence
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.STAFF_KPI, staffKPI);
    }
  }, [staffKPI, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.LEAVE_RECORDS, leaveRecords);
    }
  }, [leaveRecords, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.TRAINING_RECORDS, trainingRecords);
    }
  }, [trainingRecords, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.OT_RECORDS, otRecords);
    }
  }, [otRecords, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CUSTOMER_REVIEWS, customerReviews);
    }
  }, [customerReviews, isInitialized]);

  // Staff Portal persistence
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CHECKLIST_TEMPLATES, checklistTemplates);
    }
  }, [checklistTemplates, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CHECKLIST_COMPLETIONS, checklistCompletions);
    }
  }, [checklistCompletions, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.LEAVE_BALANCES, leaveBalances);
    }
  }, [leaveBalances, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.LEAVE_REQUESTS, leaveRequests);
    }
  }, [leaveRequests, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CLAIM_REQUESTS, claimRequests);
    }
  }, [claimRequests, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.STAFF_REQUESTS, staffRequests);
    }
  }, [staffRequests, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
    }
  }, [announcements, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.ORDER_HISTORY, orderHistory);
    }
  }, [orderHistory, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.VOID_REFUND_REQUESTS, voidRefundRequests);
    }
  }, [voidRefundRequests, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.OIL_TRACKERS, oilTrackers);
    }
  }, [oilTrackers, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.OIL_CHANGE_REQUESTS, oilChangeRequests);
    }
  }, [oilChangeRequests, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.OIL_ACTION_HISTORY, oilActionHistory);
    }
  }, [oilActionHistory, isInitialized]);

  // Menu Categories persistence
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.MENU_CATEGORIES, menuCategories);
    }
  }, [menuCategories, isInitialized]);

  // Payment Methods persistence
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.PAYMENT_METHODS, paymentMethods);
    }
  }, [paymentMethods, isInitialized]);

  // Tax Rates persistence
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.TAX_RATES, taxRates);
    }
  }, [taxRates, isInitialized]);

  // Cash Registers persistence
  useEffect(() => {
    if (isInitialized) {
      setToStorage(STORAGE_KEYS.CASH_REGISTERS, cashRegisters);
    }
  }, [cashRegisters, isInitialized]);

  // Inventory actions
  const addStockItem = useCallback(async (item: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...item,
      id: generateUUID(),
    };

    // Sync to Supabase
    try {
      const supabaseItem = await SupabaseSync.syncAddStockItem(newItem);
      if (supabaseItem && supabaseItem.id) {
        // Use Supabase-generated ID if available
        newItem.id = supabaseItem.id;
      }
    } catch (error) {
      console.error('Failed to sync to Supabase, saving locally:', error);
    }

    setInventory(prev => [...prev, newItem]);

    // Add initial log
    const log: InventoryLog = {
      id: generateUUID(),
      stockItemId: newItem.id,
      stockItemName: newItem.name,
      type: 'initial',
      quantity: newItem.currentQuantity,
      previousQuantity: 0,
      newQuantity: newItem.currentQuantity,
      reason: 'Stok baru ditambah',
      createdAt: new Date().toISOString(),
    };
    setInventoryLogs(prev => [log, ...prev]);
  }, []);

  const updateStockItem = useCallback(async (id: string, updates: Partial<StockItem>) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncUpdateStockItem(id, updates);
    } catch (error) {
      console.error('Failed to sync update to Supabase:', error);
    }

    setInventory(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteStockItem = useCallback(async (id: string) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncDeleteStockItem(id);
    } catch (error) {
      console.error('Failed to sync delete to Supabase:', error);
    }

    setInventory(prev => prev.filter(item => item.id !== id));
  }, []);

  const adjustStock = useCallback((id: string, quantity: number, type: 'in' | 'out', reason: string) => {
    setInventory(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      const previousQuantity = item.currentQuantity;
      const newQuantity = type === 'in'
        ? previousQuantity + quantity
        : Math.max(0, previousQuantity - quantity);

      // Add log
      const log: InventoryLog = {
        id: generateUUID(),
        stockItemId: id,
        stockItemName: item.name,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        reason,
        createdAt: new Date().toISOString(),
      };
      setInventoryLogs(prevLogs => [log, ...prevLogs]);

      // Sync log to Supabase
      SupabaseSync.syncAddInventoryLog(log).catch(err =>
        console.error('Failed to sync log:', err)
      );

      return prev.map(i =>
        i.id === id ? { ...i, currentQuantity: newQuantity } : i
      );
    });
  }, []);

  const bulkUpsertStock = useCallback((items: Partial<StockItem>[]) => {
    setInventory(prev => {
      const newInventory = [...prev];
      items.forEach(item => {
        if (!item.name) return;
        const existingIndex = newInventory.findIndex(i => i.name.toLowerCase() === item.name?.toLowerCase()); // Match by name loosely
        if (existingIndex >= 0) {
          newInventory[existingIndex] = { ...newInventory[existingIndex], ...item, updatedAt: new Date().toISOString() };
          // Sync update to Supabase
          SupabaseSync.syncUpdateStockItem(newInventory[existingIndex].id, item).catch(err => console.error('Failed to sync bulk update:', err));
        } else {
          const newItem: StockItem = {
            id: generateUUID(),
            name: item.name!,
            category: item.category || 'other',
            currentQuantity: item.currentQuantity || 0,
            unit: item.unit || 'unit',
            minQuantity: item.minQuantity || 10,
            cost: item.cost || 0,
            supplier: item.supplier,
            lastRestockDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newInventory.push(newItem);
          // Sync add to Supabase
          SupabaseSync.syncAddStockItem(newItem).catch(err => console.error('Failed to sync bulk add:', err));
        }
      });
      return newInventory;
    });
  }, []);

  // Staff actions
  const addStaff = useCallback(async (staffData: Omit<StaffProfile, 'id'>) => {
    const newStaff: StaffProfile = {
      ...staffData,
      id: generateUUID(),
    };

    // Sync to Supabase
    try {
      const supabaseStaff = await SupabaseSync.syncAddStaff(newStaff);
      if (supabaseStaff && supabaseStaff.id) {
        newStaff.id = supabaseStaff.id;
      }
    } catch (error) {
      console.error('Failed to sync staff to Supabase:', error);
    }

    setStaff(prev => [...prev, newStaff]);
  }, []);

  const updateStaff = useCallback(async (id: string, updates: Partial<StaffProfile>) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncUpdateStaff(id, updates);
    } catch (error) {
      console.error('Failed to sync staff update to Supabase:', error);
    }

    setStaff(prev => prev.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ));
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncDeleteStaff(id);
    } catch (error) {
      console.error('Failed to sync staff delete to Supabase:', error);
    }

    setStaff(prev => prev.filter(s => s.id !== id));
  }, []);

  const getStaffAttendanceToday = useCallback((staffId: string): AttendanceRecord | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.staffId === staffId && a.date === today);
  }, [attendance]);

  const clockIn = useCallback(async (staffId: string, pin: string, photo?: Blob, latitude?: number, longitude?: number): Promise<{ success: boolean; message: string }> => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) {
      return { success: false, message: 'Staf tidak dijumpai' };
    }

    if (staffMember.pin !== pin) {
      return { success: false, message: 'PIN salah' };
    }

    if (staffMember.status !== 'active') {
      return { success: false, message: 'Staf tidak aktif' };
    }

    const today = new Date().toISOString().split('T')[0];
    const existingRecord = attendance.find(a => a.staffId === staffId && a.date === today);

    if (existingRecord && existingRecord.clockInTime && !existingRecord.clockOutTime) {
      return { success: false, message: 'Sudah clock in hari ini' };
    }

    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Use Supabase Sync if available and photo/location provided
    if (isSupabaseConfigured() && photo && latitude && longitude) {
      try {
        const syncResult = await SupabaseSync.clockIn({
          staff_id: staffId, // Note: snake_case for sync layer
          latitude,
          longitude,
          selfie_file: photo as File
        });

        if (syncResult.success && syncResult.data) {
          // Update local state with the verified record
          const newRecord: AttendanceRecord = {
            id: syncResult.data.id,
            staffId: syncResult.data.staff_id,
            date: syncResult.data.date,
            clockInTime: syncResult.data.clock_in ? new Date(syncResult.data.clock_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : now,
            clockOutTime: undefined,
            breakDuration: 0,
            photoProofUrl: syncResult.data.selfie_url || undefined,
            locationVerified: syncResult.data.location_verified,
          };
          setAttendance(prev => [...prev, newRecord]);
          return { success: true, message: `Clock in berjaya di ${syncResult.location_name || 'Lokasi'}` };
        } else {
          // Return specific error from sync layer (e.g. "Outside allowed radius")
          return { success: false, message: syncResult.error || 'Gagal clock in' };
        }
      } catch (err) {
        console.error('Supabase clock-in failed', err);
        // Fallback to local logic below if sync fails (optional, maybe strict mode shouldn't fallback?)
        // For now, let's allow fallback but warn
      }
    }

    const newRecord: AttendanceRecord = {
      id: generateUUID(),
      staffId,
      date: today,
      clockInTime: now,
      clockOutTime: undefined,
      breakDuration: 0,
      photoProofUrl: photo ? URL.createObjectURL(photo) : undefined, // Temporary local URL
      locationVerified: false // Not verified
    };

    setAttendance(prev => [...prev, newRecord]);
    return { success: true, message: `Clock in berjaya pada ${now} (Offline/Local)` };
  }, [staff, attendance]);

  const clockOut = useCallback(async (staffId: string, pin?: string, photo?: Blob, latitude?: number, longitude?: number): Promise<{ success: boolean; message: string }> => {
    const today = new Date().toISOString().split('T')[0];
    const record = attendance.find(a => a.staffId === staffId && a.date === today && a.clockInTime && !a.clockOutTime);

    if (!record) {
      return { success: false, message: 'Tiada rekod clock in hari ini' };
    }

    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Supabase Sync
    if (isSupabaseConfigured() && photo && latitude && longitude) {
      try {
        const syncResult = await SupabaseSync.clockOut({
          attendance_id: record.id,
          staff_id: staffId,
          latitude,
          longitude,
          selfie_file: photo as File
        });

        if (syncResult.success) {
          setAttendance(prev => prev.map(a =>
            a.id === record.id ? { ...a, clockOutTime: now } : a
          ));
          return { success: true, message: 'Clock out berjaya' };
        } else {
          return { success: false, message: syncResult.error || 'Gagal clock out' };
        }
      } catch (err) {
        console.error('Supabase clock-out failed', err);
      }
    }

    setAttendance(prev => prev.map(a =>
      a.id === record.id ? { ...a, clockOutTime: now } : a
    ));

    return { success: true, message: `Clock out berjaya pada ${now}` };
  }, [attendance]);

  // Customer Loyalty Actions (Moved here for dependency access in addOrder)
  const addLoyaltyPoints = useCallback((customerId: string, points: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const newPoints = c.loyaltyPoints + points;
        const newSegment = newPoints >= 500 ? 'vip' : newPoints >= 100 ? 'regular' : 'new';
        return { ...c, loyaltyPoints: newPoints, segment: newSegment };
      }
      return c;
    }));
  }, []);

  const redeemLoyaltyPoints = useCallback((customerId: string, points: number): boolean => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.loyaltyPoints < points) return false;
    setCustomers(prev => prev.map(c =>
      c.id === customerId ? { ...c, loyaltyPoints: c.loyaltyPoints - points } : c
    ));
    return true;
  }, [customers]);

  // Order actions
  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'orderNumber'>): Promise<Order> => {
    const timestamp = Date.now();

    // Get order prefix from localStorage (default to 'ORD')
    const orderPrefix = typeof window !== 'undefined'
      ? localStorage.getItem('orderNumberPrefix') || 'ORD'
      : 'ORD';

    const newOrder: Order = {
      ...orderData,
      id: generateUUID(),
      orderNumber: `${orderPrefix}-${timestamp.toString().slice(-6)}`,
    };

    // Sync to Supabase
    try {
      const supabaseOrder = await SupabaseSync.syncAddOrder(newOrder);
      if (supabaseOrder && supabaseOrder.id) {
        newOrder.id = supabaseOrder.id;
      }
    } catch (error) {
      console.error('Failed to sync order to Supabase:', error);
    }

    setOrders(prev => [newOrder, ...prev]);

    // Also add to orderHistory for Order History page
    const historyItem: OrderHistoryItem = {
      ...newOrder,
      voidRefundStatus: 'none',
      refundAmount: 0,
    };
    setOrderHistory(prev => [historyItem, ...prev]);

    // AUTOMATIC INVENTORY DEDUCTION LOGIC
    // Check if ordered items have recipes and deduct ingredients from inventory
    if (recipes.length > 0 && inventory.length > 0) {
      const inventoryUpdates = new Map<string, number>();

      newOrder.items.forEach(cartItem => {
        // Find recipe for this item
        const recipe = recipes.find(r => r.menuItemId === cartItem.id);

        if (recipe) {
          console.log(`[Inventory] Deducting ingredients for ${cartItem.name} (Recipe found)`);

          recipe.ingredients.forEach(ingredient => {
            const currentDeduction = inventoryUpdates.get(ingredient.stockItemId) || 0;
            // Total deduction = ingredient quantity per item * item quantity in cart
            const deductionAmount = ingredient.quantity * cartItem.quantity;
            inventoryUpdates.set(ingredient.stockItemId, currentDeduction + deductionAmount);
          });
        }

        // Deduct Modifier Ingredients
        if (cartItem.selectedModifiers && cartItem.selectedModifiers.length > 0) {
          cartItem.selectedModifiers.forEach((mod: any) => {
            const modifierOption = modifierOptions.find(m => m.id === mod.id);
            if (modifierOption && modifierOption.ingredients && modifierOption.ingredients.length > 0) {
              console.log(`[Inventory] Deducting ingredients for modifier ${modifierOption.name}`);
              modifierOption.ingredients.forEach(ingredient => {
                const currentDeduction = inventoryUpdates.get(ingredient.stockItemId) || 0;
                const deductionAmount = ingredient.quantity * cartItem.quantity;
                inventoryUpdates.set(ingredient.stockItemId, currentDeduction + deductionAmount);
              });
            }
          });
        }
      });

      // Apply updates if any
      if (inventoryUpdates.size > 0) {
        setInventory(prevInventory => {
          return prevInventory.map(stockItem => {
            const deduction = inventoryUpdates.get(stockItem.id);
            if (deduction) {
              const newQuantity = stockItem.currentQuantity - deduction;
              console.log(`[Inventory] Updating ${stockItem.name}: ${stockItem.currentQuantity} -> ${newQuantity}`);

              // Sync to Supabase
              SupabaseSync.syncUpdateStockItem(stockItem.id, {
                currentQuantity: newQuantity
              }).catch(err => console.error('Failed to sync inventory deduction:', err));

              return { ...stockItem, currentQuantity: newQuantity };
            }
            return stockItem;
          });
        });
      }
    }



    // LOYALTY SYSTEM: Redemption and Earning
    if (newOrder.customerId) {
      // 1. Deduct Redeemed Points
      if (newOrder.redeemedPoints && newOrder.redeemedPoints > 0) {
        redeemLoyaltyPoints(newOrder.customerId, newOrder.redeemedPoints);
        console.log(`[Loyalty] Redeemed ${newOrder.redeemedPoints} points from customer ${newOrder.customerId}`);
      }

      // 2. Award Points on Net Spend (Total - Redemption)
      // Policy: 1 Point = $1 spend
      const redemptionValue = newOrder.redemptionAmount || 0;
      const netTotal = Math.max(0, newOrder.total - redemptionValue);
      const pointsToEarn = Math.floor(netTotal);

      if (pointsToEarn > 0) {
        addLoyaltyPoints(newOrder.customerId, pointsToEarn);
        console.log(`[Loyalty] Awarded ${pointsToEarn} points to customer ${newOrder.customerId} (Net Spend: $${netTotal.toFixed(2)})`);
      }
    }

    return newOrder;
  }, [recipes, inventory, addLoyaltyPoints, redeemLoyaltyPoints]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], staffId?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const updates: Partial<Order> = { status };
      const now = new Date().toISOString();

      // Record timestamps based on status change
      if (status === 'preparing') {
        updates.preparingStartedAt = now;
        if (staffId) updates.preparedByStaffId = staffId;
      } else if (status === 'ready') {
        updates.readyAt = now;
        // Keep preparedByStaffId if already set, or set it now
        if (staffId && !order.preparedByStaffId) updates.preparedByStaffId = staffId;
      }

      // Sync to Supabase
      SupabaseSync.syncUpdateOrder(orderId, updates).catch(error => {
        console.error('Failed to sync order update to Supabase:', error);
      });

      return { ...order, ...updates };
    }));
  }, []);

  const getTodayOrders = useCallback((): Order[] => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(order => order.createdAt.startsWith(today));
  }, [orders]);

  // Refresh orders from Supabase (for realtime sync)
  const refreshOrders = useCallback(async () => {
    try {
      const supabaseOrders = await SupabaseSync.loadOrdersFromSupabase(500);
      if (supabaseOrders && supabaseOrders.length > 0) {
        setOrders(supabaseOrders);
        console.log('[Realtime] Orders refreshed from Supabase:', supabaseOrders.length);
      }
    } catch (error) {
      console.error('Failed to refresh orders from Supabase:', error);
    }
  }, []);

  // Refresh inventory from Supabase (for realtime sync)
  const refreshInventory = useCallback(async () => {
    try {
      const supabaseInventory = await SupabaseSync.loadInventoryFromSupabase();
      if (supabaseInventory && supabaseInventory.length > 0) {
        setInventory(supabaseInventory);
        console.log('[Realtime] Inventory refreshed from Supabase:', supabaseInventory.length);
      }
    } catch (error) {
      console.error('Failed to refresh inventory from Supabase:', error);
    }
  }, []);

  const getRestockSuggestions = useCallback((): StockSuggestion[] => {
    // 1. Calculate Average Daily Usage (ADU) for each item from inventoryLogs
    const usageByItem: Record<string, number> = {};
    const daysAnalyzed = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAnalyzed);

    // Sum up "out" type logs (usage/sales/waste)
    inventoryLogs.forEach(log => {
      if (log.type === 'out' && new Date(log.createdAt).getTime() >= cutoffDate.getTime()) {
        usageByItem[log.stockItemId] = (usageByItem[log.stockItemId] || 0) + Math.abs(log.quantity);
      }
    });

    return inventory.map(item => {
      const totalUsage = usageByItem[item.id] || 0;
      const averageDailyUsage = totalUsage / daysAnalyzed;

      // Formula: (ADU * LeadTime) + SafetyStock
      const leadTimeDays = 3; // Default
      const safetyStock = item.minQuantity || (averageDailyUsage * 2); // Fallback if minQuantity not set
      const reorderPoint = (averageDailyUsage * leadTimeDays) + safetyStock;

      // Basic logic: if current quantity is significant low or below reorder point
      // Using a generous reorder point for safety
      if (item.currentQuantity <= reorderPoint || item.currentQuantity <= item.minQuantity) {
        // Suggest ordering enough to cover 2x reorder point or 3x min quantity
        const targetQty = Math.max(reorderPoint * 3, item.minQuantity * 4);
        const suggestedOrderQty = Math.max(10, targetQty - item.currentQuantity); // Min order 10

        return {
          stockId: item.id,
          stockName: item.name,
          currentQuantity: item.currentQuantity,
          averageDailyUsage,
          suggestedReorderPoint: reorderPoint,
          suggestedOrderQuantity: Math.ceil(suggestedOrderQty),
          estimatedCost: Math.ceil(suggestedOrderQty) * item.cost,
          supplier: item.supplier
        };
      }
      return null;
    }).filter(Boolean) as StockSuggestion[];
  }, [inventory, inventoryLogs]);

  // Refresh menu from Supabase (for realtime sync)
  const refreshMenu = useCallback(async () => {
    try {
      const menuResult = await SupabaseSync.loadMenuItemsFromSupabase();
      if (menuResult.data && menuResult.data.length > 0) {
        setMenuItems(menuResult.data);
        console.log('[Realtime] Menu refreshed from Supabase:', menuResult.data.length);
      }
      // Also refresh modifiers
      const modGroupResult = await SupabaseSync.loadModifierGroupsFromSupabase();
      if (modGroupResult.data && modGroupResult.data.length > 0) {
        setModifierGroups(modGroupResult.data);
      }
      const modOptResult = await SupabaseSync.loadModifierOptionsFromSupabase();
      if (modOptResult.data && modOptResult.data.length > 0) {
        setModifierOptions(modOptResult.data);
      }
    } catch (error) {
      console.error('Failed to refresh menu from Supabase:', error);
    }
  }, []);

  // Refresh staff from Supabase (for realtime sync)
  const refreshStaff = useCallback(async () => {
    try {
      const supabaseStaff = await SupabaseSync.loadStaffFromSupabase();
      if (supabaseStaff && supabaseStaff.length > 0) {
        setStaff(supabaseStaff);
        console.log('[Realtime] Staff refreshed from Supabase:', supabaseStaff.length);
      }
    } catch (error) {
      console.error('Failed to refresh staff from Supabase:', error);
    }
  }, []);

  // Refresh attendance from Supabase (for realtime sync)
  const refreshAttendance = useCallback(async () => {
    try {
      const supabaseAttendance = await SupabaseSync.loadAttendanceFromSupabase();
      if (supabaseAttendance && supabaseAttendance.length > 0) {
        setAttendance(supabaseAttendance);
        console.log('[Realtime] Attendance refreshed from Supabase:', supabaseAttendance.length);
      }
    } catch (error) {
      console.error('Failed to refresh attendance from Supabase:', error);
    }
  }, []);

  // Refresh schedules from Supabase (for realtime sync)
  const refreshSchedules = useCallback(async () => {
    try {
      const supabaseSchedules = await SupabaseSync.loadSchedulesFromSupabase();
      if (supabaseSchedules && supabaseSchedules.length > 0) {
        setSchedules(supabaseSchedules);
        console.log('[Realtime] Schedules refreshed from Supabase:', supabaseSchedules.length);
      }
    } catch (error) {
      console.error('Failed to refresh schedules from Supabase:', error);
    }
  }, []);

  // Refresh leave requests from Supabase (for realtime sync)
  const refreshLeaveRequests = useCallback(async () => {
    try {
      const supabaseLeaveRequests = await VoidRefundOps.fetchLeaveRequests();
      if (supabaseLeaveRequests && supabaseLeaveRequests.length > 0) {
        setLeaveRequests(supabaseLeaveRequests);
        console.log('[Realtime] Leave requests refreshed from Supabase:', supabaseLeaveRequests.length);
      }
    } catch (error) {
      console.error('Failed to refresh leave requests from Supabase:', error);
    }
  }, []);

  // Refresh claim requests from Supabase (for realtime sync)
  const refreshClaimRequests = useCallback(async () => {
    try {
      const supabaseClaimRequests = await VoidRefundOps.fetchClaimRequests();
      if (supabaseClaimRequests && supabaseClaimRequests.length > 0) {
        setClaimRequests(supabaseClaimRequests);
        console.log('[Realtime] Claim requests refreshed from Supabase:', supabaseClaimRequests.length);
      }
    } catch (error) {
      console.error('Failed to refresh claim requests from Supabase:', error);
    }
  }, []);

  // Refresh staff requests from Supabase (for realtime sync)
  const refreshStaffRequests = useCallback(async () => {
    try {
      const supabaseStaffRequests = await VoidRefundOps.fetchStaffRequests();
      if (supabaseStaffRequests && supabaseStaffRequests.length > 0) {
        setStaffRequests(supabaseStaffRequests);
        console.log('[Realtime] Staff requests refreshed from Supabase:', supabaseStaffRequests.length);
      }
    } catch (error) {
      console.error('Failed to refresh staff requests from Supabase:', error);
    }
  }, []);

  // Production log actions
  const addProductionLog = useCallback((log: Omit<ProductionLog, 'id'>) => {
    const newLog: ProductionLog = {
      ...log,
      id: generateUUID(),
    };
    setProductionLogs(prev => [newLog, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddProductionLog(newLog);
  }, []);

  // Delivery order actions
  const updateDeliveryStatus = useCallback((orderId: string, status: DeliveryOrder['status']) => {
    setDeliveryOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));
  }, []);

  // Refresh delivery orders from Supabase (for realtime sync)
  const refreshDeliveryOrders = useCallback(async () => {
    try {
      const supabaseOrders = await VoidRefundOps.fetchDeliveryOrders();
      if (supabaseOrders) {
        setDeliveryOrders(supabaseOrders);
        console.log('[Realtime] Delivery orders refreshed from Supabase:', supabaseOrders.length);
      }
    } catch (error) {
      console.error('Failed to refresh delivery orders from Supabase:', error);
    }
  }, []);

  // Finance actions
  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    // Sync to Supabase
    try {
      const supabaseExpense = await SupabaseSync.syncAddExpense(newExpense);
      if (supabaseExpense && supabaseExpense.id) {
        newExpense.id = supabaseExpense.id;
      }
    } catch (error) {
      console.error('Failed to sync expense to Supabase:', error);
    }

    setExpenses(prev => [newExpense, ...prev]);
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncUpdateExpense(id, updates);
    } catch (error) {
      console.error('Failed to sync expense update to Supabase:', error);
    }

    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncDeleteExpense(id);
    } catch (error) {
      console.error('Failed to sync expense delete to Supabase:', error);
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateCashFlow = useCallback((date: string, data: Partial<DailyCashFlow>) => {
    setCashFlows(prev => {
      const existing = prev.find(cf => cf.date === date);
      if (existing) {
        const updatedItem = { ...existing, ...data };
        // Sync to Supabase
        SupabaseSync.syncUpsertCashFlow(updatedItem);
        return prev.map(cf => cf.date === date ? updatedItem : cf);
      } else {
        const newCf: DailyCashFlow = {
          id: generateUUID(),
          date,
          openingCash: 0,
          salesCash: 0,
          salesCard: 0,
          salesEwallet: 0,
          expensesCash: 0,
          closingCash: 0,
          ...data,
        };
        // Sync to Supabase
        SupabaseSync.syncUpsertCashFlow(newCf);
        return [newCf, ...prev];
      }
    });
  }, []);

  const getTodayCashFlow = useCallback((): DailyCashFlow | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return cashFlows.find(cf => cf.date === today);
  }, [cashFlows]);

  const getMonthlyExpenses = useCallback((month: string): Expense[] => {
    return expenses.filter(e => e.date.startsWith(month));
  }, [expenses]);

  const getMonthlyRevenue = useCallback((month: string): number => {
    return orders
      .filter(o => o.createdAt.startsWith(month) && o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  // Refresh expenses from Supabase (for realtime sync)
  const refreshExpenses = useCallback(async () => {
    try {
      const supabaseExpenses = await VoidRefundOps.fetchExpenses();
      if (supabaseExpenses) {
        setExpenses(supabaseExpenses);
        console.log('[Realtime] Expenses refreshed from Supabase:', supabaseExpenses.length);
      }
    } catch (error) {
      console.error('Failed to refresh expenses from Supabase:', error);
    }
  }, []);

  // Refresh cash flows from Supabase (for realtime sync)
  const refreshCashFlows = useCallback(async () => {
    try {
      const supabaseCashFlows = await VoidRefundOps.fetchCashFlows();
      if (supabaseCashFlows) {
        setCashFlows(supabaseCashFlows);
        console.log('[Realtime] Cash flows refreshed from Supabase:', supabaseCashFlows.length);
      }
    } catch (error) {
      console.error('Failed to refresh cash flows from Supabase:', error);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchCustomers();
      if (data) setCustomers(data);
    } catch (error) { console.error('Failed to refresh customers', error); }
  }, []);

  const refreshSuppliers = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchSuppliers();
      if (data) setSuppliers(data);
    } catch (error) { console.error('Failed to refresh suppliers', error); }
  }, []);

  const refreshPurchaseOrders = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchPurchaseOrders();
      if (data) setPurchaseOrders(data);
    } catch (error) { console.error('Failed to refresh POs', error); }
  }, []);

  const refreshRecipes = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchRecipes();
      if (data) {
        // Enrich with menu items names as they are not in the DB table
        const enriched = data.map((r: any) => ({
          ...r,
          menuItemName: menuItems.find(m => m.id === r.menuItemId)?.name || 'Unknown'
        }));
        setRecipes(enriched);
      }
    } catch (error) { console.error('Failed to refresh recipes', error); }
  }, [menuItems]);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchNotifications();
      if (data) setNotifications(data);
    } catch (error) { console.error('Failed to refresh notifications', error); }
  }, []);

  const refreshAnnouncements = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchAnnouncements();
      if (data) setAnnouncements(data);
    } catch (error) { console.error('Failed to refresh announcements', error); }
  }, []);

  const refreshOilTrackers = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchOilTrackers();
      if (data) setOilTrackers(data);
    } catch (error) { console.error('Failed to refresh oil trackers', error); }
  }, []);

  const refreshChecklistTemplates = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchChecklistTemplates();
      if (data) setChecklistTemplates(data);
    } catch (error) { console.error('Failed to refresh checklist templates', error); }
  }, []);

  const refreshChecklistCompletions = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchChecklistCompletions();
      if (data) setChecklistCompletions(data);
    } catch (error) { console.error('Failed to refresh checklist completions', error); }
  }, []);

  const refreshProductionLogs = useCallback(async () => {
    try {
      const data = await VoidRefundOps.fetchProductionLogs();
      if (data) setProductionLogs(data);
    } catch (error) { console.error('Failed to refresh production logs', error); }
  }, []);

  // Refresh promotions from Supabase (for realtime sync)
  const refreshPromotions = useCallback(async () => {
    try {
      const supabasePromotions = await VoidRefundOps.fetchPromotions();
      if (supabasePromotions) {
        setPromotions(supabasePromotions);
        console.log('[Realtime] Promotions refreshed from Supabase:', supabasePromotions.length);
      }
    } catch (error) {
      console.error('Failed to refresh promotions from Supabase:', error);
    }
  }, []);

  // Customer actions
  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalSpent' | 'totalOrders' | 'segment'>): Promise<Customer> => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateUUID(),
      loyaltyPoints: 0,
      totalSpent: 0,
      totalOrders: 0,
      segment: 'new',
      createdAt: new Date().toISOString(),
    };

    // Sync to Supabase
    try {
      const supabaseCustomer = await SupabaseSync.syncAddCustomer(newCustomer);
      if (supabaseCustomer && supabaseCustomer.id) {
        newCustomer.id = supabaseCustomer.id;
      }
    } catch (error) {
      console.error('Failed to sync customer to Supabase:', error);
    }

    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncUpdateCustomer(id, updates);
    } catch (error) {
      console.error('Failed to sync customer update to Supabase:', error);
    }

    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);



  // Supplier actions
  const addSupplier = useCallback(async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'rating'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: generateUUID(),
      rating: 3,
      createdAt: new Date().toISOString(),
    };

    // Sync to Supabase first
    const syncedSupplier = await SupabaseSync.syncAddSupplier(newSupplier);

    // If Supabase sync succeeded, use the returned data (with proper UUID), otherwise use local data
    const finalSupplier = syncedSupplier || newSupplier;
    setSuppliers(prev => [...prev, finalSupplier]);
  }, []);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    // Sync to Supabase
    await SupabaseSync.syncUpdateSupplier(id, updates);

    // Update local state
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSupplier = useCallback(async (id: string) => {
    // Sync to Supabase
    await SupabaseSync.syncDeleteSupplier(id);

    // Update local state
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  const addPurchaseOrder = useCallback(async (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> => {
    const timestamp = Date.now();
    const newPO: PurchaseOrder = {
      ...poData,
      id: generateUUID(),
      poNumber: `PO-${timestamp.toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sync to Supabase first
    const syncedPO = await SupabaseSync.syncAddPurchaseOrder(newPO);

    // If Supabase sync succeeded, use the returned data, otherwise use local data
    const finalPO = syncedPO || newPO;
    setPurchaseOrders(prev => [finalPO, ...prev]);
    return finalPO;
  }, []);

  const updatePurchaseOrderStatus = useCallback(async (id: string, status: PurchaseOrder['status']) => {
    // Check if status is changing to 'received' to trigger inventory update
    const po = purchaseOrders.find(p => p.id === id);
    const isReceiving = status === 'received' && po?.status !== 'received';

    const updates = {
      status,
      updatedAt: new Date().toISOString(),
      actualDelivery: isReceiving ? new Date().toISOString() : undefined
    };

    // Sync to Supabase
    await SupabaseSync.syncUpdatePurchaseOrder(id, updates);

    // If receiving, update inventory stock
    if (isReceiving && po) {
      // We need to update inventory for each item
      // This is a bit complex as we need to update multiple items
      // For now, we'll update local state and call sync for each
      // Ideally this should be a transaction on the backend

      po.items.forEach(async (item) => {
        const stockItem = inventory.find(i => i.id === item.stockItemId);
        if (stockItem) {
          const newQuantity = stockItem.currentQuantity + item.quantity;

          // Update local inventory
          setInventory(prev => prev.map(i =>
            i.id === item.stockItemId
              ? { ...i, currentQuantity: newQuantity }
              : i
          ));

          // Sync inventory update
          await SupabaseSync.syncUpdateStockItem(item.stockItemId, { currentQuantity: newQuantity });

          // Add log
          const log: InventoryLog = {
            id: generateUUID(),
            stockItemId: item.stockItemId,
            stockItemName: item.stockItemName,
            quantity: item.quantity,
            previousQuantity: stockItem.currentQuantity,
            newQuantity: newQuantity,
            reason: `PO Received #${po.poNumber}`,
            type: 'in',
            createdAt: new Date().toISOString(),
          };
          setInventoryLogs(prev => [log, ...prev]);
          await SupabaseSync.syncAddInventoryLog(log);
        }
      });
    }

    // Update local PO state
    setPurchaseOrders(prev => prev.map(currPO =>
      currPO.id === id ? { ...currPO, ...updates } : currPO
    ));
  }, [purchaseOrders, inventory]);

  const markPurchaseOrderAsPaid = useCallback(async (id: string, amount?: number) => {
    try {
      // Sync to Supabase
      const result = await SupabaseSync.syncMarkPurchaseOrderAsPaid(id, amount);

      // Update local state
      setPurchaseOrders(prev => prev.map(po =>
        po.id === id
          ? {
            ...po,
            paymentStatus: 'paid' as const,
            paidAmount: amount ?? po.total,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          : po
      ));
    } catch (error) {
      console.error('Failed to mark PO as paid:', error);
      throw error;
    }
  }, []);

  // Recipe actions
  const addRecipe = useCallback(async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'totalCost' | 'profitMargin'>) => {
    const totalCost = recipeData.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    const profitMargin = recipeData.sellingPrice > 0
      ? ((recipeData.sellingPrice - totalCost) / recipeData.sellingPrice) * 100
      : 0;
    const newRecipe: Recipe = {
      ...recipeData,
      id: generateUUID(),
      totalCost,
      profitMargin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setRecipes(prev => [newRecipe, ...prev]);

    // Sync and wait
    try {
      await SupabaseSync.syncAddRecipe(newRecipe);
    } catch (error) {
      console.error('Sync failed', error);
      throw error; // Rethrow so UI knows
    }
  }, []);

  const updateRecipe = useCallback((id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
    // Sync to Supabase
    SupabaseSync.syncUpdateRecipe(id, updates);
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeleteRecipe(id);
  }, []);

  // Shift & Schedule actions
  const addShift = useCallback((shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = { ...shiftData, id: generateUUID() };
    setShifts(prev => [...prev, newShift]);
    // Sync to Supabase
    SupabaseSync.syncAddShift(newShift);
  }, []);

  const updateShift = useCallback((id: string, updates: Partial<Shift>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    // Sync to Supabase
    SupabaseSync.syncUpdateShift(id, updates);
  }, []);

  const deleteShift = useCallback((id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeleteShift(id);
  }, []);

  const addScheduleEntry = useCallback((entryData: Omit<ScheduleEntry, 'id'>) => {
    const newEntry: ScheduleEntry = { ...entryData, id: generateUUID() };
    setSchedules(prev => [...prev, newEntry]);
    // Sync to Supabase
    SupabaseSync.syncAddScheduleEntry(newEntry);
  }, []);

  const updateScheduleEntry = useCallback((id: string, updates: Partial<ScheduleEntry>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    // Sync to Supabase
    SupabaseSync.syncUpdateScheduleEntry(id, updates);
  }, []);

  const deleteScheduleEntry = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeleteScheduleEntry(id);
  }, []);

  const getWeekSchedule = useCallback((startDate: string): ScheduleEntry[] => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return schedules.filter(s => {
      const date = new Date(s.date);
      return date >= start && date < end;
    });
  }, [schedules]);

  // Promotion actions
  const addPromotion = useCallback((promoData: Omit<Promotion, 'id' | 'createdAt' | 'usageCount'>) => {
    const newPromo: Promotion = {
      ...promoData,
      id: generateUUID(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    setPromotions(prev => [newPromo, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddPromotion(newPromo);
  }, []);

  const updatePromotion = useCallback((id: string, updates: Partial<Promotion>) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    // Sync to Supabase
    SupabaseSync.syncUpdatePromotion(id, updates);
  }, []);

  const deletePromotion = useCallback((id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeletePromotion(id);
  }, []);

  const validatePromoCode = useCallback((code: string): Promotion | null => {
    const now = new Date();
    const promo = promotions.find(p =>
      p.promoCode?.toLowerCase() === code.toLowerCase() &&
      p.status === 'active' &&
      new Date(p.startDate) <= now &&
      new Date(p.endDate) >= now &&
      (!p.usageLimit || p.usageCount < p.usageLimit)
    );
    return promo || null;
  }, [promotions]);

  // Notification actions
  const addNotification = useCallback((notifData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notifData,
      id: generateUUID(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddNotification(newNotif);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    // Sync to Supabase
    SupabaseSync.syncUpdateNotification(id, { isRead: true });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeleteNotification(id);
  }, []);

  const getUnreadCount = useCallback((): number => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Menu Item actions
  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: generateUUID(),
    };

    // Sync to Supabase
    try {
      const result = await SupabaseSync.syncAddMenuItem(newItem);
      if (result.success && result.data?.id) {
        newItem.id = result.data.id;
      }
    } catch (error) {
      console.error('Failed to sync menu item to Supabase:', error);
    }

    setMenuItems(prev => [...prev, newItem]);
  }, []);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncUpdateMenuItem(id, updates);
    } catch (error) {
      console.error('Failed to sync menu item update to Supabase:', error);
    }

    setMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    // Sync to Supabase
    try {
      await SupabaseSync.syncDeleteMenuItem(id);
    } catch (error) {
      console.error('Failed to sync menu item delete to Supabase:', error);
    }

    setMenuItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const toggleMenuItemAvailability = useCallback(async (id: string) => {
    // Find current item to get the toggled value
    const currentItem = menuItems.find(item => item.id === id);
    if (!currentItem) return;

    const newAvailability = !currentItem.isAvailable;

    // Update local state first (optimistic update)
    setMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, isAvailable: newAvailability } : item
    ));

    // Sync to Supabase
    try {
      const result = await SupabaseSync.syncUpdateMenuItem(id, { isAvailable: newAvailability });
      if (!result.success) {
        console.error('[Toggle Availability] Sync failed:', result.error);
        // Rollback on failure
        setMenuItems(prev => prev.map(item =>
          item.id === id ? { ...item, isAvailable: !newAvailability } : item
        ));
      }
    } catch (error) {
      console.error('[Toggle Availability] Sync error:', error);
      // Rollback on error
      setMenuItems(prev => prev.map(item =>
        item.id === id ? { ...item, isAvailable: !newAvailability } : item
      ));
    }
  }, [menuItems]);

  const getMenuCategories = useCallback((): string[] => {
    const categories = new Set(menuItems.map(item => item.category));
    return Array.from(categories);
  }, [menuItems]);

  // Modifier Group actions
  const addModifierGroup = useCallback(async (group: Omit<ModifierGroup, 'id'>) => {
    const newGroup: ModifierGroup = {
      ...group,
      id: generateUUID(),
    };
    setModifierGroups(prev => [...prev, newGroup]);

    // Sync to Supabase
    await SupabaseSync.syncAddModifierGroup(newGroup);
  }, []);

  const updateModifierGroup = useCallback(async (id: string, updates: Partial<ModifierGroup>) => {
    setModifierGroups(prev => prev.map(group =>
      group.id === id ? { ...group, ...updates } : group
    ));

    // Sync to Supabase
    await SupabaseSync.syncUpdateModifierGroup(id, updates);
  }, []);

  const deleteModifierGroup = useCallback(async (id: string) => {
    // Delete the group
    setModifierGroups(prev => prev.filter(group => group.id !== id));
    // Delete all options in this group
    setModifierOptions(prev => prev.filter(opt => opt.groupId !== id));
    // Remove this group from all menu items
    setMenuItems(prev => prev.map(item => ({
      ...item,
      modifierGroupIds: item.modifierGroupIds.filter(gid => gid !== id)
    })));

    // Sync to Supabase
    await SupabaseSync.syncDeleteModifierGroup(id);
  }, []);

  // Modifier Option actions
  const addModifierOption = useCallback(async (option: Omit<ModifierOption, 'id'>) => {
    const newOption: ModifierOption = {
      ...option,
      id: generateUUID(),
    };
    setModifierOptions(prev => [...prev, newOption]);

    // Sync to Supabase
    await SupabaseSync.syncAddModifierOption(newOption);
  }, []);

  const updateModifierOption = useCallback(async (id: string, updates: Partial<ModifierOption>) => {
    setModifierOptions(prev => prev.map(opt =>
      opt.id === id ? { ...opt, ...updates } : opt
    ));

    // Sync to Supabase
    await SupabaseSync.syncUpdateModifierOption(id, updates);
  }, []);

  const deleteModifierOption = useCallback(async (id: string) => {
    setModifierOptions(prev => prev.filter(opt => opt.id !== id));

    // Sync to Supabase
    await SupabaseSync.syncDeleteModifierOption(id);
  }, []);

  const getOptionsForGroup = useCallback((groupId: string): ModifierOption[] => {
    return modifierOptions.filter(opt => opt.groupId === groupId);
  }, [modifierOptions]);

  // KPI & Gamification actions
  const getStaffKPI = useCallback((staffId: string, period?: string): StaffKPI | undefined => {
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    return staffKPI.find(k => k.staffId === staffId && k.period === currentPeriod);
  }, [staffKPI]);

  const getStaffKPIHistory = useCallback((staffId: string): StaffKPI[] => {
    return staffKPI.filter(k => k.staffId === staffId).sort((a, b) => b.period.localeCompare(a.period));
  }, [staffKPI]);

  const updateStaffKPI = useCallback((staffId: string, period: string, metrics: Partial<KPIMetrics>) => {
    // Determine if we are updating existing or creating new
    // We do this OUTSIDE setStaffKPI to capture the object for sync
    const existingIndex = staffKPI.findIndex(k => k.staffId === staffId && k.period === period);

    let kpiToSync: StaffKPI;

    if (existingIndex >= 0) {
      const existing = staffKPI[existingIndex];
      const updatedMetrics = { ...existing.metrics, ...metrics };
      const overallScore = calculateOverallScore(updatedMetrics);
      const bonusAmount = calculateBonus(overallScore);

      kpiToSync = {
        ...existing,
        metrics: updatedMetrics,
        overallScore,
        bonusAmount,
        updatedAt: new Date().toISOString()
      };

      setStaffKPI(prev => prev.map(k => k.id === existing.id ? kpiToSync : k));
    } else {
      const defaultMetrics: KPIMetrics = {
        mealPrepTime: 0,
        attendance: 0,
        emergencyLeave: 100,
        upselling: 0,
        customerRating: 0,
        wasteReduction: 0,
        trainingComplete: 0,
        otWillingness: 0,
        ...metrics,
      };
      const overallScore = calculateOverallScore(defaultMetrics);
      const bonusAmount = calculateBonus(overallScore);

      // Calculate rank (approximate)
      const currentPeriodCount = staffKPI.filter(k => k.period === period).length;

      kpiToSync = {
        id: generateUUID(),
        staffId,
        period,
        metrics: defaultMetrics,
        overallScore,
        bonusAmount,
        rank: currentPeriodCount + 1,
        updatedAt: new Date().toISOString(),
      };

      setStaffKPI(prev => [...prev, kpiToSync]);
    }

    // Sync to Supabase
    SupabaseSync.syncUpsertStaffKPI(kpiToSync);
  }, [staffKPI]);

  const recalculateKPIRankings = useCallback((period: string) => {
    setStaffKPI(prev => {
      const periodKPIs = prev.filter(k => k.period === period);
      const sorted = [...periodKPIs].sort((a, b) => b.overallScore - a.overallScore);
      const rankings = new Map(sorted.map((k, idx) => [k.id, idx + 1]));
      return prev.map(k =>
        k.period === period ? { ...k, rank: rankings.get(k.id) || k.rank } : k
      );
    });
  }, []);

  const getKPILeaderboard = useCallback((period?: string): StaffKPI[] => {
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    return staffKPI
      .filter(k => k.period === currentPeriod)
      .sort((a, b) => a.rank - b.rank);
  }, [staffKPI]);

  const addLeaveRecord = useCallback((leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newLeave: LeaveRecord = {
      ...leave,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setLeaveRecords(prev => [...prev, newLeave]);
  }, []);

  const updateLeaveRecord = useCallback((id: string, updates: Partial<LeaveRecord>) => {
    setLeaveRecords(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const addTrainingRecord = useCallback((training: Omit<TrainingRecord, 'id'>) => {
    const newTraining: TrainingRecord = {
      ...training,
      id: generateUUID(),
    };
    setTrainingRecords(prev => [...prev, newTraining]);
  }, []);

  const updateTrainingRecord = useCallback((id: string, updates: Partial<TrainingRecord>) => {
    setTrainingRecords(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const addOTRecord = useCallback((ot: Omit<OTRecord, 'id' | 'createdAt'>) => {
    const newOT: OTRecord = {
      ...ot,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setOTRecords(prev => [...prev, newOT]);
  }, []);

  const updateOTRecord = useCallback((id: string, updates: Partial<OTRecord>) => {
    setOTRecords(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const addCustomerReview = useCallback((review: Omit<CustomerReview, 'id' | 'createdAt'>) => {
    const newReview: CustomerReview = {
      ...review,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setCustomerReviews(prev => [newReview, ...prev]);
  }, []);

  const getStaffReviews = useCallback((staffId: string): CustomerReview[] => {
    return customerReviews.filter(r => r.staffId === staffId);
  }, [customerReviews]);

  const getStaffBonus = useCallback((staffId: string, period?: string): number => {
    const kpi = getStaffKPI(staffId, period);
    return kpi?.bonusAmount || 0;
  }, [getStaffKPI]);

  // Staff Portal - Checklist actions
  const addChecklistTemplate = useCallback((template: Omit<ChecklistItemTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: ChecklistItemTemplate = {
      ...template,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setChecklistTemplates(prev => [...prev, newTemplate]);
    // Sync to Supabase
    SupabaseSync.syncAddChecklistTemplate(newTemplate);
  }, []);

  const updateChecklistTemplate = useCallback((id: string, updates: Partial<ChecklistItemTemplate>) => {
    setChecklistTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    // Sync to Supabase
    SupabaseSync.syncUpdateChecklistTemplate(id, updates);
  }, []);

  const deleteChecklistTemplate = useCallback((id: string) => {
    setChecklistTemplates(prev => prev.filter(t => t.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeleteChecklistTemplate(id);
  }, []);

  const getChecklistTemplatesByType = useCallback((type: 'opening' | 'closing'): ChecklistItemTemplate[] => {
    return checklistTemplates
      .filter(t => t.type === type && t.isActive)
      .sort((a, b) => a.order - b.order);
  }, [checklistTemplates]);

  const startChecklist = useCallback((type: 'opening' | 'closing', staffId: string, staffName: string, shiftId: string): ChecklistCompletion => {
    const templates = checklistTemplates.filter(t => t.type === type && t.isActive).sort((a, b) => a.order - b.order);
    const newCompletion: ChecklistCompletion = {
      id: generateUUID(),
      date: new Date().toISOString().split('T')[0],
      type,
      staffId,
      staffName,
      shiftId,
      items: templates.map(t => ({
        templateId: t.id,
        title: t.title,
        isCompleted: false,
      })),
      startedAt: new Date().toISOString(),
      status: 'in_progress',
    };
    setChecklistCompletions(prev => [...prev, newCompletion]);
    // Sync to Supabase
    SupabaseSync.syncAddChecklistCompletion(newCompletion);
    return newCompletion;
  }, [checklistTemplates]);

  const updateChecklistItem = useCallback((completionId: string, templateId: string, updates: Partial<ChecklistCompletion['items'][0]>) => {
    setChecklistCompletions(prev => prev.map(c => {
      if (c.id !== completionId) return c;
      return {
        ...c,
        items: c.items.map(item =>
          item.templateId === templateId ? { ...item, ...updates } : item
        ),
      };
    }));
  }, []);

  const completeChecklist = useCallback((completionId: string) => {
    setChecklistCompletions(prev => prev.map(c => {
      if (c.id !== completionId) return c;
      const allCompleted = c.items.every(item => item.isCompleted);
      return {
        ...c,
        completedAt: new Date().toISOString(),
        status: allCompleted ? 'completed' : 'incomplete',
      };
    }));
  }, []);

  const getTodayChecklist = useCallback((type: 'opening' | 'closing'): ChecklistCompletion | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return checklistCompletions.find(c => c.date === today && c.type === type);
  }, [checklistCompletions]);

  // Staff Portal - Leave actions
  const getLeaveBalance = useCallback((staffId: string, year?: number): LeaveBalance | undefined => {
    const currentYear = year || new Date().getFullYear();
    return leaveBalances.find(lb => lb.staffId === staffId && lb.year === currentYear);
  }, [leaveBalances]);

  const addLeaveRequest = useCallback((request: Omit<LeaveRequest, 'id' | 'createdAt'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddLeaveRequest(newRequest);
    // Update pending count in leave balance
    setLeaveBalances(prev => prev.map(lb => {
      if (lb.staffId !== request.staffId) return lb;
      if (request.type === 'unpaid' || request.type === 'study') return lb;
      const leaveType = request.type;
      if (!lb[leaveType]) return lb;
      return {
        ...lb,
        [leaveType]: {
          ...lb[leaveType],
          pending: (lb[leaveType] as { pending: number }).pending + request.duration,
        },
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const updateLeaveRequest = useCallback((id: string, updates: Partial<LeaveRequest>) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    // Sync to Supabase
    SupabaseSync.syncUpdateLeaveRequest(id, updates);
  }, []);

  const approveLeaveRequest = useCallback((id: string, approverId: string, approverName: string) => {
    const request = leaveRequests.find(r => r.id === id); // Find the request before state update
    setLeaveRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'approved' as const,
        approvedBy: approverId,
        approverName,
        approvedAt: new Date().toISOString(),
      };
    }));
    // Update leave balance
    if (request) {
      setLeaveBalances(prev => prev.map(lb => {
        if (lb.staffId !== request.staffId) return lb;
        if (request.type === 'unpaid') {
          return {
            ...lb,
            unpaid: { taken: lb.unpaid.taken + request.duration },
            updatedAt: new Date().toISOString(),
          };
        }
        if (request.type === 'study') return lb;
        const leaveType = request.type;
        if (!lb[leaveType]) return lb;
        const current = lb[leaveType] as { entitled: number; taken: number; pending: number; balance: number };
        return {
          ...lb,
          [leaveType]: {
            ...current,
            taken: current.taken + request.duration,
            pending: Math.max(0, current.pending - request.duration),
            balance: current.balance - request.duration,
          },
          updatedAt: new Date().toISOString(),
        };
      }));

      // Notification for staff
      addNotification({
        type: 'system',
        title: 'Permohonan Cuti Diluluskan',
        message: `Permohonan cuti anda untuk ${request.type} dari ${request.startDate} hingga ${request.endDate} telah diluluskan.`,
        priority: 'medium',
        targetStaffId: request.staffId,
      });
    }
  }, [leaveRequests, addNotification]);

  const rejectLeaveRequest = useCallback((id: string, approverId: string, approverName: string, reason: string) => {
    const request = leaveRequests.find(r => r.id === id); // Find the request before state update
    setLeaveRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'rejected' as const,
        approvedBy: approverId,
        approverName,
        approvedAt: new Date().toISOString(),
        rejectionReason: reason,
      };
    }));
    // Remove from pending in balance
    if (request) {
      setLeaveBalances(prev => prev.map(lb => {
        if (lb.staffId !== request.staffId) return lb;
        if (request.type === 'unpaid' || request.type === 'study') return lb;
        const leaveType = request.type;
        if (!lb[leaveType]) return lb;
        return {
          ...lb,
          [leaveType]: {
            ...lb[leaveType],
            pending: Math.max(0, (lb[leaveType] as { pending: number }).pending - request.duration),
          },
          updatedAt: new Date().toISOString(),
        };
      }));

      // Notification for staff
      addNotification({
        type: 'system',
        title: 'Permohonan Cuti Ditolak',
        message: `Permohonan cuti anda untuk ${request.type} dari ${request.startDate} hingga ${request.endDate} telah ditolak. Sebab: ${reason}`,
        priority: 'high',
        targetStaffId: request.staffId,
      });
    }
  }, [leaveRequests, addNotification]);

  const getStaffLeaveRequests = useCallback((staffId: string): LeaveRequest[] => {
    return leaveRequests.filter(r => r.staffId === staffId);
  }, [leaveRequests]);

  const getPendingLeaveRequests = useCallback((): LeaveRequest[] => {
    return leaveRequests.filter(r => r.status === 'pending');
  }, [leaveRequests]);

  // Staff Portal - Claim actions
  const addClaimRequest = useCallback((claim: Omit<ClaimRequest, 'id' | 'createdAt'>) => {
    const newClaim: ClaimRequest = {
      ...claim,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setClaimRequests(prev => [newClaim, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddClaimRequest(newClaim);
  }, []);

  const updateClaimRequest = useCallback((id: string, updates: Partial<ClaimRequest>) => {
    setClaimRequests(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Sync to Supabase
    SupabaseSync.syncUpdateClaimRequest(id, updates);
  }, []);

  const approveClaimRequest = useCallback((id: string, approverId: string, approverName: string) => {
    setClaimRequests(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        status: 'approved' as const,
        approvedBy: approverId,
        approverName,
        approvedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const rejectClaimRequest = useCallback((id: string, approverId: string, approverName: string, reason: string) => {
    setClaimRequests(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        status: 'rejected' as const,
        approvedBy: approverId,
        approverName,
        approvedAt: new Date().toISOString(),
        rejectionReason: reason,
      };
    }));
  }, []);

  const markClaimAsPaid = useCallback((id: string) => {
    setClaimRequests(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, status: 'paid' as const, paidAt: new Date().toISOString() };
    }));
    // Sync to Supabase
    SupabaseSync.syncUpdateClaimRequest(id, {
      status: 'paid',
      paidAt: new Date().toISOString()
    });
  }, []);

  const getStaffClaimRequests = useCallback((staffId: string): ClaimRequest[] => {
    return claimRequests.filter(c => c.staffId === staffId);
  }, [claimRequests]);

  const getPendingClaimRequests = useCallback((): ClaimRequest[] => {
    return claimRequests.filter(c => c.status === 'pending');
  }, [claimRequests]);

  // Staff Portal - OT Claims actions
  const addOTClaim = useCallback((claim: Omit<OTClaim, 'id' | 'createdAt'>) => {
    const newClaim: OTClaim = {
      ...claim,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setOTClaims(prev => {
      const updated = [newClaim, ...prev];
      setToStorage(STORAGE_KEYS.OT_CLAIMS, updated);
      return updated;
    });
  }, []);

  const updateOTClaim = useCallback((id: string, updates: Partial<OTClaim>) => {
    setOTClaims(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      setToStorage(STORAGE_KEYS.OT_CLAIMS, updated);
      return updated;
    });
  }, []);

  const approveOTClaim = useCallback((id: string, approverId: string, approverName: string) => {
    setOTClaims(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          status: 'approved' as const,
          approvedBy: approverId,
          approverName,
          approvedAt: new Date().toISOString(),
        };
      });
      setToStorage(STORAGE_KEYS.OT_CLAIMS, updated);
      return updated;
    });
  }, []);

  const rejectOTClaim = useCallback((id: string, approverId: string, approverName: string, reason: string) => {
    setOTClaims(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          status: 'rejected' as const,
          approvedBy: approverId,
          approverName,
          approvedAt: new Date().toISOString(),
          rejectionReason: reason,
        };
      });
      setToStorage(STORAGE_KEYS.OT_CLAIMS, updated);
      return updated;
    });
  }, []);

  const markOTClaimAsPaid = useCallback((id: string) => {
    setOTClaims(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return { ...c, status: 'paid' as const, paidAt: new Date().toISOString() };
      });
      setToStorage(STORAGE_KEYS.OT_CLAIMS, updated);
      return updated;
    });
  }, []);

  const getStaffOTClaims = useCallback((staffId: string): OTClaim[] => {
    return otClaims.filter(c => c.staffId === staffId);
  }, [otClaims]);

  const getPendingOTClaims = useCallback((): OTClaim[] => {
    return otClaims.filter(c => c.status === 'pending');
  }, [otClaims]);

  // ==================== Salary Advance Actions ====================

  const addSalaryAdvance = useCallback((advance: Omit<SalaryAdvance, 'id' | 'createdAt'>) => {
    const newAdvance: SalaryAdvance = {
      ...advance,
      id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setSalaryAdvances(prev => {
      const updated = [...prev, newAdvance];
      setToStorage(STORAGE_KEYS.SALARY_ADVANCES, updated);
      return updated;
    });
  }, []);

  const approveSalaryAdvance = useCallback((id: string, approverId: string, approverName: string) => {
    setSalaryAdvances(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        return {
          ...a,
          status: 'approved' as const,
          approvedBy: approverId,
          approverName,
          approvedAt: new Date().toISOString(),
        };
      });
      setToStorage(STORAGE_KEYS.SALARY_ADVANCES, updated);
      return updated;
    });
  }, []);

  const rejectSalaryAdvance = useCallback((id: string, approverId: string, approverName: string, reason: string) => {
    setSalaryAdvances(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        return {
          ...a,
          status: 'rejected' as const,
          approvedBy: approverId,
          approverName,
          approvedAt: new Date().toISOString(),
          rejectionReason: reason,
        };
      });
      setToStorage(STORAGE_KEYS.SALARY_ADVANCES, updated);
      return updated;
    });
  }, []);

  const markSalaryAdvanceAsDeducted = useCallback((id: string, month: string) => {
    setSalaryAdvances(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        return { ...a, status: 'deducted' as const, deductedMonth: month };
      });
      setToStorage(STORAGE_KEYS.SALARY_ADVANCES, updated);
      return updated;
    });
  }, []);

  const getStaffSalaryAdvances = useCallback((staffId: string): SalaryAdvance[] => {
    return salaryAdvances.filter(a => a.staffId === staffId);
  }, [salaryAdvances]);

  const getPendingSalaryAdvances = useCallback((): SalaryAdvance[] => {
    return salaryAdvances.filter(a => a.status === 'pending');
  }, [salaryAdvances]);

  const getApprovedSalaryAdvances = useCallback((staffId?: string): SalaryAdvance[] => {
    return salaryAdvances.filter(a =>
      a.status === 'approved' && (!staffId || a.staffId === staffId)
    );
  }, [salaryAdvances]);

  // ==================== Disciplinary Action Functions ====================

  const addDisciplinaryAction = useCallback((action: Omit<DisciplinaryAction, 'id' | 'createdAt'>) => {
    const newAction: DisciplinaryAction = {
      ...action,
      id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setDisciplinaryActions(prev => {
      const updated = [newAction, ...prev];
      setToStorage(STORAGE_KEYS.DISCIPLINARY_ACTIONS, updated);
      return updated;
    });
    // Sync to Supabase
    getSupabaseClient().from('disciplinary_actions').insert({
      id: newAction.id,
      staff_id: newAction.staffId,
      staff_name: newAction.staffName,
      type: newAction.type,
      reason: newAction.reason,
      details: newAction.details,
      issued_by: newAction.issuedBy,
      issued_by_name: newAction.issuedByName,
      issued_at: newAction.issuedAt,
      acknowledged_at: newAction.acknowledgedAt,
      created_at: newAction.createdAt,
    }).then(({ error }: { error: Error | null }) => {
      if (error) console.error('[Supabase] Failed to insert disciplinary action:', error);
    });
  }, []);

  const updateDisciplinaryAction = useCallback((id: string, updates: Partial<DisciplinaryAction>) => {
    setDisciplinaryActions(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      setToStorage(STORAGE_KEYS.DISCIPLINARY_ACTIONS, updated);
      return updated;
    });
    // Sync to Supabase
    const snakeCaseUpdates: Record<string, unknown> = {};
    if (updates.staffId !== undefined) snakeCaseUpdates.staff_id = updates.staffId;
    if (updates.staffName !== undefined) snakeCaseUpdates.staff_name = updates.staffName;
    if (updates.type !== undefined) snakeCaseUpdates.type = updates.type;
    if (updates.reason !== undefined) snakeCaseUpdates.reason = updates.reason;
    if (updates.details !== undefined) snakeCaseUpdates.details = updates.details;
    if (updates.acknowledgedAt !== undefined) snakeCaseUpdates.acknowledged_at = updates.acknowledgedAt;
    getSupabaseClient().from('disciplinary_actions').update(snakeCaseUpdates).eq('id', id).then(({ error }: { error: Error | null }) => {
      if (error) console.error('[Supabase] Failed to update disciplinary action:', error);
    });
  }, []);

  const deleteDisciplinaryAction = useCallback((id: string) => {
    setDisciplinaryActions(prev => {
      const updated = prev.filter(a => a.id !== id);
      setToStorage(STORAGE_KEYS.DISCIPLINARY_ACTIONS, updated);
      return updated;
    });
    // Sync to Supabase
    getSupabaseClient().from('disciplinary_actions').delete().eq('id', id).then(({ error }: { error: Error | null }) => {
      if (error) console.error('[Supabase] Failed to delete disciplinary action:', error);
    });
  }, []);

  const getStaffDisciplinaryActions = useCallback((staffId: string): DisciplinaryAction[] => {
    return disciplinaryActions.filter(a => a.staffId === staffId);
  }, [disciplinaryActions]);

  const refreshDisciplinaryActions = useCallback(async () => {
    const { data, error } = await getSupabaseClient().from('disciplinary_actions').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const mapped: DisciplinaryAction[] = data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        staffId: row.staff_id as string,
        staffName: row.staff_name as string,
        type: row.type as DisciplinaryAction['type'],
        reason: row.reason as string,
        details: row.details as string | undefined,
        issuedBy: row.issued_by as string,
        issuedByName: row.issued_by_name as string,
        issuedAt: row.issued_at as string,
        acknowledgedAt: row.acknowledged_at as string | undefined,
        createdAt: row.created_at as string,
      }));
      setDisciplinaryActions(mapped);
      setToStorage(STORAGE_KEYS.DISCIPLINARY_ACTIONS, mapped);
    }
  }, []);

  // ==================== Staff Training Functions ====================

  const addStaffTraining = useCallback((training: Omit<StaffTraining, 'id' | 'createdAt'>) => {
    const newTraining: StaffTraining = {
      ...training,
      id: `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setStaffTraining(prev => {
      const updated = [newTraining, ...prev];
      setToStorage(STORAGE_KEYS.STAFF_TRAINING, updated);
      return updated;
    });
    // Sync to Supabase
    getSupabaseClient()?.from('staff_training').insert({
      id: newTraining.id,
      staff_id: newTraining.staffId,
      staff_name: newTraining.staffName,
      course_name: newTraining.courseName,
      provider: newTraining.provider,
      category: newTraining.category,
      scheduled_date: newTraining.scheduledDate,
      completed_at: newTraining.completedAt,
      expires_at: newTraining.expiresAt,
      certificate_number: newTraining.certificateNumber,
      notes: newTraining.notes,
      status: newTraining.status,
      created_at: newTraining.createdAt,
    }).then(({ error }: { error: Error | null }) => {
      if (error) console.error('[Supabase] Failed to insert staff training:', error);
    });
  }, []);

  const updateStaffTraining = useCallback((id: string, updates: Partial<StaffTraining>) => {
    setStaffTraining(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      setToStorage(STORAGE_KEYS.STAFF_TRAINING, updated);
      return updated;
    });
    // Sync to Supabase
    const snakeCaseUpdates: Record<string, unknown> = {};
    if (updates.staffId !== undefined) snakeCaseUpdates.staff_id = updates.staffId;
    if (updates.staffName !== undefined) snakeCaseUpdates.staff_name = updates.staffName;
    if (updates.courseName !== undefined) snakeCaseUpdates.course_name = updates.courseName;
    if (updates.provider !== undefined) snakeCaseUpdates.provider = updates.provider;
    if (updates.category !== undefined) snakeCaseUpdates.category = updates.category;
    if (updates.scheduledDate !== undefined) snakeCaseUpdates.scheduled_date = updates.scheduledDate;
    if (updates.completedAt !== undefined) snakeCaseUpdates.completed_at = updates.completedAt;
    if (updates.expiresAt !== undefined) snakeCaseUpdates.expires_at = updates.expiresAt;
    if (updates.certificateNumber !== undefined) snakeCaseUpdates.certificate_number = updates.certificateNumber;
    if (updates.notes !== undefined) snakeCaseUpdates.notes = updates.notes;
    if (updates.status !== undefined) snakeCaseUpdates.status = updates.status;
    getSupabaseClient()?.from('staff_training').update(snakeCaseUpdates).eq('id', id).then(({ error }: { error: Error | null }) => {
      if (error) console.error('[Supabase] Failed to update staff training:', error);
    });
  }, []);

  const deleteStaffTraining = useCallback((id: string) => {
    setStaffTraining(prev => {
      const updated = prev.filter(t => t.id !== id);
      setToStorage(STORAGE_KEYS.STAFF_TRAINING, updated);
      return updated;
    });
    getSupabaseClient()?.from('staff_training').delete().eq('id', id).then(({ error }: { error: Error | null }) => {
      if (error) console.error('[Supabase] Failed to delete staff training:', error);
    });
  }, []);

  const getStaffTrainingRecords = useCallback((staffId: string): StaffTraining[] => {
    return staffTraining.filter(t => t.staffId === staffId);
  }, [staffTraining]);

  const getExpiringTraining = useCallback((daysAhead: number = 30): StaffTraining[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return staffTraining.filter(t => {
      if (!t.expiresAt || t.status === 'expired') return false;
      const expiryDate = new Date(t.expiresAt);
      return expiryDate <= futureDate && expiryDate > now;
    });
  }, [staffTraining]);

  const refreshStaffTraining = useCallback(async () => {
    const { data, error } = await (getSupabaseClient()?.from('staff_training').select('*').order('created_at', { ascending: false }) || { data: null, error: null });
    if (!error && data) {
      const mapped: StaffTraining[] = data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        staffId: row.staff_id as string,
        staffName: row.staff_name as string,
        courseName: row.course_name as string,
        provider: row.provider as string,
        category: row.category as StaffTraining['category'],
        scheduledDate: row.scheduled_date as string | undefined,
        completedAt: row.completed_at as string | undefined,
        expiresAt: row.expires_at as string | undefined,
        certificateNumber: row.certificate_number as string | undefined,
        notes: row.notes as string | undefined,
        status: row.status as StaffTraining['status'],
        createdAt: row.created_at as string,
      }));
      setStaffTraining(mapped);
      setToStorage(STORAGE_KEYS.STAFF_TRAINING, mapped);
    }
  }, []);

  // Staff Portal - Staff Request actions
  const addStaffRequest = useCallback((request: Omit<StaffRequest, 'id' | 'createdAt'>) => {
    const newRequest: StaffRequest = {
      ...request,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setStaffRequests(prev => [newRequest, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddStaffRequest(newRequest);
  }, []);

  const updateStaffRequest = useCallback((id: string, updates: Partial<StaffRequest>) => {
    setStaffRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    // Sync to Supabase
    SupabaseSync.syncUpdateStaffRequest(id, updates);
  }, []);

  const completeStaffRequest = useCallback((id: string, responseNote?: string) => {
    setStaffRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'completed' as const,
        responseNote,
        completedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const rejectStaffRequest = useCallback((id: string, responseNote: string) => {
    setStaffRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'rejected' as const,
        responseNote,
        completedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const getStaffRequestsByStaff = useCallback((staffId: string): StaffRequest[] => {
    return staffRequests.filter(r => r.staffId === staffId);
  }, [staffRequests]);

  const getPendingStaffRequests = useCallback((): StaffRequest[] => {
    return staffRequests.filter(r => r.status === 'pending');
  }, [staffRequests]);

  // Staff Portal - Announcement actions
  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddAnnouncement(newAnnouncement);
  }, []);

  const updateAnnouncement = useCallback((id: string, updates: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    // Sync to Supabase
    SupabaseSync.syncUpdateAnnouncement(id, updates);
  }, []);

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    // Sync to Supabase
    SupabaseSync.syncDeleteAnnouncement(id);
  }, []);

  const getActiveAnnouncements = useCallback((role?: 'Manager' | 'Staff'): Announcement[] => {
    const today = new Date().toISOString().split('T')[0];
    return announcements.filter(a => {
      if (!a.isActive) return false;
      if (a.startDate > today) return false;
      if (a.endDate && a.endDate < today) return false;
      if (role && !a.targetRoles.includes(role)) return false;
      return true;
    });
  }, [announcements]);

  // ==================== ORDER HISTORY & VOID/REFUND FUNCTIONS ====================

  const getOrderHistory = useCallback((filters?: Partial<OrderHistoryFilters>): OrderHistoryItem[] => {
    let result = [...orderHistory];

    if (filters) {
      // Filter by date range
      if (filters.dateRange?.start) {
        result = result.filter(o => o.createdAt >= filters.dateRange!.start);
      }
      if (filters.dateRange?.end) {
        result = result.filter(o => o.createdAt <= filters.dateRange!.end + 'T23:59:59');
      }

      // Filter by status
      if (filters.status && filters.status !== 'all') {
        result = result.filter(o => {
          if (filters.status === 'voided' || filters.status === 'refunded' ||
            filters.status === 'partial_refund' || filters.status === 'pending_void' ||
            filters.status === 'pending_refund') {
            return o.voidRefundStatus === filters.status;
          }
          return o.status === filters.status;
        });
      }

      // Filter by payment method
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        result = result.filter(o => o.paymentMethod === filters.paymentMethod);
      }

      // Filter by order type
      if (filters.orderType && filters.orderType !== 'all') {
        result = result.filter(o => o.orderType === filters.orderType);
      }

      // Filter by outlet
      if (filters.outletId && filters.outletId !== 'all') {
        result = result.filter(o => o.outletId === filters.outletId);
      }

      // Filter by staff
      if (filters.staffId && filters.staffId !== 'all') {
        result = result.filter(o => o.cashierId === filters.staffId);
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        result = result.filter(o =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.customerName?.toLowerCase().includes(query) ||
          o.cashierName?.toLowerCase().includes(query) ||
          o.customerPhone?.includes(query)
        );
      }
    }

    // Sort by date descending
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orderHistory]);

  const getOrderById = useCallback((orderId: string): OrderHistoryItem | undefined => {
    return orderHistory.find(o => o.id === orderId);
  }, [orderHistory]);

  const requestVoid = useCallback(async (
    orderId: string,
    reason: string,
    requestedBy: string,
    requestedByName: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Check both orderHistory and active orders
    const order = orderHistory.find(o => o.id === orderId) || orders.find(o => o.id === orderId);

    if (!order) {
      console.error(`requestVoid: Order ${orderId} not found in history (${orderHistory.length}) or active orders (${orders.length})`);
      return { success: false, error: 'Order not found' };
    }

    if ((order as any).voidRefundStatus && (order as any).voidRefundStatus !== 'none') {
      return { success: false, error: 'Order already has a pending or completed void/refund request' };
    }

    const newRequest: VoidRefundRequest = {
      id: generateUUID(),
      orderId,
      orderNumber: order.orderNumber,
      type: 'void',
      reason,
      requestedBy,
      requestedByName,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      salesReversed: false,
      inventoryReversed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sync to Supabase
    try {
      const supabaseRequest = await VoidRefundOps.insertVoidRefundRequest(newRequest);
      if (supabaseRequest && supabaseRequest.id) {
        newRequest.id = supabaseRequest.id;
      }
    } catch (error) {
      console.error('Failed to sync void request to Supabase:', error);
    }

    setVoidRefundRequests(prev => [newRequest, ...prev]);

    // Update local state
    const updateOrder = (o: any) =>
      o.id === orderId
        ? { ...o, pendingRequest: newRequest, voidRefundStatus: 'pending_void' as any }
        : o;

    setOrderHistory(prev => prev.map(updateOrder));
    setOrders(prev => prev.map(updateOrder));

    return { success: true };
  }, [orderHistory, orders, cashFlows]);

  const requestRefund = useCallback(async (
    orderId: string,
    amount: number,
    reason: string,
    requestedBy: string,
    requestedByName: string,
    items?: RefundItem[]
  ): Promise<{ success: boolean; error?: string }> => {
    // Check both orderHistory and active orders
    const order = orderHistory.find(o => o.id === orderId) || orders.find(o => o.id === orderId);

    if (!order) {
      console.error(`requestRefund: Order ${orderId} not found in history (${orderHistory.length}) or active orders (${orders.length})`);
      return { success: false, error: 'Order not found' };
    }

    if ((order as any).voidRefundStatus && (order as any).voidRefundStatus !== 'none') {
      return { success: false, error: 'Order already has a pending or completed void/refund request' };
    }

    const isPartial = items && items.length > 0 && amount < order.total;

    const newRequest: VoidRefundRequest = {
      ...order, // Copy order details for context
      id: generateUUID(),
      orderId,
      orderNumber: order.orderNumber,
      type: isPartial ? 'partial_refund' : 'refund',
      reason,
      amount,
      itemsToRefund: items,
      requestedBy,
      requestedByName,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      salesReversed: false,
      inventoryReversed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sync to Supabase
    try {
      const supabaseRequest = await VoidRefundOps.insertVoidRefundRequest(newRequest);
      if (supabaseRequest && supabaseRequest.id) {
        newRequest.id = supabaseRequest.id;
      }
    } catch (error) {
      console.error('Failed to sync refund request to Supabase:', error);
      // Continue with local storage as fallback
    }

    setVoidRefundRequests(prev => [newRequest, ...prev]);

    // Update local state
    const updateOrder = (o: any) =>
      o.id === orderId
        ? { ...o, pendingRequest: newRequest, voidRefundStatus: isPartial ? 'pending_refund' : 'pending_refund' as any }
        : o;

    setOrderHistory(prev => prev.map(updateOrder));
    setOrders(prev => prev.map(updateOrder));

    return { success: true };
  }, [orderHistory, orders, cashFlows]);

  const approveVoidRefund = useCallback(async (
    requestId: string,
    approvedBy: string,
    approvedByName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const request = voidRefundRequests.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Request is not pending' };
    }

    // Check both orderHistory and active orders
    const order = orderHistory.find(o => o.id === request.orderId) || orders.find(o => o.id === request.orderId);

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const now = new Date().toISOString();
    const reversalAmount = request.amount || order.total;

    // Update request status
    setVoidRefundRequests(prev => prev.map(r =>
      r.id === requestId
        ? {
          ...r,
          status: 'approved' as const,
          approvedBy,
          approvedByName,
          approvedAt: now,
          salesReversed: true,
          inventoryReversed: true,
          reversalDetails: {
            salesDeducted: reversalAmount,
            inventoryItems: order.items.map(item => ({
              itemId: item.id,
              itemName: item.name,
              quantity: item.quantity
            }))
          }
        }
        : r
    ));

    // Update order status (in both lists)
    const newStatus = request.type === 'void' ? 'voided' :
      request.type === 'partial_refund' ? 'partial_refund' : 'refunded';

    const updateOrder = (o: any) =>
      o.id === request.orderId
        ? {
          ...o,
          voidRefundStatus: newStatus as any,
          refundAmount: reversalAmount,
          refundReason: request.reason,
          ...(request.type === 'void'
            ? { voidedAt: now, voidedBy: approvedBy, voidedByName: approvedByName }
            : { refundedAt: now, refundedBy: approvedBy, refundedByName: approvedByName }
          ),
          pendingRequest: undefined
        }
        : o;

    setOrderHistory(prev => prev.map(updateOrder));
    setOrders(prev => prev.map(updateOrder));

    // Reverse sales - update cash flow
    const today = new Date().toISOString().split('T')[0];
    const existingCashFlow = cashFlows.find(cf => cf.date === today);
    if (existingCashFlow && order.paymentMethod) {
      const method = order.paymentMethod;
      setCashFlows(prev => prev.map(cf => {
        if (cf.date === today) {
          if (method === 'cash') {
            return { ...cf, salesCash: Math.max(0, cf.salesCash - reversalAmount) };
          } else if (method === 'card') {
            return { ...cf, salesCard: Math.max(0, cf.salesCard - reversalAmount) };
          } else {
            return { ...cf, salesEwallet: Math.max(0, cf.salesEwallet - reversalAmount) };
          }
        }
        return cf;
      }));
    }

    // Reverse inventory - add stock back
    const itemsToReverse = request.itemsToRefund || order.items.map(item => ({
      itemId: item.id,
      itemName: item.name,
      quantity: item.quantity,
      amount: item.itemTotal * item.quantity
    }));

    // Note: In a real implementation, we would look up inventory mappings
    // and call adjustStock for each inventory item

    // Sync to Supabase
    try {
      await VoidRefundOps.updateVoidRefundRequest(requestId, {
        status: 'approved',
        approvedBy,
        approvedByName,
        approvedAt: now,
        salesReversed: true,
        inventoryReversed: true,
      });
    } catch (error) {
      console.error('Failed to sync approval to Supabase:', error);
    }

    return { success: true };
  }, [voidRefundRequests, orderHistory, orders, cashFlows]);

  const rejectVoidRefund = useCallback(async (
    requestId: string,
    rejectedBy: string,
    rejectedByName: string,
    reason: string
  ): Promise<void> => {
    const request = voidRefundRequests.find(r => r.id === requestId);
    if (!request) return;

    const now = new Date().toISOString();

    setVoidRefundRequests(prev => prev.map(r =>
      r.id === requestId
        ? {
          ...r,
          status: 'rejected' as const,
          approvedBy: rejectedBy,
          approvedByName: rejectedByName,
          approvedAt: now,
          rejectionReason: reason
        }
        : r
    ));

    const updateOrder = (o: any) =>
      o.id === request.orderId
        ? { ...o, voidRefundStatus: 'none' as const, pendingRequest: undefined }
        : o;

    setOrderHistory(prev => prev.map(updateOrder));
    setOrders(prev => prev.map(updateOrder));


    // Sync to Supabase
    try {
      await VoidRefundOps.updateVoidRefundRequest(requestId, {
        status: 'rejected',
        approvedBy: rejectedBy,
        approvedByName: rejectedByName,
        approvedAt: now,
        rejectionReason: reason,
      });
    } catch (error) {
      console.error('Failed to sync rejection to Supabase:', error);
    }
  }, [voidRefundRequests]);

  const getPendingVoidRefundRequests = useCallback((): VoidRefundRequest[] => {
    return voidRefundRequests.filter(r => r.status === 'pending')
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [voidRefundRequests]);

  const getVoidRefundRequestsByStaff = useCallback((staffId: string): VoidRefundRequest[] => {
    return voidRefundRequests.filter(r => r.requestedBy === staffId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [voidRefundRequests]);

  const getPendingVoidRefundCount = useCallback((): number => {
    return voidRefundRequests.filter(r => r.status === 'pending').length;
  }, [voidRefundRequests]);

  // Refresh void refund requests from Supabase (for realtime sync)
  const refreshVoidRefundRequests = useCallback(async () => {
    try {
      const voidRefundData = await VoidRefundOps.fetchVoidRefundRequests();
      if (voidRefundData && voidRefundData.length >= 0) {
        setVoidRefundRequests(voidRefundData);
      }
    } catch (error) {
      console.error('Failed to refresh void refund requests:', error);
    }
  }, []);

  // ==================== OIL TRACKER / EQUIPMENT FUNCTIONS ====================

  const addOilTracker = useCallback((tracker: Omit<OilTracker, 'fryerId'>) => {
    const newTracker: OilTracker = {
      ...tracker,
      fryerId: `fryer_${Date.now()}`,
    };
    setOilTrackers(prev => [...prev, newTracker]);
    // Sync to Supabase
    SupabaseSync.syncAddOilTracker(newTracker);
  }, []);

  const updateOilTracker = useCallback((fryerId: string, updates: Partial<OilTracker>) => {
    setOilTrackers(prev => prev.map(t =>
      t.fryerId === fryerId ? { ...t, ...updates } : t
    ));
    // Sync to Supabase
    SupabaseSync.syncUpdateOilTracker(fryerId, updates);
  }, []);

  const deleteOilTracker = useCallback((fryerId: string) => {
    setOilTrackers(prev => prev.filter(t => t.fryerId !== fryerId));
    // Sync to Supabase
    SupabaseSync.syncDeleteOilTracker(fryerId);
  }, []);

  const updateOilTrackerStatus = (tracker: OilTracker): OilTracker => {
    const percentage = (tracker.currentCycles / tracker.cycleLimit) * 100;
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (percentage >= 100) {
      status = 'critical';
    } else if (percentage >= 80) {
      status = 'warning';
    }
    return { ...tracker, status };
  };

  const submitOilRequest = useCallback((
    fryerId: string,
    actionType: OilActionType,
    photoUrl: string,
    requestedBy: string,
    requestedByName: string,
    topupPercentage?: number,
    notes?: string
  ): { success: boolean; error?: string } => {
    const tracker = oilTrackers.find(t => t.fryerId === fryerId);
    if (!tracker) {
      return { success: false, error: 'Fryer not found' };
    }

    if (tracker.hasPendingRequest) {
      return { success: false, error: 'Fryer already has a pending request' };
    }

    const previousCycles = tracker.currentCycles;
    let proposedCycles = 0;

    if (actionType === 'topup' && topupPercentage) {
      // Reduce cycles by the percentage
      proposedCycles = Math.round(previousCycles * (1 - topupPercentage / 100));
    }

    const newRequest: OilChangeRequest = {
      id: generateUUID(),
      fryerId,
      fryerName: tracker.name,
      actionType,
      requestedAt: new Date().toISOString(),
      requestedBy: requestedByName,
      previousCycles,
      proposedCycles,
      topupPercentage,
      photoUrl,
      notes,
      status: 'pending',
    };

    setOilChangeRequests(prev => [...prev, newRequest]);
    setOilTrackers(prev => prev.map(t =>
      t.fryerId === fryerId ? { ...t, hasPendingRequest: true } : t
    ));
    // Sync to Supabase
    SupabaseSync.syncAddOilChangeRequest(newRequest);
    SupabaseSync.syncUpdateOilTracker(fryerId, { hasPendingRequest: true });

    return { success: true };
  }, [oilTrackers]);

  const approveOilRequest = useCallback((
    requestId: string,
    approvedBy: string,
    approvedByName: string
  ): { success: boolean; error?: string } => {
    const request = oilChangeRequests.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Request is not pending' };
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Update request status
    setOilChangeRequests(prev => prev.map(r =>
      r.id === requestId
        ? { ...r, status: 'approved' as const, reviewedAt: now, reviewedBy: approvedByName }
        : r
    ));

    // Update oil tracker
    setOilTrackers(prev => prev.map(t => {
      if (t.fryerId !== request.fryerId) return t;

      const updated = {
        ...t,
        currentCycles: request.proposedCycles,
        hasPendingRequest: false,
        ...(request.actionType === 'change'
          ? { lastChangedDate: today }
          : { lastTopupDate: today }
        ),
      };
      return updateOilTrackerStatus(updated);
    }));

    // Add to history
    const historyEntry: OilActionHistory = {
      id: generateUUID(),
      fryerId: request.fryerId,
      fryerName: request.fryerName,
      actionType: request.actionType,
      actionAt: now,
      previousCycles: request.previousCycles,
      newCycles: request.proposedCycles,
      topupPercentage: request.topupPercentage,
      requestedBy: request.requestedBy,
      approvedBy: approvedByName,
      photoUrl: request.photoUrl,
    };
    setOilActionHistory(prev => [historyEntry, ...prev]);
    // Sync to Supabase
    SupabaseSync.syncAddOilActionHistory(historyEntry);
    SupabaseSync.syncUpdateOilChangeRequest(requestId, { status: 'approved', reviewedAt: now, reviewedBy: approvedByName });
    SupabaseSync.syncUpdateOilTracker(request.fryerId, {
      currentCycles: request.proposedCycles,
      hasPendingRequest: false,
      ...(request.actionType === 'change' ? { lastChangedDate: today } : { lastTopupDate: today }),
    });

    return { success: true };
  }, [oilChangeRequests]);

  const rejectOilRequest = useCallback((
    requestId: string,
    rejectedBy: string,
    rejectedByName: string,
    reason: string
  ): void => {
    const request = oilChangeRequests.find(r => r.id === requestId);
    if (!request) return;

    setOilChangeRequests(prev => prev.map(r =>
      r.id === requestId
        ? {
          ...r,
          status: 'rejected' as const,
          reviewedAt: new Date().toISOString(),
          reviewedBy: rejectedByName,
          rejectionReason: reason
        }
        : r
    ));

    // Remove pending flag from tracker
    setOilTrackers(prev => prev.map(t =>
      t.fryerId === request.fryerId ? { ...t, hasPendingRequest: false } : t
    ));
  }, [oilChangeRequests]);

  const getPendingOilRequests = useCallback((): OilChangeRequest[] => {
    return oilChangeRequests.filter(r => r.status === 'pending')
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [oilChangeRequests]);

  const getOilRequestsByStaff = useCallback((staffName: string): OilChangeRequest[] => {
    return oilChangeRequests.filter(r => r.requestedBy === staffName)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [oilChangeRequests]);

  const getPendingOilRequestCount = useCallback((): number => {
    return oilChangeRequests.filter(r => r.status === 'pending').length;
  }, [oilChangeRequests]);

  const getOilActionHistory = useCallback((fryerId: string): OilActionHistory[] => {
    return oilActionHistory.filter(h => h.fryerId === fryerId)
      .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());
  }, [oilActionHistory]);

  // ==================== MENU CATEGORIES FUNCTIONS ====================

  const addMenuCategory = useCallback(async (category: Omit<MenuCategory, 'id' | 'createdAt'>) => {
    const newCategory: MenuCategory = {
      ...category,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.addMenuCategory(newCategory);
      if (result.success && result.data) {
        setMenuCategories(prev => [...prev, result.data!]);
        return;
      }
    } catch (error) {
      console.error('[Menu Categories] Supabase sync failed, saving to localStorage:', error);
    }

    // Fallback to localStorage only
    setMenuCategories(prev => [...prev, newCategory]);
  }, []);

  const updateMenuCategory = useCallback(async (id: string, updates: Partial<MenuCategory>) => {
    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.updateMenuCategory(id, updates);
      if (result.success) {
        setMenuCategories(prev => prev.map(cat =>
          cat.id === id ? { ...cat, ...updates } : cat
        ));
        return;
      }
    } catch (error) {
      console.error('[Menu Categories] Supabase update failed, updating localStorage only:', error);
    }

    // Fallback: update localStorage only
    setMenuCategories(prev => prev.map(cat =>
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  }, []);

  const deleteMenuCategory = useCallback(async (id: string) => {
    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.deleteMenuCategory(id);
      if (result.success) {
        setMenuCategories(prev => prev.filter(cat => cat.id !== id));
        return;
      }
    } catch (error) {
      console.error('[Menu Categories] Supabase delete failed, deleting from localStorage only:', error);
    }

    // Fallback: delete from localStorage only
    setMenuCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const getActiveCategories = useCallback((): MenuCategory[] => {
    return menuCategories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [menuCategories]);

  // ==================== PAYMENT METHODS FUNCTIONS ====================

  const addPaymentMethod = useCallback(async (method: Omit<PaymentMethodConfig, 'id' | 'createdAt'>) => {
    const newMethod: PaymentMethodConfig = {
      ...method,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.addPaymentMethod(newMethod);
      if (result.success && result.data) {
        // Use Supabase data if successful
        setPaymentMethods(prev => [...prev, result.data!]);
        return;
      }
    } catch (error) {
      console.error('[Payment Methods] Supabase sync failed, saving to localStorage:', error);
    }

    // Fallback to localStorage only
    setPaymentMethods(prev => [...prev, newMethod]);
  }, []);

  const updatePaymentMethod = useCallback(async (id: string, updates: Partial<PaymentMethodConfig>) => {
    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.updatePaymentMethod(id, updates);
      if (result.success) {
        // Update local state
        setPaymentMethods(prev => prev.map(pm =>
          pm.id === id ? { ...pm, ...updates } : pm
        ));
        return;
      }
    } catch (error) {
      console.error('[Payment Methods] Supabase update failed, updating localStorage only:', error);
    }

    // Fallback: update localStorage only
    setPaymentMethods(prev => prev.map(pm =>
      pm.id === id ? { ...pm, ...updates } : pm
    ));
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    // Prevent deletion of system payment methods
    const method = paymentMethods.find(pm => pm.id === id);
    if (method?.isSystem) {
      console.warn('Cannot delete system payment method');
      return;
    }

    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.deletePaymentMethod(id);
      if (result.success) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
        return;
      }
    } catch (error) {
      console.error('[Payment Methods] Supabase delete failed, deleting from localStorage only:', error);
    }

    // Fallback: delete from localStorage only
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  }, [paymentMethods]);

  const getEnabledPaymentMethods = useCallback((): PaymentMethodConfig[] => {
    return paymentMethods
      .filter(pm => pm.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [paymentMethods]);

  // ==================== TAX RATES FUNCTIONS ====================

  const addTaxRate = useCallback(async (rate: Omit<TaxRate, 'id' | 'createdAt'>) => {
    const newRate: TaxRate = {
      ...rate,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    // If this is set as default, unset other defaults first
    if (newRate.isDefault) {
      setTaxRates(prev => prev.map(r => ({ ...r, isDefault: false })));
    }

    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.addTaxRate(newRate);
      if (result.success && result.data) {
        setTaxRates(prev => [...prev, result.data!]);
        return;
      }
    } catch (error) {
      console.error('[Tax Rates] Supabase sync failed, saving to localStorage:', error);
    }

    // Fallback to localStorage only
    setTaxRates(prev => [...prev, newRate]);
  }, []);

  const updateTaxRate = useCallback(async (id: string, updates: Partial<TaxRate>) => {
    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.updateTaxRate(id, updates);
      if (result.success) {
        // Update local state
        setTaxRates(prev => {
          // If setting this as default, unset other defaults
          if (updates.isDefault) {
            return prev.map(r =>
              r.id === id ? { ...r, ...updates } : { ...r, isDefault: false }
            );
          }
          return prev.map(r => r.id === id ? { ...r, ...updates } : r);
        });
        return;
      }
    } catch (error) {
      console.error('[Tax Rates] Supabase update failed, updating localStorage only:', error);
    }

    // Fallback: update localStorage only
    setTaxRates(prev => {
      // If setting this as default, unset other defaults
      if (updates.isDefault) {
        return prev.map(r =>
          r.id === id ? { ...r, ...updates } : { ...r, isDefault: false }
        );
      }
      return prev.map(r => r.id === id ? { ...r, ...updates } : r);
    });
  }, []);

  const deleteTaxRate = useCallback(async (id: string) => {
    const rate = taxRates.find(r => r.id === id);
    // Don't allow deleting the default tax rate
    if (rate?.isDefault) {
      console.warn('Cannot delete default tax rate');
      return;
    }

    // Try to sync to Supabase first
    try {
      const result = await PaymentTaxSync.deleteTaxRate(id);
      if (result.success) {
        setTaxRates(prev => prev.filter(r => r.id !== id));
        return;
      }
    } catch (error) {
      console.error('[Tax Rates] Supabase delete failed, deleting from localStorage only:', error);
    }

    // Fallback: delete from localStorage only
    setTaxRates(prev => prev.filter(r => r.id !== id));
  }, [taxRates]);

  const getDefaultTaxRate = useCallback((): TaxRate | undefined => {
    return taxRates.find(r => r.isDefault && r.isActive);
  }, [taxRates]);

  const getActiveTaxRates = useCallback((): TaxRate[] => {
    return taxRates.filter(r => r.isActive);
  }, [taxRates]);

  // Cash Register Functions
  const openRegister = useCallback(async (startCash: number, staffId: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
    // Check if already open
    if (currentRegister) {
      return { success: false, error: 'Register already open' };
    }

    const newRegister: CashRegister = {
      id: generateUUID(),
      openedAt: new Date().toISOString(),
      openedBy: staffId,
      startCash,
      status: 'open',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          await VoidRefundOps.insertCashRegister(newRegister);
        } catch (error) {
          console.error('Supabase open register error:', error);
          throw error;
        }
      }

      // Update Local State
      const updatedRegisters = [newRegister, ...cashRegisters];
      setCashRegisters(updatedRegisters);
      setCurrentRegister(newRegister);
      setToStorage(STORAGE_KEYS.CASH_REGISTERS, updatedRegisters);

      return { success: true };
    } catch (error) {
      console.error('Open register error:', error);
      // Fallback to local if just network error? For now, we allow local open
      // In strict mode we might block. Assuming generic offline support:
      const updatedRegisters = [newRegister, ...cashRegisters];
      setCashRegisters(updatedRegisters);
      setCurrentRegister(newRegister);
      setToStorage(STORAGE_KEYS.CASH_REGISTERS, updatedRegisters);
      return { success: true };
    }
  }, [cashRegisters, currentRegister]);

  const closeRegister = useCallback(async (actualCash: number, staffId: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentRegister) {
      return { success: false, error: 'No open register to close' };
    }

    const closedRegister: CashRegister = {
      ...currentRegister,
      closedAt: new Date().toISOString(),
      closedBy: staffId,
      endCash: actualCash,
      status: 'closed',
      notes: notes || currentRegister.notes,
      updatedAt: new Date().toISOString(),
      // Variance calculation would happen here or backend
      variance: actualCash - currentRegister.startCash // Simplified variance (Actual - Start). Real logic needs Sales Total.
      // Logic: Variance = Actual - (Start + Sales - Expenses)
      // We will handle sophisticated variance calculation in the UI or backend.
    };

    try {
      // Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          await VoidRefundOps.updateCashRegister(currentRegister.id, {
            closedAt: closedRegister.closedAt,
            closedBy: closedRegister.closedBy,
            endCash: closedRegister.endCash,
            status: 'closed',
            notes: closedRegister.notes,
            variance: closedRegister.variance,
            updatedAt: closedRegister.updatedAt
          });
        } catch (error) {
          console.error('Supabase close register error:', error);
          throw error;
        }
      }

      const updatedRegisters = cashRegisters.map(r => r.id === currentRegister.id ? closedRegister : r);
      setCashRegisters(updatedRegisters);
      setCurrentRegister(null);
      setToStorage(STORAGE_KEYS.CASH_REGISTERS, updatedRegisters);

      return { success: true };
    } catch (error) {
      console.error('Close register error:', error);
      // Local Fallback
      const updatedRegisters = cashRegisters.map(r => r.id === currentRegister.id ? closedRegister : r);
      setCashRegisters(updatedRegisters);
      setCurrentRegister(null);
      setToStorage(STORAGE_KEYS.CASH_REGISTERS, updatedRegisters);
      return { success: true };
    }
  }, [cashRegisters, currentRegister]);

  const checkRegisterStatus = useCallback((staffId: string) => {
    // This is primarily used to re-sync or check permission
    // For now we rely on the state `currentRegister`
    const open = cashRegisters.find(r => r.status === 'open');
    if (open && !currentRegister) {
      setCurrentRegister(open);
    }
  }, [cashRegisters, currentRegister]);

  // Refresh cash registers from Supabase
  const refreshCashRegisters = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabaseRegisters = await VoidRefundOps.fetchCashRegisters();
        if (supabaseRegisters) {
          setCashRegisters(supabaseRegisters);
          // Also update current register
          const open = supabaseRegisters.find((r: CashRegister) => r.status === 'open');
          setCurrentRegister(open || null);
          setToStorage(STORAGE_KEYS.CASH_REGISTERS, supabaseRegisters);
          console.log('[Realtime] Cash registers refreshed:', supabaseRegisters.length);
        }
      }
    } catch (error) {
      console.error('Failed to refresh cash registers:', error);
    }
  }, []);

  const handleCashRegisterChange = useCallback(() => {
    console.log('[Realtime] Cash register change detected, refreshing...');
    refreshCashRegisters();
  }, [refreshCashRegisters]);

  useCashRegistersRealtime(handleCashRegisterChange);

  const value: StoreState = {
    // Inventory
    inventory,
    inventoryLogs,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    adjustStock,
    bulkUpsertStock,
    refreshInventory,
    getRestockSuggestions,
    weatherForecast,

    // Staff
    staff,
    attendance,
    addStaff,
    updateStaff,
    deleteStaff,
    clockIn,
    clockOut,
    getStaffAttendanceToday,
    refreshStaff,
    refreshAttendance,

    // Orders
    orders,
    addOrder,
    updateOrderStatus,
    getTodayOrders,
    refreshOrders,

    // Production Logs
    productionLogs,
    addProductionLog,
    refreshProductionLogs,

    // Delivery Orders
    deliveryOrders,
    updateDeliveryStatus,
    refreshDeliveryOrders,

    // Finance
    expenses,
    cashFlows,
    addExpense,
    updateExpense,
    deleteExpense,
    updateCashFlow,
    getTodayCashFlow,
    getMonthlyExpenses,
    getMonthlyRevenue,
    refreshExpenses,
    refreshCashFlows,

    // Customers
    customers,
    addCustomer,
    updateCustomer,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    refreshCustomers,

    // Suppliers
    suppliers,
    purchaseOrders,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    markPurchaseOrderAsPaid,
    refreshSuppliers,
    refreshPurchaseOrders,

    // Recipes
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refreshRecipes,

    // Shifts & Schedules
    shifts,
    schedules,
    addShift,
    updateShift,
    deleteShift,
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    getWeekSchedule,
    refreshSchedules,

    // Promotions
    promotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    validatePromoCode,
    refreshPromotions,

    // Notifications
    notifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    getUnreadCount,
    refreshNotifications,
    refreshAnnouncements,

    // Menu Items
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    getMenuCategories,
    refreshMenu,

    // Modifier Groups
    modifierGroups,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,

    // Modifier Options
    modifierOptions,
    addModifierOption,
    updateModifierOption,
    deleteModifierOption,
    getOptionsForGroup,

    // KPI & Gamification
    staffKPI,
    leaveRecords,
    trainingRecords,
    otRecords,
    customerReviews,
    getStaffKPI,
    getStaffKPIHistory,
    updateStaffKPI,
    recalculateKPIRankings,
    getKPILeaderboard,
    addLeaveRecord,
    updateLeaveRecord,
    addTrainingRecord,
    updateTrainingRecord,
    addOTRecord,
    updateOTRecord,
    addCustomerReview,
    getStaffReviews,
    getStaffBonus,

    // Staff Portal - Checklist
    checklistTemplates,
    checklistCompletions,
    addChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    getChecklistTemplatesByType,
    startChecklist,
    updateChecklistItem,
    completeChecklist,
    getTodayChecklist,

    // Staff Portal - Leave
    leaveBalances,
    leaveRequests,
    getLeaveBalance,
    addLeaveRequest,
    updateLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    getStaffLeaveRequests,
    getPendingLeaveRequests,
    refreshLeaveRequests,

    // Staff Portal - Claims
    claimRequests,
    addClaimRequest,
    updateClaimRequest,
    approveClaimRequest,
    rejectClaimRequest,
    markClaimAsPaid,
    getStaffClaimRequests,
    getPendingClaimRequests,
    refreshClaimRequests,

    // Staff Portal - OT Claims
    otClaims,
    addOTClaim,
    updateOTClaim,
    approveOTClaim,
    rejectOTClaim,
    markOTClaimAsPaid,
    getStaffOTClaims,
    getPendingOTClaims,

    // Staff Portal - Salary Advances
    salaryAdvances,
    addSalaryAdvance,
    approveSalaryAdvance,
    rejectSalaryAdvance,
    markSalaryAdvanceAsDeducted,
    getStaffSalaryAdvances,
    getPendingSalaryAdvances,
    getApprovedSalaryAdvances,

    // HR - Disciplinary Actions
    disciplinaryActions,
    addDisciplinaryAction,
    updateDisciplinaryAction,
    deleteDisciplinaryAction,
    getStaffDisciplinaryActions,
    refreshDisciplinaryActions,

    // HR - Staff Training & Certifications
    staffTraining,
    addStaffTraining,
    updateStaffTraining,
    deleteStaffTraining,
    getStaffTrainingRecords,
    getExpiringTraining,
    refreshStaffTraining,

    // Staff Portal - General Requests
    staffRequests,
    addStaffRequest,
    updateStaffRequest,
    completeStaffRequest,
    rejectStaffRequest,
    getStaffRequestsByStaff,
    getPendingStaffRequests,
    refreshStaffRequests,
    refreshChecklistTemplates,
    refreshChecklistCompletions,

    // Staff Portal - Announcements
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getActiveAnnouncements,

    // Order History & Void/Refund
    orderHistory,
    voidRefundRequests,
    getOrderHistory,
    getOrderById,
    requestVoid,
    requestRefund,
    approveVoidRefund,
    rejectVoidRefund,
    getPendingVoidRefundRequests,
    getVoidRefundRequestsByStaff,
    getPendingVoidRefundCount,
    refreshVoidRefundRequests,

    // Oil Tracker / Equipment
    oilTrackers,
    oilChangeRequests,
    oilActionHistory,
    addOilTracker,
    updateOilTracker,
    deleteOilTracker,
    submitOilRequest,
    approveOilRequest,
    rejectOilRequest,
    getPendingOilRequests,
    getOilRequestsByStaff,
    getPendingOilRequestCount,
    getOilActionHistory,
    refreshOilTrackers,

    // Equipment & Maintenance Actions
    equipment,
    maintenanceSchedules,
    maintenanceLogs,
    addEquipment: useCallback((newEquipment: Omit<Equipment, 'id'>) => {
      const equip: Equipment = { ...newEquipment, id: generateUUID() };
      setEquipment(prev => {
        const updated = [...prev, equip];
        setToStorage(STORAGE_KEYS.EQUIPMENT, updated);
        return updated;
      });
      // TODO: Sync to Supabase
    }, []),
    updateEquipment: useCallback((id: string, updates: Partial<Equipment>) => {
      setEquipment(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, ...updates } : item);
        setToStorage(STORAGE_KEYS.EQUIPMENT, updated);
        return updated;
      });
      // TODO: Sync to Supabase
    }, []),
    deleteEquipment: useCallback((id: string) => {
      setEquipment(prev => {
        const updated = prev.filter(item => item.id !== id);
        setToStorage(STORAGE_KEYS.EQUIPMENT, updated);
        return updated;
      });
      // TODO: Sync to Supabase
    }, []),
    addMaintenanceSchedule: useCallback((schedule: Omit<MaintenanceSchedule, 'id'>) => {
      const newSchedule: MaintenanceSchedule = { ...schedule, id: generateUUID() };
      setMaintenanceSchedules(prev => {
        const updated = [...prev, newSchedule];
        setToStorage(STORAGE_KEYS.MAINTENANCE_SCHEDULE, updated);
        return updated;
      });
      // TODO: Sync to Supabase
    }, []),
    updateMaintenanceSchedule: useCallback((id: string, updates: Partial<MaintenanceSchedule>) => {
      setMaintenanceSchedules(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, ...updates } : item);
        setToStorage(STORAGE_KEYS.MAINTENANCE_SCHEDULE, updated);
        return updated;
      });
      // TODO: Sync to Supabase
    }, []),
    addMaintenanceLog: useCallback((log: Omit<MaintenanceLog, 'id'>) => {
      const newLog: MaintenanceLog = { ...log, id: generateUUID() };
      setMaintenanceLogs(prev => {
        const updated = [...prev, newLog];
        setToStorage(STORAGE_KEYS.MAINTENANCE_LOGS, updated);
        return updated;
      });
      // Update last performed date in schedule if linked
      if (log.scheduledTaskId) {
        setMaintenanceSchedules(prev => {
          const updated = prev.map(s => {
            if (s.id === log.scheduledTaskId) {
              // Calculate next due date based on frequency
              const lastDate = new Date(log.performedAt);
              const nextDate = new Date(lastDate);
              nextDate.setDate(lastDate.getDate() + s.frequencyDays);
              const nextDue = nextDate.toISOString().split('T')[0];

              return { ...s, lastPerformed: log.performedAt.split('T')[0], nextDue };
            }
            return s;
          });
          setToStorage(STORAGE_KEYS.MAINTENANCE_SCHEDULE, updated);
          return updated;
        });
      }
      // TODO: Sync to Supabase
    }, []),
    updateMaintenanceLog: useCallback((id: string, updates: Partial<MaintenanceLog>) => {
      setMaintenanceLogs(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, ...updates } : item);
        setToStorage(STORAGE_KEYS.MAINTENANCE_LOGS, updated);
        return updated;
      });
      // TODO: Sync to Supabase
    }, []),
    refreshEquipment: useCallback(async () => {
      // Placeholder for Supabase sync
    }, []),

    // Waste Tracking Actions
    wasteLogs,
    addWasteLog: useCallback(async (log: Omit<WasteLog, 'id' | 'createdAt' | 'totalLoss'>) => {
      const newLog: WasteLog = {
        ...log,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        totalLoss: log.quantity * log.costPerUnit
      };

      setWasteLogs(prev => {
        const updated = [newLog, ...prev];
        setToStorage(STORAGE_KEYS.WASTE_LOGS, updated);
        return updated;
      });

      // Optimistically update inventory
      const stockItem = inventory.find(i => i.id === log.stockId);
      if (stockItem) {
        // Use adjustStock if available via closure or implement logic here
        // Since adjustStock is defined above (we need to be sure), let's check.
        // Actually adjustStock is likely defined above.
        // But we are inside the value object... adjustStock is a property of this object?
        // No, adjustStock is defined as a function variable inside StoreProvider probably.
        // Let's assume we can call it if it was defined as a const before this object.
        // If adjustStock is defined INSIDE this object, we can't call it easily.
        // Let's look at how other actions behave. They use setState directly.
        // So I should replicate adjustStock logic here or call setInventory.

        const newQuantity = stockItem.currentQuantity - log.quantity;
        setInventory(prev => {
          const updated = prev.map(item => item.id === log.stockId ? { ...item, currentQuantity: newQuantity } : item);
          setToStorage(STORAGE_KEYS.INVENTORY, updated);
          return updated;
        });
      }

      // TODO: Sync to Supabase
      return { success: true };
    }, [inventory]), // depend on inventory
    refreshWasteLogs: useCallback(async () => {
      // Placeholder
    }, []),

    // Menu Categories
    menuCategories,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    getActiveCategories,

    // Payment Methods
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getEnabledPaymentMethods,

    // Tax Rates
    taxRates,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
    getDefaultTaxRate,
    getActiveTaxRates,

    // Cash Register
    cashRegisters,
    currentRegister,
    openRegister,
    closeRegister,
    checkRegisterStatus,
    refreshCashRegisters,

    // Utility
    isInitialized,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Helper hooks for specific modules
export function useInventory() {
  const store = useStore();
  return {
    inventory: store.inventory,
    inventoryLogs: store.inventoryLogs,
    weatherForecast: store.weatherForecast,
    addStockItem: store.addStockItem,
    updateStockItem: store.updateStockItem,
    deleteStockItem: store.deleteStockItem,
    adjustStock: store.adjustStock,
    wasteLogs: store.wasteLogs,
    addWasteLog: store.addWasteLog,
    refreshInventory: store.refreshInventory,
    getRestockSuggestions: store.getRestockSuggestions,
    isInitialized: store.isInitialized,

  };
}

export function useStaff() {
  const store = useStore();
  return {
    staff: store.staff,
    attendance: store.attendance,
    addStaff: store.addStaff,
    updateStaff: store.updateStaff,
    deleteStaff: store.deleteStaff,
    clockIn: store.clockIn,
    clockOut: store.clockOut,
    getStaffAttendanceToday: store.getStaffAttendanceToday,
    refreshStaff: store.refreshStaff,
    refreshAttendance: store.refreshAttendance,
    isInitialized: store.isInitialized,
  };
}

export function useOrders() {
  const store = useStore();
  return {
    orders: store.orders,
    addOrder: store.addOrder,
    updateOrderStatus: store.updateOrderStatus,
    getTodayOrders: store.getTodayOrders,
    refreshOrders: store.refreshOrders,
    isInitialized: store.isInitialized,
  };
}

export function useFinance() {
  const store = useStore();
  return {
    expenses: store.expenses,
    cashFlows: store.cashFlows,
    addExpense: store.addExpense,
    updateExpense: store.updateExpense,
    deleteExpense: store.deleteExpense,
    updateCashFlow: store.updateCashFlow,
    getTodayCashFlow: store.getTodayCashFlow,
    getMonthlyExpenses: store.getMonthlyExpenses,
    getMonthlyRevenue: store.getMonthlyRevenue,
    refreshExpenses: store.refreshExpenses,
    refreshCashFlows: store.refreshCashFlows,
    orders: store.orders,
    isInitialized: store.isInitialized,
  };
}

export function useCustomers() {
  const store = useStore();
  return {
    customers: store.customers,
    addCustomer: store.addCustomer,
    updateCustomer: store.updateCustomer,
    addLoyaltyPoints: store.addLoyaltyPoints,
    redeemLoyaltyPoints: store.redeemLoyaltyPoints,
    refreshCustomers: store.refreshCustomers,
    isInitialized: store.isInitialized,
  };
}

export function useSuppliers() {
  const store = useStore();
  return {
    suppliers: store.suppliers,
    purchaseOrders: store.purchaseOrders,
    addSupplier: store.addSupplier,
    updateSupplier: store.updateSupplier,
    deleteSupplier: store.deleteSupplier,
    addPurchaseOrder: store.addPurchaseOrder,
    updatePurchaseOrderStatus: store.updatePurchaseOrderStatus,
    markPurchaseOrderAsPaid: store.markPurchaseOrderAsPaid,
    refreshSuppliers: store.refreshSuppliers,
    refreshPurchaseOrders: store.refreshPurchaseOrders,
    inventory: store.inventory,
    isInitialized: store.isInitialized,
  };
}

export function useRecipes() {
  const store = useStore();
  return {
    recipes: store.recipes,
    addRecipe: store.addRecipe,
    updateRecipe: store.updateRecipe,
    deleteRecipe: store.deleteRecipe,
    refreshRecipes: store.refreshRecipes,
    inventory: store.inventory,
    isInitialized: store.isInitialized,
  };
}

export function useSchedules() {
  const store = useStore();
  return {
    shifts: store.shifts,
    schedules: store.schedules,
    staff: store.staff,
    addShift: store.addShift,
    updateShift: store.updateShift,
    deleteShift: store.deleteShift,
    addScheduleEntry: store.addScheduleEntry,
    updateScheduleEntry: store.updateScheduleEntry,
    deleteScheduleEntry: store.deleteScheduleEntry,
    getWeekSchedule: store.getWeekSchedule,
    refreshSchedules: store.refreshSchedules,
    isInitialized: store.isInitialized,
  };
}

export function usePromotions() {
  const store = useStore();
  return {
    promotions: store.promotions,
    addPromotion: store.addPromotion,
    updatePromotion: store.updatePromotion,
    deletePromotion: store.deletePromotion,
    validatePromoCode: store.validatePromoCode,
    refreshPromotions: store.refreshPromotions,
    isInitialized: store.isInitialized,
  };
}

export function useNotifications() {
  const store = useStore();
  return {
    notifications: store.notifications,
    addNotification: store.addNotification,
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    deleteNotification: store.deleteNotification,
    getUnreadCount: store.getUnreadCount,
    refreshNotifications: store.refreshNotifications,
    refreshAnnouncements: store.refreshAnnouncements,
    isInitialized: store.isInitialized,
  };
}

export function useMenu() {
  const store = useStore();
  return {
    menuItems: store.menuItems,
    modifierGroups: store.modifierGroups,
    modifierOptions: store.modifierOptions,
    addMenuItem: store.addMenuItem,
    updateMenuItem: store.updateMenuItem,
    deleteMenuItem: store.deleteMenuItem,
    toggleMenuItemAvailability: store.toggleMenuItemAvailability,
    getMenuCategories: store.getMenuCategories,
    addModifierGroup: store.addModifierGroup,
    updateModifierGroup: store.updateModifierGroup,
    deleteModifierGroup: store.deleteModifierGroup,
    addModifierOption: store.addModifierOption,
    updateModifierOption: store.updateModifierOption,
    deleteModifierOption: store.deleteModifierOption,
    getOptionsForGroup: store.getOptionsForGroup,
    refreshMenu: store.refreshMenu,
    isInitialized: store.isInitialized,
  };
}

export function useKPI() {
  const store = useStore();
  return {
    staffKPI: store.staffKPI,
    leaveRecords: store.leaveRecords,
    trainingRecords: store.trainingRecords,
    otRecords: store.otRecords,
    customerReviews: store.customerReviews,
    staff: store.staff,
    getStaffKPI: store.getStaffKPI,
    getStaffKPIHistory: store.getStaffKPIHistory,
    updateStaffKPI: store.updateStaffKPI,
    recalculateKPIRankings: store.recalculateKPIRankings,
    getKPILeaderboard: store.getKPILeaderboard,
    addLeaveRecord: store.addLeaveRecord,
    updateLeaveRecord: store.updateLeaveRecord,
    addTrainingRecord: store.addTrainingRecord,
    updateTrainingRecord: store.updateTrainingRecord,
    addOTRecord: store.addOTRecord,
    updateOTRecord: store.updateOTRecord,
    addCustomerReview: store.addCustomerReview,
    getStaffReviews: store.getStaffReviews,
    getStaffBonus: store.getStaffBonus,
    isInitialized: store.isInitialized,
  };
}

export function useStaffPortal() {
  const store = useStore();
  return {
    // Checklist
    checklistTemplates: store.checklistTemplates,
    checklistCompletions: store.checklistCompletions,
    addChecklistTemplate: store.addChecklistTemplate,
    updateChecklistTemplate: store.updateChecklistTemplate,
    deleteChecklistTemplate: store.deleteChecklistTemplate,
    getChecklistTemplatesByType: store.getChecklistTemplatesByType,
    startChecklist: store.startChecklist,
    updateChecklistItem: store.updateChecklistItem,
    completeChecklist: store.completeChecklist,
    getTodayChecklist: store.getTodayChecklist,
    // Leave
    leaveBalances: store.leaveBalances,
    leaveRequests: store.leaveRequests,
    getLeaveBalance: store.getLeaveBalance,
    addLeaveRequest: store.addLeaveRequest,
    updateLeaveRequest: store.updateLeaveRequest,
    approveLeaveRequest: store.approveLeaveRequest,
    rejectLeaveRequest: store.rejectLeaveRequest,
    getStaffLeaveRequests: store.getStaffLeaveRequests,
    getPendingLeaveRequests: store.getPendingLeaveRequests,
    refreshLeaveRequests: store.refreshLeaveRequests,
    // Claims
    claimRequests: store.claimRequests,
    addClaimRequest: store.addClaimRequest,
    updateClaimRequest: store.updateClaimRequest,
    approveClaimRequest: store.approveClaimRequest,
    rejectClaimRequest: store.rejectClaimRequest,
    markClaimAsPaid: store.markClaimAsPaid,
    getStaffClaimRequests: store.getStaffClaimRequests,
    getPendingClaimRequests: store.getPendingClaimRequests,
    refreshClaimRequests: store.refreshClaimRequests,
    // OT Claims
    otClaims: store.otClaims,
    addOTClaim: store.addOTClaim,
    updateOTClaim: store.updateOTClaim,
    approveOTClaim: store.approveOTClaim,
    rejectOTClaim: store.rejectOTClaim,
    markOTClaimAsPaid: store.markOTClaimAsPaid,
    getStaffOTClaims: store.getStaffOTClaims,
    getPendingOTClaims: store.getPendingOTClaims,
    // Salary Advances
    salaryAdvances: store.salaryAdvances,
    addSalaryAdvance: store.addSalaryAdvance,
    approveSalaryAdvance: store.approveSalaryAdvance,
    rejectSalaryAdvance: store.rejectSalaryAdvance,
    markSalaryAdvanceAsDeducted: store.markSalaryAdvanceAsDeducted,
    getStaffSalaryAdvances: store.getStaffSalaryAdvances,
    getPendingSalaryAdvances: store.getPendingSalaryAdvances,
    getApprovedSalaryAdvances: store.getApprovedSalaryAdvances,
    // Staff Requests
    staffRequests: store.staffRequests,
    addStaffRequest: store.addStaffRequest,
    updateStaffRequest: store.updateStaffRequest,
    completeStaffRequest: store.completeStaffRequest,
    rejectStaffRequest: store.rejectStaffRequest,
    getStaffRequestsByStaff: store.getStaffRequestsByStaff,
    getPendingStaffRequests: store.getPendingStaffRequests,
    refreshStaffRequests: store.refreshStaffRequests,
    refreshChecklistTemplates: store.refreshChecklistTemplates,
    refreshChecklistCompletions: store.refreshChecklistCompletions,

    // Announcements
    announcements: store.announcements,
    addAnnouncement: store.addAnnouncement,
    updateAnnouncement: store.updateAnnouncement,
    deleteAnnouncement: store.deleteAnnouncement,
    getActiveAnnouncements: store.getActiveAnnouncements,
    // Staff & Schedule (for reference)
    staff: store.staff,
    schedules: store.schedules,
    shifts: store.shifts,
    getWeekSchedule: store.getWeekSchedule,
    // Utility
    isInitialized: store.isInitialized,
  };
}

export function useOrderHistory() {
  const store = useStore();
  return {
    // Order History
    orderHistory: store.orderHistory,
    getOrderHistory: store.getOrderHistory,
    getOrderById: store.getOrderById,

    // Void/Refund Requests
    voidRefundRequests: store.voidRefundRequests,
    requestVoid: store.requestVoid,
    requestRefund: store.requestRefund,
    approveVoidRefund: store.approveVoidRefund,
    rejectVoidRefund: store.rejectVoidRefund,
    getPendingVoidRefundRequests: store.getPendingVoidRefundRequests,
    getVoidRefundRequestsByStaff: store.getVoidRefundRequestsByStaff,
    getPendingVoidRefundCount: store.getPendingVoidRefundCount,
    refreshVoidRefundRequests: store.refreshVoidRefundRequests,

    // Related data
    staff: store.staff,
    orders: store.orders,

    // Utility
    isInitialized: store.isInitialized,
  };
}

export function useEquipment() {
  const store = useStore();
  return {
    // Oil Trackers
    oilTrackers: store.oilTrackers,
    oilChangeRequests: store.oilChangeRequests,
    oilActionHistory: store.oilActionHistory,
    addOilTracker: store.addOilTracker,
    updateOilTracker: store.updateOilTracker,
    deleteOilTracker: store.deleteOilTracker,
    submitOilRequest: store.submitOilRequest,
    approveOilRequest: store.approveOilRequest,
    rejectOilRequest: store.rejectOilRequest,
    getPendingOilRequests: store.getPendingOilRequests,
    getOilRequestsByStaff: store.getOilRequestsByStaff,
    getPendingOilRequestCount: store.getPendingOilRequestCount,
    getOilActionHistory: store.getOilActionHistory,
    refreshOilTrackers: store.refreshOilTrackers,

    // NEW: Equipment & Maintenance
    equipment: store.equipment,
    maintenanceSchedules: store.maintenanceSchedules,
    maintenanceLogs: store.maintenanceLogs,
    addEquipment: store.addEquipment,
    updateEquipment: store.updateEquipment,
    deleteEquipment: store.deleteEquipment,
    addMaintenanceSchedule: store.addMaintenanceSchedule,
    updateMaintenanceSchedule: store.updateMaintenanceSchedule,
    addMaintenanceLog: store.addMaintenanceLog,
    updateMaintenanceLog: store.updateMaintenanceLog,
    refreshEquipment: store.refreshEquipment,

    // Related data
    staff: store.staff,

    // Utility
    isInitialized: store.isInitialized,
  };
}

export function useMenuCategories() {
  const store = useStore();
  return {
    menuCategories: store.menuCategories,
    addMenuCategory: store.addMenuCategory,
    updateMenuCategory: store.updateMenuCategory,
    deleteMenuCategory: store.deleteMenuCategory,
    getActiveCategories: store.getActiveCategories,
    isInitialized: store.isInitialized,
  };
}

export function usePaymentMethods() {
  const store = useStore();
  return {
    paymentMethods: store.paymentMethods,
    addPaymentMethod: store.addPaymentMethod,
    updatePaymentMethod: store.updatePaymentMethod,
    deletePaymentMethod: store.deletePaymentMethod,
    getEnabledPaymentMethods: store.getEnabledPaymentMethods,
    isInitialized: store.isInitialized,
  };
}

export function useTaxRates() {
  const store = useStore();
  return {
    taxRates: store.taxRates,
    addTaxRate: store.addTaxRate,
    updateTaxRate: store.updateTaxRate,
    deleteTaxRate: store.deleteTaxRate,
    getDefaultTaxRate: store.getDefaultTaxRate,
    getActiveTaxRates: store.getActiveTaxRates,
    isInitialized: store.isInitialized,
  };
}
