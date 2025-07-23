
import type { Timestamp } from 'firebase/firestore';
import type { Producto, UnidadMedida } from './producto';

export interface ProductoVendido {
  id: string;
  codigo: string;
  nombre: string;
  precio_bs: number;
  unidad: UnidadMedida;
  cantidad: number;
  subtotal_bs: number;
  subtotal_usd: number;
}

export type MetodoPago = 'efectivo_bs' | 'efectivo_usd' | 'transferencia' | 'pago_movil' | 'zelle';

export interface Venta {
  id?: string;
  numero_factura: string;
  fecha: Timestamp | Date;
  usuario_uid: string;
  usuario_nombre: string;
  cliente_id?: string; // Para futuras implementaciones
  cliente_nombre?: string; // Para futuras implementaciones
  productos: ProductoVendido[];
  subtotal_bs: number;
  subtotal_usd: number;
  descuento_bs: number;
  total_bs: number;
  total_usd: number;
  metodo_pago: MetodoPago[];
  tasa_dolar_momento: number;
}
