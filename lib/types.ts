// Core Type Definitions

export type UserRole = 'admin' | 'manager' | 'staff';

// Payment method type (defining early as it's used by Order)
export type PaymentMethod = 'cash' | 'bank' | 'card' | 'ewallet' | 'qr' | 'trf' | string;

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number; // Cost per unit for profit calculation
  image?: string;
  description?: string;
  ingredients?: string[]; // For inventory tracking
  isAvailable: boolean; // Sold out or available
  modifierGroupIds: string[]; // List of modifier groups for this item
}

// ==================== MODIFIER TYPES ====================

export interface ModifierGroup {
  id: string;
  name: string;           // "Pilih Sos", "Pilih Flavour"
  isRequired: boolean;    // Wajib pilih?
  allowMultiple: boolean; // Boleh pilih lebih dari satu?
  minSelection: number;   // Minimum pilihan (0 jika optional)
  maxSelection: number;   // Maximum pilihan
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;           // "Extra Cheese"
  extraPrice: number;     // 0 jika percuma, 1.00 jika +$1
  isAvailable: boolean;
  ingredients?: {
    stockItemId: string;
    quantity: number;
  }[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedModifiers: SelectedModifier[]; // Selected modifiers for this cart item
  itemTotal: number; // Base price + modifier prices
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: SelectedModifier[];
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  customerId?: string;          // Link ke registered customer
  customerName?: string;        // Nama pelanggan untuk personalize receipt
  customerPhone?: string;
  redeemedPoints?: number;      // Points redeemed for this order
  redemptionAmount?: number;    // Value deducted in currency (BND)
  orderType: 'takeaway' | 'gomamam' | 'dine-in' | 'delivery';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod?: PaymentMethod;
  createdAt: string;
  staffId?: string;
  staffName?: string; // Add staffName for history display
  // Staff speed tracking timestamps
  preparingStartedAt?: string;  // Bila staff mula prepare
  readyAt?: string;             // Bila order siap
  preparedByStaffId?: string;   // Staff mana yang prepare
  loyaltyPointsEarned?: number; // Points earned from this order (for void/refund reversal)
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  currentQuantity: number;
  minQuantity: number;
  unit: string;
  cost: number;
  supplier?: string;
  countDaily?: boolean; // Critical item to be counted during opening/closing
  // Tracking
  updatedAt?: string;
  lastRestockDate?: string;
  sku?: string;
  location?: string;
}

// ==================== STAFF PROFILE TYPES ====================

export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type EmploymentType = 'permanent' | 'contract' | 'part-time' | 'probation';
export type SalaryType = 'monthly' | 'hourly' | 'daily';
export type AccessLevel = 'admin' | 'manager' | 'staff';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  address?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface StatutoryContributions {
  // TAP - Tabung Amanah Pekerja (Brunei)
  tapEnabled?: boolean; // Toggle TAP on/off per staff
  tapNumber?: string;
  tapEmployeeRate?: number; // percentage (default 5%)
  tapEmployerRate?: number; // percentage (default 5%)
  // SCP - Supplemental Contribution Plan (Brunei)
  scpEnabled?: boolean; // Toggle SCP on/off per staff
  scpNumber?: string;
  scpEmployeeRate?: number; // percentage (default 3.5%)
  scpEmployerRate?: number; // percentage (default 3.5%)
  // For Malaysia compatibility
  epfNumber?: string;
  socsoNumber?: string;
  eisNumber?: string;
}

export interface LeaveEntitlement {
  annual: number;
  medical: number;
  emergency: number;
  maternity: number;
  paternity: number;
  compassionate: number;
  carryForwardDays: number;
}

export interface StaffPermissions {
  canApproveLeave: boolean;
  canApproveClaims: boolean;
  canViewReports: boolean;
  canManageStaff: boolean;
  canAccessPOS: boolean;
  canGiveDiscount: boolean;
  maxDiscountPercent: number;
  canVoidTransaction: boolean;
  canAccessInventory: boolean;
  canAccessFinance: boolean;
  canAccessKDS: boolean;
  canManageMenu: boolean;
}

export interface SchedulePreferences {
  defaultShiftId?: string;
  workDaysPerWeek: number;
  preferredOffDays: number[]; // 0-6 (Sun-Sat)
  maxOTHoursPerWeek: number;
  isFlexibleSchedule: boolean;
}

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface StaffDocument {
  id: string;
  staffId?: string;           // Added for standalone document management
  staffName?: string;         // Added for standalone document management
  type: 'ic_front' | 'ic_back' | 'contract' | 'resume' | 'offer_letter' | 'medical_report' | 'work_permit' | 'certificate' | 'other';
  name: string;
  description?: string;       // Added for document notes
  url: string;
  uploadedAt: string;
  expiryDate?: string;
  createdAt?: string;         // Added for tracking
}

// ==================== PERFORMANCE REVIEW TYPES ====================

export type ReviewPeriod = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type ReviewStatus = 'draft' | 'pending_acknowledgement' | 'completed';

export interface PerformanceReview {
  id: string;
  staffId: string;
  staffName: string;
  reviewerId: string;
  reviewerName: string;
  period: ReviewPeriod;
  periodStart: string;
  periodEnd: string;
  overallRating: number;  // 1-5
  punctuality: number;    // 1-5
  teamwork: number;       // 1-5
  productivity: number;   // 1-5
  communication: number;  // 1-5
  initiative: number;     // 1-5
  strengths?: string;
  improvements?: string;
  goals?: string;
  comments?: string;
  status: ReviewStatus;
  acknowledgedAt?: string;
  createdAt: string;
}

// ==================== ONBOARDING CHECKLIST TYPES ====================

export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

export interface OnboardingItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface OnboardingChecklist {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  dueDate?: string;
  items: OnboardingItem[];
  status: OnboardingStatus;
  notes?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
}

// ==================== EXIT INTERVIEW TYPES ====================

export type ExitReason = 'resignation' | 'termination' | 'contract_end' | 'retirement' | 'other';

export interface ExitInterview {
  id: string;
  staffId: string;
  staffName: string;
  exitDate: string;
  reason: ExitReason;
  reasonDetails?: string;
  overallExperience: number;  // 1-5
  managementRating: number;   // 1-5
  workEnvironment: number;    // 1-5
  careerGrowth: number;       // 1-5
  whatLiked?: string;
  whatDisliked?: string;
  suggestions?: string;
  wouldRecommend: boolean;
  interviewedBy?: string;
  interviewedByName?: string;
  createdAt: string;
}

// ==================== STAFF COMPLAINT TYPES ====================

export type ComplaintStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type ComplaintCategory = 'harassment' | 'misconduct' | 'safety' | 'management' | 'other';

export interface StaffComplaint {
  id: string;
  isAnonymous: boolean;
  staffId?: string;     // Null if anonymous
  staffName?: string;   // "Anonymous" if anonymous
  date: string;         // Incident date
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface StaffProfile {
  id: string;
  employeeNumber?: string;

  // === Personal Information ===
  name: string;
  icNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  religion?: string;
  maritalStatus?: MaritalStatus;
  address?: string;
  email?: string;
  phone: string;
  profilePhotoUrl?: string;

  // === Employment Details ===
  role: 'Manager' | 'Staff';
  position?: string;
  department?: string;
  employmentType?: EmploymentType;
  joinDate?: string;
  contractEndDate?: string;
  probationEndDate?: string;
  reportingTo?: string;
  workLocation?: string;
  status: 'active' | 'on-leave' | 'terminated';
  terminationDate?: string;
  terminationReason?: string;

  // === Authentication ===
  pin: string;

  // === Salary & Compensation ===
  salaryType?: SalaryType;
  baseSalary: number;
  hourlyRate: number;
  dailyRate?: number;
  overtimeRate?: number; // multiplier e.g. 1.5, 2.0
  allowances?: Allowance[];
  fixedDeductions?: Deduction[];
  paymentFrequency?: 'weekly' | 'biweekly' | 'monthly';

  // === Bank Details ===
  bankDetails?: BankDetails;

  // === Statutory Contributions (TAP/SCP for Brunei) ===
  statutoryContributions?: StatutoryContributions;

  // === Emergency Contact ===
  emergencyContact?: EmergencyContact;

  // === Leave Entitlement ===
  leaveEntitlement?: LeaveEntitlement;

  // === Permissions & Access ===
  accessLevel?: AccessLevel;
  permissions?: StaffPermissions;

  // === Schedule Preferences ===
  schedulePreferences?: SchedulePreferences;

  // === Documents ===
  documents?: StaffDocument[];

  // === Skills & Training ===
  skills?: string[];
  certifications?: string[];

  // === Additional Info ===
  uniformSize?: string;
  shoeSize?: string;
  dietaryRestrictions?: string;
  medicalConditions?: string;
  bloodType?: string;
  notes?: string;

  // === Performance ===
  performanceBadges?: string[];

  // === Metadata ===
  createdAt?: string;
  updatedAt?: string;

  // === Legacy fields for backward compatibility ===
  /** @deprecated Use statutoryContributions.epfNumber instead */
  epf?: string;
  /** @deprecated Use statutoryContributions.socsoNumber instead */
  socso?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakDuration: number; // in minutes
  photoProofUrl?: string;
  locationVerified?: boolean;
  actualLatitude?: number;
  actualLongitude?: number;
}

export interface ClockInData {
  staffId: string;
  pin: string;
  latitude?: number;
  longitude?: number;
  photo?: Blob | File;
}

export interface PayrollEntry {
  id: string;
  staffId: string;
  month: string;
  totalHours: number;
  otHours: number;
  deductions: number;
  finalPayout: number;
  baseSalary: number;
}

export interface OilTracker {
  fryerId: string;
  name: string;
  currentCycles: number;
  cycleLimit: number;
  lastChangedDate: string;
  lastTopupDate?: string;
  status: 'good' | 'warning' | 'critical';
  hasPendingRequest?: boolean;
}

export type OilActionType = 'change' | 'topup';
export type OilRequestStatus = 'pending' | 'approved' | 'rejected';

// Request dari staff (perlu approval)
export interface OilChangeRequest {
  id: string;
  fryerId: string;
  fryerName: string;
  actionType: OilActionType;
  requestedAt: string;
  requestedBy: string;
  previousCycles: number;
  proposedCycles: number;
  topupPercentage?: number;
  photoUrl: string;
  notes?: string;
  status: OilRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// History untuk tindakan yang sudah approved
export interface OilActionHistory {
  id: string;
  fryerId: string;
  fryerName: string;
  actionType: OilActionType;
  actionAt: string;
  previousCycles: number;
  newCycles: number;
  topupPercentage?: number;
  requestedBy: string;
  approvedBy: string;
  photoUrl: string;
}

// ==================== EQUIPMENT & MAINTENANCE TYPES ====================

export interface Equipment {
  id: string;
  name: string;
  type: 'fridge' | 'freezer' | 'ac' | 'grill' | 'fryer' | 'pos' | 'other';
  location: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: 'good' | 'warning' | 'critical' | 'maintenance' | 'broken' | 'retired';
  notes?: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  taskName: string;
  frequencyDays: number;
  lastPerformed?: string;
  nextDue: string;
  assignedRole?: string;
  isActive: boolean;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  scheduledTaskId?: string;
  type: 'routine' | 'repair' | 'issue';
  performedBy: string;
  performedByName: string;
  performedAt: string;
  notes?: string;
  cost: number;
  photoUrl?: string;
  status: 'completed' | 'pending' | 'in_progress';
}

export interface WasteLog {
  id: string;
  stockId: string;
  stockName?: string; // For UI display
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalLoss: number;
  reason: 'expired' | 'spilled' | 'burned' | 'customer_return' | 'staff_meal' | 'other';
  reportedBy: string;
  reportedByName: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface ProductionLog {
  id: string;
  date: string;
  item: string;
  quantityProduced: number;
  wasteAmount: number;
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  platform: 'Grab' | 'Panda' | 'Shopee';
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'picked_up';
  driverName?: string;
  driverPlate?: string;
  createdAt: string;
}

// ==================== FINANCE TYPES ====================

export type ExpenseCategory = 'rent' | 'utilities' | 'supplies' | 'wages' | 'marketing' | 'maintenance' | 'ingredients' | 'equipment' | 'other';
// PaymentMethod is defined at the top of this file

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  paymentMethod: PaymentMethod;
  vendor?: string;
  createdAt: string;
}

export interface DailyCashFlow {
  id: string;
  date: string;
  openingCash: number;
  salesCash: number;
  salesCard: number;
  salesEwallet: number;
  expensesCash: number;
  closingCash: number;
  notes?: string;
  closedBy?: string;
  closedAt?: string;
}

export interface CashRegister {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string; // Staff ID
  closedBy?: string; // Staff ID
  startCash: number;
  endCash?: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  notes?: string;
  status: 'open' | 'closed';
  outletId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== CASH PAYOUT (MONEY OUT) ====================

export type CashPayoutCategory = 'petty_cash' | 'refund' | 'change' | 'supplier' | 'other';

export interface CashPayout {
  id: string;
  amount: number;
  reason: string;
  category: CashPayoutCategory;
  performedBy: string;
  performedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  registerId?: string;
  outletId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


export interface ProfitLossReport {
  period: string; // YYYY-MM format
  revenue: {
    posSales: number;
    deliverySales: number;
    otherIncome: number;
    totalRevenue: number;
  };
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: {
    rent: number;
    utilities: number;
    wages: number;
    marketing: number;
    maintenance: number;
    supplies: number;
    other: number;
    totalExpenses: number;
  };
  netProfit: number;
  profitMargin: number;
}

// ==================== CUSTOMER TYPES ====================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  segment: 'new' | 'regular' | 'vip';
  notes?: string;
  createdAt: string;
  lastOrderAt?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem';
  points: number;
  orderId?: string;
  description: string;
  createdAt: string;
}

// ==================== SUPPLIER TYPES ====================

export interface SupplierAccountNumber {
  bankName: string;
  accountNumber: string;
  accountName?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  accountNumbers?: SupplierAccountNumber[];
  paymentTerms: 'cod' | 'net7' | 'net14' | 'net30';
  leadTimeDays: number;
  rating: number; // 1-5
  status: 'active' | 'inactive';
  category?: string[]; // Tags like "Ayam", "Minyak", "Packaging"
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid'; // Payment tracking
  paidAmount?: number; // Amount paid so far
  paidAt?: string; // When payment was made
  expectedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// ==================== RECIPE TYPES ====================

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  ingredients: RecipeIngredient[];
  totalCost: number;
  sellingPrice: number;
  profitMargin: number;
  instructions?: string;
  prepTime: number; // minutes
  yieldQuantity: number;
  yieldUnit: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

// ==================== SHIFT & SCHEDULE TYPES ====================

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDuration: number; // minutes
  color: string;
}

export interface ScheduleEntry {
  id: string;
  staffId: string;
  staffName: string;
  shiftId: string;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'cancelled';
  notes?: string;
}

// ==================== PROMOTION TYPES ====================

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'bogo' | 'free_item' | 'buy_x_get_y';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  promoCode?: string;
  applicableItems: string[]; // menu item IDs, empty = all items
  startDate: string;
  endDate: string;
  daysOfWeek?: number[]; // 0-6 (Sun-Sat)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  usageLimit?: number;
  usageCount: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  // Buy X Get Y fields
  buyQuantity?: number; // e.g. Buy 2
  getQuantity?: number; // e.g. Get 1
  getFreeItemId?: string; // ID of free item (null = same item)
  getDiscountPercent?: number; // e.g. 50% off the free item (100 = totally free)
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification {
  id: string;
  type: 'low_stock' | 'new_order' | 'equipment' | 'staff' | 'finance' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  targetRole?: UserRole;
  targetStaffId?: string;
}

// ==================== SETTINGS TYPES ====================

export interface OutletSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  operatingHours: {
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }[];
  taxRate: number;
  currency: string;
  timezone: string;
  receiptHeader?: string;
  receiptFooter?: string;
  logoUrl?: string;
}

// ==================== RECEIPT SETTINGS TYPES ====================

export type ReceiptWidth = '58mm' | '80mm';

export interface ReceiptSettings {
  // Logo
  logoTopUrl: string;
  logoBottomUrl: string;
  showLogoTop: boolean;
  showLogoBottom: boolean;

