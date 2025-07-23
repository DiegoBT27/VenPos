import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, PlusCircle, LogOut, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CashierPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-3xl font-bold">Punto de Venta</h1>
          <p className="text-muted-foreground">Realiza ventas y gestiona tu turno.</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen del Turno</CardTitle>
            <CardDescription>Visualiza el estado actual de tu sesión.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-lg border p-4">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Monto Vendido</p>
                    <p className="text-2xl font-bold">$345.60</p>
                </div>
            </div>
             <div className="flex items-center gap-4 rounded-lg border p-4">
                <ShoppingCart className="h-8 w-8 text-blue-500" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Ventas Realizadas</p>
                    <p className="text-2xl font-bold">12</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardContent className="flex flex-col gap-4 p-4">
            <Button size="lg" className="w-full">
              <PlusCircle className="mr-2" />
              Iniciar Nueva Venta
            </Button>
            <Button size="lg" variant="destructive" className="w-full">
              <LogOut className="mr-2" />
              Cerrar Turno
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>Listado de las últimas transacciones realizadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aquí se mostrará un listado de las ventas del turno.</p>
          </CardContent>
        </Card>

    </div>
  );
}
