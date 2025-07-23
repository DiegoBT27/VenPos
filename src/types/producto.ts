
export type UnidadMedida = 'kg' | 'unidad' | 'litro' | 'paquete';

export interface Producto {
  id: string;
  codigo: string;
  codigo_barras?: string; // Código de barras para el lector
  codigo_int: number;
  nombre: string;
  nombre_lower: string; 
  descripcion?: string;
  precio_bs: number;
  unidad: UnidadMedida;
  stock: number;
}