  // Business Info
  businessName: string;
  businessTagline: string;
  businessAddress: string;
  businessPhone: string;

  // Custom Content
  headerText: string;
  footerText: string;
  customMessage: string;

  // Social Media
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  showSocialMedia: boolean;

  // QR Code
  qrCodeUrl: string;
  showQrCode: boolean;
  qrCodeLabel: string;

  // Customer Display Options
  showCustomerName: boolean;
  showCustomerPhone: boolean;

  // Printing Options
  autoPrint: boolean;
  printKitchenSlip: boolean;
  openCashDrawer: boolean;
  receiptWidth: ReceiptWidth;
}

// ==================== PRINTER SETTINGS TYPES ====================

export type PrinterConnectionType = 'usb' | 'network' | 'bluetooth' | 'browser';
export type PrintMethod = 'webserial' | 'rawbt' | 'nokoprint' | 'posprinter' | 'bluetooth' | 'browser';

export interface PrinterSettings {
  isConnected: boolean;
  connectionType: PrinterConnectionType;
  printerName?: string;
  vendorId?: number;
  productId?: number;
  ipAddress?: string;
  port?: number;
  baudRate?: number;
  paperWidth: ReceiptWidth;
  autoCut: boolean;
  openDrawerOnCashPayment: boolean;
  useRawbt?: boolean; // Legacy - use printMethod instead
  printMethod?: PrintMethod; // Print method selector
}

// ==================== PIXEL & ANALYTICS SETTINGS ====================

export interface PixelConfig {
  id: string;
  name?: string; // Optional label for multiple pixels
  enabled: boolean;
}

export interface PixelSettings {
  // Facebook/Meta Pixel - supports multiple
  facebookPixels: PixelConfig[];

