// Services Index - Central export for all services

// PDF Report Generator
export {
  generatePrintableReport,
  printReport,
  generateDailySalesReport,
  generateInventoryReport,
  generateStaffAttendanceReport,
  generateExpenseReport,
} from './pdf-generator';
export type { ReportData } from './pdf-generator';

// Excel Export
export {
  exportToCSV,
  exportOrders,
  exportInventory,
  exportStaff,
  exportExpenses,
  exportCustomers,
  exportAttendance,
  exportAllData,
} from './excel-export';
export type { ExportColumn, ExportOptions } from './excel-export';

// WhatsApp Integration
export {
  isWhatsAppConfigured,
  getWhatsAppConfig,
  saveWhatsAppConfig,
  formatPhoneNumber,
  generateOrderReceiptMessage,
  generateOrderReadyMessage,
  generateLowStockAlertMessage,
  generateDailySummaryMessage,
  sendWhatsAppMessage,
  openWhatsAppWeb,
  sendReceiptViaWhatsAppWeb,
} from './whatsapp';
export type { WhatsAppConfig, WhatsAppMessage, WhatsAppTemplate } from './whatsapp';

// Multi-Outlet Management
export {
  getOutlets,
  getCurrentOutlet,
  setCurrentOutlet,
  addOutlet,
  updateOutlet,
  deleteOutlet,
  getOutletById,
  isOutletOpen,
  generateHQDashboardStats,
  getOutletStorageKey,
} from './multi-outlet';
export type { Outlet, OutletStats } from './multi-outlet';

// AI Forecasting
export {
  generateSalesForecast,
  generateItemForecast,
  generateReorderSuggestions,
  generateInsights,
  getForecastSummary,
} from './forecasting';
export type {
  SalesDataPoint,
  ForecastResult,
  ItemForecast,
  StockReorderSuggestion,
  ForecastSummary,
} from './forecasting';

