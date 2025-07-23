export interface KpiData {
  ventasHoy: number;
  ventasSemana: number;
  transaccionesHoy: number;
  productosActivos: number;
  productosBajos: number;
}

export interface DailySalesData {
  fecha: string;
  total: number;
}
