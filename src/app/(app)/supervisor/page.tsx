
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, PackageSearch, FileText, AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useReportData } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SupervisorPage() {
  const { kpis, lowStockProducts, loading } = useReportData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 self-start">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-headline text-2xl font-bold">Panel de Supervisor</h1>
            <p className="text-sm text-muted-foreground">Consulta de reportes e inventario.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="outline">
            <Link href="/supervisor/inventario">
              <PackageSearch className="mr-2" /> Consultar Inventario
            </Link>
          </Button>
          <Button asChild>
            <Link href="/supervisor/reportes">
              <FileText className="mr-2" /> Ver Reportes Detallados
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
                <div className="text-2xl font-bold">Bs. {kpis.ventasHoy.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">{kpis.transaccionesHoy} transacciones hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de la Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-3/4" /> : (
                <div className="text-2xl font-bold">Bs. {kpis.ventasSemana.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">Total de los últimos 7 días</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos con Stock Bajo</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-1/4" /> : (
                <div className="text-2xl font-bold">{kpis.productosBajos}</div>
            )}
            <p className="text-xs text-muted-foreground">Necesitan reposición urgente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos con Stock Bajo</CardTitle>
          <CardDescription>Estos productos necesitan ser repuestos pronto (stock &lt;= 5).</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full whitespace-nowrap rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Stock Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : lowStockProducts.length > 0 ? (
                  lowStockProducts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">{p.stock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No hay productos con stock bajo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
