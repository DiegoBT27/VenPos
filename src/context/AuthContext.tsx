
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { FirestoreUser } from '@/types/user';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
  handleLogout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true); // Siempre empieza cargando
  const router = useRouter();

  useEffect(() => {
    // onAuthStateChanged devuelve una función de cancelación (unsubscribe)
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      // Si no hay usuario de autenticación, sabemos que no hay usuario de Firestore.
      // Podemos dejar de cargar.
      if (!authUser) {
        setFirestoreUser(null);
        setLoading(false);
      }
    });

    // Limpiamos la suscripción cuando el componente se desmonte
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Este efecto depende de `user`. Si `user` cambia...
    if (user) {
      // Si hay un usuario, empezamos (o continuamos) cargando mientras buscamos sus datos.
      setLoading(true);
      const unsubscribeFirestore = onSnapshot(doc(db, "usuarios", user.uid), (doc) => {
        if (doc.exists()) {
          setFirestoreUser({ uid: doc.id, ...doc.data() } as FirestoreUser);
        } else {
          // El usuario existe en Auth pero no en Firestore. Mal estado.
          setFirestoreUser(null);
          // Deslogueamos para evitar problemas.
          signOut(auth);
        }
        // Terminamos de cargar SOLO DESPUÉS de obtener la respuesta de Firestore.
        setLoading(false);
      }, (error) => {
        console.error("Error fetching firestore user:", error);
        setFirestoreUser(null);
        setLoading(false);
        // También podría ser bueno desloguear aquí.
        signOut(auth);
      });

      return () => unsubscribeFirestore();
    }
    // Si `user` es `null`, el otro useEffect ya se encargó de poner loading en false.
    // No necesitamos hacer nada aquí en ese caso.
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      // `onAuthStateChanged` se activará, poniendo `user` a null,
      // lo que a su vez pondrá `firestoreUser` a null.
      // La redirección ocurrirá de forma segura desde el AppLayout.
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, firestoreUser, loading, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
