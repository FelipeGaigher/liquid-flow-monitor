import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Movement, Tank, KPIs } from "@/types";

// Configuracoes do PDF
const PDF_CONFIG = {
  margin: 20,
  headerColor: [41, 128, 185] as [number, number, number], // Azul
  alternateRowColor: [245, 245, 245] as [number, number, number],
  fontSize: {
    title: 18,
    subtitle: 12,
    body: 10,
    small: 8,
  },
};

// Formatar valores monetarios
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Formatar numeros
function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Formatar porcentagem
function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

// Formatar data
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

// Formatar data e hora
function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

// Adicionar cabecalho do relatorio
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Titulo
  doc.setFontSize(PDF_CONFIG.fontSize.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 128, 185);
  doc.text(title, PDF_CONFIG.margin, 25);

  // Subtitulo
  if (subtitle) {
    doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, PDF_CONFIG.margin, 35);
  }

  // Linha separadora
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(PDF_CONFIG.margin, 40, pageWidth - PDF_CONFIG.margin, 40);

  // Info de geracao
  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setTextColor(150, 150, 150);
  const now = formatDateTime(new Date());
  doc.text(`Gerado em: ${now}`, pageWidth - PDF_CONFIG.margin, 25, { align: "right" });
  doc.text("TankControl - Sistema de Gestao de Tanques", pageWidth - PDF_CONFIG.margin, 32, { align: "right" });

  return 50; // Retorna a posicao Y apos o cabecalho
}

// Adicionar rodape
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
}

// Tipos de dados para os relatorios
interface SalesReportData {
  movements: Movement[];
  tanks: Tank[];
  period: { start: Date; end: Date };
  kpis?: KPIs;
}

interface StockReportData {
  tanks: Tank[];
  currentPrices: Record<string, number>;
}

interface FinancialReportData {
  kpis: KPIs;
  salesByProduct: Record<string, number>;
  period: { start: Date; end: Date };
}

interface MovementsReportData {
  movements: Movement[];
  tanks: Tank[];
  users: { id: string; name: string }[];
  period?: { start: Date; end: Date };
}

