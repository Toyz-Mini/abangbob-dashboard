// Services Index - Central export for all services

// PDF Report Generator
export {
  generatePrintableReport,
  printReport,
  generateDailySalesReport,
  generateInventoryReport,
  generateStaffAttendanceReport,
  generateExpenseReport,
  generatePayslipHTML,
  printPayslip,
  downloadPayslipPDF,
} from './pdf-generator';
export type { ReportData, PayslipData } from './pdf-generator';

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

// Thermal Printer Service
export {
  thermalPrinter,
  ThermalPrinterService,
  ESCPOS,
} from './thermal-printer';
export type { ThermalPrinterConnection } from './thermal-printer';

// Receipt Generator
export {
  generateReceiptData,
  generateKitchenSlipData,
  saveReceiptSettings,
  loadReceiptSettings,
  loadReceiptSettingsFromSupabase,
  savePrinterSettings,
  loadPrinterSettings,
  loadPrinterSettingsFromSupabase,
  formatDateTime,
  formatTime,
  calculateSubtotal,
  getPaymentMethodLabel,
} from './receipt-generator';
export type { ReceiptLine, ReceiptData } from './receipt-generator';

// Network Utilities
export {
  isOnline,
  NetworkError,
  withRetry,
  fetchWithTimeout,
  saveDraft,
  loadDraft,
  clearDraft,
  getNetworkErrorMessage,
  safeApiCall,
  isRetryableError,
  debounceAsync,
  requestQueue,
  generateTransactionId,
  isTransactionSubmitted,
  markTransactionSubmitted,
  clearTransaction,
} from './network';
export type { ApiResult } from './network';

