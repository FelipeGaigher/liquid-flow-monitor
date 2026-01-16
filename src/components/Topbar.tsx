import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useFilters } from "@/contexts/FilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { listProducts, listTanks, listUsers } from "@/services/api";
import type { MovementType, ProductType, Tank, User } from "@/types";
import { Calendar, Filter, LogOut } from "lucide-react";

const periodOptions = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "3m", label: "3 Meses" },
  { value: "6m", label: "6 Meses" },
  { value: "ano", label: "Ano" },
  { value: "custom", label: "Personalizado" },
];

export const Topbar = () => {
  const { filters, updateFilters } = useFilters();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  useEffect(() => {
    let active = true;
    const loadFilterOptions = async () => {
      try {
        setLoadingFilters(true);
        const [productsData, tanksData, usersData] = await Promise.all([
          listProducts(),
          listTanks(),
          listUsers(),
        ]);
        if (!active) return;
        setProducts(
          Array.from(new Set(productsData.map((product) => product.type as ProductType)))
        );
        setTanks(tanksData);
        setOperators(usersData.filter((user) => user.status === "active"));
      } catch (error) {
        if (!active) return;
        setProducts([]);
        setTanks([]);
        setOperators([]);
      } finally {
        if (active) setLoadingFilters(false);
      }
    };

    loadFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = filters.products[0] ?? "all";
  const selectedTank = filters.tankIds[0] ?? "all";
  const selectedOperator = filters.operatorIds[0] ?? "all";
  const selectedType = filters.movementTypes[0] ?? "all";

  const clearFilters = () =>
    updateFilters({
      products: [],
      tankIds: [],
      operatorIds: [],
      movementTypes: [],
    });
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.period}
            onValueChange={(value) => updateFilters({ period: value as any })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Mais Filtros
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-6">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={(value) =>
                    updateFilters({
                      products: value === "all" ? [] : [value as ProductType],
                    })
                  }
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanque</Label>
                <Select
                  value={selectedTank}
                  onValueChange={(value) =>
                    updateFilters({ tankIds: value === "all" ? [] : [value] })
                  }
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tanks.map((tank) => (
                      <SelectItem key={tank.id} value={tank.id}>
                        {tank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operador</Label>
                <Select
                  value={selectedOperator}
                  onValueChange={(value) =>
                    updateFilters({
                      operatorIds: value === "all" ? [] : [value],
                    })
                  }
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) =>
                    updateFilters({
                      movementTypes:
                        value === "all" ? [] : [value as MovementType],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saída">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
          {initials}
        </div>
      </div>
    </header>
  );
};
