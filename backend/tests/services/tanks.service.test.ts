import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { TanksService, TankError, CreateTankDTO } from '../../src/services/tanks.service.js';
import { Tank } from '../../src/types/index.js';

describe('TanksService', () => {
  let tanksService: TanksService;

  const mockTank: Tank = {
    id: 'tank-1',
    name: 'Tank 01',
    site_id: 'site-1',
    product_id: 'prod-1',
    capacity_l: 10000,
    current_volume_l: 5000,
    min_alert_l: 1000,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    tanksService = new TanksService();
    jest.clearAllMocks();
  });

  describe('calculateFillPercentage', () => {
    it('should calculate correct percentage', () => {
      expect(tanksService.calculateFillPercentage(5000, 10000)).toBe(50);
      expect(tanksService.calculateFillPercentage(2500, 10000)).toBe(25);
      expect(tanksService.calculateFillPercentage(10000, 10000)).toBe(100);
      expect(tanksService.calculateFillPercentage(0, 10000)).toBe(0);
    });

    it('should return 0 for zero capacity', () => {
      expect(tanksService.calculateFillPercentage(5000, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(tanksService.calculateFillPercentage(333, 1000)).toBe(33);
      expect(tanksService.calculateFillPercentage(666, 1000)).toBe(67);
    });

    it('should round to nearest integer', () => {
      expect(tanksService.calculateFillPercentage(3333, 10000)).toBe(33);
      expect(tanksService.calculateFillPercentage(6666, 10000)).toBe(67);
    });

    it('should handle 100% fill', () => {
      expect(tanksService.calculateFillPercentage(10000, 10000)).toBe(100);
    });

    it('should handle very small percentages', () => {
      expect(tanksService.calculateFillPercentage(1, 10000)).toBe(0);
      expect(tanksService.calculateFillPercentage(50, 10000)).toBe(1);
    });
  });

  describe('calculateAlertStatus', () => {
    it('should return red when volume is at or below min_alert', () => {
      expect(tanksService.calculateAlertStatus(1000, 10000, 1000)).toBe('red');
      expect(tanksService.calculateAlertStatus(500, 10000, 1000)).toBe('red');
      expect(tanksService.calculateAlertStatus(0, 10000, 1000)).toBe('red');
    });

    it('should return yellow when volume is low (<=25%) but above min_alert', () => {
      expect(tanksService.calculateAlertStatus(2000, 10000, 1000)).toBe('yellow');
      expect(tanksService.calculateAlertStatus(2500, 10000, 1000)).toBe('yellow');
    });

    it('should return green when volume is above 25% and above min_alert', () => {
      expect(tanksService.calculateAlertStatus(5000, 10000, 1000)).toBe('green');
      expect(tanksService.calculateAlertStatus(8000, 10000, 1000)).toBe('green');
      expect(tanksService.calculateAlertStatus(3000, 10000, 1000)).toBe('green');
    });

    it('should prioritize red over yellow when at min_alert', () => {
      // Even if percentage is >25%, red takes priority when at min_alert
      expect(tanksService.calculateAlertStatus(1000, 3000, 1000)).toBe('red');
    });

    it('should handle full tank', () => {
      expect(tanksService.calculateAlertStatus(10000, 10000, 1000)).toBe('green');
    });

    it('should handle empty tank', () => {
      expect(tanksService.calculateAlertStatus(0, 10000, 1000)).toBe('red');
    });
  });

  describe('validateTankData', () => {
    it('should throw error for empty name', () => {
      const data: CreateTankDTO = {
        name: '',
        site_id: 'site-1',
        product_id: 'prod-1',
        capacity_l: 10000,
      };

      expect(() => tanksService.validateTankData(data)).toThrow(TankError);
      expect(() => tanksService.validateTankData(data)).toThrow('Nome do tanque e obrigatorio');
    });

    it('should throw error for whitespace-only name', () => {
      const data: CreateTankDTO = {
        name: '   ',
        site_id: 'site-1',
        product_id: 'prod-1',
        capacity_l: 10000,
      };

      expect(() => tanksService.validateTankData(data)).toThrow('Nome do tanque e obrigatorio');
    });

    it('should throw error for zero capacity', () => {
      const data: CreateTankDTO = {
        name: 'Tank 01',
        site_id: 'site-1',
        product_id: 'prod-1',
        capacity_l: 0,
      };

      expect(() => tanksService.validateTankData(data)).toThrow('Capacidade deve ser maior que zero');
    });

    it('should throw error for negative capacity', () => {
      const data: CreateTankDTO = {
        name: 'Tank 01',
        site_id: 'site-1',
        product_id: 'prod-1',
        capacity_l: -100,
      };

      expect(() => tanksService.validateTankData(data)).toThrow('Capacidade deve ser maior que zero');
    });

    it('should not throw for valid data', () => {
      const data: CreateTankDTO = {
        name: 'Tank 01',
        site_id: 'site-1',
        product_id: 'prod-1',
        capacity_l: 10000,
      };

      expect(() => tanksService.validateTankData(data)).not.toThrow();
    });

    it('should validate current_volume_l if provided', () => {
      const data: CreateTankDTO = {
        name: 'Tank 01',
        site_id: 'site-1',
        product_id: 'prod-1',
        capacity_l: 10000,
        current_volume_l: 15000, // Exceeds capacity
      };

      expect(() => tanksService.validateTankData(data)).toThrow('Volume nao pode exceder a capacidade');
    });
  });

  describe('validateVolume', () => {
    it('should throw error for negative volume', () => {
      expect(() => tanksService.validateVolume(-100, 10000)).toThrow('Volume nao pode ser negativo');
    });

    it('should throw error when volume exceeds capacity', () => {
      expect(() => tanksService.validateVolume(15000, 10000)).toThrow('Volume nao pode exceder a capacidade');
    });

    it('should not throw for valid volume', () => {
      expect(() => tanksService.validateVolume(0, 10000)).not.toThrow();
      expect(() => tanksService.validateVolume(5000, 10000)).not.toThrow();
      expect(() => tanksService.validateVolume(10000, 10000)).not.toThrow();
    });

    it('should allow volume equal to capacity', () => {
      expect(() => tanksService.validateVolume(10000, 10000)).not.toThrow();
    });

    it('should allow zero volume', () => {
      expect(() => tanksService.validateVolume(0, 10000)).not.toThrow();
    });
  });

  describe('enrichTank', () => {
    it('should add fill_percentage and alert_status', () => {
      const enriched = tanksService.enrichTank(mockTank);

      expect(enriched.fill_percentage).toBe(50);
      expect(enriched.alert_status).toBe('green');
      expect(enriched.id).toBe(mockTank.id);
      expect(enriched.name).toBe(mockTank.name);
    });

    it('should handle low volume tank', () => {
      const lowVolumeTank = { ...mockTank, current_volume_l: 500 };
      const enriched = tanksService.enrichTank(lowVolumeTank);

      expect(enriched.fill_percentage).toBe(5);
      expect(enriched.alert_status).toBe('red');
    });

    it('should handle medium volume tank', () => {
      const mediumVolumeTank = { ...mockTank, current_volume_l: 2000 };
      const enriched = tanksService.enrichTank(mediumVolumeTank);

      expect(enriched.fill_percentage).toBe(20);
      expect(enriched.alert_status).toBe('yellow');
    });

    it('should preserve original tank properties', () => {
      const enriched = tanksService.enrichTank(mockTank);

      expect(enriched.id).toBe(mockTank.id);
      expect(enriched.name).toBe(mockTank.name);
      expect(enriched.site_id).toBe(mockTank.site_id);
      expect(enriched.product_id).toBe(mockTank.product_id);
      expect(enriched.capacity_l).toBe(mockTank.capacity_l);
      expect(enriched.current_volume_l).toBe(mockTank.current_volume_l);
      expect(enriched.min_alert_l).toBe(mockTank.min_alert_l);
      expect(enriched.status).toBe(mockTank.status);
    });

    it('should handle full tank', () => {
      const fullTank = { ...mockTank, current_volume_l: 10000 };
      const enriched = tanksService.enrichTank(fullTank);

      expect(enriched.fill_percentage).toBe(100);
      expect(enriched.alert_status).toBe('green');
    });

    it('should handle empty tank', () => {
      const emptyTank = { ...mockTank, current_volume_l: 0 };
      const enriched = tanksService.enrichTank(emptyTank);

      expect(enriched.fill_percentage).toBe(0);
      expect(enriched.alert_status).toBe('red');
    });
  });

  describe('TankError', () => {
    it('should create error with message and code', () => {
      const error = new TankError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('TankError');
    });

    it('should be instance of Error', () => {
      const error = new TankError('Test error', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TankError);
    });
  });
});
