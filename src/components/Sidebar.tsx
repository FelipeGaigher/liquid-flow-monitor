import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Droplet,
  ArrowLeftRight,
  Package,
  FileText,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tanks", label: "Tanques", icon: Droplet },
  { to: "/movements", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/products-prices", label: "Produtos & Preços", icon: Package },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/admin", label: "Administração", icon: Users },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          TankControl
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Sistema de Controle</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth",
                "hover:bg-accent/10",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground/70"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p>v1.0.0 • Mock Mode</p>
      </div>
    </aside>
  );
};
