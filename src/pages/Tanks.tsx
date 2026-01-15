import { useEffect, useState } from "react";
import { listSites, listTanks } from "@/services/api";
import { TankCard } from "@/components/TankCard";
import { MovementModal } from "@/components/MovementModal";
import { TankModal } from "@/components/TankModal";
import { Site, Tank, MovementType } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus } from "lucide-react";

const Tanks = () => {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tankModalOpen, setTankModalOpen] = useState(false);
  const [selectedTank, setSelectedTank] = useState<string>();
  const [selectedType, setSelectedType] = useState<MovementType>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTanks();
  }, []);

  const loadTanks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tanksData, sitesData] = await Promise.all([listTanks(), listSites()]);
      setTanks(tanksData);
      setSites(sitesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar tanques";
      setError(message);
      setTanks([]);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  const openMovementModal = (tankId?: string, type?: MovementType) => {
    setSelectedTank(tankId);
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTank(undefined);
    setSelectedType(undefined);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar os tanques</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadTanks}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Tanques</h2>
          <p className="text-muted-foreground">Gerencie seus tanques de armazenamento</p>
        </div>
        <Button onClick={() => setTankModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tanque
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tanks.map((tank) => (
          <TankCard
            key={tank.id}
            tank={tank}
            onNewEntry={() => openMovementModal(tank.id, "entrada")}
            onNewExit={() => openMovementModal(tank.id, "saída")}
            onAdjust={() => openMovementModal(tank.id, "ajuste")}
          />
        ))}
      </div>

      <MovementModal
        open={modalOpen}
        onClose={handleModalClose}
        tanks={tanks}
        preSelectedTank={selectedTank}
        preSelectedType={selectedType}
        onSuccess={loadTanks}
      />

      <TankModal
        open={tankModalOpen}
        onClose={() => setTankModalOpen(false)}
        sites={sites}
        onSuccess={loadTanks}
      />
    </div>
  );
};

export default Tanks;
