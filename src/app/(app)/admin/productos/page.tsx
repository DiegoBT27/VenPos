
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query as firestoreQuery, orderBy, deleteDoc, doc, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Producto } from '@/types/producto';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { ProductoForm } from '@/components/ProductoForm';
import { useToast } from '@/hooks/use-toast';
import { Package, PlusCircle, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

async function getNextProductCode(): Promise<string> {
    const productosRef = collection(db, 'productos');
    const q = firestoreQuery(productosRef, orderBy('codigo_int', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return "100";
    }

    const lastProduct = querySnapshot.docs[0].data();
    const nextCodeInt = (lastProduct.codigo_int || 99) + 1;
    return nextCodeInt.toString();
}


export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [nextCode, setNextCode] = useState<string | null>(null);
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

  const handleOpenForm = async (producto: Producto | null = null) => {
    const code = await getNextProductCode();
    setNextCode(code);
    setProductoSeleccionado(producto);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setProductoSeleccionado(null);
    setIsFormOpen(false);
    setNextCode(null);
  };

  const handleDelete = async () => {
    if (!productoAEliminar) return;
    try {
      await deleteDoc(doc(db, 'productos', productoAEliminar.id));
      toast({
        title: 'Producto eliminado',
        description: `El producto "${productoAEliminar.nombre}" ha sido eliminado.`,
      });
      setProductoAEliminar(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el producto. Intente de nuevo.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 self-start">
            <Package className="h-8 w-8 text-primary" />
            <div>
                <h1 className="font-headline text-2xl font-bold">Gestión de Productos</h1>
                <p className="text-sm text-muted-foreground">Administra tu inventario de productos.</p>
            </div>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario de Productos</CardTitle>
          <CardDescription>Consulta y administra los productos de tu negocio.</CardDescription>
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
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cód. Barras</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio (Bs)</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
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
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenForm(producto)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setProductoAEliminar(producto)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <ProductoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        producto={productoSeleccionado}
        nextCode={nextCode}
        onProductsAdded={fetchProducts}
      />

      <AlertDialog open={!!productoAEliminar} onOpenChange={(open) => !open && setProductoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{productoAEliminar?.nombre}" de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
