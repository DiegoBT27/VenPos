
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, PlusCircle, LogOut, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCashierReport } from "@/hooks/useCashierReport";
import { useTurno } from "@/hooks/useTurno";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { IniciarTurnoModal } from "@/components/IniciarTurnoModal";

const METODO_PAGO_LABELS: { [key: string]: string } = {
  efectivo_bs: "Efectivo (Bs.)",
  efectivo_usd: "Efectivo (USD)",
  transferencia: "Transferencia",
  pago_movil: "Pago Móvil",
  zelle: "Zelle",
};

export default function CashierPage() {
  const { firestoreUser, handleLogout } = useAuth();
  const router = useRouter();
  const { turnoActivo, loading: loadingTurno, iniciarTurno, cerrarTurno, checkForActiveTurno } = useTurno(firestoreUser?.uid);
  const { report, loading: loadingReport } = useCashierReport(firestoreUser?.uid, !!turnoActivo);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCerrarSesion = async () => {
    // La lógica de cierre de turno es manejada por el supervisor.
    // Este botón ahora es solo para desloguear.
    await handleLogout();
  };

  const onTurnoIniciado = async (fondo_bs: number, fondo_usd: number) => {
      if (firestoreUser) {
        await iniciarTurno(fondo_bs, fondo_usd);
        // Forzamos la recarga del estado del turno
        await checkForActiveTurno(firestoreUser.uid);
      }
  }

  if (loadingTurno || !firestoreUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (!turnoActivo) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center h-[60vh]">
          <PlayCircle className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-xl font-semibold">No tienes un turno activo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Para empezar a registrar ventas, necesitas iniciar un nuevo turno de caja.
          </p>
          <Button size="lg" className="mt-6" onClick={() => setIsModalOpen(true)}>
            <PlayCircle className="mr-2" /> Iniciar Turno
          </Button>
        </div>
        <IniciarTurnoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTurnoIniciado={onTurnoIniciado}
          userId={firestoreUser.uid}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Punto de Venta</h1>
          <p className="text-sm text-muted-foreground">
            {`Bienvenido, ${firestoreUser.nombreCompleto}. Turno activo.`}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
             <CardDescription>Inicia una nueva transacción o finaliza tu sesión.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="w-full" onClick={() => router.push('/nueva-venta')}>
              <PlusCircle className="mr-2" />
              Iniciar Nueva Venta
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive" className="w-full" disabled={loadingReport}>
                  <LogOut className="mr-2" />
                  Cerrar Sesión
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas el cierre de tu sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción solo cerrará tu sesión en la aplicación. El cierre y arqueo de tu caja debe ser realizado por un supervisor.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCerrarSesion}>
                    Confirmar y Salir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>Listado de las últimas transacciones realizadas en tu turno.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura N°</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Monto (Bs)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReport ? Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                      <TableCell><Skeleton className="h-5 w-16"/></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 ml-auto"/></TableCell>
                    </TableRow>
                  )) : report.ventas.length > 0 ? (
                    report.ventas.map(venta => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-mono text-xs">{venta.numero_factura}</TableCell>
                        <TableCell className="text-xs">{new Date(venta.fecha).toLocaleTimeString()}</TableCell>
                        <TableCell className="text-right font-medium">Bs. {venta.total_bs.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">No has realizado ventas en este turno.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
