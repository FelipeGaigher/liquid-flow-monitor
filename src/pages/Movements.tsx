import { useEffect, useState } from "react";
import { listMovements, listTanks } from "@/services/api";
import { Movement, Tank } from "@/types";
import { Button } from "@/components/ui/button";
import { MovementModal } from "@/components/MovementModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Plus } from "lucide-react";

const Movements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [movData, tanksData] = await Promise.all([
        listMovements({}, 1, 50),
        listTanks(),
      ]);
      setMovements(movData.data);
      setTanks(tanksData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar movimentacoes";
      setError(message);
      setMovements([]);
      setTanks([]);
    } finally {
      setLoading(false);
    }
  };

  const getTankName = (tankId: string) => {
    return tanks.find((t) => t.id === tankId)?.name || "N/A";
  };

  const exportCSV = () => {
    const headers = [
      "Data/Hora",
      "Produto",
      "Tanque",
      "Tipo",
      "Volume (L)",
      "Preço/L",
      "Valor (R$)",
      "COGS (R$)",
      "Lucro (R$)",
      "Referência",
    ];

    const rows = movements.map((m) => [
      new Date(m.created_at).toLocaleString("pt-BR"),
      m.product,
      getTankName(m.tank_id),
      m.type,
      m.volume_l,
      m.price_per_l || "-",
      m.total_value.toFixed(2),
      m.total_cost?.toFixed(2) || "-",
      m.profit?.toFixed(2) || "-",
      m.reference || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimentacoes-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar as movimentacoes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    );
  }

  const totals = {
    volume: movements.reduce((sum, m) => sum + (m.type === "saída" ? m.volume_l : 0), 0),
    value: movements.reduce((sum, m) => sum + m.total_value, 0),
    cost: movements.reduce((sum, m) => sum + (m.total_cost || 0), 0),
    profit: movements.reduce((sum, m) => sum + (m.profit || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Movimentações</h2>
          <p className="text-muted-foreground">Histórico de entradas, saídas e ajustes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tanque</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Volume (L)</TableHead>
              <TableHead className="text-right">Preço/L</TableHead>
              <TableHead className="text-right">Valor (R$)</TableHead>
              <TableHead className="text-right">COGS (R$)</TableHead>
              <TableHead className="text-right">Lucro (R$)</TableHead>
              <TableHead>Ref</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((mov) => (
              <TableRow key={mov.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(mov.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>{mov.product}</TableCell>
                <TableCell>{getTankName(mov.tank_id)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      mov.type === "entrada"
                        ? "bg-success/10 text-success"
                        : mov.type === "saída"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {mov.type}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {mov.volume_l.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  {mov.price_per_l
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(mov.price_per_l)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(mov.total_value)}
                </TableCell>
                <TableCell className="text-right">
                  {mov.total_cost
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(mov.total_cost)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {mov.profit !== undefined
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(mov.profit)
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {mov.reference || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="border-t p-4 bg-muted/30">
          <div className="flex gap-8 text-sm font-medium">
            <div>
              <span className="text-muted-foreground mr-2">Volume Total:</span>
              <span>{totals.volume.toLocaleString("pt-BR")} L</span>
            </div>
            <div>
              <span className="text-muted-foreground mr-2">Valor Total:</span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totals.value)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground mr-2">Lucro Total:</span>
              <span className="text-success">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totals.profit)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <MovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tanks={tanks}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Movements;
