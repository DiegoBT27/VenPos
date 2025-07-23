
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, X, PlusCircle, Printer, DollarSign, Trash2, Loader2, FileText, Barcode } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/hooks/useConfig';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, writeBatch, query, where, getDocs, doc, runTransaction, limit } from 'firebase/firestore';
import type { Producto, UnidadMedida } from '@/types/producto';
import type { Venta, ProductoVendido, MetodoPago } from '@/types/venta';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from './ui/scroll-area';


// Componente para manejar la cantidad de productos pesables
const CantidadInput = ({ control, index, stock }: { control: any, index: number, stock: number }) => {
    const { toast } = useToast();
    const [unidadInput, setUnidadInput] = useState<'kg' | 'g'>('kg');
    const cantidad = useWatch({ control, name: `productos.${index}.cantidad` });
    const { setValue } = useForm({ control });

    const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = parseFloat(e.target.value);
        if (isNaN(valor)) valor = 0;
        
        const valorEnKg = unidadInput === 'g' ? valor / 1000 : valor;

        if (valorEnKg > stock) {
            toast({ variant: 'destructive', title: 'Stock insuficiente', description: `Solo quedan ${stock}kg en stock.` });
            const stockMaximo = unidadInput === 'g' ? stock * 1000 : stock;
            e.target.value = stockMaximo.toString();
            setValue(`productos.${index}.cantidad`, stock);
        } else {
            setValue(`productos.${index}.cantidad`, valorEnKg);
        }
    };

    const handleUnidadChange = (nuevaUnidad: 'kg' | 'g') => {
        setUnidadInput(nuevaUnidad);
        // No es necesario convertir al cambiar, la conversión se hace al escribir.
        // Esto previene bucles o conversiones no deseadas.
    };
    
    // Mostramos el valor en la unidad seleccionada para que el usuario vea lo que escribió
    const displayValue = useMemo(() => {
        if (unidadInput === 'g') {
            return (cantidad * 1000).toFixed(0);
        }
        return cantidad.toString();
    }, [cantidad, unidadInput]);


    return (
        <div className="flex items-center gap-1">
            <Input
                type="number"
                min="0"
                step="any"
                className="h-8 text-xs w-[70px]"
                defaultValue={displayValue}
                onChange={handleCantidadChange}
                key={unidadInput} // Forzar re-render para mostrar el valor correcto al cambiar de unidad
            />
            <Select value={unidadInput} onValueChange={handleUnidadChange}>
                <SelectTrigger className="h-8 text-xs w-[60px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};


const ventaSchema = z.object({
  productos: z.array(z.object({
    id: z.string(),
    codigo: z.string(),
    nombre: z.string(),
    precio_bs: z.number(),
    unidad: z.string(),
    stock: z.number(),
    cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
  })).min(1, "Debe agregar al menos un producto."),
  descuento: z.coerce.number().min(0, "El descuento no puede ser negativo.").default(0),
});

const metodosDePago: { id: MetodoPago; label: string }[] = [
    { id: 'efectivo_bs', label: 'Efectivo Bs.' },
    { id: 'efectivo_usd', label: 'Efectivo USD' },
    { id: 'transferencia', label: 'Transferencia' },
    { id: 'pago_movil', label: 'Pago Móvil' },
    { id: 'zelle', label: 'Zelle' },
];

export default function POS() {
  const { firestoreUser } = useAuth();
  const { toast } = useToast();
  const { config, loading: configLoading } = useConfig();
  const [busqueda, setBusqueda] = useState('');
  const [productosBusqueda, setProductosBusqueda] = useState<Producto[]>([]);
  const [busquedaLoading, setBusquedaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMetodosPago, setSelectedMetodosPago] = useState<Set<MetodoPago>>(new Set());
  const [ventaFinalizada, setVentaFinalizada] = useState<Venta | null>(null);

  const form = useForm<z.infer<typeof ventaSchema>>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      productos: [],
      descuento: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "productos",
  });
  
  const productosEnCarritoIds = new Set(fields.map(p => p.id));

  const agregarProducto = useCallback((producto: Producto, cantidad: number = 1) => {
    if (productosEnCarritoIds.has(producto.id)) {
      toast({
        variant: 'destructive',
        title: 'Producto ya agregado',
        description: 'Este producto ya está en el carrito. Puede editar la cantidad.',
      });
      return;
    }
    if (producto.stock <= 0) {
        toast({ variant: 'destructive', title: 'Sin Stock', description: 'Este producto no tiene stock disponible.' });
        return;
    }
    append({ ...producto, cantidad: producto.unidad === 'kg' ? 0 : cantidad });
    setBusqueda('');
    setProductosBusqueda([]);
  }, [append, productosEnCarritoIds, toast]);

  useEffect(() => {
    const buscarProductos = async () => {
      if (busqueda.trim().length < 2) {
        setProductosBusqueda([]);
        return;
      }
      setBusquedaLoading(true);
      try {
        const busquedaLower = busqueda.toLowerCase();
        const productosRef = collection(db, 'productos');
        
        // Primero, buscar por código de barras
        if (!isNaN(parseInt(busqueda))) { // Es probable que sea un código de barras
            const barcodeQuery = query(productosRef, where('codigo_barras', '==', busqueda), limit(1));
            const barcodeSnapshot = await getDocs(barcodeQuery);
            if (!barcodeSnapshot.empty) {
                const producto = { id: barcodeSnapshot.docs[0].id, ...barcodeSnapshot.docs[0].data() } as Producto;
                agregarProducto(producto);
                setBusquedaLoading(false);
                return;
            }
        }
        
        // Si no, buscar por nombre
        const q = query(productosRef, where('nombre_lower', '>=', busquedaLower), where('nombre_lower', '<=', busquedaLower + '\uf8ff'));
        
        const querySnapshot = await getDocs(q);
        const productosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));
        
        setProductosBusqueda(productosData);
      } catch (error) {
        console.error("Error buscando productos:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron buscar los productos.' });
      } finally {
        setBusquedaLoading(false);
      }
    };

    const debounce = setTimeout(() => {
        buscarProductos();
    }, 300); // Espera 300ms despues de que el usuario deja de escribir

    return () => clearTimeout(debounce);
  }, [busqueda, toast, agregarProducto]);


  const valoresCalculados = useMemo(() => {
    const productos = form.watch('productos');
    const descuento = form.watch('descuento') || 0;
    const tasaDolar = config?.tasa_dolar || 1;

    const subtotalBs = productos.reduce((acc, item) => acc + (item.precio_bs * item.cantidad), 0);
    const subtotalUsd = subtotalBs / tasaDolar;
    const totalBs = subtotalBs - descuento;
    const totalUsd = totalBs / tasaDolar;

    return { subtotalBs, subtotalUsd, totalBs, totalUsd };
  }, [form, config]);

  const handleMetodoPagoChange = (metodo: MetodoPago) => {
    setSelectedMetodosPago(prev => {
        const newSet = new Set(prev);
        if (newSet.has(metodo)) {
            newSet.delete(metodo);
        } else {
            newSet.add(metodo);
        }
        return newSet;
    });
  };

  const resetVenta = () => {
    form.reset();
    setSelectedMetodosPago(new Set());
    setVentaFinalizada(null);
  };

  const generarNumeroFactura = (): string => {
    return format(new Date(), 'yyyyMMddHHmmss');
  };

  const onSubmit = async (data: z.infer<typeof ventaSchema>) => {
    if (!firestoreUser || !config) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al usuario o la configuración.' });
        return;
    }
    if (selectedMetodosPago.size === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar al menos un método de pago.' });
        return;
    }
    setIsSubmitting(true);
    
    try {
        await runTransaction(db, async (transaction) => {
            const productosVendidos: ProductoVendido[] = [];

            for (const p of data.productos) {
                const productoRef = doc(db, 'productos', p.id);
                const productoDoc = await transaction.get(productoRef);

                if (!productoDoc.exists()) {
                    throw new Error(`El producto "${p.nombre}" no fue encontrado.`);
                }
                
                if (p.cantidad <= 0) {
                    throw new Error(`La cantidad para "${p.nombre}" debe ser mayor a cero.`);
                }

                const stockActual = productoDoc.data().stock;
                if (stockActual < p.cantidad) {
                    throw new Error(`Stock insuficiente para "${p.nombre}". Disponible: ${stockActual}.`);
                }

                const nuevoStock = stockActual - p.cantidad;
                transaction.update(productoRef, { stock: nuevoStock });

                productosVendidos.push({
                    id: p.id,
                    codigo: p.codigo,
                    nombre: p.nombre,
                    precio_bs: p.precio_bs,
                    unidad: p.unidad as UnidadMedida,
                    cantidad: p.cantidad,
                    subtotal_bs: p.precio_bs * p.cantidad,
                    subtotal_usd: (p.precio_bs * p.cantidad) / config.tasa_dolar,
                });
            }
            
            const numeroFactura = generarNumeroFactura();
            const nuevaVentaData: Omit<Venta, 'id'> = {
                numero_factura: numeroFactura,
                fecha: serverTimestamp(),
                usuario_uid: firestoreUser.uid,
                usuario_nombre: firestoreUser.nombreCompleto,
                productos: productosVendidos,
                subtotal_bs: valoresCalculados.subtotalBs,
                subtotal_usd: valoresCalculados.subtotalUsd,
                descuento_bs: data.descuento,
                total_bs: valoresCalculados.totalBs,
                total_usd: valoresCalculados.totalUsd,
                metodo_pago: Array.from(selectedMetodosPago),
                tasa_dolar_momento: config.tasa_dolar,
            };

            const ventaRef = doc(collection(db, 'ventas'));
            transaction.set(ventaRef, nuevaVentaData);

            const ventaCompleta: Venta = {
                ...nuevaVentaData,
                id: ventaRef.id,
                fecha: new Date(),
            };
            setVentaFinalizada(ventaCompleta);
        });

        toast({
            title: 'Venta registrada con éxito',
            description: `Monto total: ${valoresCalculados.totalBs.toFixed(2)} Bs.`,
        });

    } catch (error: any) {
        console.error("Error al guardar la venta:", error);
        toast({
            variant: 'destructive',
            title: 'Error al procesar la venta',
            description: error.message || 'Ocurrió un problema. El stock no ha sido modificado.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (configLoading) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                 <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                 <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                 <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  if (!config) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive bg-card p-12 text-center">
            <h2 className="text-xl font-bold text-destructive">Error de Configuración</h2>
            <p className="text-muted-foreground">No se pudo cargar la configuración del sistema. Por favor, contacte a un administrador para que configure los datos del negocio en el módulo de Configuración.</p>
        </div>
    )
  }

  return (
    <>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 non-printable">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            <span className='text-xl'>Nueva Venta</span>
          </CardTitle>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[250px] w-full whitespace-nowrap rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs">Producto</TableHead>
                            <TableHead className="w-[150px] text-xs">Cant.</TableHead>
                            <TableHead className="text-right text-xs">Subtotal</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                                    Agregue productos desde el panel de la derecha.
                                </TableCell>
                            </TableRow>
                        ) : fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell className="text-xs font-medium whitespace-normal">{field.nombre}</TableCell>
                                <TableCell>
                                    {field.unidad === 'kg' ? (
                                        <CantidadInput control={form.control} index={index} stock={field.stock} />
                                    ) : (
                                        <Input 
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="h-8 text-xs"
                                            {...form.register(`productos.${index}.cantidad`)}
                                            onBlur={(e) => {
                                                const newQty = parseInt(e.target.value, 10);
                                                if (newQty > field.stock) {
                                                    form.setValue(`productos.${index}.cantidad`, field.stock);
                                                    toast({ variant: 'destructive', title: 'Stock insuficiente', description: `Solo quedan ${field.stock} en stock.`})
                                                }
                                            }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <p className="text-xs font-semibold">Bs. {(field.precio_bs * form.watch(`productos.${index}.cantidad`)).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">${((field.precio_bs * form.watch(`productos.${index}.cantidad`)) / (config?.tasa_dolar || 1)).toFixed(2)}</p>
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Método de Pago</h3>
                    <div className="grid grid-cols-2 gap-2">
                    {metodosDePago.map(metodo => (
                        <div key={metodo.id} className="flex items-center gap-2">
                           <Checkbox
                                id={metodo.id}
                                checked={selectedMetodosPago.has(metodo.id)}
                                onCheckedChange={() => handleMetodoPagoChange(metodo.id)}
                            />
                            <Label htmlFor={metodo.id} className="cursor-pointer text-xs">{metodo.label}</Label>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Subtotal:</Label>
                        <span className="text-sm font-medium">Bs. {valoresCalculados.subtotalBs.toFixed(2)}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="descuento" className="text-xs">Descuento (Bs.):</Label>
                        <Input id="descuento" type="number" className="h-8 w-24 text-xs" {...form.register('descuento')} />
                    </div>
                    <hr />
                    <div className="flex items-center justify-between text-lg font-bold">
                        <span className="text-base">TOTAL A PAGAR:</span>
                        <span>Bs. {valoresCalculados.totalBs.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-green-600">
                        <DollarSign className="h-4 w-4"/>
                        <span>${valoresCalculados.totalUsd.toFixed(2)}</span>
                    </div>
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetVenta} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || fields.length === 0} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <> <FileText/> Confirmar Venta </>}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="lg:col-span-2 non-printable">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5"/>
            <span className="text-xl">Buscar Productos</span>
          </CardTitle>
          <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Barcode className="h-5 w-5 text-muted-foreground" />
             </div>
            <Input 
                placeholder="Escanear código o buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
            />
            {busqueda && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setBusqueda('')}>
                    <X className="h-4 w-4" />
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          {busquedaLoading && <p className="text-sm text-muted-foreground">Buscando...</p>}
          <div className="space-y-2">
            {!busquedaLoading && productosBusqueda
              .filter(p => !productosEnCarritoIds.has(p.id))
              .map(producto => (
                <div key={producto.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-secondary">
                  <div>
                    <p className="text-sm font-semibold">{producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">Bs. {producto.precio_bs.toFixed(2)} - Stock: {producto.stock}</p>
                  </div>
                  <Button size="sm" onClick={() => agregarProducto(producto)}>
                    <PlusCircle className="mr-2" /> Añadir
                  </Button>
                </div>
            ))}
            {!busquedaLoading && productosBusqueda.length === 0 && busqueda.length > 1 && (
                <p className="text-center text-sm text-muted-foreground">No se encontraron productos.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog open={!!ventaFinalizada} onOpenChange={(isOpen) => !isOpen && resetVenta()}>
      <DialogContent className="sm:max-w-md">
        <div className="printable-area">
          <DialogHeader className="pt-4">
            <DialogTitle className="text-center font-headline text-2xl">{config.nombre_negocio}</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
                {config.direccion} <br/> RIF: {config.rif}
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 border-t border-dashed" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>Factura N°:</span> <span className="font-mono">{ventaFinalizada?.numero_factura}</span></div>
            <div className="flex justify-between"><span>Fecha:</span> <span>{ventaFinalizada?.fecha ? new Date(ventaFinalizada.fecha).toLocaleString() : ''}</span></div>
            <div className="flex justify-between"><span>Cajero:</span> <span>{ventaFinalizada?.usuario_nombre}</span></div>
          </div>
          
          <div className="my-4 border-t border-dashed" />

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-auto p-1 text-xs">Cant.</TableHead>
                  <TableHead className="h-auto p-1 text-xs">Descripción</TableHead>
                  <TableHead className="h-auto p-1 text-right text-xs">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventaFinalizada?.productos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="p-1 align-top text-xs">{p.cantidad}</TableCell>
                    <TableCell className="p-1 text-xs">{p.nombre}</TableCell>
                    <TableCell className="p-1 align-top text-right text-xs">Bs. {p.subtotal_bs.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="my-4 border-t border-dashed" />

          <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span> <span>Bs. {ventaFinalizada?.subtotal_bs.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Descuento:</span> <span>Bs. {ventaFinalizada?.descuento_bs.toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>TOTAL Bs:</span> <span>Bs. {ventaFinalizada?.total_bs.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-green-600"><span>TOTAL USD:</span> <span>${ventaFinalizada?.total_usd.toFixed(2)}</span></div>
              <p className="pt-2 text-center text-xs text-muted-foreground">Tasa: Bs. {ventaFinalizada?.tasa_dolar_momento.toFixed(2)} por $</p>
          </div>
        </div>
        
        <DialogFooter className="mt-4 non-printable flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={resetVenta} className="w-full sm:w-auto">Nueva Venta</Button>
          <Button type="button" onClick={() => window.print()} className="w-full sm:w-auto">
            <Printer className="mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-area, .printable-area * {
          visibility: visible;
        }
        .printable-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 20px;
          margin: 0;
          border: none;
        }
        .non-printable {
          display: none;
        }
      }
    `}</style>
    </>
  );
}
