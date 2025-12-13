import { OilTracker, ProductionLog } from './types';

export const MOCK_OIL_TRACKERS: OilTracker[] = [
  {
    fryerId: '1',
    name: 'Fryer 1 - Ayam',
    currentCycles: 420,
    cycleLimit: 500,
    lastChangedDate: '2024-01-15',
    status: 'good',
  },
  {
    fryerId: '2',
    name: 'Fryer 2 - Kentang',
    currentCycles: 480,
    cycleLimit: 500,
    lastChangedDate: '2024-01-15',
    status: 'warning',
  },
  {
    fryerId: '3',
    name: 'Fryer 3 - Ikan',
    currentCycles: 510,
    cycleLimit: 500,
    lastChangedDate: '2024-01-15',
    status: 'critical',
  },
];

export const MOCK_PRODUCTION_LOGS: ProductionLog[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    item: 'Patty Burger',
    quantityProduced: 500,
    wasteAmount: 5,
    notes: 'All good quality',
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    item: 'Sambal',
    quantityProduced: 20,
    wasteAmount: 0.5,
    notes: 'Standard yield',
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0],
    item: 'Ayam Goreng',
    quantityProduced: 200,
    wasteAmount: 2,
    notes: 'Slight over-frying on batch 3',
  },
];

export function updateOilStatus(tracker: OilTracker): OilTracker {
  const percentage = (tracker.currentCycles / tracker.cycleLimit) * 100;
  let status: 'good' | 'warning' | 'critical' = 'good';
  
  if (percentage >= 100) {
    status = 'critical';
  } else if (percentage >= 80) {
    status = 'warning';
  }
  
  return { ...tracker, status };
}

export function addFryingCycles(fryerId: string, quantity: number): OilTracker | null {
  const tracker = MOCK_OIL_TRACKERS.find(t => t.fryerId === fryerId);
  if (!tracker) return null;
  
  const updated = {
    ...tracker,
    currentCycles: tracker.currentCycles + quantity,
  };
  
  return updateOilStatus(updated);
}

