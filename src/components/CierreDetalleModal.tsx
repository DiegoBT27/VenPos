
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { Printer, XCircle } from 'lucide-react';
import type { Turno } from '@/types/turno';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface CierreDetalleModalProps {
  turno: Turno | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CierreDetalleModal({ turno, isOpen, onClose }: CierreDetalleModalProps) {

  const handlePrint = () => {
    window.print();
  };
  
  if (!turno) return null;

  const formatCurrency = (value: number | undefined, currency = 'Bs') => {
    const amount = (value || 0).toFixed(2);
    return currency === 'Bs' ? `Bs. ${amount}` : `$${amount}`;
  }

  const getDescuadreClass = (descuadre: number | undefined) => {
    if (descuadre === undefined || descuadre === 0) return 'text-green-600';
    return 'text-destructive font-bold';
  }

  const efectivoEsperadoBs = (turno.fondo_bs || 0) + (turno.total_efectivo_bs || 0);
  const efectivoEsperadoUsd = (turno.fondo_usd || 0) + (turno.total_efectivo_usd || 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <ScrollArea className="max-h-[80vh]">
            <div className="printable-area p-4">
              <DialogHeader className="pt-4 text-center">
                <DialogTitle className="font-headline text-lg">Detalle de Cierre de Caja</DialogTitle>
                <DialogDescription className="text-xs">
                  Cierre por: {turno.supervisor_nombre} <br />
                  {turno.fecha_cierre ? new Date(turno.fecha_cierre).toLocaleString() : ''}
                </DialogDescription>
              </DialogHeader>
              
              <div className="my-3 border-t border-dashed" />

              <div className="printable-content space-y-4 text-sm">
                
                <div className="printable-flex-container">
                  <div className="printable-column">
                    <h3 className="font-semibold text-center text-xs uppercase tracking-wider">Resumen de Ingresos</h3>
                    <Table>
                        <TableHeader>
                          <TableRow><TableHead className="h-auto p-1 text-xs">Método</TableHead><TableHead className="h-auto p-1 text-right text-xs">Monto</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow><TableCell className="p-1 text-xs">Efectivo (Bs)</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_efectivo_bs)}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Efectivo (USD)</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_efectivo_usd, 'USD')}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Pago Móvil</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_pago_movil_bs)}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Transferencia</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_transferencia_bs)}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Zelle</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_zelle_usd, 'USD')}</TableCell></TableRow>
                            <TableRow className="font-bold border-t"><TableCell className="p-1 text-xs">Total Ventas</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_ventas_bs)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                  </div>
                  
                  <div className="printable-column">
                    <h3 className="font-semibold text-center text-xs uppercase tracking-wider pt-2">Arqueo de Caja (Bolívares)</h3>
                    <Table>
                        <TableBody>
                            <TableRow><TableCell className="p-1 text-xs">Fondo Inicial</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.fondo_bs)}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Ventas Efectivo</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_efectivo_bs)}</TableCell></TableRow>
                            <TableRow className="font-bold border-y"><TableCell className="p-1 text-xs">Esperado</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(efectivoEsperadoBs)}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Contado</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.efectivo_contado_bs)}</TableCell></TableRow>
                            <TableRow className={cn("font-extrabold", getDescuadreClass(turno.descuadre_bs))}><TableCell className="p-1 text-xs">Diferencia</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.descuadre_bs)}</TableCell></TableRow>
                        </TableBody>
                    </Table>

                    <div className="my-3 border-t border-dashed" />

                    <h3 className="font-semibold text-center text-xs uppercase tracking-wider pt-2">Arqueo de Caja (Dólares)</h3>
                    <Table>
                        <TableBody>
                            <TableRow><TableCell className="p-1 text-xs">Fondo Inicial</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.fondo_usd, 'USD')}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Ventas Efectivo</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.total_efectivo_usd, 'USD')}</TableCell></TableRow>
                            <TableRow className="font-bold border-y"><TableCell className="p-1 text-xs">Esperado</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(efectivoEsperadoUsd, 'USD')}</TableCell></TableRow>
                            <TableRow><TableCell className="p-1 text-xs">Contado</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.efectivo_contado_usd, 'USD')}</TableCell></TableRow>
                            <TableRow className={cn("font-extrabold", getDescuadreClass(turno.descuadre_usd))}><TableCell className="p-1 text-xs">Diferencia</TableCell><TableCell className="text-right font-mono text-xs">{formatCurrency(turno.descuadre_usd, 'USD')}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 non-printable">
            <Button type="button" variant="outline" onClick={onClose}>
                <XCircle /> Cerrar
            </Button>
            <Button type="button" onClick={handlePrint}>
              <Printer /> Imprimir / Guardar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        @media screen {
            /* No special styles needed here anymore as ScrollArea handles it */
        }
        @media print {
          @page {
            size: landscape;
            margin: 1cm;
          }
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
            height: auto;
            padding: 0;
            margin: 0;
            border: none;
            font-size: 10pt;
            background: white;
            color: black;
          }
          .printable-content {
            display: block !important;
          }
          .printable-flex-container {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            justify-content: space-between;
          }
          .printable-column {
            width: 48%;
          }
          .non-printable {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
