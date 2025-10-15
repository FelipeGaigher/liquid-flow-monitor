import { useEffect, useState } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { getDashboardData, listTanks } from "@/services/api";
import { KPICard } from "@/components/KPICard";
import { TankCard } from "@/components/TankCard";
import { MovementModal } from "@/components/MovementModal";
import { Tank, MovementType } from "@/types";
import { DollarSign, Droplets, TrendingDown, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card } from "@/components/ui/card";

const COLORS = {
  Álcool: "hsl(var(--chart-1))",
  Cachaça: "hsl(var(--chart-2))",
};

const Dashboard = () => {
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTank, setSelectedTank] = useState<string>();
  const [selectedType, setSelectedType] = useState<MovementType>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashData, tanksData] = await Promise.all([
        getDashboardData(filters),
        listTanks(),
      ]);
      setData(dashData);
      setTanks(tanksData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const openMovementModal = (tankId?: string, type?: MovementType) => {
    setSelectedTank(tankId);
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTank(undefined);
    setSelectedType(undefined);
  };

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { kpis, salesByProduct, revenueTimeSeries, profitByProduct, top5Tanks } = data;

  const donutData = Object.entries(salesByProduct).map(([product, value]) => ({
    name: product,
    value: value as number,
  }));

  const profitData = Object.entries(profitByProduct).map(([product, data]: any) => ({
    name: product,
    lucro: data.profit,
    margem: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do período selecionado</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Faturamento"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
          }).format(kpis.revenue)}
          growth={kpis.revenueGrowth}
          icon={<DollarSign className="h-8 w-8" />}
        />
        <KPICard
          title="Volume Vendido"
          value={`${kpis.volume.toLocaleString("pt-BR")} L`}
          growth={kpis.volumeGrowth}
          icon={<Droplets className="h-8 w-8" />}
        />
        <KPICard
          title="Lucro"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
          }).format(kpis.profit)}
          growth={kpis.profitGrowth}
          icon={<TrendingUp className="h-8 w-8" />}
        />
        <KPICard
          title="Margem"
          value={`${kpis.margin.toFixed(1)}%`}
          icon={<TrendingDown className="h-8 w-8" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="COGS"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
          }).format(kpis.cogs)}
        />
        <KPICard
          title="Ticket Médio"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
          }).format(kpis.avgTicket)}
        />
      </div>

      {/* Tanques */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Tanques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tanks.map((tank) => (
            <TankCard
              key={tank.id}
              tank={tank}
              onNewEntry={() => openMovementModal(tank.id, "entrada")}
              onNewExit={() => openMovementModal(tank.id, "saída")}
              onAdjust={() => openMovementModal(tank.id, "ajuste")}
            />
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Produto */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Vendas por Produto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${((entry.value / donutData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Faturamento por Período */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Faturamento por Período</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Faturamento"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Lucro por Produto */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Lucro por Produto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="lucro" name="Lucro (R$)" fill="hsl(var(--chart-1))" />
              <Line yAxisId="right" dataKey="margem" name="Margem (%)" stroke="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 5 Tanques */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 Tanques por Faturamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5Tanks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="tankName" type="category" width={100} />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Bar dataKey="revenue" name="Faturamento" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <MovementModal
        open={modalOpen}
        onClose={handleModalClose}
        tanks={tanks}
        preSelectedTank={selectedTank}
        preSelectedType={selectedType}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Dashboard;
