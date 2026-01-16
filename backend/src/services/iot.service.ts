import crypto from 'crypto';
import { db } from '../config/database.js';
import { IotDevice, IotMeasurement, Tank } from '../types/index.js';
import { tanksService } from './tanks.service.js';
import { auditLogsService } from './audit-logs.service.js';

export interface CreateIotDeviceDTO {
  name: string;
  tank_id?: string | null;
}

export interface RecordMeasurementDTO {
  device_id: string;
  volume_l: number;
  measured_at?: Date | string;
  raw_payload?: Record<string, unknown> | null;
}

const DEVICE_ONLINE_MINUTES = 10;

class IotService {
  generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  async createDevice(payload: CreateIotDeviceDTO): Promise<{ device: IotDevice; apiKey: string }> {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new IotError('Nome do dispositivo e obrigatorio', 'INVALID_NAME', 400);
    }

    if (payload.tank_id) {
      const tank = await tanksService.findById(payload.tank_id);
      if (!tank) {
        throw new IotError('Tanque nao encontrado', 'TANK_NOT_FOUND', 404);
      }
    }

    const apiKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(apiKey);

    const [device] = await db<IotDevice>('iot_devices')
      .insert({
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        tank_id: payload.tank_id ?? null,
        api_key_hash: apiKeyHash,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return { device, apiKey };
  }

  async listDevices(): Promise<Array<IotDevice & { tank_name?: string | null }>> {
    const devices = await db<IotDevice>('iot_devices')
      .select('iot_devices.*', 'tanks.name as tank_name')
      .leftJoin('tanks', 'iot_devices.tank_id', 'tanks.id')
      .orderBy('iot_devices.name', 'asc');

    return devices as Array<IotDevice & { tank_name?: string | null }>;
  }

  async getSummary(): Promise<{
    total: number;
    online: number;
    offline: number;
    latestMeasurements: IotMeasurement[];
  }> {
    const devices = await db<IotDevice>('iot_devices').select('*');
    const total = devices.length;

    const onlineThreshold = new Date(Date.now() - DEVICE_ONLINE_MINUTES * 60 * 1000);
    const online = devices.filter((device) =>
      device.last_seen_at ? new Date(device.last_seen_at) >= onlineThreshold : false
    ).length;

    const offline = total - online;

    const latestMeasurements = await db<IotMeasurement>('iot_measurements')
      .select('*')
      .orderBy('measured_at', 'desc')
      .limit(10);

    return { total, online, offline, latestMeasurements };
  }

  async authenticateDevice(deviceId: string, apiKey: string): Promise<IotDevice> {
    if (!apiKey) {
      throw new IotError('API key ausente', 'UNAUTHORIZED', 401);
    }

    const apiKeyHash = this.hashApiKey(apiKey);
    const device = await db<IotDevice>('iot_devices')
      .where({ id: deviceId, api_key_hash: apiKeyHash })
      .first();

    if (!device) {
      throw new IotError('API key invalida', 'UNAUTHORIZED', 401);
    }

    if (device.status !== 'active') {
      throw new IotError('Dispositivo inativo', 'DEVICE_INACTIVE', 403);
    }

    return device;
  }

  async recordMeasurement(payload: RecordMeasurementDTO, apiKey: string, ipAddress?: string): Promise<IotMeasurement> {
    if (!payload.device_id) {
      throw new IotError('device_id e obrigatorio', 'INVALID_DEVICE', 400);
    }

    if (payload.volume_l === undefined || Number.isNaN(Number(payload.volume_l))) {
      throw new IotError('volume_l e obrigatorio', 'INVALID_VOLUME', 400);
    }

    const device = await this.authenticateDevice(payload.device_id, apiKey);

    if (!device.tank_id) {
      throw new IotError('Dispositivo sem tanque associado', 'DEVICE_NO_TANK', 422);
    }

    const tank = await tanksService.findById(device.tank_id);
    if (!tank) {
      throw new IotError('Tanque nao encontrado', 'TANK_NOT_FOUND', 404);
    }

    const volume = Number(payload.volume_l);
    tanksService.validateVolume(volume, Number(tank.capacity_l));

    const measuredAt = payload.measured_at ? new Date(payload.measured_at) : new Date();
    if (Number.isNaN(measuredAt.getTime())) {
      throw new IotError('measured_at invalido', 'INVALID_MEASURED_AT', 400);
    }

    const measurement = await db.transaction(async (trx) => {
      const [created] = await trx<IotMeasurement>('iot_measurements')
        .insert({
          id: crypto.randomUUID(),
          device_id: device.id,
          tank_id: device.tank_id,
          volume_l: volume,
          measured_at: measuredAt,
          raw_payload: payload.raw_payload ?? null,
        })
        .returning('*');

      await trx<Tank>('tanks')
        .where({ id: device.tank_id })
        .update({
          current_volume_l: volume,
          updated_at: new Date(),
        });

      await trx<IotDevice>('iot_devices')
        .where({ id: device.id })
        .update({
          last_seen_at: new Date(),
          last_volume_l: volume,
          updated_at: new Date(),
        });

      return created;
    });

    await auditLogsService.create({
      action: 'UPDATE',
      entity: 'tank',
      entity_id: device.tank_id,
      old_values: { current_volume_l: (tank as any).current_volume_l },
      new_values: { current_volume_l: volume },
      ip_address: ipAddress,
    });

    return measurement;
  }
}

export class IotError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'IotError';
    this.code = code;
    this.status = status;
  }
}

export const iotService = new IotService();
