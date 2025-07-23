
"use client";

import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, addDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Producto, UnidadMedida } from '@/types/producto';
import { extractProductInfo } from '@/ai/flows/extract-product-info-flow';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, ScanLine, Barcode, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const productoSchema = z.object({
  codigo: z.string(),
  codigo_barras: z.string().optional(),
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  descripcion: z.string().optional(),
  precio_bs: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  unidad: z.enum(['kg', 'unidad', 'litro', 'paquete'], { required_error: 'Debe seleccionar una unidad.' }),
  stock: z.coerce.number().min(0, { message: 'El stock no puede ser negativo.' }),
});

const productosExtraidosSchema = z.object({
    productos: z.array(productoSchema.omit({ codigo: true }).extend({
        codigo_barras: z.string().optional(),
    }))
});

type ProductoExtraido = Omit<z.infer<typeof productoSchema>, 'codigo' | 'id'>;

interface ProductoFormProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  nextCode: string | null;
  onProductsAdded: () => void; // Callback para refrescar la lista
}

export function ProductoForm({ isOpen, onClose, producto, nextCode, onProductsAdded }: ProductoFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario para un solo producto (editar/crear)
  const singleForm = useForm<z.infer<typeof productoSchema>>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: '',
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      precio_bs: 0,
      stock: 0,
    },
  });

  // Formulario para múltiples productos extraídos por IA
  const batchForm = useForm<z.infer<typeof productosExtraidosSchema>>({
      resolver: zodResolver(productosExtraidosSchema),
      defaultValues: {
          productos: []
      }
  });

  const { fields, remove } = useFieldArray({
      control: batchForm.control,
      name: "productos"
  });

  useEffect(() => {
    if (isOpen) {
      if (producto) {
        singleForm.reset({
          ...producto,
          codigo_barras: producto.codigo_barras || '',
        });
      } else {
        singleForm.reset({
          codigo: nextCode || '',
          codigo_barras: '',
          nombre: '',
          descripcion: '',
          precio_bs: 0,
          unidad: undefined,
          stock: 0,
        });
      }
    }
  }, [producto, isOpen, singleForm, nextCode]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAiLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        try {
          const result = await extractProductInfo({ photoDataUri: dataUri });
          
          if (!result || result.productos.length === 0) {
              toast({
                  variant: 'destructive',
                  title: 'No se encontraron productos',
                  description: 'La IA no pudo detectar productos en la imagen. Intente con otra imagen.',
              });
              setAiLoading(false);
              return;
          }
          
          const productosConDefaults = result.productos.map(p => ({
            ...p,
            codigo_barras: p.codigo_barras || '',
            descripcion: p.descripcion || '',
            stock: p.stock || 0,
            unidad: p.unidad || 'unidad',
          }));

          batchForm.reset({ productos: productosConDefaults });
          onClose(); // Cerrar el modal actual
          setIsBatchModalOpen(true); // Abrir el modal de lote
          toast({
            title: 'Información extraída',
            description: `Se encontraron ${result.productos.length} productos en la imagen.`,
          });
        } catch (aiError) {
          console.error("Error con la IA:", aiError);
          toast({
            variant: 'destructive',
            title: 'Error de escaneo',
            description: 'No se pudo extraer la información de la imagen. Por favor, llene los campos manualmente.',
          });
        } finally {
          setAiLoading(false);
        }
      };
      reader.onerror = () => {
        setAiLoading(false);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
      };
    } catch (e) {
      setAiLoading(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un problema al procesar el archivo.' });
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  // Guardar un solo producto
  const onSingleSubmit = async (values: z.infer<typeof productoSchema>) => {
    setLoading(true);
    try {
      const codeNumber = parseInt(values.codigo, 10);
      if (isNaN(codeNumber)) {
        throw new Error("El código del producto no es un número válido.");
      }

      const dataToSave = {
        ...values,
        codigo_int: codeNumber,
        nombre_lower: values.nombre.toLowerCase(),
      };

      if (producto) {
        const productoRef = doc(db, 'productos', producto.id);
        await setDoc(productoRef, dataToSave, { merge: true });
        toast({ title: 'Producto actualizado', description: `El producto "${values.nombre}" ha sido actualizado.` });
      } else {
        const collectionRef = collection(db, 'productos');
        await addDoc(collectionRef, dataToSave);
        toast({ title: 'Producto creado', description: `El producto "${values.nombre}" ha sido agregado.` });
      }
      onProductsAdded();
      onClose();
    } catch (error) {
      console.error("Error guardando producto:", error);
      toast({ variant: 'destructive', title: 'Error al guardar', description: 'Ocurrió un error al intentar guardar el producto.' });
    } finally {
      setLoading(false);
    }
  };

  // Guardar múltiples productos
  const onBatchSubmit = async (data: z.infer<typeof productosExtraidosSchema>) => {
      setLoading(true);
      const batch = writeBatch(db);
      const lastCode = parseInt(nextCode ?? "99", 10);

      try {
          data.productos.forEach((p, index) => {
              const newDocRef = doc(collection(db, "productos"));
              const codeNumber = lastCode + index;
              const dataToSave = {
                  ...p,
                  codigo: codeNumber.toString(),
                  codigo_int: codeNumber,
                  nombre_lower: p.nombre.toLowerCase(),
                  descripcion: p.descripcion || "",
                  codigo_barras: p.codigo_barras || "",
              };
              batch.set(newDocRef, dataToSave);
          });

          await batch.commit();
          toast({
              title: "Productos guardados",
              description: `Se han creado ${data.productos.length} nuevos productos en el inventario.`
          });
          onProductsAdded();
          setIsBatchModalOpen(false);

      } catch (error) {
          console.error("Error guardando productos en lote:", error);
          toast({
              variant: "destructive",
              title: "Error al guardar",
              description: "No se pudieron guardar los productos. Intente de nuevo.",
          });
      } finally {
          setLoading(false);
      }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar Producto' : 'Registrar Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {producto ? 'Modifica los detalles del producto.' : 'Llena los campos o escanea una factura para empezar.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
            <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="animate-spin" /> : <><ScanLine className="mr-2" /> Escanear Factura/Etiqueta con IA</>}
            </Button>
        </div>
        <Form {...singleForm}>
          <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={singleForm.control} name="codigo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Interno</FormLabel>
                    <FormControl><Input placeholder="100" {...field} disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField control={singleForm.control} name="codigo_barras" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Escanear o tipear..." {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <FormField control={singleForm.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl><Input placeholder="Punta Trasera" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <div className="grid grid-cols-3 gap-4">
                <FormField control={singleForm.control} name="precio_bs" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Precio (Bs)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder='0.00' {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={singleForm.control} name="unidad" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="paquete">Paquete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                <FormField control={singleForm.control} name="stock" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl><Input type="number" step="1" placeholder='0' {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={singleForm.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Corte de primera calidad..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading || aiLoading}>Cancelar</Button>
                <Button type="submit" disabled={loading || aiLoading}>
                {loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> {producto ? 'Guardar Cambios' : 'Crear Producto'}</>}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Modal para Productos en Lote */}
    <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Productos Extraídos de la Factura</DialogTitle>
                <DialogDescription>
                    Revisa la información extraída por la IA y haz los ajustes necesarios antes de guardar todos los productos.
                </DialogDescription>
            </DialogHeader>
            <Form {...batchForm}>
                <form onSubmit={batchForm.handleSubmit(onBatchSubmit)}>
                    <div className="max-h-[60vh] overflow-auto pr-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Precio (Bs)</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell><FormField control={batchForm.control} name={`productos.${index}.nombre`} render={({ field }) => <Input {...field} />} /></TableCell>
                                        <TableCell><FormField control={batchForm.control} name={`productos.${index}.precio_bs`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                        <TableCell><FormField control={batchForm.control} name={`productos.${index}.stock`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                        <TableCell>
                                            <FormField control={batchForm.control} name={`productos.${index}.unidad`} render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="kg">Kg</SelectItem>
                                                        <SelectItem value="unidad">Unidad</SelectItem>
                                                        <SelectItem value="litro">Litro</SelectItem>
                                                        <SelectItem value="paquete">Paquete</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
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
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsBatchModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> Guardar {fields.length} Productos</>}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    </>
  );
}
