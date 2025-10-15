import { mockSites, mockTanks, mockMovements, mockPriceLists, mockUsers } from "@/mocks/seed";
import { DashboardFilters, KPIs, Movement, Tank, ProductType } from "@/types";

// Simula delay de rede
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Estado em memória
let tanks = [...mockTanks];
let movements = [...mockMovements];
let priceLists = [...mockPriceLists];
let users = [...mockUsers];
const sites = [...mockSites];

// Helper: filtra movimentos pelos filtros globais
function filterMovements(filters: DashboardFilters): Movement[] {
  const { period, customDateRange, products, tankIds, siteIds, operatorIds, movementTypes } = filters;
  
  let filtered = [...movements];

  // Filtro de período
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case "hoje":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "semana":
      startDate.setDate(now.getDate() - 7);
      break;
    case "mes":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "ano":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "custom":
      if (customDateRange) startDate = customDateRange.start;
      break;
  }

  filtered = filtered.filter(m => new Date(m.created_at) >= startDate);
  if (period === "custom" && customDateRange) {
    filtered = filtered.filter(m => new Date(m.created_at) <= customDateRange.end);
  }

  // Filtros de produto
  if (products.length > 0) {
    filtered = filtered.filter(m => products.includes(m.product));
  }

  // Filtros de tanque
  if (tankIds.length > 0) {
    filtered = filtered.filter(m => tankIds.includes(m.tank_id));
  }

  // Filtros de site
  if (siteIds.length > 0) {
    const tanksInSites = tanks.filter(t => siteIds.includes(t.site_id)).map(t => t.id);
    filtered = filtered.filter(m => tanksInSites.includes(m.tank_id));
  }

  // Filtros de operador
  if (operatorIds.length > 0) {
    filtered = filtered.filter(m => operatorIds.includes(m.operator_id));
  }

  // Filtros de tipo de movimentação
  if (movementTypes.length > 0) {
    filtered = filtered.filter(m => movementTypes.includes(m.type));
  }

  return filtered;
}

// Calcula KPIs
function calculateKPIs(filtered: Movement[], period: DashboardFilters["period"]): KPIs {
  const saidas = filtered.filter(m => m.type === "saída");
  
  const revenue = saidas.reduce((sum, m) => sum + m.total_value, 0);
  const volume = saidas.reduce((sum, m) => sum + m.volume_l, 0);
  const cogs = saidas.reduce((sum, m) => sum + (m.total_cost || 0), 0);
  const profit = revenue - cogs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const avgTicket = saidas.length > 0 ? revenue / saidas.length : 0;

  // Calcula crescimentos (mock simples)
  const revenueGrowth = Math.random() * 20 - 5;
  const profitGrowth = Math.random() * 25 - 5;
  const volumeGrowth = Math.random() * 15 - 3;

  return {
    revenue,
    volume,
    cogs,
    profit,
    margin,
    avgTicket,
    revenueGrowth,
    profitGrowth,
    volumeGrowth,
  };
}

export async function getDashboardData(filters: DashboardFilters) {
  await delay();
  
  const filtered = filterMovements(filters);
  const kpis = calculateKPIs(filtered, filters.period);

  // Vendas por produto (donut)
  const salesByProduct = filtered
    .filter(m => m.type === "saída")
    .reduce((acc, m) => {
      acc[m.product] = (acc[m.product] || 0) + m.total_value;
      return acc;
    }, {} as Record<ProductType, number>);

  // Faturamento por período (série temporal)
  const revenueTimeSeries = generateTimeSeries(filtered, filters.period);

  // Lucro por produto
  const profitByProduct = filtered
    .filter(m => m.type === "saída")
    .reduce((acc, m) => {
      if (!acc[m.product]) acc[m.product] = { profit: 0, revenue: 0 };
      acc[m.product].profit += m.profit || 0;
      acc[m.product].revenue += m.total_value;
      return acc;
    }, {} as Record<ProductType, { profit: number; revenue: number }>);

  // Top 5 tanques por faturamento
  const topTanks = filtered
    .filter(m => m.type === "saída")
    .reduce((acc, m) => {
      acc[m.tank_id] = (acc[m.tank_id] || 0) + m.total_value;
      return acc;
    }, {} as Record<string, number>);

  const top5Tanks = Object.entries(topTanks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tankId, revenue]) => ({
      tankId,
      tankName: tanks.find(t => t.id === tankId)?.name || "N/A",
      revenue,
    }));

  // Heatmap vendas por hora x dia
  const heatmap = generateHeatmap(filtered);

  return {
    kpis,
    salesByProduct,
    revenueTimeSeries,
    profitByProduct,
    top5Tanks,
    heatmap,
  };
}

