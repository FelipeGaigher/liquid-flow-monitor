import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const Reports = () => {
  const handleExport = (type: string) => {
    alert(`Mock: Exportando ${type}...`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Relatórios</h2>
        <p className="text-muted-foreground">Exporte e visualize relatórios do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <FileText className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Relatório de Vendas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Relatório completo de todas as vendas realizadas no período
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleExport("Vendas CSV")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("Vendas PDF")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <FileText className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Relatório de Estoque</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Situação atual de todos os tanques e volumes armazenados
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleExport("Estoque CSV")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("Estoque PDF")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <FileText className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Relatório Financeiro</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Análise de faturamento, custos, lucros e margens
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleExport("Financeiro CSV")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("Financeiro PDF")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <FileText className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Relatório de Movimentações</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Histórico detalhado de entradas, saídas e ajustes
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleExport("Movimentações CSV")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("Movimentações PDF")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
