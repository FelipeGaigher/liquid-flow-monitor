import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ArrowDownToLine, ArrowUpFromLine, Settings2 } from "lucide-react";
import { Tank } from "@/types";
import { cn } from "@/lib/utils";

interface TankCardProps {
  tank: Tank;
  onNewEntry: () => void;
  onNewExit: () => void;
  onAdjust: () => void;
}

export const TankCard = ({ tank, onNewEntry, onNewExit, onAdjust }: TankCardProps) => {
  const percentage = (tank.current_volume_l / tank.capacity_l) * 100;
  
  const getStatusColor = () => {
    if (tank.current_volume_l < tank.min_alert_l) return "text-danger";
    if (tank.current_volume_l < tank.min_alert_l * 1.5) return "text-warning";
    return "text-success";
  };

  const getProgressColor = () => {
    if (tank.current_volume_l < tank.min_alert_l) return "bg-danger";
    if (tank.current_volume_l < tank.min_alert_l * 1.5) return "bg-warning";
    return "bg-success";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const estimatedValue = tank.current_volume_l * (tank.product === "Álcool" ? 3.5 : 12.8);

  return (
    <Card className="p-6 transition-smooth hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{tank.name}</h3>
          <p className="text-sm text-muted-foreground">{tank.product}</p>
        </div>
        <div className={cn("h-3 w-3 rounded-full", getProgressColor())} />
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Volume atual</span>
            <span className={cn("font-medium", getStatusColor())}>
              {formatNumber(tank.current_volume_l)} L
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{percentage.toFixed(1)}%</span>
            <span>Cap: {formatNumber(tank.capacity_l)} L</span>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor estimado</span>
          <span className="font-medium">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(estimatedValue)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1"
          onClick={onNewEntry}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Entrada
        </Button>
        <Button
          size="sm"
          variant="default"
          className="flex-1 gap-1"
          onClick={onNewExit}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          Saída
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAdjust}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