  // TikTok Pixel - supports multiple
  tiktokPixels: PixelConfig[];

  // Google Analytics 4 - supports multiple
  googleAnalytics: PixelConfig[];

  // Google Tag Manager - supports multiple
  googleTagManager: PixelConfig[];

  // Event tracking options
  trackPageViews: boolean;
  trackPurchases: boolean;
  trackAddToCart: boolean;
  trackCheckout: boolean;

  // Debug mode (logs events to console)
  debugMode: boolean;
}

export const DEFAULT_PIXEL_SETTINGS: PixelSettings = {
  facebookPixels: [],
  tiktokPixels: [],
  googleAnalytics: [],
  googleTagManager: [],
  trackPageViews: true,
  trackPurchases: true,
  trackAddToCart: true,
  trackCheckout: true,
  debugMode: false,
};

// Default receipt settings
export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  logoTopUrl: '',
  logoBottomUrl: '',
  showLogoTop: true,
  showLogoBottom: false,

  businessName: 'ABANGBOB',
  businessTagline: 'Nasi Lemak & Burger',
  businessAddress: '',
  businessPhone: '',

  headerText: '',
  footerText: 'Terima kasih!\nSila datang lagi',
  customMessage: '',

  instagram: '@abangbob.bn',
  facebook: '',
  tiktok: '',
  whatsapp: '',
  showSocialMedia: true,

