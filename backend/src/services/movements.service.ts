import { db } from '../config/database.js';
import { Movement, MovementWithDetails, MovementType, PaginatedResponse } from '../types/index.js';
import { tanksService, TankError } from './tanks.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

export interface CreateMovementDTO {
  tank_id: string;
  type: MovementType;
  volume_l: number;
  price_per_l?: number;
  cost_per_l?: number;
  reference?: string;
  notes?: string;
  operator_id: string;
}

export interface MovementFilters {
  tank_id?: string;
  product_id?: string;
  type?: MovementType;
  operator_id?: string;
  start_date?: Date;
  end_date?: Date;
}

export class MovementsService {
  async findAll(
    filters: MovementFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<MovementWithDetails>> {
    let query = db<Movement>('movements')
      .select(
        'movements.*',
        'tanks.name as tank_name',
        'products.name as product_name',
        'users.name as operator_name'
      )
      .leftJoin('tanks', 'movements.tank_id', 'tanks.id')
      .leftJoin('products', 'movements.product_id', 'products.id')
      .leftJoin('users', 'movements.operator_id', 'users.id');

    // Apply filters
    if (filters.tank_id) {
      query = query.where('movements.tank_id', filters.tank_id);
    }
    if (filters.product_id) {
      query = query.where('movements.product_id', filters.product_id);
    }
    if (filters.type) {
      query = query.where('movements.type', filters.type);
    }
    if (filters.operator_id) {
      query = query.where('movements.operator_id', filters.operator_id);
    }
    if (filters.start_date) {
      query = query.where('movements.created_at', '>=', filters.start_date);
    }
    if (filters.end_date) {
      query = query.where('movements.created_at', '<=', filters.end_date);
    }

    // Count total
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('movements.id as count');
    const total = Number(count);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await query
      .orderBy('movements.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: data as MovementWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<MovementWithDetails | null> {
    const movement = await db<Movement>('movements')
      .select(
        'movements.*',
        'tanks.name as tank_name',
        'products.name as product_name',
        'users.name as operator_name'
      )
      .leftJoin('tanks', 'movements.tank_id', 'tanks.id')
      .leftJoin('products', 'movements.product_id', 'products.id')
      .leftJoin('users', 'movements.operator_id', 'users.id')
      .where('movements.id', id)
      .first();

    return movement as MovementWithDetails || null;
  }

  async create(data: CreateMovementDTO): Promise<Movement> {
    // Validate tank exists
    const tank = await tanksService.findById(data.tank_id);
    if (!tank) {
      throw new MovementError('Tanque nao encontrado', 'TANK_NOT_FOUND');
    }

    // Validate movement based on type
    this.validateMovement(data, tank.current_volume_l, tank.capacity_l);

    // Calculate values
    const calculations = this.calculateValues(data);

    // Create movement in transaction
    const volumeChange = this.calculateVolumeChange(data.type, data.volume_l, tank.current_volume_l);
    const updatedVolume = tank.current_volume_l + volumeChange;

    const movement = await db.transaction(async (trx) => {
      // Insert movement
      const [newMovement] = await trx<Movement>('movements')
        .insert({
          id: crypto.randomUUID(),
          tank_id: data.tank_id,
          product_id: tank.product_id,
          type: data.type,
          volume_l: data.volume_l,
          price_per_l: data.price_per_l,
          cost_per_l: data.cost_per_l,
          total_value: calculations.total_value,
          total_cost: calculations.total_cost,
          profit: calculations.profit,
          reference: data.reference,
          notes: data.notes,
          operator_id: data.operator_id,
          created_at: new Date(),
        })
        .returning('*');

      // Update tank volume
      const volumeChange = this.calculateVolumeChange(data.type, data.volume_l, tank.current_volume_l);
      await trx('tanks')
        .where({ id: data.tank_id })
        .update({
          current_volume_l: tank.current_volume_l + volumeChange,
          updated_at: new Date(),
        });

      return newMovement;
    });

    const shouldAlert = updatedVolume <= tank.min_alert_l && tank.current_volume_l > tank.min_alert_l;
    if (shouldAlert) {
      try {
        await emailService.sendLowStockAlert({
          tankName: tank.name,
          productName: tank.product_name,
          siteName: tank.site_name,
          currentVolume: updatedVolume,
          minAlert: tank.min_alert_l,
        });
      } catch (error) {
        logger.error('Failed to send low stock alert', { error, tankId: tank.id });
      }
    }

    return movement;
  }

  async getKPIs(filters: MovementFilters = {}): Promise<{
    totalVolume: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgMargin: number;
    movementCount: number;
  }> {
    let query = db<Movement>('movements')
      .where('type', 'saida');

    if (filters.start_date) {
      query = query.where('created_at', '>=', filters.start_date);
    }
    if (filters.end_date) {
      query = query.where('created_at', '<=', filters.end_date);
    }
    if (filters.product_id) {
      query = query.where('product_id', filters.product_id);
    }
    if (filters.tank_id) {
      query = query.where('tank_id', filters.tank_id);
    }

    const movements = await query;

    const totalVolume = movements.reduce((sum, m) => sum + Number(m.volume_l), 0);
    const totalRevenue = movements.reduce((sum, m) => sum + Number(m.total_value || 0), 0);
    const totalCost = movements.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
    const totalProfit = movements.reduce((sum, m) => sum + Number(m.profit || 0), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalVolume,
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin,
      movementCount: movements.length,
    };
  }

  validateMovement(data: CreateMovementDTO, currentVolume: number, capacity: number): void {
    if (data.volume_l <= 0) {
      throw new MovementError('Volume deve ser maior que zero', 'INVALID_VOLUME');
    }

    switch (data.type) {
      case 'entrada':
        const newVolumeEntrada = currentVolume + data.volume_l;
        if (newVolumeEntrada > capacity) {
          throw new MovementError(
            `Volume de entrada excede capacidade disponivel. Capacidade restante: ${capacity - currentVolume}L`,
            'EXCEEDS_CAPACITY'
          );
        }
        break;

      case 'saida':
        if (data.volume_l > currentVolume) {
          throw new MovementError(
            `Volume de saida excede estoque disponivel. Estoque atual: ${currentVolume}L`,
            'INSUFFICIENT_STOCK'
          );
        }
        if (!data.price_per_l) {
          throw new MovementError('Preco por litro e obrigatorio para saidas', 'PRICE_REQUIRED');
        }
        break;

      case 'ajuste':
        if (data.volume_l > capacity) {
          throw new MovementError('Volume de ajuste excede capacidade do tanque', 'EXCEEDS_CAPACITY');
        }
        break;

      default:
        throw new MovementError('Tipo de movimentacao invalido', 'INVALID_TYPE');
    }
  }

  calculateVolumeChange(type: MovementType, volume: number, currentVolume: number): number {
    switch (type) {
      case 'entrada':
        return volume;
      case 'saida':
        return -volume;
      case 'ajuste':
        return volume - currentVolume;
      default:
        return 0;
    }
  }

  calculateValues(data: CreateMovementDTO): {
    total_value?: number;
    total_cost?: number;
    profit?: number;
  } {
    if (data.type !== 'saida') {
      return {
        total_cost: data.cost_per_l ? data.volume_l * data.cost_per_l : undefined,
      };
    }

    const total_value = data.price_per_l ? data.volume_l * data.price_per_l : undefined;
    const total_cost = data.cost_per_l ? data.volume_l * data.cost_per_l : undefined;
    const profit = total_value !== undefined && total_cost !== undefined
      ? total_value - total_cost
      : undefined;

    return { total_value, total_cost, profit };
  }
}

export class MovementError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'MovementError';
    this.code = code;
  }
}

export const movementsService = new MovementsService();
