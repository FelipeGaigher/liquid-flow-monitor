import { Tank, Site, Movement, PriceList, User, ProductType, MovementType } from "@/types";

// Sites
export const mockSites: Site[] = [
  { id: "site-1", name: "Unidade Norte", location: "São Paulo - SP" },
  { id: "site-2", name: "Unidade Sul", location: "Curitiba - PR" },
  { id: "site-3", name: "Unidade Centro", location: "Belo Horizonte - MG" },
];

// Tanks
export const mockTanks: Tank[] = [
  {
    id: "tank-1",
    name: "Tanque A1",
    product: "Álcool",
    capacity_l: 50000,
    current_volume_l: 38500,
    min_alert_l: 10000,
    site_id: "site-1",
    status: "active",
  },
  {
    id: "tank-2",
    name: "Tanque A2",
    product: "Álcool",
    capacity_l: 80000,
    current_volume_l: 62000,
    min_alert_l: 15000,
    site_id: "site-1",
    status: "active",
  },
  {
    id: "tank-3",
    name: "Tanque C1",
    product: "Cachaça",
    capacity_l: 30000,
    current_volume_l: 8500,
    min_alert_l: 8000,
    site_id: "site-1",
    status: "active",
  },
  {
    id: "tank-4",
    name: "Tanque C2",
    product: "Cachaça",
    capacity_l: 40000,
    current_volume_l: 28000,
    min_alert_l: 10000,
    site_id: "site-2",
    status: "active",
  },
  {
    id: "tank-5",
    name: "Tanque M1",
    product: "Ambos",
    capacity_l: 60000,
    current_volume_l: 45000,
    min_alert_l: 12000,
    site_id: "site-2",
    status: "active",
  },
  {
    id: "tank-6",
    name: "Tanque A3",
    product: "Álcool",
    capacity_l: 70000,
    current_volume_l: 52000,
    min_alert_l: 14000,
    site_id: "site-3",
    status: "active",
  },
];

// Users
export const mockUsers: User[] = [
  { id: "user-1", name: "João Silva", email: "joao@example.com", phone: "(11) 98765-4321", role: "admin", status: "active" },
  { id: "user-2", name: "Maria Santos", email: "maria@example.com", phone: "(21) 99876-5432", role: "operador", status: "active" },
  { id: "user-3", name: "Pedro Costa", email: "pedro@example.com", phone: "(31) 97654-3210", role: "operador", status: "active" },
  { id: "user-4", name: "Ana Paula", email: "ana@example.com", role: "viewer", status: "active" },
];

// Price Lists
export const mockPriceLists: PriceList[] = [
  {
    id: "price-1",
    product: "Álcool",
    valid_from: "2024-01-01T00:00:00Z",
    price_per_l: 3.5,
    status: "vigente",
  },
  {
    id: "price-2",
    product: "Cachaça",
    valid_from: "2024-01-01T00:00:00Z",
    price_per_l: 12.8,
    status: "vigente",
  },
  {
    id: "price-3",
    product: "Álcool",
    valid_from: "2025-02-01T00:00:00Z",
    price_per_l: 3.75,
    status: "futuro",
  },
];

// Generate movements (últimos 6 meses)
function generateMovements(): Movement[] {
  const movements: Movement[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  const products: ProductType[] = ["Álcool", "Cachaça"];
  const types: MovementType[] = ["entrada", "saída"];

  for (let i = 0; i < 300; i++) {
    const randomDate = new Date(
      sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
    );

    const product = products[Math.floor(Math.random() * products.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const volume = Math.floor(Math.random() * 5000) + 500;
    
    const pricePerL = product === "Álcool" ? 3.5 : 12.8;
    const costPerL = product === "Álcool" ? 2.1 : 7.5;

    const totalValue = type === "saída" ? volume * pricePerL : 0;
    const totalCost = type === "entrada" ? volume * costPerL : (type === "saída" ? volume * costPerL : 0);
    const profit = type === "saída" ? totalValue - totalCost : 0;

    const availableTanks = mockTanks.filter(t => t.product === product || t.product === "Ambos");
    const tank = availableTanks[Math.floor(Math.random() * availableTanks.length)];

    movements.push({
      id: `mov-${i + 1}`,
      tank_id: tank.id,
      product,
      type,
      volume_l: volume,
      price_per_l: type === "saída" ? pricePerL : undefined,
      cost_per_l: type === "entrada" ? costPerL : undefined,
      total_value: totalValue,
      total_cost: totalCost,
      profit,
      reference: `REF-${1000 + i}`,
      notes: type === "entrada" ? "Entrada de estoque" : "Venda cliente",
      operator_id: mockUsers[Math.floor(Math.random() * mockUsers.length)].id,
      created_at: randomDate.toISOString(),
    });
  }

  return movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const mockMovements = generateMovements();
