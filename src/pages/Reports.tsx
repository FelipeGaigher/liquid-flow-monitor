import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateSalesReport,
  generateStockReport,
  generateFinancialReport,
  generateMovementsReport,
} from "@/lib/pdf-generator";
import {
  listMovements,
  listTanks,
  listUsers,
  getDashboardData,
  getCurrentPrice,
} from "@/services/api";
import type { DashboardFilters, ProductType } from "@/types";

type ReportType = "vendas" | "estoque" | "financeiro" | "movimentacoes";

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  });
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async (type: ReportType) => {
    setLoading(true);
    try {
      // Buscar dados
      const tanks = await listTanks();
      const { data: movements } = await listMovements({}, 1, 10000);
      const users = await listUsers();

      // Filtrar por periodo
      const filteredMovements = movements.filter((m) => {
        const date = new Date(m.created_at);
        return date >= dateRange.start && date <= dateRange.end;
      });

      let csvContent = "";
      const separator = ";";

      switch (type) {
        case "vendas": {
          const sales = filteredMovements.filter((m) => m.type === "saida");
          csvContent = `Relatorio de Vendas - Periodo: ${format(dateRange.start, "dd/MM/yyyy")} a ${format(dateRange.end, "dd/MM/yyyy")}\n`;
          csvContent += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}\n\n`;
          csvContent += `Data${separator}Tanque${separator}Produto${separator}Volume_L${separator}Preco_L${separator}Valor_Total${separator}Lucro${separator}Referencia\n`;

          const tankMap = new Map(tanks.map((t) => [t.id, t]));
          sales.forEach((sale) => {
            const tank = tankMap.get(sale.tank_id);
            csvContent += `${format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}${separator}`;
            csvContent += `${tank?.name || "N/A"}${separator}`;
            csvContent += `${sale.product}${separator}`;
            csvContent += `${sale.volume_l}${separator}`;
            csvContent += `${sale.price_per_l || 0}${separator}`;
            csvContent += `${sale.total_value}${separator}`;
            csvContent += `${sale.profit || 0}${separator}`;
            csvContent += `${sale.reference || ""}\n`;
          });

          const totalVolume = sales.reduce((sum, s) => sum + s.volume_l, 0);
          const totalValue = sales.reduce((sum, s) => sum + s.total_value, 0);
          const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);

          csvContent += `\nTOTAIS\n`;
          csvContent += `Volume Total${separator}${totalVolume} L\n`;
          csvContent += `Valor Total${separator}R$ ${totalValue.toFixed(2)}\n`;
          csvContent += `Lucro Total${separator}R$ ${totalProfit.toFixed(2)}\n`;
          break;
        }

        case "estoque": {
          csvContent = `Relatorio de Estoque - Posicao em: ${format(new Date(), "dd/MM/yyyy")}\n`;
          csvContent += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}\n\n`;
          csvContent += `Tanque${separator}Produto${separator}Volume_Atual_L${separator}Capacidade_L${separator}Ocupacao_%${separator}Status${separator}Alerta\n`;

          tanks.forEach((tank) => {
            const occupancy = tank.capacity_l > 0 ? ((tank.current_volume_l / tank.capacity_l) * 100).toFixed(1) : "0";
            const alert = tank.current_volume_l <= tank.min_alert_l ? "SIM" : "NAO";
            csvContent += `${tank.name}${separator}`;
            csvContent += `${tank.product}${separator}`;
            csvContent += `${tank.current_volume_l}${separator}`;
            csvContent += `${tank.capacity_l}${separator}`;
            csvContent += `${occupancy}${separator}`;
            csvContent += `${tank.status}${separator}`;
            csvContent += `${alert}\n`;
          });
          break;
        }

        case "financeiro": {
          const filters: DashboardFilters = {
            period: "custom",
            customDateRange: dateRange,
            products: [],
            tankIds: [],
            siteIds: [],
            operatorIds: [],
            movementTypes: [],
          };
          const dashboardData = await getDashboardData(filters);
          const kpis = dashboardData.kpis;

          csvContent = `Relatorio Financeiro - Periodo: ${format(dateRange.start, "dd/MM/yyyy")} a ${format(dateRange.end, "dd/MM/yyyy")}\n`;
          csvContent += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}\n\n`;
          csvContent += `Indicador${separator}Valor\n`;
          csvContent += `Faturamento${separator}R$ ${kpis.revenue.toFixed(2)}\n`;
          csvContent += `Custo (COGS)${separator}R$ ${kpis.cogs.toFixed(2)}\n`;
          csvContent += `Lucro Bruto${separator}R$ ${kpis.profit.toFixed(2)}\n`;
          csvContent += `Margem Bruta${separator}${kpis.margin.toFixed(1)}%\n`;
          csvContent += `Volume Vendido${separator}${kpis.volume} L\n`;
          csvContent += `Ticket Medio${separator}R$ ${kpis.avgTicket.toFixed(2)}\n`;
          break;
        }

        case "movimentacoes": {
          csvContent = `Relatorio de Movimentacoes - Periodo: ${format(dateRange.start, "dd/MM/yyyy")} a ${format(dateRange.end, "dd/MM/yyyy")}\n`;
          csvContent += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}\n\n`;
          csvContent += `Data${separator}Tanque${separator}Produto${separator}Tipo${separator}Volume_L${separator}Preco_L${separator}Valor${separator}Lucro${separator}Operador${separator}Referencia\n`;

          const tankMap = new Map(tanks.map((t) => [t.id, t]));
          const userMap = new Map(users.map((u) => [u.id, u]));

          filteredMovements.forEach((m) => {
            const tank = tankMap.get(m.tank_id);
            const user = userMap.get(m.operator_id);
            csvContent += `${format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}${separator}`;
            csvContent += `${tank?.name || "N/A"}${separator}`;
            csvContent += `${m.product}${separator}`;
            csvContent += `${m.type}${separator}`;
            csvContent += `${m.volume_l}${separator}`;
            csvContent += `${m.price_per_l || ""}${separator}`;
            csvContent += `${m.total_value}${separator}`;
            csvContent += `${m.profit || ""}${separator}`;
            csvContent += `${user?.name || "N/A"}${separator}`;
            csvContent += `${m.reference || ""}\n`;
          });
          break;
        }
      }

      // Download do CSV
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${type}-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Relatorio de ${type} exportado com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Erro ao exportar relatorio. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (type: ReportType) => {
    setLoading(true);
    try {
      // Buscar dados necessarios
      const tanks = await listTanks();
      const { data: movements } = await listMovements({}, 1, 10000);
      const users = await listUsers();

      // Filtrar movimentacoes por periodo
      const filteredMovements = movements.filter((m) => {
        const date = new Date(m.created_at);
        return date >= dateRange.start && date <= dateRange.end;
      });

      switch (type) {
        case "vendas": {
          const filters: DashboardFilters = {
            period: "custom",
            customDateRange: dateRange,
            products: [],
            tankIds: [],
            siteIds: [],
            operatorIds: [],
            movementTypes: ["saida"],
          };
          const dashboardData = await getDashboardData(filters);

          generateSalesReport({
            movements: filteredMovements,
            tanks,
            period: dateRange,
            kpis: dashboardData.kpis,
          });
          break;
        }

        case "estoque": {
          // Buscar precos atuais
          const priceAlcool = await getCurrentPrice("Alcool" as ProductType);
          const priceCachaca = await getCurrentPrice("Cachaca" as ProductType);

          const currentPrices: Record<string, number> = {
            "Alcool": priceAlcool || 0,
            "Cachaca": priceCachaca || 0,
          };

          generateStockReport({
            tanks,
            currentPrices,
          });
          break;
        }

        case "financeiro": {
          const filters: DashboardFilters = {
            period: "custom",
            customDateRange: dateRange,
            products: [],
            tankIds: [],
            siteIds: [],
            operatorIds: [],
            movementTypes: [],
          };
          const dashboardData = await getDashboardData(filters);

          generateFinancialReport({
            kpis: dashboardData.kpis,
            salesByProduct: dashboardData.salesByProduct as Record<string, number>,
            period: dateRange,
          });
          break;
        }

        case "movimentacoes": {
          generateMovementsReport({
            movements: filteredMovements,
            tanks,
            users: users.map((u) => ({ id: u.id, name: u.name })),
            period: dateRange,
          });
          break;
        }
      }

      toast.success(`Relatorio de ${type} gerado com sucesso!`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatorio PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      id: "vendas" as ReportType,
      title: "Relatorio de Vendas",
      description: "Volume, valor, lucro e margem por periodo selecionado",
      icon: FileText,
    },
    {
      id: "estoque" as ReportType,
      title: "Relatorio de Estoque",
      description: "Posicao atual de todos os tanques e volumes armazenados",
      icon: FileText,
    },
    {
      id: "financeiro" as ReportType,
      title: "Relatorio Financeiro",
      description: "Analise de faturamento, custos, lucros e margens",
      icon: FileText,
    },
    {
      id: "movimentacoes" as ReportType,
      title: "Relatorio de Movimentacoes",
      description: "Historico detalhado de entradas, saidas e ajustes",
      icon: FileText,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Relatorios</h2>
        <p className="text-muted-foreground">Exporte e visualize relatorios do sistema</p>
      </div>

      {/* Filtros de Periodo */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Periodo</Label>
            <Select
              defaultValue="mes"
              onValueChange={(value) => {
                const now = new Date();
                let start = new Date();

                switch (value) {
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
                }

                if (value !== "custom") {
                  setDateRange({ start, end: now });
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Ultimos 7 dias</SelectItem>
                <SelectItem value="mes">Ultimo mes</SelectItem>
                <SelectItem value="3m">Ultimos 3 meses</SelectItem>
                <SelectItem value="6m">Ultimos 6 meses</SelectItem>
                <SelectItem value="ano">Ultimo ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.start ? format(dateRange.start, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date) => date && setDateRange((prev) => ({ ...prev, start: date }))}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !dateRange.end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.end ? format(dateRange.end, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date) => date && setDateRange((prev) => ({ ...prev, end: date }))}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Cards de Relatorios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:shadow-md",
              selectedReport === report.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedReport(report.id)}
          >
            <report.icon className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportCSV(report.id);
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportPDF(report.id);
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Informacoes adicionais */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium">Sobre os Relatorios</h4>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>- Arquivos CSV usam ponto-e-virgula (;) como separador</li>
              <li>- PDFs incluem cabecalho com data de geracao e usuario</li>
              <li>- Limite de 50.000 registros por exportacao</li>
              <li>- Formato de data: DD/MM/YYYY</li>
              <li>- Formato monetario: R$ #.###,##</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
