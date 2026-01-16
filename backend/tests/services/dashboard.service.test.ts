import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database before importing the service
jest.mock('../../src/config/database.js', () => ({
  db: jest.fn(),
}));

import { DashboardService } from '../../src/services/dashboard.service.js';
import { db } from '../../src/config/database.js';
import { Movement, DashboardFilters } from '../../src/types/index.js';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  const mockDb = db as jest.MockedFunction<any>;

  const mockMovements: Movement[] = [
    {
      id: 'mov-1',
      tank_id: 'tank-1',
      product_id: 'prod-1',
      type: 'saida',
      volume_l: 100,
      price_per_l: 5.0,
      cost_per_l: 3.0,
      total_value: 500,
      total_cost: 300,
      profit: 200,
      operator_id: 'user-1',
      created_at: new Date(),
    },
    {
      id: 'mov-2',
      tank_id: 'tank-2',
      product_id: 'prod-1',
      type: 'saida',
      volume_l: 200,
      price_per_l: 5.0,
      cost_per_l: 3.0,
      total_value: 1000,
      total_cost: 600,
      profit: 400,
      operator_id: 'user-1',
      created_at: new Date(),
    },
    {
      id: 'mov-3',
      tank_id: 'tank-1',
      product_id: 'prod-2',
      type: 'saida',
      volume_l: 150,
      price_per_l: 6.0,
      cost_per_l: 4.0,
      total_value: 900,
      total_cost: 600,
      profit: 300,
      operator_id: 'user-2',
      created_at: new Date(),
    },
  ];

  beforeEach(() => {
    dashboardService = new DashboardService();
    jest.clearAllMocks();
  });

  describe('calculateGrowth', () => {
    it('should calculate positive growth', () => {
      expect(dashboardService.calculateGrowth(150, 100)).toBe(50);
    });

    it('should calculate negative growth', () => {
      expect(dashboardService.calculateGrowth(50, 100)).toBe(-50);
    });

    it('should return 0 when previous is 0', () => {
      expect(dashboardService.calculateGrowth(100, 0)).toBe(0);
    });

    it('should return 0 when no change', () => {
      expect(dashboardService.calculateGrowth(100, 100)).toBe(0);
    });
  });

  describe('calculatePeriodMetrics', () => {
    it('should calculate metrics correctly', () => {
      const result = dashboardService.calculatePeriodMetrics(mockMovements);

      expect(result.revenue).toBe(2400);
      expect(result.volume).toBe(450);
      expect(result.cogs).toBe(1500);
      expect(result.profit).toBe(900);
      expect(result.count).toBe(3);
    });

    it('should handle empty array', () => {
      const result = dashboardService.calculatePeriodMetrics([]);

      expect(result.revenue).toBe(0);
      expect(result.volume).toBe(0);
      expect(result.cogs).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.count).toBe(0);
    });

    it('should handle movements with missing values', () => {
      const movementsWithNulls: Movement[] = [
        {
          id: 'mov-1',
          tank_id: 'tank-1',
          product_id: 'prod-1',
          type: 'saida',
          volume_l: 100,
          operator_id: 'user-1',
          created_at: new Date(),
        },
      ];

      const result = dashboardService.calculatePeriodMetrics(movementsWithNulls);

      expect(result.revenue).toBe(0);
      expect(result.volume).toBe(100);
      expect(result.cogs).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.count).toBe(1);
    });
  });

  describe('calculateKPIs', () => {
    it('should calculate KPIs with growth', () => {
      const current = mockMovements;
      const previous = [mockMovements[0]]; // Just one movement for previous period

      const result = dashboardService.calculateKPIs(current, previous);

      expect(result.revenue).toBe(2400);
      expect(result.volume).toBe(450);
      expect(result.profit).toBe(900);
      expect(result.margin).toBeCloseTo(37.5); // 900/2400 * 100
      expect(result.avgTicket).toBe(800); // 2400/3
      expect(result.revenueGrowth).toBe(380); // (2400-500)/500 * 100
    });

    it('should handle zero previous values', () => {
      const current = mockMovements;
      const previous: Movement[] = [];

      const result = dashboardService.calculateKPIs(current, previous);

      expect(result.revenueGrowth).toBe(0);
      expect(result.profitGrowth).toBe(0);
      expect(result.volumeGrowth).toBe(0);
    });
  });

  describe('calculateSalesByProduct', () => {
    it('should aggregate sales by product', () => {
      const result = dashboardService.calculateSalesByProduct(mockMovements);

      expect(result['prod-1']).toBe(1500);
      expect(result['prod-2']).toBe(900);
    });

    it('should handle empty array', () => {
      const result = dashboardService.calculateSalesByProduct([]);

      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('calculateProfitByProduct', () => {
    it('should aggregate profit and revenue by product', () => {
      const result = dashboardService.calculateProfitByProduct(mockMovements);

      expect(result['prod-1'].profit).toBe(600);
      expect(result['prod-1'].revenue).toBe(1500);
      expect(result['prod-2'].profit).toBe(300);
      expect(result['prod-2'].revenue).toBe(900);
    });
  });

  describe('calculateHeatmap', () => {
    it('should create 7x24 grid', () => {
      const result = dashboardService.calculateHeatmap([]);

      expect(result.length).toBe(168); // 7 days * 24 hours
    });

    it('should aggregate values by day and hour', () => {
      const movementAt10AM = {
        ...mockMovements[0],
        created_at: new Date('2024-01-15T10:00:00'), // Monday
      };

      const result = dashboardService.calculateHeatmap([movementAt10AM]);

      const mondayAt10 = result.find(r => r.day === 'Seg' && r.hour === 10);
      expect(mondayAt10?.value).toBe(500);
    });
  });

  describe('resolvePeriod', () => {
    it('should resolve "hoje" period', () => {
      const filters: DashboardFilters = { period: 'hoje' };
      const { start, end } = dashboardService.resolvePeriod(filters);

      const today = new Date();
      expect(start.getDate()).toBe(today.getDate());
      expect(start.getMonth()).toBe(today.getMonth());
      expect(start.getFullYear()).toBe(today.getFullYear());
    });

    it('should resolve "semana" period', () => {
      const filters: DashboardFilters = { period: 'semana' };
      const { start, end } = dashboardService.resolvePeriod(filters);

      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });

    it('should resolve "mes" period', () => {
      const filters: DashboardFilters = { period: 'mes' };
      const { start, end } = dashboardService.resolvePeriod(filters);

      expect(start.getMonth()).not.toBe(end.getMonth());
    });

    it('should resolve "custom" period with dates', () => {
      const customStart = new Date('2024-01-01');
      const customEnd = new Date('2024-01-31');
      const filters: DashboardFilters = {
        period: 'custom',
        start_date: customStart,
        end_date: customEnd,
      };

      const { start, end } = dashboardService.resolvePeriod(filters);

      expect(start.getTime()).toBe(customStart.getTime());
      expect(end.getTime()).toBe(customEnd.getTime());
    });
  });

  describe('previousPeriod', () => {
    it('should calculate previous period of same length', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-22');

      const { prevStart, prevEnd } = dashboardService.previousPeriod(start, end);

      // Previous period should be Jan 8 - Jan 15
      expect(prevEnd.getTime()).toBe(start.getTime());

      const currentDiff = end.getTime() - start.getTime();
      const prevDiff = prevEnd.getTime() - prevStart.getTime();
      expect(prevDiff).toBe(currentDiff);
    });
  });

  describe('calculateRevenueTimeSeries', () => {
    it('should group by day for short periods', () => {
      const movementsWithDates = [
        { ...mockMovements[0], created_at: new Date('2024-01-15') },
        { ...mockMovements[1], created_at: new Date('2024-01-15') },
        { ...mockMovements[2], created_at: new Date('2024-01-16') },
      ];

      const result = dashboardService.calculateRevenueTimeSeries(movementsWithDates, 'semana');

      expect(result.length).toBe(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].revenue).toBe(1500);
      expect(result[1].date).toBe('2024-01-16');
      expect(result[1].revenue).toBe(900);
    });

    it('should group by month for long periods', () => {
      const movementsWithDates = [
        { ...mockMovements[0], created_at: new Date('2024-01-15') },
        { ...mockMovements[1], created_at: new Date('2024-02-15') },
      ];

      const result = dashboardService.calculateRevenueTimeSeries(movementsWithDates, 'ano');

      expect(result.length).toBe(2);
      expect(result[0].date).toBe('2024-01');
      expect(result[1].date).toBe('2024-02');
    });
  });
});
