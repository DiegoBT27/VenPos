"use client";

import { useState } from "react";
import { useActiveCashiers } from "@/hooks/useActiveCashiers";
import { useCashierReport } from "@/hooks/useCashierReport";
import { useTurno } from "@/hooks/useTurno";
import { Archive, User, ChevronRight, Lock } from "lucide-react";
import { ArqueoDeCajaModal } from "@/components/ArqueoDeCajaModal";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReporteCajeroView } from "@/components/ReporteCajeroView";
import type { FirestoreUser } from "@/types/user";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CajasPage() {
  const { activeCashiers, loading: loadingCashiers } = useActiveCashiers();
  const [selectedCashier, setSelectedCashier] = useState<FirestoreUser | null>(null);
  
  const { turnoActivo, checkForActiveTurno } = useTurno(selectedCashier?.uid);
  const { report, loading: loadingReport } = useCashierReport(selectedCashier?.uid, !!turnoActivo);
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false);

  const handleSelectCashier = (cashier: FirestoreUser) => {
    setSelectedCashier(cashier);
    checkForActiveTurno(cashier.uid);
  }

  const onTurnoClosed = () => {
    setIsArqueoModalOpen(false);
    if(selectedCashier) {
        checkForActiveTurno(selectedCashier.uid); // Re-check to update the view
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Archive className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Estado de Cajas</h1>
          <p className="text-sm text-muted-foreground">Consulta el estado de los cajeros y realiza cierres de caja.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de Cajeros */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Cajeros Activos</CardTitle>
            <CardDescription>Selecciona un cajero para ver su reporte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingCashiers ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : activeCashiers.length > 0 ? (
              activeCashiers.map(cashier => (
                <button
                  key={cashier.uid}
                  onClick={() => handleSelectCashier(cashier)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border flex items-center justify-between transition-colors",
                    selectedCashier?.uid === cashier.uid 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <span className="font-medium">{cashier.nombreCompleto}</span>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </button>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground p-4">No hay cajeros activos en el sistema.</p>
            )}
          </CardContent>
        </Card>

        {/* Reporte del Cajero Seleccionado */}
        <div className="lg:col-span-2">
          {selectedCashier ? (
            loadingReport ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ) : turnoActivo ? (
                <>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Turno Activo</CardTitle>
                                <CardDescription>Este cajero tiene un turno en progreso.</CardDescription>
                            </div>
                            <Button onClick={() => setIsArqueoModalOpen(true)}>
                                <Lock className="mr-2"/>
                                Realizar Arqueo y Cierre
                            </Button>
                        </CardHeader>
                    </Card>
                    <div className="mt-6">
                        <ReporteCajeroView report={report} cashierName={selectedCashier.nombreCompleto} />
                    </div>
                    <ArqueoDeCajaModal 
                        isOpen={isArqueoModalOpen}
                        onClose={() => setIsArqueoModalOpen(false)}
                        turno={turnoActivo}
                        report={report}
                        onTurnoClosed={onTurnoClosed}
                    />
                </>
            ) : (
                 <Card className="flex items-center justify-center h-full min-h-[300px]">
                    <p className="text-muted-foreground">{selectedCashier.nombreCompleto} no tiene un turno activo.</p>
                 </Card>
            )
          ) : (
            <Card className="flex items-center justify-center h-full min-h-[300px]">
              <p className="text-muted-foreground">Selecciona un cajero para ver su reporte detallado.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