// Gerar Relatorio de Vendas
export function generateSalesReport(data: SalesReportData): void {
  const doc = new jsPDF();
  const { movements, tanks, period, kpis } = data;

  const periodStr = `${formatDate(period.start)} a ${formatDate(period.end)}`;
  let yPos = addHeader(doc, "Relatorio de Vendas", `Periodo: ${periodStr}`);

  // Filtrar apenas saidas (vendas)
  const sales = movements.filter((m) => m.type === "saida");

  // Resumo de KPIs
  if (kpis) {
    yPos += 5;
    doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Resumo do Periodo", PDF_CONFIG.margin, yPos);

    yPos += 10;
    autoTable(doc, {
      startY: yPos,
      head: [["Indicador", "Valor"]],
      body: [
        ["Volume Total Vendido", `${formatNumber(kpis.volume)} L`],
        ["Faturamento Total", formatCurrency(kpis.revenue)],
        ["Custo Total (COGS)", formatCurrency(kpis.cogs)],
        ["Lucro Bruto", formatCurrency(kpis.profit)],
        ["Margem Bruta", formatPercent(kpis.margin)],
        ["Ticket Medio", formatCurrency(kpis.avgTicket)],
        ["Quantidade de Vendas", formatNumber(sales.length)],
      ],
      headStyles: {
        fillColor: PDF_CONFIG.headerColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: PDF_CONFIG.alternateRowColor,
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
      theme: "striped",
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Tabela de vendas detalhadas
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento das Vendas", PDF_CONFIG.margin, yPos);

  const tankMap = new Map(tanks.map((t) => [t.id, t]));

  const tableData = sales.map((sale) => {
    const tank = tankMap.get(sale.tank_id);
    return [
      formatDateTime(sale.created_at),
      tank?.name || "N/A",
      sale.product,
      `${formatNumber(sale.volume_l)} L`,
      formatCurrency(sale.price_per_l || 0),
      formatCurrency(sale.total_value),
      formatCurrency(sale.profit || 0),
      sale.reference || "-",
    ];
  });

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Data/Hora", "Tanque", "Produto", "Volume", "Preco/L", "Total", "Lucro", "Ref."]],
    body: tableData,
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
  });

  addFooter(doc);
  doc.save(`relatorio-vendas-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

// Gerar Relatorio de Estoque
export function generateStockReport(data: StockReportData): void {
  const doc = new jsPDF();
  const { tanks, currentPrices } = data;

  const dateStr = formatDate(new Date());
  let yPos = addHeader(doc, "Relatorio de Estoque", `Posicao em: ${dateStr}`);

  // Resumo geral
  const totalVolume = tanks.reduce((sum, t) => sum + t.current_volume_l, 0);
  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity_l, 0);
  const avgOccupancy = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 0;
  const activeTanks = tanks.filter((t) => t.status === "active").length;
  const alertTanks = tanks.filter((t) => t.current_volume_l <= t.min_alert_l).length;

  // Calcular valor total estimado
  let totalEstimatedValue = 0;
  tanks.forEach((tank) => {
    const price = currentPrices[tank.product] || 0;
    totalEstimatedValue += tank.current_volume_l * price;
  });

  yPos += 5;
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo Geral", PDF_CONFIG.margin, yPos);

  yPos += 10;
  autoTable(doc, {
    startY: yPos,
    head: [["Indicador", "Valor"]],
    body: [
      ["Total de Tanques", formatNumber(tanks.length)],
      ["Tanques Ativos", formatNumber(activeTanks)],
      ["Tanques em Alerta", formatNumber(alertTanks)],
      ["Volume Total em Estoque", `${formatNumber(totalVolume)} L`],
      ["Capacidade Total", `${formatNumber(totalCapacity)} L`],
      ["Ocupacao Media", formatPercent(avgOccupancy)],
      ["Valor Estimado em Estoque", formatCurrency(totalEstimatedValue)],
    ],
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Tabela de tanques
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Tanque", PDF_CONFIG.margin, yPos);

  const tableData = tanks.map((tank) => {
    const occupancy = tank.capacity_l > 0 ? (tank.current_volume_l / tank.capacity_l) * 100 : 0;
    const price = currentPrices[tank.product] || 0;
    const estimatedValue = tank.current_volume_l * price;
    const statusLabel = tank.status === "active" ? "Ativo" : tank.status === "maintenance" ? "Manutencao" : "Inativo";
    const alertLabel = tank.current_volume_l <= tank.min_alert_l ? "SIM" : "-";

    return [
      tank.name,
      tank.product,
      `${formatNumber(tank.current_volume_l)} L`,
      `${formatNumber(tank.capacity_l)} L`,
      formatPercent(occupancy),
      formatCurrency(estimatedValue),
      statusLabel,
      alertLabel,
    ];
  });

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Tanque", "Produto", "Volume Atual", "Capacidade", "Ocupacao", "Valor Est.", "Status", "Alerta"]],
    body: tableData,
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
    didParseCell: (data) => {
      // Destacar tanques em alerta
      if (data.column.index === 7 && data.cell.raw === "SIM") {
        data.cell.styles.textColor = [255, 0, 0];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  addFooter(doc);
  doc.save(`relatorio-estoque-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

// Gerar Relatorio Financeiro
export function generateFinancialReport(data: FinancialReportData): void {
  const doc = new jsPDF();
  const { kpis, salesByProduct, period } = data;

  const periodStr = `${formatDate(period.start)} a ${formatDate(period.end)}`;
  let yPos = addHeader(doc, "Relatorio Financeiro", `Periodo: ${periodStr}`);

  // Indicadores Principais
  yPos += 5;
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Indicadores Financeiros", PDF_CONFIG.margin, yPos);

  yPos += 10;
  autoTable(doc, {
    startY: yPos,
    head: [["Indicador", "Valor", "Variacao"]],
    body: [
      ["Faturamento Bruto", formatCurrency(kpis.revenue), `${kpis.revenueGrowth >= 0 ? "+" : ""}${formatPercent(kpis.revenueGrowth)}`],
      ["Custo dos Produtos (COGS)", formatCurrency(kpis.cogs), "-"],
      ["Lucro Bruto", formatCurrency(kpis.profit), `${kpis.profitGrowth >= 0 ? "+" : ""}${formatPercent(kpis.profitGrowth)}`],
      ["Margem Bruta", formatPercent(kpis.margin), "-"],
      ["Volume Vendido", `${formatNumber(kpis.volume)} L`, `${kpis.volumeGrowth >= 0 ? "+" : ""}${formatPercent(kpis.volumeGrowth)}`],
      ["Ticket Medio", formatCurrency(kpis.avgTicket), "-"],
    ],
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
    didParseCell: (data) => {
      // Colorir variacoes
      if (data.column.index === 2 && data.section === "body") {
        const value = data.cell.raw as string;
        if (value.startsWith("+")) {
          data.cell.styles.textColor = [0, 128, 0]; // Verde
        } else if (value.startsWith("-") && value !== "-") {
          data.cell.styles.textColor = [255, 0, 0]; // Vermelho
        }
      }
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Faturamento por Produto
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.text("Faturamento por Produto", PDF_CONFIG.margin, yPos);

  const totalRevenue = Object.values(salesByProduct).reduce((sum, val) => sum + val, 0);
  const productData = Object.entries(salesByProduct).map(([product, revenue]) => {
    const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
    return [product, formatCurrency(revenue), formatPercent(percentage)];
  });

  // Adicionar linha de total
  productData.push(["TOTAL", formatCurrency(totalRevenue), "100%"]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Produto", "Faturamento", "Participacao"]],
    body: productData,
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
    didParseCell: (data) => {
      // Destacar linha de total
      if (data.row.index === productData.length - 1 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [220, 220, 220];
      }
    },
  });

  addFooter(doc);
  doc.save(`relatorio-financeiro-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

// Gerar Relatorio de Movimentacoes
export function generateMovementsReport(data: MovementsReportData): void {
  const doc = new jsPDF("l"); // Paisagem para mais colunas
  const { movements, tanks, users, period } = data;

  const periodStr = period
    ? `${formatDate(period.start)} a ${formatDate(period.end)}`
    : "Todas as movimentacoes";
  let yPos = addHeader(doc, "Relatorio de Movimentacoes", periodStr);

  // Resumo
  const entradas = movements.filter((m) => m.type === "entrada");
  const saidas = movements.filter((m) => m.type === "saida");
  const ajustes = movements.filter((m) => m.type === "ajuste");

  const volumeEntradas = entradas.reduce((sum, m) => sum + m.volume_l, 0);
  const volumeSaidas = saidas.reduce((sum, m) => sum + m.volume_l, 0);
  const valorEntradas = entradas.reduce((sum, m) => sum + (m.total_cost || 0), 0);
  const valorSaidas = saidas.reduce((sum, m) => sum + m.total_value, 0);

  yPos += 5;
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo das Movimentacoes", PDF_CONFIG.margin, yPos);

  yPos += 10;
  autoTable(doc, {
    startY: yPos,
    head: [["Tipo", "Quantidade", "Volume Total", "Valor Total"]],
    body: [
      ["Entradas", formatNumber(entradas.length), `${formatNumber(volumeEntradas)} L`, formatCurrency(valorEntradas)],
      ["Saidas (Vendas)", formatNumber(saidas.length), `${formatNumber(volumeSaidas)} L`, formatCurrency(valorSaidas)],
      ["Ajustes", formatNumber(ajustes.length), "-", "-"],
      ["TOTAL", formatNumber(movements.length), "-", "-"],
    ],
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Tabela de movimentacoes
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setFont("helvetica", "bold");
  doc.text("Historico Detalhado", PDF_CONFIG.margin, yPos);

  const tankMap = new Map(tanks.map((t) => [t.id, t]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const typeLabels: Record<string, string> = {
    entrada: "Entrada",
    saida: "Saida",
    ajuste: "Ajuste",
  };

  const tableData = movements.map((m) => {
    const tank = tankMap.get(m.tank_id);
    const user = userMap.get(m.operator_id);
    return [
      formatDateTime(m.created_at),
      tank?.name || "N/A",
      m.product,
      typeLabels[m.type] || m.type,
      `${formatNumber(m.volume_l)} L`,
      m.price_per_l ? formatCurrency(m.price_per_l) : "-",
      formatCurrency(m.total_value),
      m.profit ? formatCurrency(m.profit) : "-",
      user?.name || "N/A",
      m.reference || "-",
    ];
  });

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Data/Hora", "Tanque", "Produto", "Tipo", "Volume", "Preco/L", "Valor", "Lucro", "Operador", "Ref."]],
    body: tableData,
    headStyles: {
      fillColor: PDF_CONFIG.headerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: PDF_CONFIG.alternateRowColor,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    theme: "striped",
    didParseCell: (data) => {
      // Colorir por tipo
      if (data.column.index === 3 && data.section === "body") {
        const tipo = data.cell.raw as string;
        if (tipo === "Entrada") {
          data.cell.styles.textColor = [0, 128, 0]; // Verde
        } else if (tipo === "Saida") {
          data.cell.styles.textColor = [0, 0, 200]; // Azul
        } else if (tipo === "Ajuste") {
          data.cell.styles.textColor = [200, 150, 0]; // Amarelo escuro
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`relatorio-movimentacoes-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}
