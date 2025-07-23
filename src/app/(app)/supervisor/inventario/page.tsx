
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Producto } from '@/types/producto';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PackageSearch, Search } from "lucide-react";

export default function InventarioSupervisorPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { toast } = useToast();

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const productosRef = collection(db, 'productos');
    const q = firestoreQuery(productosRef, orderBy('nombre'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Producto[];
      setProductos(productosData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener productos:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los productos.' });
      setLoading(false);
    });
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchProducts();
    return () => unsubscribe();
  }, [fetchProducts]);

  const productosFiltrados = useMemo(() =>
    productos.filter(p =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(busqueda.toLowerCase()))
    ), [productos, busqueda]);


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <PackageSearch className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Consulta de Inventario</h1>
          <p className="text-sm text-muted-foreground">Verifica el stock y los precios de los productos.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Productos</CardTitle>
          <CardDescription>Busca productos y revisa su disponibilidad y precio.</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o código de barras..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cód. Barras</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio (Bs)</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : productosFiltrados.length > 0 ? (
                  productosFiltrados.map(producto => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-mono text-xs">{producto.codigo}</TableCell>
                      <TableCell className="font-mono text-xs">{producto.codigo_barras || '-'}</TableCell>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>Bs. {producto.precio_bs.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{producto.unidad}</TableCell>
                      <TableCell className="text-center">{producto.stock}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
