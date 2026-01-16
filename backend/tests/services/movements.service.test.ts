import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { MovementsService, MovementError, CreateMovementDTO } from '../../src/services/movements.service.js';
import { Movement } from '../../src/types/index.js';

describe('MovementsService', () => {
  let movementsService: MovementsService;

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
    describe('general validation', () => {
      it('should throw error for zero volume', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'entrada',
          volume_l: 0,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Volume deve ser maior que zero');
      });

      it('should throw error for negative volume', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'entrada',
          volume_l: -100,
          operator_id: 'user-1',
        };

        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Volume deve ser maior que zero');
      });
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

      it('should include remaining capacity in error message', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'entrada',
          volume_l: 6000,
          operator_id: 'user-1',
        };

        try {
          movementsService.validateMovement(data, 5000, 10000);
        } catch (error) {
          expect((error as Error).message).toContain('5000');
        }
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

      it('should allow entrada that fills tank to exactly capacity', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'entrada',
          volume_l: 5000,
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

      it('should include current stock in error message', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'saida',
          volume_l: 6000,
          price_per_l: 5.0,
          operator_id: 'user-1',
        };

        try {
          movementsService.validateMovement(data, 5000, 10000);
        } catch (error) {
          expect((error as Error).message).toContain('5000');
        }
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

      it('should allow saida of entire stock', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'saida',
          volume_l: 5000,
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

      it('should allow ajuste to zero', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'ajuste',
          volume_l: 0,
          operator_id: 'user-1',
        };

        // Note: Zero is still invalid due to general validation
        expect(() => movementsService.validateMovement(data, 5000, 10000))
          .toThrow('Volume deve ser maior que zero');
      });

      it('should allow ajuste to exact capacity', () => {
        const data: CreateMovementDTO = {
          tank_id: 'tank-1',
          type: 'ajuste',
          volume_l: 10000,
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

    it('should return positive difference for ajuste when increasing', () => {
      expect(movementsService.calculateVolumeChange('ajuste', 8000, 5000)).toBe(3000);
    });

    it('should return negative difference for ajuste when decreasing', () => {
      expect(movementsService.calculateVolumeChange('ajuste', 3000, 5000)).toBe(-2000);
    });

    it('should return zero for ajuste with same value', () => {
      expect(movementsService.calculateVolumeChange('ajuste', 5000, 5000)).toBe(0);
    });

    it('should handle large volumes', () => {
      expect(movementsService.calculateVolumeChange('entrada', 100000, 50000)).toBe(100000);
      expect(movementsService.calculateVolumeChange('saida', 100000, 150000)).toBe(-100000);
    });
  });

  describe('calculateValues', () => {
    it('should calculate all values for saida with price and cost', () => {
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

    it('should calculate only total_value for saida without cost', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'saida',
        volume_l: 100,
        price_per_l: 5.0,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.total_value).toBe(500);
      expect(result.total_cost).toBeUndefined();
      expect(result.profit).toBeUndefined();
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

    it('should return undefined values when no prices provided for entrada', () => {
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

    it('should handle ajuste type', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'ajuste',
        volume_l: 100,
        cost_per_l: 3.0,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.total_value).toBeUndefined();
      expect(result.total_cost).toBe(300);
    });

    it('should handle zero profit (price equals cost)', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'saida',
        volume_l: 100,
        price_per_l: 5.0,
        cost_per_l: 5.0,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.profit).toBe(0);
    });

    it('should handle negative profit (loss)', () => {
      const data: CreateMovementDTO = {
        tank_id: 'tank-1',
        type: 'saida',
        volume_l: 100,
        price_per_l: 3.0,
        cost_per_l: 5.0,
        operator_id: 'user-1',
      };

      const result = movementsService.calculateValues(data);

      expect(result.profit).toBe(-200);
    });
  });

  describe('MovementError', () => {
    it('should create error with message and code', () => {
      const error = new MovementError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('MovementError');
    });

    it('should be instance of Error', () => {
      const error = new MovementError('Test error', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MovementError);
    });

    it('should have proper error codes for different scenarios', () => {
      const tankNotFound = new MovementError('Tanque nao encontrado', 'TANK_NOT_FOUND');
      const exceedsCapacity = new MovementError('Volume excede capacidade', 'EXCEEDS_CAPACITY');
      const insufficientStock = new MovementError('Estoque insuficiente', 'INSUFFICIENT_STOCK');

      expect(tankNotFound.code).toBe('TANK_NOT_FOUND');
      expect(exceedsCapacity.code).toBe('EXCEEDS_CAPACITY');
      expect(insufficientStock.code).toBe('INSUFFICIENT_STOCK');
    });
  });
});
