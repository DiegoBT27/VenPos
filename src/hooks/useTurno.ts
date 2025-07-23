
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Turno } from '@/types/turno';
import { useToast } from './use-toast';
import { iniciarTurnoAction, cerrarTurnoAction } from '@/actions/turnoActions';
import type { z } from 'zod';

// Esto nos permite usar el tipo del schema de Zod sin importarlo directamente en el frontend
type CerrarTurnoData = Parameters<typeof cerrarTurnoAction>[0];

export const useTurno = (uid: string | undefined | null) => {
  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkForActiveTurno = useCallback(async (userId: string) => {
    if (!userId) {
      setTurnoActivo(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const turnosRef = collection(db, 'turnos');
      const q = query(
        turnosRef,
        where('usuario_uid', '==', userId),
        where('estado', '==', 'abierto'),
        orderBy('fecha_apertura', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const turnoDoc = querySnapshot.docs[0];
        const turnoData = { id: turnoDoc.id, ...turnoDoc.data() } as Turno;
        // Asegurarnos que la fecha sea un objeto Date
        if (turnoData.fecha_apertura && !(turnoData.fecha_apertura instanceof Date)) {
          turnoData.fecha_apertura = (turnoData.fecha_apertura as any).toDate();
        }
        setTurnoActivo(turnoData);
      } else {
        setTurnoActivo(null);
      }
    } catch (error) {
      console.error("Error buscando turno activo:", error);
      setTurnoActivo(null);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar el estado del turno.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (uid) {
      checkForActiveTurno(uid);
    } else {
      setLoading(false);
      setTurnoActivo(null);
    }
  }, [uid, checkForActiveTurno]);

  const iniciarTurno = async (fondo_bs: number, fondo_usd: number) => {
    if (!uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al usuario.' });
      return;
    }
    const result = await iniciarTurnoAction({ fondo_bs, fondo_usd, userId: uid });
    if (result.success) {
      toast({ title: 'Turno iniciado', description: 'Fondo de caja registrado. ¡Listo para vender!' });
      await checkForActiveTurno(uid); // Re-verificar para actualizar el estado
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const cerrarTurno = async (data: CerrarTurnoData) => {
      const result = await cerrarTurnoAction(data);
      if (result.success) {
          toast({ title: 'Turno cerrado', description: 'El resumen del turno ha sido guardado.'});
          setTurnoActivo(null);
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      return result.success;
  };

  return { turnoActivo, loading, iniciarTurno, cerrarTurno, checkForActiveTurno };
};
