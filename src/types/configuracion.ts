import type { Timestamp } from 'firebase/firestore';

export interface ConfiguracionSistema {
  id?: string;
  // Información General
  nombre_negocio: string;
  rif: string;
  direccion: string;
  telefono?: string;
  email?: string;
  
  // Datos Fiscales y Monetarios
  tasa_dolar: number;
  iva: number;
  moneda_principal: 'Bs' | 'USD';
  condiciones_pago?: string; // Texto para el pie de factura

  // Preferencias
  zona_horaria: string;
  prefijo_factura?: string;

  fecha_actualizacion?: Timestamp;
}
