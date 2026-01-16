const now = new Date();

const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const buildMockState = () => ({
  version: 1,
  tanks: [
    {
      id: "tank-1",
      name: "Tanque A1",
      product: "Álcool",
      capacity_l: 50000,
      current_volume_l: 38000,
      min_alert_l: 10000,
      site_id: "site-1",
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
  ],
  sites: [
    { id: "site-1", name: "Unidade Norte", location: "São Paulo - SP" },
    { id: "site-2", name: "Unidade Sul", location: "Curitiba - PR" },
  ],
  movements: [
    {
      id: "mov-1",
      tank_id: "tank-1",
      product: "Álcool",
      type: "saída",
      volume_l: 1200,
      price_per_l: 3.5,
      cost_per_l: 2.1,
      total_value: 4200,
      total_cost: 2520,
      profit: 1680,
      reference: "REF-1001",
      notes: "Venda teste",
      operator_id: "user-1",
      created_at: daysAgo(3),
    },
    {
      id: "mov-2",
      tank_id: "tank-1",
      product: "Álcool",
      type: "entrada",
      volume_l: 2000,
      cost_per_l: 2.1,
      total_value: 0,
      total_cost: 4200,
      profit: 0,
      reference: "REF-1002",
      notes: "Entrada teste",
      operator_id: "user-1",
      created_at: daysAgo(5),
    },
  ],
  users: [
    {
      id: "user-1",
      name: "Administrador",
      email: "admin@tankcontrol.com",
      phone: "(11) 98765-4321",
      role: "admin",
      status: "active",
    },
  ],
  priceLists: [
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
  ],
  products: [
    { id: "prod-1", name: "Álcool", type: "Álcool", status: "active" },
    { id: "prod-2", name: "Cachaça", type: "Cachaça", status: "active" },
  ],
});
