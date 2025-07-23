
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, PackageX, BarChartBig, Users, Settings, LogOut, ShieldCheck } from "lucide-react";
import Link from 'next/link';
import { useReportData } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { kpis, loading } = useReportData();

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 self-start">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
            <h1 className="font-headline text-xl font-bold">Panel de Administrador</h1>
            <p className="text-xs text-muted-foreground">Vista general y acceso a todos los módulos.</p>
            </div>
        </div>
         <Link href="/admin/reportes" passHref>
            <Button className="w-full sm:w-auto">
                <BarChartBig className="mr-2 h-4 w-4" />
                Ver Reportes Detallados
            </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ventas del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : (
                <>
                    <div className="text-lg font-bold">Bs. {kpis.ventasHoy.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{kpis.transaccionesHoy} transacciones hoy</p>
                </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Stock Bajo</CardTitle>
            <PackageX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-3/4" /> : (
                <>
                    <div className="text-lg font-bold">{kpis.productosBajos} productos</div>
                    <p className="text-xs text-muted-foreground">Necesitan reposición urgente</p>
                </>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Ventas de la Semana</CardTitle>
                <BarChartBig className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-3/4" /> : (
                    <>
                        <div className="text-lg font-bold">Bs. {kpis.ventasSemana.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Total de los últimos 7 días</p>
                    </>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
