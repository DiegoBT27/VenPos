
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, orderBy, query as firestoreQuery } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Venta } from '@/types/venta';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VentaDetalleModal } from '@/components/VentaDetalleModal';
import { ShoppingCart, Search } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true);
      try {
        const ventasRef = collection(db, 'ventas');
        const q = firestoreQuery(ventasRef, orderBy('fecha', 'desc'));
        const querySnapshot = await getDocs(q);
        const ventasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha: doc.data().fecha.toDate(), // Convertir Timestamp a Date
        })) as Venta[];
        setVentas(ventasData);
      } catch (error) {
        console.error("Error al obtener las ventas: ", error);
        // Aquí podrías usar un toast para notificar el error
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  const ventasFiltradas = useMemo(() => 
    ventas.filter(venta => 
      venta.numero_factura?.toLowerCase().includes(busqueda.toLowerCase()) ||
      venta.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    ), [ventas, busqueda]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Historial de Ventas</h1>
          <p className="text-sm text-muted-foreground">Consulta todas las transacciones realizadas.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Registradas</CardTitle>
          <CardDescription>Aquí puedes ver y buscar todas las ventas.</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por N° de Factura o Cajero..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] p-2 text-xs">Factura N°</TableHead>
                  <TableHead className="p-2 text-xs">Fecha</TableHead>
                  <TableHead className="p-2 text-xs">Cajero</TableHead>
                  <TableHead className="p-2 text-center text-xs">Productos</TableHead>
                  <TableHead className="p-2 text-right text-xs">Total Bs.</TableHead>
                  <TableHead className="p-2 text-center text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="p-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : ventasFiltradas.length > 0 ? (
                  ventasFiltradas.map(venta => (
                    <TableRow key={venta.id}>
                      <TableCell className="p-2 font-mono text-xs">{venta.numero_factura}</TableCell>
                      <TableCell className="p-2 text-xs">{new Date(venta.fecha).toLocaleString()}</TableCell>
                      <TableCell className="p-2 text-xs">{venta.usuario_nombre}</TableCell>
                      <TableCell className="p-2 text-center">
                        <Badge variant="secondary">{venta.productos.length}</Badge>
                      </TableCell>
                      <TableCell className="p-2 text-right text-xs font-medium">Bs. {venta.total_bs.toFixed(2)}</TableCell>
                      <TableCell className="p-2 text-center">
                        <Button variant="outline" size="sm" onClick={() => setVentaSeleccionada(venta)}>
                          Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No se encontraron ventas con los filtros actuales.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
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
