// Multi-Outlet Management Service
// Foundation for managing multiple outlet locations

export interface Outlet {
  id: string;
  name: string;
  code: string; // Short code like "HQ", "KB", "TT"
  address: string;
  phone: string;
  email?: string;
  isHeadquarters: boolean;
  isActive: boolean;
  timezone: string;
  currency: string;
  operatingHours: {
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }[];
  settings: {
    taxRate: number;
    receiptHeader?: string;
    receiptFooter?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OutletStats {
  outletId: string;
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  staffOnDuty: number;
}

// Storage key
const OUTLETS_STORAGE_KEY = 'abangbob_outlets';
const CURRENT_OUTLET_KEY = 'abangbob_current_outlet';

// Default headquarters outlet
const DEFAULT_HQ_OUTLET: Outlet = {
  id: 'outlet_hq',
  name: 'AbangBob HQ',
  code: 'HQ',
  address: 'Lot 123, Simpang 456, Kampung ABC, Brunei',
  phone: '+673 712 3456',
  email: 'order@abangbob.com',
  isHeadquarters: true,
  isActive: true,
  timezone: 'Asia/Brunei',
  currency: 'BND',
  operatingHours: [
    { dayOfWeek: 0, isOpen: false, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '22:00' },
  ],
  settings: {
    taxRate: 0,
    receiptHeader: 'ABANGBOB\nNasi Lemak & Burger',
    receiptFooter: 'Terima kasih!\nSila datang lagi',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Get all outlets
export function getOutlets(): Outlet[] {
  if (typeof window === 'undefined') return [DEFAULT_HQ_OUTLET];
  
  const stored = localStorage.getItem(OUTLETS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with HQ
  localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify([DEFAULT_HQ_OUTLET]));
  return [DEFAULT_HQ_OUTLET];
}

// Get current outlet
export function getCurrentOutlet(): Outlet {
  if (typeof window === 'undefined') return DEFAULT_HQ_OUTLET;
  
  const outlets = getOutlets();
  const currentId = localStorage.getItem(CURRENT_OUTLET_KEY);
  
  if (currentId) {
    const current = outlets.find(o => o.id === currentId);
    if (current) return current;
  }
  
  // Default to HQ or first outlet
  const hq = outlets.find(o => o.isHeadquarters);
  return hq || outlets[0] || DEFAULT_HQ_OUTLET;
}

// Set current outlet
export function setCurrentOutlet(outletId: string): void {
  localStorage.setItem(CURRENT_OUTLET_KEY, outletId);
}

// Add new outlet
export function addOutlet(outlet: Omit<Outlet, 'id' | 'createdAt' | 'updatedAt'>): Outlet {
  const outlets = getOutlets();
  
  const newOutlet: Outlet = {
    ...outlet,
    id: `outlet_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  outlets.push(newOutlet);
  localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(outlets));
  
  return newOutlet;
}

// Update outlet
export function updateOutlet(outletId: string, updates: Partial<Outlet>): Outlet | null {
  const outlets = getOutlets();
  const index = outlets.findIndex(o => o.id === outletId);
  
  if (index === -1) return null;
  
  outlets[index] = {
    ...outlets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(outlets));
  return outlets[index];
}

// Delete outlet
export function deleteOutlet(outletId: string): boolean {
  const outlets = getOutlets();
  const outlet = outlets.find(o => o.id === outletId);
  
  // Cannot delete HQ
  if (outlet?.isHeadquarters) return false;
  
  const filtered = outlets.filter(o => o.id !== outletId);
  localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(filtered));
  
  // If deleted outlet was current, switch to HQ
  if (localStorage.getItem(CURRENT_OUTLET_KEY) === outletId) {
    const hq = filtered.find(o => o.isHeadquarters);
    if (hq) setCurrentOutlet(hq.id);
  }
  
  return true;
}

// Get outlet by ID
export function getOutletById(outletId: string): Outlet | null {
  const outlets = getOutlets();
  return outlets.find(o => o.id === outletId) || null;
}

// Check if outlet is open now
export function isOutletOpen(outlet: Outlet): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  const todayHours = outlet.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
  
  if (!todayHours || !todayHours.isOpen) return false;
  
  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
}

// Generate aggregate stats for HQ dashboard
export function generateHQDashboardStats(outletStats: OutletStats[]): {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  outletPerformance: { outletId: string; outletName: string; sales: number; orders: number }[];
  topItemsAcrossOutlets: { name: string; quantity: number; revenue: number }[];
} {
  const outlets = getOutlets();
  
  const totalSales = outletStats.reduce((sum, s) => sum + s.totalSales, 0);
  const totalOrders = outletStats.reduce((sum, s) => sum + s.totalOrders, 0);
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Aggregate performance by outlet
  const outletPerformance = outlets.map(outlet => {
    const stats = outletStats.filter(s => s.outletId === outlet.id);
    return {
      outletId: outlet.id,
      outletName: outlet.name,
      sales: stats.reduce((sum, s) => sum + s.totalSales, 0),
      orders: stats.reduce((sum, s) => sum + s.totalOrders, 0),
    };
  }).sort((a, b) => b.sales - a.sales);
  
  // Aggregate top items
  const itemsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  outletStats.forEach(stat => {
    stat.topItems.forEach(item => {
      if (!itemsMap[item.name]) {
        itemsMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      itemsMap[item.name].quantity += item.quantity;
      itemsMap[item.name].revenue += item.revenue;
    });
  });
  
  const topItemsAcrossOutlets = Object.values(itemsMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    outletPerformance,
    topItemsAcrossOutlets,
  };
}

// Prefix storage keys with outlet ID for data segregation
export function getOutletStorageKey(baseKey: string, outletId?: string): string {
  const id = outletId || getCurrentOutlet().id;
  return `${baseKey}_${id}`;
}

