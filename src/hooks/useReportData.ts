
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Venta } from '@/types/venta';
import type { Producto } from '@/types/producto';
import type { KpiData, DailySalesData } from '@/types/reportes';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export const useReportData = () => {
  const [kpis, setKpis] = useState<KpiData>({
    ventasHoy: 0,
    ventasSemana: 0,
    transaccionesHoy: 0,
    productosActivos: 0,
    productosBajos: 0,
  });
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const sevenDaysAgo = startOfDay(subDays(today, 6));

        // Consultas para Ventas
        const ventasRef = collection(db, 'ventas');
        const ventasHoyQuery = query(ventasRef, where('fecha', '>=', startOfToday), where('fecha', '<=', endOfToday));
        const ventasSemanaQuery = query(ventasRef, where('fecha', '>=', sevenDaysAgo), where('fecha', '<=', endOfToday));
        
        const [ventasHoySnapshot, ventasSemanaSnapshot] = await Promise.all([
            getDocs(ventasHoyQuery),
            getDocs(ventasSemanaQuery)
        ]);

        const ventasHoyData = ventasHoySnapshot.docs.map(doc => doc.data() as Venta);
        const ventasSemanaData = ventasSemanaSnapshot.docs.map(doc => doc.data() as Venta);

        const totalVentasHoy = ventasHoyData.reduce((sum, venta) => sum + venta.total_bs, 0);
        const totalVentasSemana = ventasSemanaData.reduce((sum, venta) => sum + venta.total_bs, 0);

        // Procesamiento para gráfico de ventas diarias
        const salesByDay: { [key: string]: number } = {};
        for (let i = 0; i < 7; i++) {
            const date = subDays(today, i);
            const formattedDate = format(date, 'EEE dd', { locale: es });
            salesByDay[formattedDate] = 0;
        }

        ventasSemanaData.forEach(venta => {
            const fechaVenta = (venta.fecha as Timestamp).toDate();
            const formattedDate = format(fechaVenta, 'EEE dd', { locale: es });
            if (salesByDay.hasOwnProperty(formattedDate)) {
                salesByDay[formattedDate] += venta.total_bs;
            }
        });

        const dailySalesChartData = Object.keys(salesByDay)
            .map(fecha => ({ fecha, total: salesByDay[fecha] }))
            .reverse();
        
        setDailySales(dailySalesChartData);

        // Consultas para Productos
        const productosRef = collection(db, 'productos');
        const productosActivosQuery = query(productosRef);
        const lowStockQuery = query(productosRef, where('stock', '<=', 5));

        const [productosActivosSnapshot, lowStockSnapshot] = await Promise.all([
            getDocs(productosActivosQuery),
            getDocs(lowStockQuery)
        ]);
        
        const lowStockData = lowStockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));

        setKpis({
          ventasHoy: totalVentasHoy,
          ventasSemana: totalVentasSemana,
          transaccionesHoy: ventasHoySnapshot.size,
          productosActivos: productosActivosSnapshot.size,
          productosBajos: lowStockSnapshot.size,
        });

        setLowStockProducts(lowStockData);

      } catch (error) {
        console.error("Error al obtener datos para reportes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { kpis, dailySales, lowStockProducts, loading };
};
