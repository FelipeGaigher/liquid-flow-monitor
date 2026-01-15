import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useFilters } from "@/contexts/FilterContext";
import { useAuth } from "@/contexts/AuthContext";
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

        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Mais Filtros
        </Button>
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
