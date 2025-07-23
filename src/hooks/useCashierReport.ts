
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Venta, MetodoPago } from '@/types/venta';
import { isToday, startOfDay, endOfDay } from 'date-fns';

export interface CashierReportData {
  totalVendido: number;
  totalVentas: number;
  ticketPromedio: number;
  metodosPago: { [key in MetodoPago]?: number };
  ventas: Venta[];
}

export const useCashierReport = (uid: string | undefined | null, turnoActivo: boolean = false) => {
  const [report, setReport] = useState<CashierReportData>({
    totalVendido: 0,
    totalVentas: 0,
    ticketPromedio: 0,
    metodosPago: {},
    ventas: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!uid || !turnoActivo) {
        setLoading(false);
        setReport({
            totalVendido: 0,
            totalVentas: 0,
            ticketPromedio: 0,
            metodosPago: {},
            ventas: [],
        });
        return;
      }
      
      setLoading(true);
      try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        
        const ventasRef = collection(db, 'ventas');
        
        // Se simplifica la consulta para evitar la necesidad de un índice compuesto.
        // Solo se filtra por usuario. El filtrado por fecha se hará en el cliente.
        const q = query(
            ventasRef, 
            where('usuario_uid', '==', uid)
        );

        const querySnapshot = await getDocs(q);
        
        const allUserVentas = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            fecha: (doc.data().fecha as Timestamp).toDate(),
          })) as Venta[];

        // Filtrado por fecha y ordenación en el cliente.
        const ventasData = allUserVentas
          .filter(venta => (venta.fecha as Date) >= startOfToday)
          .sort((a, b) => (b.fecha as Date).getTime() - (a.fecha as Date).getTime());

        const totalVendido = ventasData.reduce((sum, venta) => sum + venta.total_bs, 0);
        const totalVentas = ventasData.length;
        const ticketPromedio = totalVentas > 0 ? totalVendido / totalVentas : 0;

        const metodosPago: { [key in MetodoPago]?: number } = {};
        ventasData.forEach(venta => {
          if (venta.metodo_pago.length === 1) {
            const metodo = venta.metodo_pago[0];
            metodosPago[metodo] = (metodosPago[metodo] || 0) + venta.total_bs;
          } else {
            // Si hay pago mixto, dividimos el monto entre los métodos
            const montoPorMetodo = venta.total_bs / venta.metodo_pago.length;
            venta.metodo_pago.forEach(metodo => {
              metodosPago[metodo] = (metodosPago[metodo] || 0) + montoPorMetodo;
            });
          }
        });

        setReport({
          totalVendido,
          totalVentas,
          ticketPromedio,
          metodosPago,
          ventas: ventasData,
        });

      } catch (error) {
        console.error("Error al obtener el reporte del cajero:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [uid, turnoActivo]);

  return { report, loading };
};
