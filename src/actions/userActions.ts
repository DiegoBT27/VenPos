
'use server';

import * as z from 'zod';
import type { UserRole } from '@/types/user';
import { ALL_ROLES } from '@/types/user';
import { db } from '@/lib/firebase'; // Usamos la instancia del cliente
import { doc, updateDoc } from 'firebase/firestore';

// Esquema para la actualización de usuario
const UpdateUserSchema = z.object({
  nombreCompleto: z.string().min(3),
  rol: z.enum(ALL_ROLES),
});

/**
 * Actualiza los datos de un usuario en Firestore.
 * Esta acción se ejecuta en el servidor pero utiliza el SDK del cliente.
 * La seguridad se delega a las Reglas de Seguridad de Firestore.
 */
export async function updateUser(uid: string, data: z.infer<typeof UpdateUserSchema>) {
   try {
    const validatedData = UpdateUserSchema.parse(data);
    const userDocRef = doc(db, 'usuarios', uid);
    await updateDoc(userDocRef, {
      nombreCompleto: validatedData.nombreCompleto,
      rol: validatedData.rol,
    });
    return { success: true };
  } catch (error: any) {
    const errorMessage = error instanceof z.ZodError ? 'Datos inválidos.' : error.message || 'No se pudo actualizar el usuario.';
    console.error("Error en updateUser Action:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Cambia el estado (activo/inactivo) de un usuario.
 * La seguridad se delega a las Reglas de Seguridad de Firestore.
 */
export async function updateUserStatus(uid: string, newStatus: boolean) {
  try {
    const userDocRef = doc(db, 'usuarios', uid);
    await updateDoc(userDocRef, { activo: newStatus });
    return { success: true };
  } catch (error: any) {
    console.error("Error en updateUserStatus Action:", error);
    return { success: false, error: error.message || 'No se pudo actualizar el estado del usuario.' };
  }
}
