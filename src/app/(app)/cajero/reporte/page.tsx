
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCashierReport } from "@/hooks/useCashierReport";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, DollarSign, ShoppingCart, Hash } from "lucide-react";
import { VentaDetalleModal } from "@/components/VentaDetalleModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Venta } from "@/types/venta";

const METODO_PAGO_LABELS: { [key: string]: string } = {
  efectivo_bs: "Efectivo (Bs.)",
  efectivo_usd: "Efectivo (USD)",
  transferencia: "Transferencia",
  pago_movil: "Pago Móvil",
  zelle: "Zelle",
};

export default function ReporteCajeroPage() {
  const { firestoreUser } = useAuth();
  const { report, loading } = useCashierReport(firestoreUser?.uid);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Mi Reporte de Turno</h1>
          <p className="text-sm text-muted-foreground">Resumen de tus ventas y transacciones de hoy.</p>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">Bs. {report.totalVendido.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">Total facturado en tu sesión de hoy.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : (
              <div className="text-2xl font-bold">{report.totalVentas}</div>
            )}
            <p className="text-xs text-muted-foreground">Ventas realizadas en tu sesión.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">Bs. {report.ticketPromedio.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">Valor promedio por cada venta.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Desglose de Pagos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Desglose de Pagos</CardTitle>
            <CardDescription>Total recibido por cada método de pago.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Total Recibido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(report.metodosPago).length > 0 ? (
                    Object.entries(report.metodosPago).map(([metodo, total]) => (
                      <TableRow key={metodo}>
                        <TableCell className="font-medium">{METODO_PAGO_LABELS[metodo] || metodo}</TableCell>
                        <TableCell className="text-right font-mono">Bs. {total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">No hay pagos registrados hoy.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Historial de Ventas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historial de Ventas de Hoy</CardTitle>
            <CardDescription>Listado de todas las transacciones que realizaste.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura N°</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total (Bs)</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ))
                  ) : report.ventas.length > 0 ? (
                    report.ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-mono text-xs">{venta.numero_factura}</TableCell>
                        <TableCell className="text-xs">{new Date(venta.fecha).toLocaleTimeString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{venta.productos.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">Bs. {venta.total_bs.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" onClick={() => setVentaSeleccionada(venta)}>Ver</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">No has realizado ventas hoy.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {ventaSeleccionada && (
        <VentaDetalleModal
          venta={ventaSeleccionada}
          isOpen={!!ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
        />
      )}
    </div>
  );
}
