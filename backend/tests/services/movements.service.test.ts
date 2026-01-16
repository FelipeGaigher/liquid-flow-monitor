import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database before importing the service
jest.mock('../../src/config/database.js', () => ({
  db: jest.fn(),
}));

// Mock tanks service
jest.mock('../../src/services/tanks.service.js', () => ({
  tanksService: {
    findById: jest.fn(),
  },
  TankError: class TankError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'TankError';
      this.code = code;
    }
  },
}));

import { MovementsService, MovementError, CreateMovementDTO } from '../../src/services/movements.service.js';
import { tanksService } from '../../src/services/tanks.service.js';
import { db } from '../../src/config/database.js';
import { Movement, TankWithDetails } from '../../src/types/index.js';

describe('MovementsService', () => {
  let movementsService: MovementsService;
  const mockDb = db as jest.MockedFunction<any>;
  const mockTanksService = tanksService as jest.Mocked<typeof tanksService>;

  const mockTank: TankWithDetails = {
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

  const mockMovement: Movement = {
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
  };

  beforeEach(() => {
    movementsService = new MovementsService();
    jest.clearAllMocks();
  });

  describe('validateMovement', () => {
    it('should throw error for zero or negative volume', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'entrada',
        volume_l: 0,
        operator_id: 'user-1',
      };

      expect(() => movementsService.validateMovement(data, 5000, 10000))
        .toThrow('Volume deve ser maior que zero');

      data.volume_l = -100;
      expect(() => movementsService.validateMovement(data, 5000, 10000))
        .toThrow('Volume deve ser maior que zero');
    });

    describe('entrada', () => {
      it('should throw error when entrada exceeds capacity', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'entrada',
          volume_l: 6000,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Volume de entrada excede capacidade disponivel');
      });

      it('should not throw for valid entrada', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'entrada',
          volume_l: 3000,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000)).not.toThrow();
      });
    });

    describe('saida', () => {
      it('should throw error when saida exceeds current stock', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'saida',
          volume_l: 6000,
          price_per_l: 5.0,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Volume de saida excede estoque disponivel');
      });

      it('should throw error when saida has no price', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'saida',
          volume_l: 100,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Preco por litro e obrigatorio para saidas');
      });

      it('should not throw for valid saida', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'saida',
          volume_l: 100,
          price_per_l: 5.0,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000)).not.toThrow();
      });
    });

    describe('ajuste', () => {
      it('should throw error when ajuste exceeds capacity', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'ajuste',
          volume_l: 15000,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Volume de ajuste excede capacidade do tanque');
      });

      it('should not throw for valid ajuste', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'ajuste',
          volume_l: 8000,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000)).not.toThrow();
      });
    });
  });

  describe('calculateVolumeChange', () => {
    it('should return positive for entrada', () => {
      expect(movementsService.calculateVolumeChange('entrada', 1000, 5000)).toBe(1000);
    });

    it('should return negative for saida', () => {
      expect(movementsService.calculateVolumeChange('saida', 1000, 5000)).toBe(-1000);
    });

    it('should return difference for ajuste', () => {
      expect(movementsService.calculateVolumeChange('ajuste', 8000, 5000)).toBe(3000);
      expect(movementsService.calculateVolumeChange('ajuste', 3000, 5000)).toBe(-2000);
      expect(movementsService.calculateVolumeChange('ajuste', 5000, 5000)).toBe(0);
    });
  });

  describe('calculateValues', () => {
    it('should calculate values for saida', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'saida',
        volume_l: 100,
        price_per_l: 5.0,
        cost_per_l: 3.0,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.total_value).toBe(500);
      expect(result.total_cost).toBe(300);
      expect(result.profit).toBe(200);
    });

    it('should calculate only cost for entrada', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'entrada',
        volume_l: 100,
        cost_per_l: 3.0,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.total_value).toBeUndefined();
      expect(result.total_cost).toBe(300);
      expect(result.profit).toBeUndefined();
    });

    it('should return undefined when no prices provided', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'entrada',
        volume_l: 100,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.total_value).toBeUndefined();
      expect(result.total_cost).toBeUndefined();
      expect(result.profit).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should throw error when tank not found', async () => {
      mockTanksService.findById.mockResolvedValue(null);

      const data: CreateMovementDTO = {
        tank_id: 'non-existent',
        type: 'saida',
        volume_l: 100,
        price_per_l: 5.0,
        operator_id: 'user-1',
      };

      await expect(movementsService.create(data)).rejects.toThrow('Tanque nao encontrado');
    });

    it('should validate movement before creating', async () => {
      mockTanksService.findById.mockResolvedValue(mockTank);

      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'saida',
        volume_l: 10000, // Exceeds current volume
        price_per_l: 5.0,
        operator_id: 'user-1',
      };

      await expect(movementsService.create(data)).rejects.toThrow('Volume de saida excede estoque disponivel');
    });
  });

  describe('getKPIs', () => {
    it('should calculate KPIs correctly', async () => {
      const mockMovements = [
        { ...mockMovement, volume_l: 100, total_value: 500, total_cost: 300, profit: 200 },
        { ...mockMovement, id: 'mov-2', volume_l: 200, total_value: 1000, total_cost: 600, profit: 400 },
      ];

      const mockWhere = jest.fn().mockResolvedValue(mockMovements);
      mockDb.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({ where: mockWhere });

      const result = await movementsService.getKPIs({});

      expect(result.totalVolume).toBe(300);
      expect(result.totalRevenue).toBe(1500);
      expect(result.totalCost).toBe(900);
      expect(result.totalProfit).toBe(600);
      expect(result.avgMargin).toBe(40); // 600/1500 * 100
      expect(result.movementCount).toBe(2);
    });

    it('should handle empty movements', async () => {
      const mockWhere = jest.fn().mockResolvedValue([]);
      mockDb.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({ where: mockWhere });

      const result = await movementsService.getKPIs({});

      expect(result.totalVolume).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.avgMargin).toBe(0);
      expect(result.movementCount).toBe(0);
    });
  });
});
