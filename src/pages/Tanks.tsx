import { useEffect, useState } from "react";
import { listTanks } from "@/services/api";
import { TankCard } from "@/components/TankCard";
import { MovementModal } from "@/components/MovementModal";
import { Tank, MovementType } from "@/types";

const Tanks = () => {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTank, setSelectedTank] = useState<string>();
  const [selectedType, setSelectedType] = useState<MovementType>();

  useEffect(() => {
    loadTanks();
  }, []);

  const loadTanks = async () => {
    setLoading(true);
    const data = await listTanks();
    setTanks(data);
    setLoading(false);
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Tanques</h2>
        <p className="text-muted-foreground">Gerencie seus tanques de armazenamento</p>
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
    </div>
  );
};

export default Tanks;
