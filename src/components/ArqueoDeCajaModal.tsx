
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Lock, Scale } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { Turno } from '@/types/turno';
import type { CashierReportData } from '@/hooks/useCashierReport';
import { cerrarTurnoAction } from '@/actions/turnoActions';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  efectivo_contado_bs: z.coerce.number().min(0, "El monto no puede ser negativo.").default(0),
  efectivo_contado_usd: z.coerce.number().min(0, "El monto no puede ser negativo.").default(0),
});

interface ArqueoDeCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  turno: Turno;
  report: CashierReportData;
  onTurnoClosed: () => void;
}

export function ArqueoDeCajaModal({ isOpen, onClose, turno, report, onTurnoClosed }: ArqueoDeCajaModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { firestoreUser } = useAuth(); // Obtener el usuario que está realizando la acción

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      efectivo_contado_bs: 0,
      efectivo_contado_usd: 0,
    },
  });

  const totalEfectivoBs = report.metodosPago.efectivo_bs || 0;
  const totalEfectivoUsd = report.metodosPago.efectivo_usd || 0;
  const fondoInicialBs = turno.fondo_bs;
  const fondoInicialUsd = turno.fondo_usd;

  const efectivoEsperadoBs = fondoInicialBs + totalEfectivoBs;
  const efectivoEsperadoUsd = fondoInicialUsd + totalEfectivoUsd;
  
  const watchedContadoBs = form.watch('efectivo_contado_bs');
  const watchedContadoUsd = form.watch('efectivo_contado_usd');

  const descuadreBs = watchedContadoBs - efectivoEsperadoBs;
  const descuadreUsd = watchedContadoUsd - efectivoEsperadoUsd;

  const getDescuadreClass = (descuadre: number) => {
    if (descuadre < 0) return 'text-destructive';
    if (descuadre > 0) return 'text-yellow-500';
    return 'text-green-500';
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestoreUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha podido identificar al supervisor.' });
        return;
    }
    setLoading(true);
    const result = await cerrarTurnoAction({
        turnoId: turno.id,
        totalVentasBs: report.totalVendido,
        totalEfectivoBs: report.metodosPago.efectivo_bs || 0,
        totalEfectivoUsd: report.metodosPago.efectivo_usd || 0,
        totalTransferenciaBs: report.metodosPago.transferencia || 0,
        totalPagoMovilBs: report.metodosPago.pago_movil || 0,
        totalZelleUsd: report.metodosPago.zelle || 0,
        efectivoContadoBs: values.efectivo_contado_bs,
        efectivoContadoUsd: values.efectivo_contado_usd,
        descuadreBs: descuadreBs,
        descuadreUsd: descuadreUsd,
        supervisorUid: firestoreUser.uid,
        supervisorNombre: firestoreUser.nombreCompleto
    });

    if (result.success) {
        toast({ title: 'Turno cerrado con éxito', description: 'El arqueo de caja ha sido guardado.'});
        onTurnoClosed();
        form.reset();
    } else {
        toast({ variant: 'destructive', title: 'Error al cerrar turno', description: result.error });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale /> Arqueo y Cierre de Caja
          </DialogTitle>
          <DialogDescription>
            Introduce el monto total de efectivo contado en caja para calcular la diferencia y cerrar el turno.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 text-sm">
             <Table>
                <TableBody>
                    <TableRow><TableCell className="font-medium p-1">Fondo Inicial (Bs)</TableCell><TableCell className="text-right p-1">{fondoInicialBs.toFixed(2)}</TableCell></TableRow>
                    <TableRow><TableCell className="font-medium p-1">Ventas Efectivo (Bs)</TableCell><TableCell className="text-right p-1">{totalEfectivoBs.toFixed(2)}</TableCell></TableRow>
                    <TableRow className="border-t-2"><TableCell className="font-bold p-1">Efectivo Esperado (Bs)</TableCell><TableCell className="font-bold text-right p-1">{efectivoEsperadoBs.toFixed(2)}</TableCell></TableRow>
                    <TableRow><TableCell className="font-medium p-1">Fondo Inicial (USD)</TableCell><TableCell className="text-right p-1">{fondoInicialUsd.toFixed(2)}</TableCell></TableRow>
                    <TableRow><TableCell className="font-medium p-1">Ventas Efectivo (USD)</TableCell><TableCell className="text-right p-1">{totalEfectivoUsd.toFixed(2)}</TableCell></TableRow>
                    <TableRow className="border-t-2"><TableCell className="font-bold p-1">Efectivo Esperado (USD)</TableCell><TableCell className="font-bold text-right p-1">{efectivoEsperadoUsd.toFixed(2)}</TableCell></TableRow>
                </TableBody>
            </Table>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="efectivo_contado_bs"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Efectivo Contado (Bs)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="efectivo_contado_usd"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Efectivo Contado (USD)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
                <h4 className="font-semibold text-center">Descuadre / Diferencia</h4>
                <div className="flex justify-around">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Bolívares</p>
                        <p className={`font-bold text-lg ${getDescuadreClass(descuadreBs)}`}>{descuadreBs.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Dólares</p>
                        <p className={`font-bold text-lg ${getDescuadreClass(descuadreUsd)}`}>{descuadreUsd.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} variant="destructive">
                {loading ? <Loader2 className="animate-spin" /> : <><Lock className="mr-2" /> Confirmar Cierre</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
