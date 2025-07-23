
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ConfiguracionSistema } from '@/types/configuracion';
import { useToast } from './use-toast';

export const useConfig = () => {
  const [config, setConfig] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const updateRateInFirestore = useCallback(async (newRate: number) => {
    const configRef = doc(db, 'configuracion', 'general');
    try {
      await setDoc(configRef, { 
        tasa_dolar: newRate,
        fecha_actualizacion: serverTimestamp()
      }, { merge: true });
      toast({
        title: 'Tasa actualizada',
        description: `Se actualizó la tasa del BCV a: ${newRate.toFixed(2)} Bs.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error al guardar tasa',
        description: 'No se pudo guardar la nueva tasa en la base de datos.',
      });
    }
  }, [toast]);
  
  const fetchAndUpdateRateIfNeeded = useCallback(async (currentConfig: ConfiguracionSistema) => {
    const lastUpdate = currentConfig.fecha_actualizacion?.toDate();
    const now = new Date();
    
    // Si no hay fecha de actualización o han pasado más de 4 horas
    if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > 4 * 60 * 60 * 1000) {
      try {
        const response = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv&monitor=usd');
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        
        const data = await response.json();
        const newRate = data?.price;

        if (newRate && typeof newRate === 'number' && newRate !== currentConfig.tasa_dolar) {
          await updateRateInFirestore(newRate);
        }
      } catch (error) {
        console.warn("No se pudo actualizar la tasa automáticamente:", error);
      }
    }
  }, [updateRateInFirestore]);


  useEffect(() => {
    const configRef = doc(db, 'configuracion', 'general');
    
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const newConfig = docSnap.data() as ConfiguracionSistema;
        setConfig(newConfig);
        fetchAndUpdateRateIfNeeded(newConfig);
      } else {
        setConfig(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching config:", error);
      setConfig(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndUpdateRateIfNeeded]);

  return { config, loading };
};
