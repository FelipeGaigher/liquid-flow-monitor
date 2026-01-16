import { DashboardFilters, KPIs, Movement, ProductType, Tank, User, Site, PriceList } from "@/types";
import { mockMovements, mockPriceLists, mockSites, mockTanks, mockUsers } from "@/mocks/seed";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const TOKEN_STORAGE_KEY = "lfm.auth";
const MOCK_STORAGE_KEY = "lfm.mock";
const MOCK_VERSION = 1;

type MockProduct = { id: string; name: string; type: ProductType; status: "active" | "inactive" };

type MockState = {
  version: number;
  tanks: Tank[];
  sites: Site[];
  movements: Movement[];
  users: User[];
  priceLists: PriceList[];
  products: MockProduct[];
};

let inMemoryMockState: MockState | null = null;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildMockSeed(): MockState {
  return {
    version: MOCK_VERSION,
    tanks: clone(mockTanks),
    sites: clone(mockSites),
    movements: clone(mockMovements),
    users: clone(mockUsers),
    priceLists: clone(mockPriceLists),
    products: [
      { id: "prod-1", name: "Álcool", type: "Álcool", status: "active" },
      { id: "prod-2", name: "Cachaça", type: "Cachaça", status: "active" },
    ],
  };
}

function saveMockState(state: MockState) {
  inMemoryMockState = state;
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (private mode, quota, etc).
  }
}

function getMockState(): MockState {
  if (inMemoryMockState) return inMemoryMockState;
  if (typeof window === "undefined") {
    inMemoryMockState = buildMockSeed();
    return inMemoryMockState;
  }

  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!raw) {
    const seed = buildMockSeed();
    saveMockState(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as MockState;
    if (!parsed || parsed.version !== MOCK_VERSION) throw new Error("invalid mock cache");
    inMemoryMockState = parsed;
    return parsed;
  } catch {
    const seed = buildMockSeed();
    saveMockState(seed);
    return seed;
  }
}

function isOfflineError(error: unknown): boolean {
  // TypeError é lançado quando fetch falha (conexão recusada, sem rede, etc)
  if (error instanceof TypeError) return true;

  // Verificar se é um erro de rede pelo nome
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    if (
      name.includes("type") ||
      name.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed") ||
      message.includes("err_connection") ||
      message.includes("err_network") ||
      message.includes("fetch")
    ) {
      return true;
    }
  }

  return false;
}

