import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Movement, MovementType, ProductType, Tank } from "@/types";
import { createMovement, getCurrentPrice } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

interface MovementModalProps {
  open: boolean;
  onClose: () => void;
  tanks: Tank[];
  preSelectedTank?: string;
  preSelectedType?: MovementType;
  onSuccess?: () => void;
}

export const MovementModal = ({
  open,
  onClose,
  tanks,
  preSelectedTank,
  preSelectedType,
  onSuccess,
}: MovementModalProps) => {
  const [tankId, setTankId] = useState("");
  const [type, setType] = useState<MovementType>("saída");
  const [product, setProduct] = useState<ProductType>("Álcool");
  const [volume, setVolume] = useState("");
  const [pricePerL, setPricePerL] = useState("");
  const [costPerL, setCostPerL] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTank = tanks.find((t) => t.id === tankId);
  const volumeNum = parseFloat(volume) || 0;
  const priceNum = parseFloat(pricePerL) || 0;
  const costNum = parseFloat(costPerL) || 0;

  const beforeVolume = selectedTank?.current_volume_l || 0;
  const afterVolume =
    type === "entrada"
      ? beforeVolume + volumeNum
      : type === "saída"
      ? beforeVolume - volumeNum
      : volumeNum;

  const totalValue = type === "saída" ? volumeNum * priceNum : 0;
  const totalCost = type === "entrada" ? volumeNum * costNum : volumeNum * costNum;
  const profit = type === "saída" ? totalValue - totalCost : 0;

  useEffect(() => {
    if (open) {
      if (preSelectedTank) setTankId(preSelectedTank);
      if (preSelectedType) setType(preSelectedType);
      setVolume("");
      setPricePerL("");
      setCostPerL("");
      setReference("");
      setNotes("");
    }
  }, [open, preSelectedTank, preSelectedType]);

  useEffect(() => {
    if (tankId) {
      const tank = tanks.find((t) => t.id === tankId);
      if (tank && tank.product !== "Ambos") {
        setProduct(tank.product as ProductType);
      }
    }
  }, [tankId, tanks]);

  useEffect(() => {
    if (type === "saída" && product && !pricePerL) {
      getCurrentPrice(product).then((price) => {
        if (price) setPricePerL(price.toString());
      });
    }

    if (product) {
      const cost = product === "Álcool" ? 2.1 : 7.5;
      setCostPerL(cost.toString());
    }
  }, [type, product]);

  const validate = (): boolean => {
    if (!tankId) {
      toast({ title: "Erro", description: "Selecione um tanque", variant: "destructive" });
      return false;
    }
    if (!volume || volumeNum <= 0) {
      toast({ title: "Erro", description: "Informe um volume válido", variant: "destructive" });
      return false;
    }
    if (type === "saída" && afterVolume < 0) {
      toast({
        title: "Saldo Negativo",
        description: "Esta operação resultaria em saldo negativo",
        variant: "destructive",
      });
      return false;
    }
    if (type === "entrada" && selectedTank && afterVolume > selectedTank.capacity_l) {
      toast({
        title: "Capacidade Excedida",
        description: "Esta operação excede a capacidade do tanque",
        variant: "destructive",
      });
      return false;
    }
    if (type === "saída" && !pricePerL) {
      toast({
        title: "Preço não informado",
        description: "Informe o preço por litro",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Omit<Movement, "id" | "created_at"> = {
        tank_id: tankId,
        product,
        type,
        volume_l: volumeNum,
        price_per_l: type === "saída" ? priceNum : undefined,
        cost_per_l: type === "entrada" ? costNum : undefined,
        total_value: totalValue,
        total_cost: totalCost,
        profit: type === "saída" ? profit : undefined,
        reference: reference || undefined,
        notes: notes || undefined,
        operator_id: "user-1",
      };

      await createMovement(payload);

      toast({
        title: "Sucesso!",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} registrada com sucesso`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanque *</Label>
              <Select value={tankId} onValueChange={setTankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tanque" />
                </SelectTrigger>
                <SelectContent>
                  {tanks.map((tank) => (
                    <SelectItem key={tank.id} value={tank.id}>
                      {tank.name} ({tank.product})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saída">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTank?.product === "Ambos" && (
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={product} onValueChange={(v) => setProduct(v as ProductType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Álcool">Álcool</SelectItem>
                  <SelectItem value="Cachaça">Cachaça</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Volume (L) *</Label>
            <Input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Ex: 1000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type === "saída" && (
              <div className="space-y-2">
                <Label>Preço por L (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricePerL}
                  onChange={(e) => setPricePerL(e.target.value)}
                  placeholder="Ex: 3.50"
                />
              </div>
            )}

            {type === "entrada" && (
              <div className="space-y-2">
                <Label>Custo por L (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costPerL}
                  onChange={(e) => setCostPerL(e.target.value)}
                  placeholder="Ex: 2.10"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Referência</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: NF-12345"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          {selectedTank && volumeNum > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm mb-2">Prévia</h4>
              <div className="flex items-center gap-2 text-sm">
                <span>Saldo:</span>
                <span className="font-medium">
                  {beforeVolume.toLocaleString("pt-BR")} L
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`font-medium ${
                    afterVolume < 0
                      ? "text-danger"
                      : afterVolume > selectedTank.capacity_l
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {afterVolume.toLocaleString("pt-BR")} L
                </span>
              </div>
              {type === "saída" && totalValue > 0 && (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Valor Total: </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(totalValue)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Lucro: </span>
                    <span className="font-medium text-success">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(profit)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
