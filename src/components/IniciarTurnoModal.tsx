
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlayCircle, DollarSign, Coins } from 'lucide-react';

const formSchema = z.object({
  fondo_bs: z.coerce.number().min(0, "El fondo no puede ser negativo.").default(0),
  fondo_usd: z.coerce.number().min(0, "El fondo no puede ser negativo.").default(0),
});

interface IniciarTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTurnoIniciado: (fondo_bs: number, fondo_usd: number) => Promise<void>;
  userId: string;
}

export function IniciarTurnoModal({ isOpen, onClose, onTurnoIniciado }: IniciarTurnoModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fondo_bs: 0,
      fondo_usd: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    await onTurnoIniciado(values.fondo_bs, values.fondo_usd);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle /> Iniciar Nuevo Turno
          </DialogTitle>
          <DialogDescription>
            Introduce el monto inicial de efectivo (fondo de caja) que recibiste para este turno. Si no recibiste, deja los campos en 0.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="fondo_bs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fondo en Bolívares (Bs.)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input type="number" step="0.01" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fondo_usd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fondo en Dólares (USD)</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input type="number" step="0.01" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <PlayCircle className="mr-2" /> Confirmar e Iniciar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