  qrCodeUrl: '',
  showQrCode: false,
  qrCodeLabel: 'Scan untuk feedback',

  showCustomerName: true,
  showCustomerPhone: false,

  autoPrint: false,
  printKitchenSlip: true,
  openCashDrawer: true,
  receiptWidth: '80mm',
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  isConnected: false,
  connectionType: 'browser',
  paperWidth: '80mm',
  baudRate: 9600, // Default baud rate
  autoCut: true,
  openDrawerOnCashPayment: true,
};

// ==================== KPI & GAMIFICATION TYPES ====================

export type KPIMetricKey =
  | 'mealPrepTime'
  | 'attendance'
  | 'emergencyLeave'
  | 'upselling'
  | 'customerRating'
  | 'wasteReduction'
  | 'trainingComplete'
  | 'otWillingness';

export interface KPIMetrics {
  mealPrepTime: number;      // 0-100 - Masa penyediaan makanan
  attendance: number;         // 0-100 - Kehadiran on-time
  emergencyLeave: number;     // 0-100 - Kurang emergency leave/MC
  upselling: number;          // 0-100 - Upselling performance
  customerRating: number;     // 0-100 - Rating dari customer
  wasteReduction: number;     // 0-100 - Pengurangan pembaziran
  trainingComplete: number;   // 0-100 - Training selesai
  otWillingness: number;      // 0-100 - Sanggup kerja OT
}

export interface KPIMetricConfig {
  key: KPIMetricKey;
  label: string;
  labelBM: string;
  description: string;
  weight: number;             // Weight for overall score calculation
  icon: string;               // Icon name for display
  color: string;              // Color for charts
}

export interface StaffKPI {
  id: string;
  staffId: string;
  period: string;             // YYYY-MM format
  metrics: KPIMetrics;
  overallScore: number;       // 0-100 weighted average
  bonusAmount: number;        // RM bonus based on score
  rank: number;               // Ranking among all staff
  updatedAt: string;
}

export interface KPIConfig {
  baseBonus: number;          // Base bonus amount (RM)
  metricsConfig: KPIMetricConfig[];
}

export interface LeaveRecord {
  id: string;
  staffId: string;
  type: 'annual' | 'medical' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface TrainingRecord {
  id: string;
  staffId: string;
  name: string;
  description?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
  certificateUrl?: string;
}

export interface OTRecord {
  id: string;
  staffId: string;
  date: string;
  requestedBy: string;
  hoursRequested: number;
  accepted: boolean;
  reason?: string;
  createdAt: string;
}

// ==================== OT CLAIM TYPES ====================

export type OTClaimStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface OTClaim {
  id: string;
  staffId: string;
  staffName: string;
  date: string;           // Date OT was worked
  startTime: string;      // OT start time (e.g., "18:00")
  endTime: string;        // OT end time (e.g., "22:00")
  hoursWorked: number;    // Calculated hours
  hourlyRate: number;     // Staff's OT hourly rate
  multiplier: number;     // 1.5x, 2x etc
  totalAmount: number;    // hoursWorked * hourlyRate * multiplier
  reason: string;         // Why OT was needed
  status: OTClaimStatus;
  approvedBy?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
}

// ==================== SALARY ADVANCE TYPES ====================

export type SalaryAdvanceStatus = 'pending' | 'approved' | 'rejected' | 'deducted';

export interface SalaryAdvance {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  reason: string;
  status: SalaryAdvanceStatus;
  approvedBy?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  deductedMonth?: string;      // Month when deducted from salary (e.g., "2024-01")
  createdAt: string;
}

// ==================== DISCIPLINARY ACTION TYPES ====================

export type DisciplinaryActionType = 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'termination';

export interface DisciplinaryAction {
  id: string;
  staffId: string;
  staffName: string;
  type: DisciplinaryActionType;
  reason: string;
  details?: string;
  issuedBy: string;
  issuedByName: string;
  issuedAt: string;
  acknowledgedAt?: string;  // When staff acknowledged the warning
  createdAt: string;
}

// ==================== STAFF TRAINING TYPES ====================

export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'expired';

export interface StaffTraining {
  id: string;
  staffId: string;
  staffName: string;
  courseName: string;
  provider: string;
  category: 'food_safety' | 'health_safety' | 'customer_service' | 'technical' | 'compliance' | 'other';
  scheduledDate?: string;
  completedAt?: string;
  expiresAt?: string;
  certificateNumber?: string;
  notes?: string;
  status: TrainingStatus;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  orderId: string;
  staffId?: string;
  rating: number;             // 1-5 stars
  comment?: string;
  createdAt: string;
}

// ==================== CHECKLIST TYPES ====================

export interface ChecklistItemTemplate {
  id: string;
  type: 'opening' | 'closing';
  title: string;
  description?: string;
  requirePhoto: boolean;
  requireNotes: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface ChecklistCompletion {
  id: string;
  date: string;
  type: 'opening' | 'closing';
  staffId: string;
  staffName: string;
  shiftId: string;
  items: ChecklistItemCompletion[];
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'incomplete';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ChecklistItemCompletion {
  templateId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  photoUrl?: string;
  notes?: string;
}

// ==================== ENHANCED LEAVE TYPES ====================

export type LeaveType =
  | 'annual'
  | 'medical'
  | 'emergency'
  | 'unpaid'
  | 'maternity'
  | 'paternity'
  | 'compassionate'
  | 'replacement'
  | 'study';

export interface LeaveBalance {
  id: string;
  staffId: string;
  year: number;
  annual: { entitled: number; taken: number; pending: number; balance: number };
  medical: { entitled: number; taken: number; pending: number; balance: number };
  emergency: { entitled: number; taken: number; pending: number; balance: number };
  maternity: { entitled: number; taken: number; pending: number; balance: number };
  paternity: { entitled: number; taken: number; pending: number; balance: number };
  compassionate: { entitled: number; taken: number; pending: number; balance: number };
  unpaid: { taken: number }; // no limit
  replacement: { entitled: number; taken: number; pending: number; balance: number };
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  duration: number; // days
  isHalfDay: boolean;
  halfDayType?: 'morning' | 'afternoon';
  reason: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ==================== CLAIM TYPES ====================

export type ClaimType =
  | 'medical'
  | 'transport'
  | 'meal'
  | 'training'
  | 'phone'
  | 'uniform'
  | 'equipment'
  | 'mileage'
  | 'other';

export interface ClaimRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: ClaimType;
  amount: number;
  description: string;
  receiptUrls: string[];
  claimDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';

  // Mileage Specific
  category?: 'general' | 'mileage';
  odometerStart?: number;
  odometerEnd?: number;
  distanceKm?: number;
  ratePerKm?: number; // Snapshot of rate
  locations?: string; // From -> To

  approvedBy?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
}

// ==================== STAFF REQUEST TYPES ====================

export type RequestCategory =
  | 'shift_swap'
  | 'off_day'
  | 'ot_request'
  | 'schedule_change'
  | 'salary_advance'
  | 'payslip'
  | 'letter'
  | 'training'
  | 'equipment'
  | 'complaint'
  | 'resignation'
  | 'bank_change'
  | 'other';

export interface StaffRequest {
  id: string;
  staffId: string;
  staffName: string;
  category: RequestCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  assigneeName?: string;
  responseNote?: string;
  createdAt: string;
  completedAt?: string;
}

// ==================== ANNOUNCEMENT TYPES ====================

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  targetRoles: ('Manager' | 'Staff')[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

// ==================== ORDER HISTORY & VOID/REFUND TYPES ====================

export type VoidRefundType = 'void' | 'refund' | 'partial_refund';
export type VoidRefundRequestStatus = 'pending' | 'approved' | 'rejected';
export type OrderVoidRefundStatus = 'none' | 'pending_void' | 'pending_refund' | 'voided' | 'refunded' | 'partial_refund';

export interface RefundItem {
  itemId: string;
  itemName: string;
  quantity: number;
  amount: number;
}

export interface VoidRefundRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  type: VoidRefundType;
  reason: string;
  amount?: number; // For refunds
  itemsToRefund?: RefundItem[];

  // Requester info
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;

  // Approval info
  status: VoidRefundRequestStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Reversal tracking
  salesReversed: boolean;
  inventoryReversed: boolean;
  reversalDetails?: {
    salesDeducted: number;
    inventoryItems: { itemId: string; itemName: string; quantity: number }[];
  };

  createdAt: string;
  updatedAt?: string;
}

// Extended Order with history-specific fields
export interface OrderHistoryItem extends Order {
  cashierId?: string;
  cashierName?: string;
  outletId?: string;
  outletName?: string;

  // Void/Refund status
  voidRefundStatus: OrderVoidRefundStatus;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  refundedByName?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidedByName?: string;

  // Pending request (if any)
  pendingRequest?: VoidRefundRequest;

  // Sync info
  isSyncedOffline?: boolean;
}

// Order Status for history (extended)
export type OrderHistoryStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'voided'
  | 'refunded'
  | 'partial_refund'
  | 'pending_void'
  | 'pending_refund';

// Filter state for order history
export interface OrderHistoryFilters {
  dateRange: { start: string; end: string };
  status: OrderHistoryStatus | 'all';
  paymentMethod: string | 'all';
  orderType: string | 'all';
  outletId: string | 'all';
  staffId: string | 'all';
  searchQuery: string;
}

// Order item for granular tracking
export interface OrderItemRecord {
  id: string;
  orderId: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  modifiers: SelectedModifier[];
  isRefunded: boolean;
  createdAt: string;
}

// Payment record
export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'qr' | 'ewallet';
  status: 'completed' | 'refunded' | 'voided';
  referenceNumber?: string;
  createdAt: string;
}

// ==================== MENU CATEGORY TYPES ====================

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Default menu categories
export const DEFAULT_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat_1', name: 'Nasi Lemak', sortOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_2', name: 'Burger', sortOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_3', name: 'Minuman', sortOrder: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_4', name: 'Sides', sortOrder: 4, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_5', name: 'Dessert', sortOrder: 5, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_6', name: 'Alacart', sortOrder: 6, isActive: true, createdAt: new Date().toISOString() },
];

// ==================== PAYMENT METHOD CONFIG TYPES ====================

export interface PaymentMethodConfig {
  id: string;
  name: string;
  code: string;
  icon?: string;
  color: string;
  isEnabled: boolean;
  isSystem: boolean; // System payment methods cannot be deleted
  sortOrder: number;
  createdAt: string;
}

// Default payment methods
export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'pm_1', name: 'Tunai (Cash)', code: 'cash', color: '#22c55e', isEnabled: true, isSystem: true, sortOrder: 1, createdAt: new Date().toISOString() },
  { id: 'pm_2', name: 'Kad (Card)', code: 'card', color: '#3b82f6', isEnabled: true, isSystem: true, sortOrder: 2, createdAt: new Date().toISOString() },
  { id: 'pm_3', name: 'QR Code', code: 'qr', color: '#8b5cf6', isEnabled: true, isSystem: true, sortOrder: 3, createdAt: new Date().toISOString() },
  { id: 'pm_4', name: 'DST Pay', code: 'dstpay', color: '#f97316', isEnabled: false, isSystem: false, sortOrder: 4, createdAt: new Date().toISOString() },
  { id: 'pm_5', name: 'BIBD Pay', code: 'bibdpay', color: '#0891b2', isEnabled: false, isSystem: false, sortOrder: 5, createdAt: new Date().toISOString() },
];

