
"use client";

import { useConfig } from '@/hooks/useConfig';
import type { Venta } from '@/types/venta';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer } from 'lucide-react';

interface VentaDetalleModalProps {
  venta: Venta | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VentaDetalleModal({ venta, isOpen, onClose }: VentaDetalleModalProps) {
  const { config } = useConfig();

  const handlePrint = () => {
    // La función de impresión nativa del navegador.
    // Los estilos CSS se encargarán de formatear el contenido.
    window.print();
  };
  
  if (!venta || !config) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          {/* Este div es el que se imprimirá */}
          <div className="printable-area">
            <DialogHeader className="pt-4">
              <DialogTitle className="text-center font-headline text-xl">{config.nombre_negocio}</DialogTitle>
              {/* Añadimos DialogDescription para mejorar la accesibilidad y evitar warnings */}
              <DialogDescription className="text-center text-xs text-muted-foreground">
                {config.direccion} <br/> RIF: {config.rif}
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4 border-t border-dashed" />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Factura N°:</span> <span className="font-mono">{venta.numero_factura}</span></div>
              <div className="flex justify-between"><span>Fecha:</span> <span>{new Date(venta.fecha instanceof Date ? venta.fecha : venta.fecha.toDate()).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cajero:</span> <span>{venta.usuario_nombre}</span></div>
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
                  {venta.productos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="p-1 align-top text-xs">{p.cantidad}{p.unidad === 'kg' ? 'kg' : ''}</TableCell>
                      <TableCell className="p-1 text-xs">{p.nombre}</TableCell>
                      <TableCell className="p-1 align-top text-right text-xs">Bs. {p.subtotal_bs.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="my-4 border-t border-dashed" />

            <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span> <span>Bs. {venta.subtotal_bs.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Descuento:</span> <span>Bs. {venta.descuento_bs.toFixed(2)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>TOTAL Bs:</span> <span>Bs. {venta.total_bs.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-green-600"><span>TOTAL USD:</span> <span>${venta.total_usd.toFixed(2)}</span></div>
                <p className="pt-2 text-center text-xs text-muted-foreground">Tasa usada: Bs. {venta.tasa_dolar_momento.toFixed(2)} por $</p>
            </div>
          </div>
          
          <DialogFooter className="mt-4 non-printable">
            <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
            {/* Este es el botón que activa la impresión. `type="button"` es importante */}
            <Button type="button" onClick={handlePrint}>
              <Printer className="mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Estilos globales que solo se aplican al imprimir */}
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
