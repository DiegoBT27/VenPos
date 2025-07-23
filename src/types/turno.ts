import type { Timestamp } from 'firebase/firestore';

export interface Turno {
  id: string;
  usuario_uid: string;
  fecha_apertura: Timestamp | Date;
  fecha_cierre?: Timestamp | Date;
  
  // Fondos iniciales
  fondo_bs: number;
  fondo_usd: number;
  
  // Totales del sistema por método de pago
  total_ventas_bs?: number; // Total general
  total_efectivo_bs?: number;
  total_efectivo_usd?: number;
  total_transferencia_bs?: number;
  total_pago_movil_bs?: number;
  total_zelle_usd?: number;


  // Conteo manual al cierre
  efectivo_contado_bs?: number;
  efectivo_contado_usd?: number;

  // Diferencias
  descuadre_bs?: number;
  descuadre_usd?: number;

  estado: 'abierto' | 'cerrado';

  // Auditoría de cierre
  supervisor_uid?: string;
  supervisor_nombre?: string;
}