// ==================== TAX RATE TYPES ====================

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // Percentage (e.g., 6 for 6%)
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

// Default tax rates
export const DEFAULT_TAX_RATES: TaxRate[] = [
  { id: 'tax_1', name: 'Tiada Cukai', rate: 0, description: 'Tanpa cukai', isDefault: true, isActive: true, createdAt: new Date().toISOString() },
];

// ==================== STAFF ADVANCE TYPES ====================

export type StaffAdvanceStatus = 'pending' | 'approved' | 'rejected' | 'deducted';

export interface StaffAdvance {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  advanceDate: string;
  reason?: string;
  status: StaffAdvanceStatus;
  deductionMonth?: string; // YYYY-MM format for when it will be deducted
  deductionAmount?: number; // Amount to deduct per month (for installments)
  remainingBalance?: number; // Remaining amount to be deducted
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

// ==================== EVENT CHECKLIST TYPES ====================

export type EventChecklistStatus = 'preparing' | 'packed' | 'dispatched' | 'returned' | 'completed';

export interface EventChecklistItem {
  id: string;
  name: string;
  quantity: number;
  packed: boolean;
  packedQuantity?: number;
  notes?: string;
}

export interface EventChecklist {
  id: string;
  eventName: string;
  eventDate?: string;
  eventEndDate?: string;
  location?: string;
  boothNumber?: string;
  items: EventChecklistItem[];
  totalItems: number;
  packedItems: number;
  status: EventChecklistStatus;
  preparedBy?: string;
  preparedByName?: string;
  checkedBy?: string;
  checkedByName?: string;
  notes?: string;
  outletId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== INTERVIEW CANDIDATE TYPES ====================

export type InterviewCandidateStatus = 'pending' | 'scheduled' | 'interviewed' | 'shortlisted' | 'hired' | 'rejected' | 'no_show';
export type InterviewSource = 'Walk-in' | 'Referral' | 'JobStreet' | 'Facebook' | 'Instagram' | 'WhatsApp' | 'LinkedIn' | 'Other';

export interface InterviewCandidate {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  icNumber?: string; // Malaysian IC number
  positionApplied: string;
  experienceYears: number;
  source?: InterviewSource | string;
  interviewDate?: string;
  interviewTime?: string;
  interviewerId?: string;
  interviewerName?: string;
  status: InterviewCandidateStatus;
  rating?: number; // 1-5
  strengths?: string;
  weaknesses?: string;
  expectedSalary?: number;
  availableStartDate?: string;
  notes?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== OUTLET TYPES ====================

export type OutletType = 'Main Outlet' | 'Outlet' | 'Event Venue' | 'Event Booth';

export interface Outlet {
  id: string;
  name: string;
  code: string;
  address?: string;
  type?: OutletType | string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
}

// ==================== INVENTORY TYPES ====================

export interface InventoryLog {
  id: string;
  stockItemId: string;
  stockItemName: string;
  type: 'in' | 'out' | 'adjustment' | 'initial';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  createdAt: string;
  createdBy?: string;
}

export interface StockSuggestion {
  stockId: string;
  stockName: string;
  currentQuantity: number;
  averageDailyUsage: number;
  suggestedReorderPoint: number;
  suggestedOrderQuantity: number;
  estimatedCost: number;
  supplier?: string;
}


// ==================== SOP WIZARD TYPES ====================

export interface SOPTemplate {
  id: string;
  title: string;
  description?: string;
  targetRole: string[];
  shiftType: 'morning' | 'mid' | 'night' | 'any';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface SOPStep {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  stepOrder: number;
  isRequired: boolean;
  requiresPhoto: boolean;
  requiresValue: boolean;
  valueType: 'boolean' | 'number' | 'text' | 'temperature' | 'currency';
  minValue?: number;
  maxValue?: number;
  inventoryItemId?: string;
  inventoryAction?: 'set_stock' | 'deduct' | 'add';
  createdAt: string;
  updatedAt?: string;
}

export interface SOPLog {
  id: string;
  templateId: string;
  staffId: string;
  shiftId?: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
  totalSteps: number;
  completedSteps: number;
  outletId?: string;
}

export interface SOPLogItem {
  id: string;
  logId: string;
  stepId: string;
  isChecked: boolean;
  inputValue?: string;
  photoUrl?: string; // base64 or url
  completedAt: string;
  notes?: string;
}
