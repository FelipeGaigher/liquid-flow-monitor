import { db } from '../config/database.js';
import { Tank, TankWithDetails, PaginatedResponse, Pagination } from '../types/index.js';

export interface CreateTankDTO {
  name: string;
  site_id: string;
  product_id: string;
  capacity_l: number;
  current_volume_l?: number;
  min_alert_l?: number;
}

export interface UpdateTankDTO {
  name?: string;
  site_id?: string;
  product_id?: string;
  capacity_l?: number;
  current_volume_l?: number;
  min_alert_l?: number;
  status?: 'active' | 'inactive';
}

export interface TankFilters {
  site_id?: string;
  product_id?: string;
  status?: 'active' | 'inactive';
  search?: string;
}

export class TanksService {
  async findAll(filters: TankFilters = {}): Promise<TankWithDetails[]> {
    let query = db<Tank>('tanks')
      .select(
        'tanks.*',
        'sites.name as site_name',
        'products.name as product_name'
      )
      .leftJoin('sites', 'tanks.site_id', 'sites.id')
      .leftJoin('products', 'tanks.product_id', 'products.id');

    if (filters.site_id) {
      query = query.where('tanks.site_id', filters.site_id);
    }

    if (filters.product_id) {
      query = query.where('tanks.product_id', filters.product_id);
    }

    if (filters.status) {
      query = query.where('tanks.status', filters.status);
    }

    if (filters.search) {
      query = query.where('tanks.name', 'ilike', `%${filters.search}%`);
    }

    const tanks = await query.orderBy('tanks.name', 'asc');

    return tanks.map(tank => this.enrichTank(tank));
  }

  async findById(id: string): Promise<TankWithDetails | null> {
    const tank = await db<Tank>('tanks')
      .select(
        'tanks.*',
        'sites.name as site_name',
        'products.name as product_name'
      )
      .leftJoin('sites', 'tanks.site_id', 'sites.id')
      .leftJoin('products', 'tanks.product_id', 'products.id')
      .where('tanks.id', id)
      .first();

    if (!tank) {
      return null;
    }

    return this.enrichTank(tank);
  }

  async create(data: CreateTankDTO): Promise<Tank> {
    this.validateTankData(data);

    const [tank] = await db<Tank>('tanks')
      .insert({
        id: crypto.randomUUID(),
        name: data.name,
        site_id: data.site_id,
        product_id: data.product_id,
        capacity_l: data.capacity_l,
        current_volume_l: data.current_volume_l ?? 0,
        min_alert_l: data.min_alert_l ?? data.capacity_l * 0.1, // 10% default
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return tank;
  }

  async update(id: string, data: UpdateTankDTO): Promise<Tank | null> {
    if (data.capacity_l !== undefined || data.current_volume_l !== undefined) {
      const existing = await this.findById(id);
      if (existing) {
        const capacity = data.capacity_l ?? existing.capacity_l;
        const volume = data.current_volume_l ?? existing.current_volume_l;
        this.validateVolume(volume, capacity);
      }
    }

    const [tank] = await db<Tank>('tanks')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    return tank || null;
  }

  async updateVolume(id: string, volumeChange: number): Promise<Tank | null> {
    const tank = await this.findById(id);
    if (!tank) {
      return null;
    }

    const newVolume = tank.current_volume_l + volumeChange;
    this.validateVolume(newVolume, tank.capacity_l);

    const [updated] = await db<Tank>('tanks')
      .where({ id })
      .update({
        current_volume_l: newVolume,
        updated_at: new Date(),
      })
      .returning('*');

    return updated || null;
  }

  async getSummary(): Promise<{
    totalTanks: number;
    activeTanks: number;
    totalCapacity: number;
    totalVolume: number;
    byProduct: Record<string, { count: number; volume: number; capacity: number }>;
  }> {
    const tanks = await db<Tank>('tanks')
      .select('tanks.*', 'products.name as product_name')
      .leftJoin('products', 'tanks.product_id', 'products.id')
      .where('tanks.status', 'active');

    const totalTanks = tanks.length;
    const activeTanks = tanks.filter(t => t.status === 'active').length;
    const totalCapacity = tanks.reduce((sum, t) => sum + Number(t.capacity_l), 0);
    const totalVolume = tanks.reduce((sum, t) => sum + Number(t.current_volume_l), 0);

    const byProduct: Record<string, { count: number; volume: number; capacity: number }> = {};
    for (const tank of tanks) {
      const productName = (tank as any).product_name || 'Desconhecido';
      if (!byProduct[productName]) {
        byProduct[productName] = { count: 0, volume: 0, capacity: 0 };
      }
      byProduct[productName].count++;
      byProduct[productName].volume += Number(tank.current_volume_l);
      byProduct[productName].capacity += Number(tank.capacity_l);
    }

    return {
      totalTanks,
      activeTanks,
      totalCapacity,
      totalVolume,
      byProduct,
    };
  }

  calculateFillPercentage(currentVolume: number, capacity: number): number {
    if (capacity <= 0) return 0;
    return Math.round((currentVolume / capacity) * 100);
  }

  calculateAlertStatus(currentVolume: number, capacity: number, minAlert: number): 'green' | 'yellow' | 'red' {
    const percentage = this.calculateFillPercentage(currentVolume, capacity);

    if (currentVolume <= minAlert) {
      return 'red';
    }

    if (percentage <= 25) {
      return 'yellow';
    }

    return 'green';
  }

  validateTankData(data: CreateTankDTO): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new TankError('Nome do tanque e obrigatorio', 'INVALID_NAME');
    }

    if (data.capacity_l <= 0) {
      throw new TankError('Capacidade deve ser maior que zero', 'INVALID_CAPACITY');
    }

    if (data.current_volume_l !== undefined) {
      this.validateVolume(data.current_volume_l, data.capacity_l);
    }
  }

  validateVolume(volume: number, capacity: number): void {
    if (volume < 0) {
      throw new TankError('Volume nao pode ser negativo', 'INVALID_VOLUME');
    }

    if (volume > capacity) {
      throw new TankError('Volume nao pode exceder a capacidade', 'VOLUME_EXCEEDS_CAPACITY');
    }
  }

  enrichTank(tank: any): TankWithDetails {
    return {
      ...tank,
      fill_percentage: this.calculateFillPercentage(
        Number(tank.current_volume_l),
        Number(tank.capacity_l)
      ),
      alert_status: this.calculateAlertStatus(
        Number(tank.current_volume_l),
        Number(tank.capacity_l),
        Number(tank.min_alert_l)
      ),
    };
  }
}

export class TankError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'TankError';
    this.code = code;
  }
}

export const tanksService = new TanksService();
