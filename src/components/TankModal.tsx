import { useEffect, useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { createTank } from "@/services/api";
import { ProductType, Site, Tank } from "@/types";

interface TankModalProps {
  open: boolean;
  onClose: () => void;
  sites: Site[];
  onSuccess?: () => void;
}

export const TankModal = ({ open, onClose, sites, onSuccess }: TankModalProps) => {
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [product, setProduct] = useState<ProductType | "Ambos">("Álcool");
  const [capacity, setCapacity] = useState("");
  const [currentVolume, setCurrentVolume] = useState("");
  const [minAlert, setMinAlert] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setSiteId("");
      setProduct("Álcool");
      setCapacity("");
      setCurrentVolume("");
      setMinAlert("");
    }
  }, [open]);

  const validate = (): boolean => {
    const capacityNum = parseFloat(capacity) || 0;
    const currentNum = parseFloat(currentVolume) || 0;
    const minAlertNum = parseFloat(minAlert) || 0;

    if (!name.trim()) {
      toast({ title: "Erro", description: "Informe o nome do tanque", variant: "destructive" });
      return false;
    }
    if (!siteId) {
      toast({ title: "Erro", description: "Selecione um site", variant: "destructive" });
      return false;
    }
    if (capacityNum <= 0) {
      toast({ title: "Erro", description: "Capacidade deve ser maior que zero", variant: "destructive" });
      return false;
    }
    if (currentNum < 0 || currentNum > capacityNum) {
      toast({
        title: "Erro",
        description: "Volume atual deve estar entre 0 e a capacidade",
        variant: "destructive",
      });
      return false;
    }
    if (minAlertNum < 0 || minAlertNum > capacityNum) {
      toast({
        title: "Erro",
        description: "Minimo de alerta deve ser menor ou igual a capacidade",
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
      const payload: Omit<Tank, "id" | "status"> = {
        name: name.trim(),
        site_id: siteId,
        product,
        capacity_l: parseFloat(capacity),
        current_volume_l: parseFloat(currentVolume) || 0,
        min_alert_l: parseFloat(minAlert) || 0,
      };

      await createTank(payload);

      toast({
        title: "Tanque criado",
        description: "Novo tanque adicionado com sucesso",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Nao foi possivel criar o tanque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Tanque</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tanque A1"
            />
          </div>

          <div className="space-y-2">
            <Label>Site *</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Produto *</Label>
            <Select value={product} onValueChange={(value) => setProduct(value as ProductType | "Ambos")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Álcool">Álcool</SelectItem>
                <SelectItem value="Cachaça">Cachaça</SelectItem>
                <SelectItem value="Ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capacidade (L) *</Label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Ex: 10000"
              />
            </div>
            <div className="space-y-2">
              <Label>Volume atual (L)</Label>
              <Input
                type="number"
                value={currentVolume}
                onChange={(e) => setCurrentVolume(e.target.value)}
                placeholder="Ex: 2500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Minimo de alerta (L)</Label>
            <Input
              type="number"
              value={minAlert}
              onChange={(e) => setMinAlert(e.target.value)}
              placeholder="Ex: 1000"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
