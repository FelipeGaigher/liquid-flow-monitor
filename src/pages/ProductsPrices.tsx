import { useEffect, useState } from "react";
import { listPriceLists } from "@/services/api";
import { PriceList } from "@/types";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ProductsPrices = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPriceLists();
      setPriceLists(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar precos";
      setError(message);
      setPriceLists([]);
    } finally {
      setLoading(false);
    }
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
          <AlertTitle>Falha ao carregar produtos e precos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Produtos & Preços</h2>
          <p className="text-muted-foreground">Gerencie produtos e tabelas de preços</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Preço
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tabela de Preços</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Válido a partir de</TableHead>
                <TableHead className="text-right">Preço por L (R$)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">{price.product}</TableCell>
                  <TableCell>
                    {new Date(price.valid_from).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(price.price_per_l)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        price.status === "vigente"
                          ? "bg-success/10 text-success"
                          : price.status === "futuro"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {price.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Produtos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Álcool</TableCell>
                <TableCell>Álcool</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">
                    Ativo
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Cachaça</TableCell>
                <TableCell>Cachaça</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">
                    Ativo
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default ProductsPrices;
