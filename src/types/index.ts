export type ProductType = "Álcool" | "Cachaça";

export type MovementType = "entrada" | "saída" | "ajuste";

export interface Tank {
  id: string;
  name: string;
  product: ProductType | "Ambos";
  capacity_l: number;
  current_volume_l: number;
  min_alert_l: number;
  site_id: string;
  status: "active" | "inactive" | "maintenance";
}

export interface Site {
  id: string;
  name: string;
  location: string;
}

export interface Movement {
  id: string;
  tank_id: string;
  product: ProductType;
  type: MovementType;
  volume_l: number;
  price_per_l?: number;
  cost_per_l?: number;
  total_value: number;
  total_cost?: number;
  profit?: number;
  reference?: string;
  notes?: string;
  operator_id: string;
  created_at: string;
}

export interface PriceList {
  id: string;
  product: ProductType;
  valid_from: string;
  price_per_l: number;
  status: "vigente" | "futuro" | "expirado";
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "operador" | "viewer";
  status: "active" | "inactive";
}

export interface DashboardFilters {
  period: "hoje" | "semana" | "mes" | "3m" | "6m" | "ano" | "custom";
  customDateRange?: { start: Date; end: Date };
  products: ProductType[];
  tankIds: string[];
  siteIds: string[];
  operatorIds: string[];
  movementTypes: MovementType[];
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
