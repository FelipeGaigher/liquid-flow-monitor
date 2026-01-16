import { db } from '../config/database.js';
import { DashboardFilters, KPIs, Movement } from '../types/index.js';

interface DashboardData {
  kpis: KPIs;
  salesByProduct: Record<string, number>;
  revenueTimeSeries: Array<{ date: string; revenue: number }>;
  profitByProduct: Record<string, { profit: number; revenue: number }>;
  top5Tanks: Array<{ tankId: string; tankName: string; revenue: number }>;
  heatmap: Array<{ day: string; hour: number; value: number }>;
}

export class DashboardService {
  private readonly DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  async getDashboard(filters: DashboardFilters): Promise<DashboardData> {
    const { start, end } = this.resolvePeriod(filters);
    const { prevStart, prevEnd } = this.previousPeriod(start, end);

    // Get current period movements
    const currentMovements = await this.getFilteredMovements(filters, start, end);
    const currentSaidas = currentMovements.filter(m => m.type === 'saida');

    // Get previous period movements for growth calculations
    const prevMovements = await this.getFilteredMovements(filters, prevStart, prevEnd);
    const prevSaidas = prevMovements.filter(m => m.type === 'saida');

    // Calculate KPIs
    const kpis = this.calculateKPIs(currentSaidas, prevSaidas);

    // Calculate other metrics
    const salesByProduct = this.calculateSalesByProduct(currentSaidas);
    const revenueTimeSeries = this.calculateRevenueTimeSeries(currentSaidas, filters.period);
    const profitByProduct = this.calculateProfitByProduct(currentSaidas);
    const top5Tanks = await this.getTop5Tanks(currentSaidas);
    const heatmap = this.calculateHeatmap(currentSaidas);

    return {
      kpis,
      salesByProduct,
      revenueTimeSeries,
      profitByProduct,
      top5Tanks,
      heatmap,
    };
  }

  async getFilteredMovements(
    filters: DashboardFilters,
    start: Date,
    end: Date
  ): Promise<Movement[]> {
    let query = db<Movement>('movements')
      .where('created_at', '>=', start)
      .where('created_at', '<=', end);

    if (filters.products && filters.products.length > 0) {
      query = query.whereIn('product_id', filters.products);
    }

    if (filters.tank_ids && filters.tank_ids.length > 0) {
      query = query.whereIn('tank_id', filters.tank_ids);
    }

    if (filters.operator_ids && filters.operator_ids.length > 0) {
      query = query.whereIn('operator_id', filters.operator_ids);
    }

    if (filters.movement_types && filters.movement_types.length > 0) {
      query = query.whereIn('type', filters.movement_types);
    }

    if (filters.site_ids && filters.site_ids.length > 0) {
      query = query
        .join('tanks', 'movements.tank_id', 'tanks.id')
        .whereIn('tanks.site_id', filters.site_ids)
        .select('movements.*');
    }

    return query;
  }

  calculateKPIs(current: Movement[], previous: Movement[]): KPIs {
    const currentMetrics = this.calculatePeriodMetrics(current);
    const prevMetrics = this.calculatePeriodMetrics(previous);

    return {
      revenue: currentMetrics.revenue,
      volume: currentMetrics.volume,
      cogs: currentMetrics.cogs,
      profit: currentMetrics.profit,
      margin: currentMetrics.revenue > 0
        ? (currentMetrics.profit / currentMetrics.revenue) * 100
        : 0,
      avgTicket: currentMetrics.count > 0
        ? currentMetrics.revenue / currentMetrics.count
        : 0,
      revenueGrowth: this.calculateGrowth(currentMetrics.revenue, prevMetrics.revenue),
      profitGrowth: this.calculateGrowth(currentMetrics.profit, prevMetrics.profit),
      volumeGrowth: this.calculateGrowth(currentMetrics.volume, prevMetrics.volume),
    };
  }

