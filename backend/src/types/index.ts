import { Role } from '../config/permissions.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: Role;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'active' | 'inactive';
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export type ProductType = 'Alcool' | 'Cachaca';

export interface Tank {
  id: string;
  name: string;
  site_id: string;
  product_id: string;
  capacity_l: number;
  current_volume_l: number;
  min_alert_l: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface TankWithDetails extends Tank {
  site_name?: string;
  product_name?: string;
  fill_percentage?: number;
  alert_status?: 'green' | 'yellow' | 'red';
}

export type MovementType = 'entrada' | 'saida' | 'ajuste';

export interface Movement {
  id: string;
  tank_id: string;
  product_id: string;
  type: MovementType;
  volume_l: number;
  price_per_l?: number;
  cost_per_l?: number;
  total_value?: number;
  total_cost?: number;
  profit?: number;
  reference?: string;
  notes?: string;
  operator_id: string;
  created_at: Date;
}

export interface MovementWithDetails extends Movement {
  tank_name?: string;
  product_name?: string;
  operator_name?: string;
}

export interface PriceList {
  id: string;
  product_id: string;
  price_per_l: number;
  valid_from: Date;
  valid_until?: Date;
  status: 'vigente' | 'futuro' | 'expirado';
  created_at: Date;
  updated_at: Date;
}

export interface DashboardFilters {
  period: 'hoje' | 'semana' | 'mes' | '3m' | '6m' | 'ano' | 'custom';
  start_date?: Date;
  end_date?: Date;
  products?: string[];
  tank_ids?: string[];
  site_ids?: string[];
  operator_ids?: string[];
  movement_types?: MovementType[];
}

export interface KPIs {
  revenue: number;
  volume: number;
  cogs: number;
  profit: number;
  margin: number;
  avgTicket: number;
  revenueGrowth: number;
  profitGrowth: number;
  volumeGrowth: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: AuditAction;
  entity: string;
  entity_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: Date;
}
