
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreUser } from '@/types/user';

export const useActiveCashiers = () => {
  const [activeCashiers, setActiveCashiers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCashiers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'usuarios');
        // Se simplifica la consulta para evitar la necesidad de un índice compuesto.
        // El ordenamiento se hará en el cliente.
        const q = query(
          usersRef, 
          where('rol', '==', 'cajero'), 
          where('activo', '==', true)
        );
        
        const querySnapshot = await getDocs(q);

        const cashiersData = querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        })) as FirestoreUser[];
        
        // Ordenar los resultados en el lado del cliente
        cashiersData.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

        setActiveCashiers(cashiersData);

      } catch (error) {
        console.error("Error al obtener los cajeros activos:", error);
        setActiveCashiers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCashiers();
  }, []);

  return { activeCashiers, loading };
};
