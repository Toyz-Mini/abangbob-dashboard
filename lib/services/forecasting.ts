// AI Demand Forecasting Service
// Structure for predictive analytics and smart suggestions

export interface SalesDataPoint {
  date: string;
  dayOfWeek: number;
  revenue: number;
  orders: number;
  items: { id: string; name: string; quantity: number }[];
}

export interface ForecastResult {
  date: string;
  predictedRevenue: number;
  predictedOrders: number;
  confidence: number; // 0-100
  factors: string[];
}

export interface ItemForecast {
  itemId: string;
  itemName: string;
  predictedDemand: number;
  currentStock: number;
  daysUntilStockout: number;
  suggestedReorder: number;
  confidence: number;
}

export interface StockReorderSuggestion {
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  suggestedQuantity: number;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

// Calculate simple moving average
function movingAverage(data: number[], window: number): number {
  if (data.length < window) return data.reduce((a, b) => a + b, 0) / data.length;
  
  const recent = data.slice(-window);
  return recent.reduce((a, b) => a + b, 0) / window;
}

// Calculate weighted moving average (more weight on recent data)
function weightedMovingAverage(data: number[], window: number): number {
  if (data.length === 0) return 0;
  
  const recent = data.slice(-window);
  let weightSum = 0;
  let valueSum = 0;
  
  recent.forEach((value, index) => {
    const weight = index + 1; // More recent = higher weight
    weightSum += weight;
    valueSum += value * weight;
  });
  
  return valueSum / weightSum;
}

// Calculate day of week factor
function getDayOfWeekFactor(salesData: SalesDataPoint[], targetDayOfWeek: number): number {
  const byDayOfWeek: Record<number, number[]> = {};
  
  salesData.forEach(point => {
    if (!byDayOfWeek[point.dayOfWeek]) {
      byDayOfWeek[point.dayOfWeek] = [];
    }
    byDayOfWeek[point.dayOfWeek].push(point.revenue);
  });
  
  const avgByDay: Record<number, number> = {};
  let totalAvg = 0;
  let count = 0;
  
  Object.entries(byDayOfWeek).forEach(([day, revenues]) => {
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    avgByDay[parseInt(day)] = avg;
    totalAvg += avg;
    count++;
  });
  
  const overallAvg = totalAvg / count;
  const targetAvg = avgByDay[targetDayOfWeek] || overallAvg;
  
  return overallAvg > 0 ? targetAvg / overallAvg : 1;
}

// Generate sales forecast for upcoming days
export function generateSalesForecast(
  historicalData: SalesDataPoint[],
  daysAhead: number = 7
): ForecastResult[] {
  if (historicalData.length === 0) {
    return [];
  }

  const forecasts: ForecastResult[] = [];
  const revenues = historicalData.map(d => d.revenue);
  const orders = historicalData.map(d => d.orders);
  
  // Calculate base predictions
  const baseRevenue = weightedMovingAverage(revenues, 14);
  const baseOrders = weightedMovingAverage(orders, 14);
  
  // Calculate trend
  const recentAvg = movingAverage(revenues.slice(-7), 7);
  const olderAvg = movingAverage(revenues.slice(-14, -7), 7);
  const trend = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  
  for (let i = 1; i <= daysAhead; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dayOfWeek = targetDate.getDay();
    
    // Apply day of week factor
    const dayFactor = getDayOfWeekFactor(historicalData, dayOfWeek);
    
    // Apply trend factor (diminishing for further dates)
    const trendFactor = 1 + (trend * (1 / Math.sqrt(i)));
    
    const predictedRevenue = baseRevenue * dayFactor * trendFactor;
    const predictedOrders = Math.round(baseOrders * dayFactor * trendFactor);
    
    // Confidence decreases for further predictions
    const baseConfidence = Math.min(85, 50 + historicalData.length);
    const confidence = Math.max(30, baseConfidence - (i * 5));
    
    const factors: string[] = [];
    if (dayFactor > 1.1) factors.push(`Hari ${getDayName(dayOfWeek)} biasanya sibuk`);
    if (dayFactor < 0.9) factors.push(`Hari ${getDayName(dayOfWeek)} biasanya senyap`);
    if (trend > 0.05) factors.push('Trend jualan meningkat');
    if (trend < -0.05) factors.push('Trend jualan menurun');
    
    forecasts.push({
      date: targetDate.toISOString().split('T')[0],
      predictedRevenue: Math.round(predictedRevenue * 100) / 100,
      predictedOrders,
      confidence,
      factors: factors.length > 0 ? factors : ['Berdasarkan purata sejarah'],
    });
  }
  
  return forecasts;
}

// Get day name in Malay
function getDayName(dayOfWeek: number): string {
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  return days[dayOfWeek];
}

// Generate item demand forecast
export function generateItemForecast(
  salesData: SalesDataPoint[],
  inventory: Array<{
    id: string;
    name: string;
    currentQuantity: number;
    minQuantity: number;
    cost: number;
  }>,
  daysAhead: number = 7
): ItemForecast[] {
  // Aggregate item sales
  const itemSales: Record<string, number[]> = {};
  
  salesData.forEach(point => {
    point.items.forEach(item => {
      if (!itemSales[item.id]) {
        itemSales[item.id] = [];
      }
      itemSales[item.id].push(item.quantity);
    });
  });
  
  return inventory.map(item => {
    const sales = itemSales[item.id] || [];
    const avgDailyDemand = sales.length > 0 
      ? weightedMovingAverage(sales, 7) 
      : 0;
    
    const predictedDemand = Math.ceil(avgDailyDemand * daysAhead);
    const daysUntilStockout = avgDailyDemand > 0 
      ? Math.floor(item.currentQuantity / avgDailyDemand)
      : 999;
    
    // Suggest reorder if stockout within 7 days
    const suggestedReorder = daysUntilStockout <= 7 
      ? Math.ceil(avgDailyDemand * 14) - item.currentQuantity
      : 0;
    
    const confidence = sales.length >= 7 ? 75 : sales.length >= 3 ? 50 : 30;
    
    return {
      itemId: item.id,
      itemName: item.name,
      predictedDemand: Math.max(0, predictedDemand),
      currentStock: item.currentQuantity,
      daysUntilStockout,
      suggestedReorder: Math.max(0, suggestedReorder),
      confidence,
    };
  }).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

// Generate auto-reorder suggestions
export function generateReorderSuggestions(
  inventory: Array<{
    id: string;
    name: string;
    currentQuantity: number;
    minQuantity: number;
    cost: number;
    supplier?: string;
  }>,
  itemForecasts: ItemForecast[]
): StockReorderSuggestion[] {
  const suggestions: StockReorderSuggestion[] = [];
  
  inventory.forEach(item => {
    const forecast = itemForecasts.find(f => f.itemId === item.id);
    
    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let reason = '';
    let suggestedQuantity = 0;
    
    if (item.currentQuantity <= 0) {
      urgency = 'critical';
      reason = 'Stok habis!';
      suggestedQuantity = item.minQuantity * 3;
    } else if (item.currentQuantity <= item.minQuantity * 0.5) {
      urgency = 'critical';
      reason = 'Stok kritikal (< 50% minimum)';
      suggestedQuantity = item.minQuantity * 2;
    } else if (item.currentQuantity <= item.minQuantity) {
      urgency = 'high';
      reason = 'Stok di bawah paras minimum';
      suggestedQuantity = item.minQuantity * 1.5;
    } else if (forecast && forecast.daysUntilStockout <= 3) {
      urgency = 'high';
      reason = `Dijangka habis dalam ${forecast.daysUntilStockout} hari`;
      suggestedQuantity = forecast.suggestedReorder;
    } else if (forecast && forecast.daysUntilStockout <= 7) {
      urgency = 'medium';
      reason = `Dijangka habis dalam ${forecast.daysUntilStockout} hari`;
      suggestedQuantity = forecast.suggestedReorder;
    } else if (item.currentQuantity <= item.minQuantity * 1.5) {
      urgency = 'low';
      reason = 'Stok menghampiri minimum';
      suggestedQuantity = item.minQuantity;
    }
    
    if (urgency !== 'low' || item.currentQuantity <= item.minQuantity * 1.5) {
      suggestions.push({
        itemId: item.id,
        itemName: item.name,
        currentStock: item.currentQuantity,
        minStock: item.minQuantity,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        estimatedCost: Math.ceil(suggestedQuantity) * item.cost,
        urgency,
        reason,
      });
    }
  });
  
  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

// Generate smart insights from data
export function generateInsights(
  salesData: SalesDataPoint[],
  forecasts: ForecastResult[]
): string[] {
  const insights: string[] = [];
  
  if (salesData.length < 7) {
    insights.push('Data tidak mencukupi untuk analisis mendalam. Teruskan rekod jualan untuk insights lebih baik.');
    return insights;
  }
  
  // Calculate metrics
  const revenues = salesData.map(d => d.revenue);
  const recentAvg = movingAverage(revenues.slice(-7), 7);
  const olderAvg = movingAverage(revenues.slice(-14, -7), 7);
  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  
  // Trend insight
  if (trend > 10) {
    insights.push(`📈 Jualan meningkat ${trend.toFixed(1)}% berbanding minggu lepas. Teruskan momentum!`);
  } else if (trend < -10) {
    insights.push(`📉 Jualan menurun ${Math.abs(trend).toFixed(1)}% berbanding minggu lepas. Mungkin perlu promosi?`);
  } else {
    insights.push('📊 Jualan stabil berbanding minggu lepas.');
  }
  
  // Best day insight
  const byDayOfWeek: Record<number, number[]> = {};
  salesData.forEach(point => {
    if (!byDayOfWeek[point.dayOfWeek]) byDayOfWeek[point.dayOfWeek] = [];
    byDayOfWeek[point.dayOfWeek].push(point.revenue);
  });
  
  let bestDay = 0;
  let bestAvg = 0;
  Object.entries(byDayOfWeek).forEach(([day, revenues]) => {
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = parseInt(day);
    }
  });
  insights.push(`🏆 Hari terbaik untuk jualan: ${getDayName(bestDay)} (purata BND ${bestAvg.toFixed(2)})`);
  
  // Forecast insight
  if (forecasts.length > 0) {
    const weekForecast = forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0);
    insights.push(`🔮 Ramalan jualan 7 hari akan datang: ~BND ${weekForecast.toFixed(2)}`);
  }
  
  return insights;
}

// Export forecast summary for dashboard widget
export interface ForecastSummary {
  nextDayForecast: ForecastResult | null;
  weeklyForecast: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  criticalItems: StockReorderSuggestion[];
  insights: string[];
}

export function getForecastSummary(
  salesData: SalesDataPoint[],
  inventory: Array<{
    id: string;
    name: string;
    currentQuantity: number;
    minQuantity: number;
    cost: number;
  }>
): ForecastSummary {
  const forecasts = generateSalesForecast(salesData, 7);
  const itemForecasts = generateItemForecast(salesData, inventory, 7);
  const reorderSuggestions = generateReorderSuggestions(inventory, itemForecasts);
  const insights = generateInsights(salesData, forecasts);
  
  // Calculate trend
  const revenues = salesData.map(d => d.revenue);
  const recentAvg = movingAverage(revenues.slice(-7), 7);
  const olderAvg = movingAverage(revenues.slice(-14, -7), 7);
  const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (trendPercentage > 5) trend = 'up';
  else if (trendPercentage < -5) trend = 'down';
  
  return {
    nextDayForecast: forecasts[0] || null,
    weeklyForecast: forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0),
    trend,
    trendPercentage,
    criticalItems: reorderSuggestions.filter(s => s.urgency === 'critical' || s.urgency === 'high'),
    insights,
  };
}

