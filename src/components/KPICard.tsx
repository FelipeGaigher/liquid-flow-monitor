import { Card } from "./ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  growth?: number;
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard = ({ title, value, growth, icon, className }: KPICardProps) => {
  const hasGrowth = growth !== undefined;
  const isPositive = growth && growth > 0;

  return (
    <Card className={cn("p-6 transition-smooth hover:shadow-lg", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          
          {hasGrowth && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              isPositive ? "text-success" : "text-danger"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{isPositive ? "+" : ""}{growth.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs anterior</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="text-muted-foreground opacity-50">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
