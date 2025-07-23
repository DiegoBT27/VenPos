"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Package, ShoppingBasket, AlertCircle } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/skeleton";
import VentasChart from "@/components/VentasChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ReportesPage() {
  const { kpis, dailySales, lowStockProducts, loading } = useReportData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Analiza el rendimiento de tu negocio.</p>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">Bs. {kpis.ventasHoy.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">Total facturado hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de la Semana</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">Bs. {kpis.ventasSemana.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">Total en los últimos 7 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones Hoy</CardTitle>
            <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">{kpis.transaccionesHoy}</div>
            )}
            <p className="text-xs text-muted-foreground">Número de ventas procesadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">{kpis.productosActivos}</div>
            )}
            <p className="text-xs text-muted-foreground">Total de productos en inventario</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Ventas en los Últimos 7 Días</CardTitle>
                <CardDescription>Visualización de ingresos diarios.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-[350px] w-full" /> : <VentasChart data={dailySales} />}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" /> Productos con Stock Bajo</CardTitle>
                <CardDescription>Productos que necesitan reposición urgente (stock &lt;= 5).</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-[350px] w-full" /> : (
                     <div className="max-h-[350px] overflow-y-auto rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Stock Actual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.map(p => (
                                    <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.nombre}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="destructive">{p.stock}</Badge>
                                    </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    No hay productos con stock bajo.
                                </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