  calculatePeriodMetrics(movements: Movement[]): {
    revenue: number;
    volume: number;
    cogs: number;
    profit: number;
    count: number;
  } {
    return {
      revenue: movements.reduce((sum, m) => sum + Number(m.total_value || 0), 0),
      volume: movements.reduce((sum, m) => sum + Number(m.volume_l || 0), 0),
      cogs: movements.reduce((sum, m) => sum + Number(m.total_cost || 0), 0),
      profit: movements.reduce((sum, m) => sum + Number(m.profit || 0), 0),
      count: movements.length,
    };
  }

  calculateGrowth(current: number, previous: number): number {
    if (previous <= 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  calculateSalesByProduct(movements: Movement[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const m of movements) {
      const productId = m.product_id;
      result[productId] = (result[productId] || 0) + Number(m.total_value || 0);
    }

    return result;
  }

  calculateRevenueTimeSeries(
    movements: Movement[],
    period: string
  ): Array<{ date: string; revenue: number }> {
    const groupByDay = period === 'hoje' || period === 'semana';
    const grouped: Record<string, number> = {};

    for (const m of movements) {
      const date = new Date(m.created_at);
      const key = groupByDay
        ? date.toISOString().split('T')[0]
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      grouped[key] = (grouped[key] || 0) + Number(m.total_value || 0);
    }

    return Object.entries(grouped)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  calculateProfitByProduct(
    movements: Movement[]
  ): Record<string, { profit: number; revenue: number }> {
    const result: Record<string, { profit: number; revenue: number }> = {};

    for (const m of movements) {
      const productId = m.product_id;
      if (!result[productId]) {
        result[productId] = { profit: 0, revenue: 0 };
      }
      result[productId].profit += Number(m.profit || 0);
      result[productId].revenue += Number(m.total_value || 0);
    }

    return result;
  }

  async getTop5Tanks(
    movements: Movement[]
  ): Promise<Array<{ tankId: string; tankName: string; revenue: number }>> {
    const tankRevenue: Record<string, number> = {};

    for (const m of movements) {
      tankRevenue[m.tank_id] = (tankRevenue[m.tank_id] || 0) + Number(m.total_value || 0);
    }

    const tankIds = Object.keys(tankRevenue);
    if (tankIds.length === 0) {
      return [];
    }

    const tanks = await db('tanks')
      .whereIn('id', tankIds)
      .select('id', 'name');

    const tankMap = new Map(tanks.map(t => [t.id, t.name]));

    return Object.entries(tankRevenue)
      .map(([tankId, revenue]) => ({
        tankId,
        tankName: tankMap.get(tankId) || 'Tanque',
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  calculateHeatmap(movements: Movement[]): Array<{ day: string; hour: number; value: number }> {
    const grid: Array<{ day: string; hour: number; value: number }> = [];

    // Initialize grid
    for (let dow = 0; dow < 7; dow++) {
      for (let hour = 0; hour < 24; hour++) {
        grid.push({ day: this.DAY_LABELS[dow], hour, value: 0 });
      }
    }

    // Fill with data
    for (const m of movements) {
      const date = new Date(m.created_at);
      const day = this.DAY_LABELS[date.getDay()];
      const hour = date.getHours();

      const entry = grid.find(g => g.day === day && g.hour === hour);
      if (entry) {
        entry.value += Number(m.total_value || 0);
      }
    }

    return grid;
  }

  resolvePeriod(filters: DashboardFilters): { start: Date; end: Date } {
    const now = new Date();
    let start = new Date(now);

    switch (filters.period) {
      case 'hoje':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case '3m':
        start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start = new Date(now);
        start.setMonth(start.getMonth() - 6);
        break;
      case 'ano':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'custom':
        if (filters.start_date) start = filters.start_date;
        if (filters.end_date) return { start, end: filters.end_date };
        break;
    }

    return { start, end: now };
  }

  previousPeriod(start: Date, end: Date): { prevStart: Date; prevEnd: Date } {
    const diff = end.getTime() - start.getTime();
    return {
      prevStart: new Date(start.getTime() - diff),
      prevEnd: new Date(start.getTime()),
    };
  }
}

export const dashboardService = new DashboardService();