function generateTimeSeries(movements: Movement[], period: DashboardFilters["period"]) {
  const series: { date: string; revenue: number }[] = [];
  
  movements
    .filter(m => m.type === "saída")
    .forEach(m => {
      const date = new Date(m.created_at);
      const key = period === "hoje" || period === "semana" 
        ? date.toISOString().split("T")[0]
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      const existing = series.find(s => s.date === key);
      if (existing) {
        existing.revenue += m.total_value;
      } else {
        series.push({ date: key, revenue: m.total_value });
      }
    });

  return series.sort((a, b) => a.date.localeCompare(b.date));
}

function generateHeatmap(movements: Movement[]) {
  const heatmap: { day: string; hour: number; value: number }[] = [];
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const value = movements
        .filter(m => {
          const d = new Date(m.created_at);
          return d.getDay() === day && d.getHours() === hour && m.type === "saída";
        })
        .reduce((sum, m) => sum + m.total_value, 0);
      
      heatmap.push({ day: days[day], hour, value });
    }
  }
  
  return heatmap;
}

export async function listTanks() {
  await delay();
  return tanks;
}

export async function listSites() {
  await delay();
  return sites;
}

export async function listProducts() {
  await delay();
  return [
    { id: "alcohol", name: "Álcool", type: "Álcool" as ProductType },
    { id: "cachaca", name: "Cachaça", type: "Cachaça" as ProductType },
  ];
}

export async function listUsers() {
  await delay();
  return users;
}

export async function listMovements(filters?: Partial<DashboardFilters>, page: number = 1, pageSize: number = 20) {
  await delay();
  
  const defaultFilters: DashboardFilters = {
    period: "mes",
    products: [],
    tankIds: [],
    siteIds: [],
    operatorIds: [],
    movementTypes: [],
    ...filters,
  };

  const filtered = filterMovements(defaultFilters);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function createMovement(payload: Omit<Movement, "id" | "created_at">) {
  await delay(500);
  
  const newMovement: Movement = {
    ...payload,
    id: `mov-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  movements.unshift(newMovement);

  // Atualiza saldo do tanque
  const tank = tanks.find(t => t.id === payload.tank_id);
  if (tank) {
    if (payload.type === "entrada") {
      tank.current_volume_l += payload.volume_l;
    } else if (payload.type === "saída") {
      tank.current_volume_l -= payload.volume_l;
    } else {
      tank.current_volume_l = payload.volume_l;
    }
  }

  return newMovement;
}

export async function listPriceLists() {
  await delay();
  return priceLists;
}

export async function createPrice(productType: ProductType, data: { valid_from: string; price_per_l: number }) {
  await delay();
  
  const status: "futuro" | "vigente" = new Date(data.valid_from) > new Date() ? "futuro" : "vigente";
  
  const newPrice = {
    id: `price-${Date.now()}`,
    product: productType,
    valid_from: data.valid_from,
    price_per_l: data.price_per_l,
    status,
  };

  priceLists.push(newPrice);
  return newPrice;
}

export async function resetDemoData() {
  await delay();
  
  tanks = [...mockTanks];
  movements = [...mockMovements];
  priceLists = [...mockPriceLists];
  users = [...mockUsers];

  return { success: true };
}

export async function getTankById(id: string): Promise<Tank | undefined> {
  await delay();
  return tanks.find(t => t.id === id);
}

export async function getCurrentPrice(product: ProductType): Promise<number | null> {
  await delay();
  const now = new Date();
  const validPrices = priceLists.filter(
    p => p.product === product && new Date(p.valid_from) <= now
  );
  
  if (validPrices.length === 0) return null;
  
  validPrices.sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime());
  return validPrices[0].price_per_l;
}
