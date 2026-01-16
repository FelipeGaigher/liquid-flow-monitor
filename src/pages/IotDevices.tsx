import { useEffect, useMemo, useState } from "react";
import { getIotSummary, listIotDevices } from "@/services/api";
import type { IotDevice, IotSummary } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Wifi, WifiOff } from "lucide-react";

const ONLINE_THRESHOLD_MINUTES = 10;

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const isOnline = (device: IotDevice) => {
  if (!device.last_seen_at) return false;
  const threshold = Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000;
  return new Date(device.last_seen_at).getTime() >= threshold;
};

const getStatusBadge = (device: IotDevice) => {
  if (device.status !== "active") {
    return { label: "Inativo", variant: "secondary" as const, icon: WifiOff };
  }
  if (isOnline(device)) {
    return { label: "Online", variant: "default" as const, icon: Wifi };
  }
  return { label: "Offline", variant: "destructive" as const, icon: WifiOff };
};

const IotDevices = () => {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [summary, setSummary] = useState<IotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceMap = useMemo(() => new Map(devices.map((device) => [device.id, device])), [devices]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devicesData, summaryData] = await Promise.all([listIotDevices(), getIotSummary()]);
      setDevices(devicesData);
      setSummary(summaryData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dispositivos IoT";
      setError(message);
      setDevices([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar dispositivos IoT</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    );
  }

  const lastMeasurement = summary?.latestMeasurements?.[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dispositivos IoT</h2>
          <p className="text-muted-foreground">Monitoramento de sensores e medições automatizadas</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total de dispositivos</span>
            <Cpu className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold">{summary?.total ?? 0}</div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Online agora</span>
            <Wifi className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold">{summary?.online ?? 0}</div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Ultima medicao</span>
            <WifiOff className="h-4 w-4" />
          </div>
          <div className="text-lg font-semibold">{formatDateTime(lastMeasurement?.measured_at)}</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Dispositivos cadastrados</h3>
          <p className="text-sm text-muted-foreground">Status e ultimo volume recebido por sensor</p>
        </div>

        {devices.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum dispositivo cadastrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Tanque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultima leitura</TableHead>
                <TableHead className="text-right">Volume (L)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => {
                const badge = getStatusBadge(device);
                const StatusIcon = badge.icon;
                return (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.tank_name ?? "Sem tanque"}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(device.last_seen_at)}</TableCell>
                    <TableCell className="text-right">
                      {device.last_volume_l !== null && device.last_volume_l !== undefined
                        ? Number(device.last_volume_l).toLocaleString("pt-BR")
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Ultimas medicoes</h3>
          <p className="text-sm text-muted-foreground">Historico recente de leituras enviadas</p>
        </div>

        {summary?.latestMeasurements?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Tanque</TableHead>
                <TableHead className="text-right">Volume (L)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestMeasurements.map((measurement) => {
                const device = deviceMap.get(measurement.device_id);
                return (
                  <TableRow key={measurement.id}>
                    <TableCell>{formatDateTime(measurement.measured_at)}</TableCell>
                    <TableCell>{device?.name ?? measurement.device_id}</TableCell>
                    <TableCell>{device?.tank_name ?? measurement.tank_id}</TableCell>
                    <TableCell className="text-right">
                      {Number(measurement.volume_l).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-sm text-muted-foreground">Sem medicoes registradas.</div>
        )}
      </Card>
    </div>
  );
};

export default IotDevices;
