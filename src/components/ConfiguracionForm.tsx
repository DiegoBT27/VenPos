
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useConfig } from '@/hooks/useConfig';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Building, CircleDollarSign, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  // Info General
  nombre_negocio: z.string().min(1, "El nombre del negocio es requerido."),
  rif: z.string().min(1, "El RIF es requerido."),
  direccion: z.string().min(1, "La dirección es requerida."),
  telefono: z.string().optional(),
  email: z.string().email("Correo electrónico no válido.").optional().or(z.literal('')),

  // Datos Fiscales
  tasa_dolar: z.coerce.number().positive("La tasa debe ser un número positivo."),
  iva: z.coerce.number().min(0, "El IVA no puede ser negativo."),
  moneda_principal: z.enum(['Bs', 'USD']),
  condiciones_pago: z.string().optional(),
  
  // Preferencias
  zona_horaria: z.string().min(1, "La zona horaria es requerida."),
  prefijo_factura: z.string().optional(),
});

export function ConfiguracionForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { config, loading: fetching } = useConfig();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_negocio: '',
      rif: '',
      direccion: '',
      telefono: '',
      email: '',
      tasa_dolar: 0,
      iva: 16,
      moneda_principal: 'Bs',
      condiciones_pago: '',
      zona_horaria: 'America/Caracas',
      prefijo_factura: 'FAC-',
    },
  });

  useEffect(() => {
    if (config) {
        form.reset({
          ...config,
          telefono: config.telefono || '',
          email: config.email || '',
          condiciones_pago: config.condiciones_pago || '',
          prefijo_factura: config.prefijo_factura || 'FAC-',
        });
    }
  }, [config, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const configRef = doc(db, 'configuracion', 'general');
      // El hook se encargará de actualizar la fecha de la tasa si es necesario.
      // Aquí solo guardamos los datos del formulario.
      await setDoc(configRef, values, { merge: true });

      toast({
        title: 'Configuración guardada',
        description: 'Los datos generales del sistema han sido actualizados.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Ocurrió un error al intentar guardar la configuración.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
             <div className="rounded-full border bg-secondary p-3">
                <Building className="h-6 w-6 text-secondary-foreground" />
             </div>
             <div>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos principales de tu empresa.</CardDescription>
             </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="nombre_negocio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Negocio</FormLabel>
                  <FormControl><Input placeholder="Mi Negocio C.A." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField control={form.control} name="rif" render={({ field }) => (
                <FormItem>
                  <FormLabel>RIF</FormLabel>
                  <FormControl><Input placeholder="J-12345678-9" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField control={form.control} name="direccion" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Dirección Fiscal</FormLabel>
                  <FormControl><Textarea placeholder="Av. Principal, Local 1, Ciudad" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField control={form.control} name="telefono" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl><Input placeholder="0212-555-1234" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl><Input placeholder="contacto@minegocio.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
             <div className="rounded-full border bg-secondary p-3">
                <CircleDollarSign className="h-6 w-6 text-secondary-foreground" />
             </div>
             <div>
                <CardTitle>Datos Fiscales y Monetarios</CardTitle>
                <CardDescription>Configura impuestos, moneda y tasas.</CardDescription>
             </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
             <FormField control={form.control} name="tasa_dolar" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa del Dólar (Bs.)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormDescription>Se actualiza automáticamente desde el BCV.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
             <FormField control={form.control} name="iva" render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA (%)</FormLabel>
                  <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField control={form.control} name="moneda_principal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda Principal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Bs">Bolívar (Bs)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField control={form.control} name="condiciones_pago" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Condiciones de Pago (Pie de Factura)</FormLabel>
                  <FormControl><Textarea placeholder="Ej: Gracias por su compra. Precios sujetos a cambio sin previo aviso." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
             <div className="rounded-full border bg-secondary p-3">
                <SlidersHorizontal className="h-6 w-6 text-secondary-foreground" />
             </div>
             <div>
                <CardTitle>Preferencias del Sistema</CardTitle>
                <CardDescription>Ajusta el comportamiento de la aplicación.</CardDescription>
             </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="zona_horaria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona Horaria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="America/Caracas">Venezuela (Caracas)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
             <FormField control={form.control} name="prefijo_factura" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefijo de Número de Factura</FormLabel>
                  <FormControl><Input placeholder="FAC-" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || fetching} size="lg">
            {loading ? <Loader2 className="animate-spin" /> : <><Save /> Guardar Toda la Configuración</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