function getStoredTokens(): AuthTokens | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function hasStoredTokens(): boolean {
  return Boolean(getStoredTokens());
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function notifyAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    const current = getStoredTokens();
    if (!current) return null;

    const updated: AuthTokens = {
      accessToken: data.access_token,
      refreshToken: current.refreshToken,
    };
    storeTokens(updated);
    return updated.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
  retry = true
): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;
  const tokens = auth ? getStoredTokens() : null;
  const finalHeaders: HeadersInit = {
    Accept: "application/json",
    ...(headers || {}),
  };

  let payload = body;
  if (body && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (tokens?.accessToken) {
    finalHeaders.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: payload,
  });

  let authExpired = false;
  if (response.status === 401 && retry && tokens?.refreshToken) {
    const newToken = await refreshAccessToken(tokens.refreshToken);
    if (newToken) {
      return apiRequest(path, options, false);
    }
    authExpired = true;
  }

  if (auth && response.status === 401 && !tokens?.refreshToken) {
    clearTokens();
    notifyAuthExpired();
  }

  if (auth && response.status === 401 && authExpired) {
    clearTokens();
    notifyAuthExpired();
  }

  if (!response.ok) {
    const errorBody = await safeJson(response);
    const errorMessage = errorBody?.error?.message || response.statusText || "Erro na requisicao";
    throw new ApiError(errorMessage, response.status, errorBody?.error?.code, errorBody?.error?.details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await safeJson(response)) as T;
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildQuery(params: Record<string, string | number | string[] | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      search.set(key, value.join(","));
      return;
    }
    if (value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function toApiProduct(value: ProductType | "Ambos") {
  if (value === "Álcool") return "Alcool";
  if (value === "Cachaça") return "Cachaca";
  return value;
}

function toUiProduct(value: string): ProductType | "Ambos" {
  if (value === "Alcool") return "Álcool";
  if (value === "Cachaca") return "Cachaça";
  if (value === "Ambos") return "Ambos";
  return "Álcool";
}

function toApiMovementType(value: Movement["type"]) {
  if (value === "saída") return "saida";
  return value;
}

function toUiMovementType(value: string): Movement["type"] {
  if (value === "saida") return "saída";
  if (value === "entrada" || value === "ajuste") return value;
  return "entrada";
}

function mapTankFromApi(payload: any): Tank {
  return {
    id: payload.id,
    name: payload.name,
    product: toUiProduct(payload.product),
    capacity_l: Number(payload.capacity_l),
    current_volume_l: Number(payload.current_volume_l),
    min_alert_l: Number(payload.min_alert_l),
    site_id: payload.site_id,
    status: payload.status,
  };
}

function mapMovementFromApi(payload: any): Movement {
  return {
    id: payload.id,
    tank_id: payload.tank_id,
    product: toUiProduct(payload.product) as ProductType,
    type: toUiMovementType(payload.type),
    volume_l: Number(payload.volume_l),
    price_per_l: payload.price_per_l ? Number(payload.price_per_l) : undefined,
    cost_per_l: payload.cost_per_l ? Number(payload.cost_per_l) : undefined,
    total_value: payload.total_value ? Number(payload.total_value) : 0,
    total_cost: payload.total_cost ? Number(payload.total_cost) : undefined,
    profit: payload.profit ? Number(payload.profit) : undefined,
    reference: payload.reference ?? undefined,
    notes: payload.notes ?? undefined,
    operator_id: payload.operator_id,
    created_at: payload.created_at,
  };
}

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function resolvePeriod(filters: DashboardFilters) {
  const now = new Date();
  let start = new Date(now);

  switch (filters.period) {
    case "hoje":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "semana":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "mes":
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case "3m":
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    case "ano":
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "custom":
      if (filters.customDateRange?.start) start = filters.customDateRange.start;
      if (filters.customDateRange?.end) return { start, end: filters.customDateRange.end };
      break;
    default:
      break;
  }

  return { start, end: now };
}

function previousPeriod(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return { prevStart: new Date(start.getTime() - diff), prevEnd: new Date(start.getTime()) };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

function filterMovements(
  movements: Movement[],
  tanks: Tank[],
  filters: DashboardFilters,
  start: Date,
  end: Date
) {
  const tankById = new Map(tanks.map((tank) => [tank.id, tank]));

  return movements.filter((movement) => {
    const createdAt = new Date(movement.created_at);
    if (createdAt < start || createdAt > end) return false;
    if (filters.products.length > 0 && !filters.products.includes(movement.product)) return false;
    if (filters.tankIds.length > 0 && !filters.tankIds.includes(movement.tank_id)) return false;
    if (filters.operatorIds.length > 0 && !filters.operatorIds.includes(movement.operator_id)) return false;
    if (filters.movementTypes.length > 0 && !filters.movementTypes.includes(movement.type)) return false;
    if (filters.siteIds.length > 0) {
      const tank = tankById.get(movement.tank_id);
      if (!tank || !filters.siteIds.includes(tank.site_id)) return false;
    }
    return true;
  });
}

function buildEmptyHeatmap() {
  const grid: { day: string; hour: number; value: number }[] = [];
  for (let dow = 0; dow < 7; dow += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      grid.push({ day: dayLabels[dow], hour, value: 0 });
    }
  }
  return grid;
}

function buildMockDashboard(filters: DashboardFilters) {
  const state = getMockState();
  const { start, end } = resolvePeriod(filters);
  const includesSaida = filters.movementTypes.length === 0 || filters.movementTypes.includes("saída");

  if (!includesSaida) {
    return {
      kpis: {
        revenue: 0,
        volume: 0,
        cogs: 0,
        profit: 0,
        margin: 0,
        avgTicket: 0,
        revenueGrowth: 0,
        profitGrowth: 0,
        volumeGrowth: 0,
      },
      salesByProduct: {},
      revenueTimeSeries: [],
      profitByProduct: {},
      top5Tanks: [],
      heatmap: buildEmptyHeatmap(),
    };
  }

  const base = filterMovements(state.movements, state.tanks, filters, start, end);
  const saidas = base.filter((movement) => movement.type === "saída");

  const kpiValues = (movements: Movement[]) => {
    const revenue = movements.reduce((sum, m) => sum + (m.total_value || 0), 0);
    const volume = movements.reduce((sum, m) => sum + (m.volume_l || 0), 0);
    const cogs = movements.reduce((sum, m) => sum + (m.total_cost || 0), 0);
    const profit = movements.reduce((sum, m) => sum + (m.profit || 0), 0);
    const count = movements.length;
    return { revenue, volume, cogs, profit, count };
  };

  const current = kpiValues(saidas);
  const { prevStart, prevEnd } = previousPeriod(start, end);
  const prevBase = filterMovements(state.movements, state.tanks, filters, prevStart, prevEnd)
    .filter((movement) => movement.type === "saída");
  const previous = kpiValues(prevBase);

  const salesByProduct = saidas.reduce<Record<string, number>>((acc, movement) => {
    acc[movement.product] = (acc[movement.product] || 0) + (movement.total_value || 0);
    return acc;
  }, {});

  const groupByDay = filters.period === "hoje" || filters.period === "semana";
  const revenueTimeSeries = saidas.reduce<Record<string, number>>((acc, movement) => {
    const date = new Date(movement.created_at);
    const key = groupByDay
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + (movement.total_value || 0);
    return acc;
  }, {});

  const profitByProduct = saidas.reduce<Record<string, { profit: number; revenue: number }>>((acc, movement) => {
    const key = movement.product;
    if (!acc[key]) acc[key] = { profit: 0, revenue: 0 };
    acc[key].profit += movement.profit || 0;
    acc[key].revenue += movement.total_value || 0;
    return acc;
  }, {});

  const tankRevenue = saidas.reduce<Record<string, number>>((acc, movement) => {
    acc[movement.tank_id] = (acc[movement.tank_id] || 0) + (movement.total_value || 0);
    return acc;
  }, {});
  const top5Tanks = Object.entries(tankRevenue)
    .map(([tankId, revenue]) => ({
      tankId,
      tankName: state.tanks.find((tank) => tank.id === tankId)?.name || "Tanque",
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const heatmap = buildEmptyHeatmap();
  for (const movement of saidas) {
    const date = new Date(movement.created_at);
    const day = dayLabels[date.getDay()];
    const hour = date.getHours();
    const entry = heatmap.find((row) => row.day === day && row.hour === hour);
    if (entry) entry.value += movement.total_value || 0;
  }

  return {
    kpis: {
      revenue: current.revenue,
      volume: current.volume,
      cogs: current.cogs,
      profit: current.profit,
      margin: current.revenue > 0 ? (current.profit / current.revenue) * 100 : 0,
      avgTicket: current.count > 0 ? current.revenue / current.count : 0,
      revenueGrowth: calculateGrowth(current.revenue, previous.revenue),
      profitGrowth: calculateGrowth(current.profit, previous.profit),
      volumeGrowth: calculateGrowth(current.volume, previous.volume),
    },
    salesByProduct,
    revenueTimeSeries: Object.entries(revenueTimeSeries)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    profitByProduct,
    top5Tanks,
    heatmap,
  };
}

function filterMovementsForList(
  movements: Movement[],
  filters: Partial<DashboardFilters> = {}
) {
  const tankId = filters.tankIds?.[0];
  const product = filters.products?.[0];
  const type = filters.movementTypes?.[0];
  const operatorId = filters.operatorIds?.[0];
  const periodRange = filters.period
    ? resolvePeriod({
        period: filters.period,
        customDateRange: filters.customDateRange,
        products: [],
        tankIds: [],
        siteIds: [],
        operatorIds: [],
        movementTypes: [],
      })
    : null;

  return movements.filter((movement) => {
    if (tankId && movement.tank_id !== tankId) return false;
    if (product && movement.product !== product) return false;
    if (type && movement.type !== type) return false;
    if (operatorId && movement.operator_id !== operatorId) return false;
    if (periodRange) {
      const createdAt = new Date(movement.created_at);
      if (createdAt < periodRange.start || createdAt > periodRange.end) return false;
    }
    return true;
  });
}

export async function getDashboardData(filters: DashboardFilters) {
  const query = buildQuery({
    period: filters.period,
    start_date: filters.period === "custom" ? filters.customDateRange?.start?.toISOString() : undefined,
    end_date: filters.period === "custom" ? filters.customDateRange?.end?.toISOString() : undefined,
    products: filters.products.map(toApiProduct),
    tank_ids: filters.tankIds,
    site_ids: filters.siteIds,
    operator_ids: filters.operatorIds,
    movement_types: filters.movementTypes.map(toApiMovementType),
  });

  try {
    return await apiRequest<{ kpis: KPIs; [key: string]: unknown }>(`/dashboard${query}`);
  } catch (error) {
    if (isOfflineError(error)) {
      return buildMockDashboard(filters);
    }
    throw error;
  }
}

export async function listTanks(): Promise<Tank[]> {
  try {
    const response = await apiRequest<{ data: any[] }>("/tanks");
    return response.data.map(mapTankFromApi);
  } catch (error) {
    if (isOfflineError(error)) {
      return getMockState().tanks;
    }
    throw error;
  }
}

export async function createTank(payload: Omit<Tank, "id" | "status"> & { status?: Tank["status"] }) {
  try {
    const response = await apiRequest<any>("/tanks", {
      method: "POST",
      body: {
        name: payload.name,
        site_id: payload.site_id,
        product: toApiProduct(payload.product),
        capacity_l: payload.capacity_l,
        current_volume_l: payload.current_volume_l,
        min_alert_l: payload.min_alert_l,
      },
    });
    return mapTankFromApi(response);
  } catch (error) {
    if (isOfflineError(error)) {
      const state = getMockState();
      const newTank: Tank = {
        id: `tank-local-${Date.now()}`,
        name: payload.name,
        site_id: payload.site_id,
        product: payload.product,
        capacity_l: payload.capacity_l,
        current_volume_l: payload.current_volume_l,
        min_alert_l: payload.min_alert_l,
        status: payload.status ?? "active",
      };
      state.tanks = [...state.tanks, newTank];
      saveMockState(state);
      return newTank;
    }
    throw error;
  }
}

export async function listSites(): Promise<Site[]> {
  try {
    const response = await apiRequest<{ data: Site[] }>("/sites");
    return response.data;
  } catch (error) {
    if (isOfflineError(error)) {
      return getMockState().sites;
    }
    throw error;
  }
}

export async function listProducts() {
  try {
    const response = await apiRequest<{ data: Array<{ id: string; name: string; status: string }> }>("/products");
    return response.data.map((product) => ({
      id: product.id,
      name: toUiProduct(product.name) as string,
      type: toUiProduct(product.name) as ProductType,
      status: product.status,
    }));
  } catch (error) {
    if (isOfflineError(error)) {
      return getMockState().products;
    }
    throw error;
  }
}

export async function listUsers(): Promise<User[]> {
  try {
    const response = await apiRequest<{ data: User[] }>("/users");
    return response.data;
  } catch (error) {
    if (isOfflineError(error)) {
      return getMockState().users;
    }
    throw error;
  }
}

export async function listMovements(
  filters: Partial<DashboardFilters> = {},
  page = 1,
  pageSize = 20
) {
  const periodRange = filters.period
    ? resolvePeriod({
        period: filters.period,
        customDateRange: filters.customDateRange,
        products: [],
        tankIds: [],
        siteIds: [],
        operatorIds: [],
        movementTypes: [],
      })
    : null;

  const query = buildQuery({
    tank_id: filters.tankIds?.[0],
    product: filters.products?.[0] ? toApiProduct(filters.products[0]) : undefined,
    type: filters.movementTypes?.[0] ? toApiMovementType(filters.movementTypes[0]) : undefined,
    operator_id: filters.operatorIds?.[0],
    start_date: periodRange?.start ? periodRange.start.toISOString() : undefined,
    end_date: periodRange?.end ? periodRange.end.toISOString() : undefined,
    page,
    limit: pageSize,
  });

  try {
    const response = await apiRequest<{ data: any[]; pagination: { total: number; page: number; limit: number } }>(
      `/movements${query}`
    );
    return {
      data: response.data.map(mapMovementFromApi),
      total: response.pagination.total,
      page: response.pagination.page,
      pageSize: response.pagination.limit,
    };
  } catch (error) {
    if (isOfflineError(error)) {
      const state = getMockState();
      const filtered = filterMovementsForList(state.movements, filters);
      const sorted = [...filtered].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const start = (page - 1) * pageSize;
      return {
        data: sorted.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    }
    throw error;
  }
}

export async function createMovement(payload: Omit<Movement, "id" | "created_at">) {
  try {
    const response = await apiRequest<any>("/movements", {
      method: "POST",
      body: {
        tank_id: payload.tank_id,
        type: toApiMovementType(payload.type),
        volume_l: payload.volume_l,
        price_per_l: payload.price_per_l,
        cost_per_l: payload.cost_per_l,
        reference: payload.reference,
        notes: payload.notes,
      },
    });

    return mapMovementFromApi({
      ...response,
      tank_id: response.tank?.id ?? payload.tank_id,
      operator_id: response.operator?.id ?? payload.operator_id,
    });
  } catch (error) {
    if (isOfflineError(error)) {
      const state = getMockState();
      const createdAt = new Date().toISOString();
      const movement: Movement = {
        ...payload,
        id: `mov-local-${Date.now()}`,
        created_at: createdAt,
      };

      const tankIndex = state.tanks.findIndex((tank) => tank.id === payload.tank_id);
      if (tankIndex >= 0) {
        const tank = state.tanks[tankIndex];
        let nextVolume = tank.current_volume_l;
        if (payload.type === "entrada") nextVolume += payload.volume_l;
        if (payload.type === "saída") nextVolume -= payload.volume_l;
        if (payload.type === "ajuste") nextVolume = payload.volume_l;
        state.tanks[tankIndex] = { ...tank, current_volume_l: Math.max(nextVolume, 0) };
      }

      state.movements = [movement, ...state.movements];
      saveMockState(state);
      return movement;
    }
    throw error;
  }
}

export async function listPriceLists(): Promise<PriceList[]> {
  try {
    const response = await apiRequest<{ data: any[] }>("/price-lists");
    return response.data.map((price) => ({
      id: price.id,
      product: toUiProduct(price.product_name) as ProductType,
      valid_from: price.valid_from,
      price_per_l: Number(price.price_per_l),
      status: price.status,
    }));
  } catch (error) {
    if (isOfflineError(error)) {
      return getMockState().priceLists;
    }
    throw error;
  }
}

export async function createPrice(productType: ProductType, data: { valid_from: string; price_per_l: number }) {
  try {
    const products = await listProducts();
    const match = products.find((product) => product.type === productType);
    if (!match) {
      throw new ApiError("Produto nao encontrado", 404, "PRODUCT_NOT_FOUND");
    }

    const response = await apiRequest<any>("/price-lists", {
      method: "POST",
      body: {
        product_id: match.id,
        price_per_l: data.price_per_l,
        valid_from: data.valid_from,
      },
    });

    return {
      id: response.id,
      product: productType,
      valid_from: response.valid_from,
      price_per_l: Number(response.price_per_l),
      status: response.status,
    } as PriceList;
  } catch (error) {
    if (isOfflineError(error)) {
      const state = getMockState();
      const validFrom = new Date(data.valid_from);
      const now = new Date();
      const status: PriceList["status"] = validFrom <= now ? "vigente" : "futuro";
      if (status === "vigente") {
        state.priceLists = state.priceLists.map((price) =>
          price.product === productType && price.status === "vigente"
            ? { ...price, status: "expirado" }
            : price
        );
      }
      const newPrice: PriceList = {
        id: `price-local-${Date.now()}`,
        product: productType,
        valid_from: data.valid_from,
        price_per_l: data.price_per_l,
        status,
      };
      state.priceLists = [newPrice, ...state.priceLists];
      saveMockState(state);
      return newPrice;
    }
    throw error;
  }
}

export async function resetDemoData() {
  const seed = buildMockSeed();
  saveMockState(seed);
  return seed;
}

export async function getTankById(id: string): Promise<Tank | undefined> {
  try {
    const response = await apiRequest<any>(`/tanks/${id}`);
    return mapTankFromApi(response);
  } catch (error) {
    if (isOfflineError(error)) {
      return getMockState().tanks.find((tank) => tank.id === id);
    }
    throw error;
  }
}

export async function getCurrentPrice(product: ProductType): Promise<number | null> {
  try {
    const response = await apiRequest<any>(`/prices/current/${toApiProduct(product)}`);
    return response.price ? Number(response.price.price_per_l) : null;
  } catch (error) {
    if (isOfflineError(error)) {
      const now = new Date();
      const prices = getMockState().priceLists.filter((price) => price.product === product);
      const current = prices
        .filter((price) => new Date(price.valid_from) <= now)
        .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())[0];
      return current ? current.price_per_l : null;
    }
    throw error;
  }
}

// Mock de usuarios para autenticacao offline
const mockAuthUsers = [
  { id: "user-1", email: "admin@tankcontrol.com", password: "admin123", name: "Administrador", role: "admin" as const },
  { id: "user-2", email: "operador@tankcontrol.com", password: "operador123", name: "Operador", role: "operador" as const },
  { id: "user-3", email: "viewer@tankcontrol.com", password: "viewer123", name: "Visualizador", role: "viewer" as const },
];

// Variavel para armazenar usuario logado no modo mock
let mockLoggedUser: typeof mockAuthUsers[0] | null = null;

function mockLogin(email: string, password: string) {
  const user = mockAuthUsers.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new ApiError("Email ou senha invalidos", 401, "INVALID_CREDENTIALS");
  }

  mockLoggedUser = user;

  // Gerar tokens mock
  const mockTokens = {
    accessToken: `mock-access-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
  };
  storeTokens(mockTokens);

  return {
    access_token: mockTokens.accessToken,
    refresh_token: mockTokens.refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: "active" as const,
    },
  };
}

export async function login(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        errorBody?.error?.message || "Falha na autenticacao",
        response.status,
        errorBody?.error?.code
      );
    }

    const data = await response.json();
    storeTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });

    return data;
  } catch (error) {
    // Fallback para modo offline - autenticacao mockada
    // Captura qualquer erro de rede (TypeError, fetch failed, etc)
    if (error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes("fetch"))) {
      console.log("[Auth] Backend offline, usando autenticacao mock");
      return mockLogin(email, password);
    }
    // Se for ApiError (credenciais invalidas), propagar
    throw error;
  }
}

export async function logout() {
  const tokens = getStoredTokens();
  try {
    if (tokens?.accessToken) {
      await apiRequest("/auth/logout", { method: "POST" });
    }
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser() {
  const tokens = getStoredTokens();

  // Se o token é mock, retornar usuario mock diretamente
  if (tokens?.accessToken?.startsWith("mock-") && mockLoggedUser) {
    return {
      id: mockLoggedUser.id,
      email: mockLoggedUser.email,
      name: mockLoggedUser.name,
      role: mockLoggedUser.role,
      status: "active" as const,
    };
  }

  try {
    return await apiRequest("/auth/me");
  } catch (error) {
    // Fallback para modo offline
    if (error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes("fetch"))) {
      // Se não há usuario mock logado, limpar tokens
      clearTokens();
    }
    throw error;
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest("/auth/password", {
    method: "PUT",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}
