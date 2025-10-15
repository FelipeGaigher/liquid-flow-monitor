import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Configurações</h2>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Limites e Alertas</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alerta de Volume Mínimo Padrão (L)</Label>
              <Input type="number" defaultValue="10000" />
            </div>
            <div className="space-y-2">
              <Label>Alerta de Volume de Segurança (%)</Label>
              <Input type="number" defaultValue="20" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Política de Bloqueio</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Bloquear Saldo Negativo</Label>
                <p className="text-sm text-muted-foreground">
                  Impede saídas que resultariam em saldo negativo
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Bloquear Capacidade Excedida</Label>
                <p className="text-sm text-muted-foreground">
                  Impede entradas acima da capacidade do tanque
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Interface</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Densidade da Tabela</Label>
              <select className="w-full px-3 py-2 border rounded-md bg-background">
                <option>Confortável</option>
                <option>Compacta</option>
                <option>Expandida</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Notificações</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>E-mail em Alerta de Estoque</Label>
                <p className="text-sm text-muted-foreground">
                  Receber e-mail quando volume atingir mínimo
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações do Sistema</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações de eventos importantes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default Settings;
