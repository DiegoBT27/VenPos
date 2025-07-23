
'use server';

import { collection, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as z from 'zod';
import type { Turno } from '@/types/turno';

const IniciarTurnoSchema = z.object({
  fondo_bs: z.coerce.number().min(0, "El fondo no puede ser negativo."),
  fondo_usd: z.coerce.number().min(0, "El fondo no puede ser negativo."),
  userId: z.string().min(1, "Se requiere el ID de usuario.")
});

export async function iniciarTurnoAction(data: z.infer<typeof IniciarTurnoSchema>) {
  try {
    const validatedData = IniciarTurnoSchema.parse(data);

    const nuevoTurno: Omit<Turno, 'id'> = {
      usuario_uid: validatedData.userId,
      fecha_apertura: serverTimestamp() as any, // Firestore se encargará de poner el timestamp
      fondo_bs: validatedData.fondo_bs,
      fondo_usd: validatedData.fondo_usd,
      estado: 'abierto',
    };

    const docRef = await addDoc(collection(db, 'turnos'), nuevoTurno);
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error al iniciar turno:", error);
    const errorMessage = error instanceof z.ZodError ? 'Datos inválidos.' : error.message || 'No se pudo iniciar el turno.';
    return { success: false, error: errorMessage };
  }
}


const CerrarTurnoSchema = z.object({
    turnoId: z.string().min(1),
    totalVentasBs: z.coerce.number(),
    totalEfectivoBs: z.coerce.number().default(0),
    totalEfectivoUsd: z.coerce.number().default(0),
    totalTransferenciaBs: z.coerce.number().default(0),
    totalPagoMovilBs: z.coerce.number().default(0),
    totalZelleUsd: z.coerce.number().default(0),
    efectivoContadoBs: z.coerce.number().min(0),
    efectivoContadoUsd: z.coerce.number().min(0),
    descuadreBs: z.coerce.number(),
    descuadreUsd: z.coerce.number(),
    supervisorUid: z.string().min(1, "Se requiere el ID del supervisor."),
    supervisorNombre: z.string().min(1, "Se requiere el nombre del supervisor."),
});


export async function cerrarTurnoAction(data: z.infer<typeof CerrarTurnoSchema>) {
    try {
        const validatedData = CerrarTurnoSchema.parse(data);
        const turnoRef = doc(db, 'turnos', validatedData.turnoId);

        await updateDoc(turnoRef, {
            estado: 'cerrado',
            fecha_cierre: serverTimestamp(),
            total_ventas_bs: validatedData.totalVentasBs,
            total_efectivo_bs: validatedData.totalEfectivoBs,
            total_efectivo_usd: validatedData.totalEfectivoUsd,
            total_transferencia_bs: validatedData.totalTransferenciaBs,
            total_pago_movil_bs: validatedData.totalPagoMovilBs,
            total_zelle_usd: validatedData.totalZelleUsd,
            efectivo_contado_bs: validatedData.efectivoContadoBs,
            efectivo_contado_usd: validatedData.efectivoContadoUsd,
            descuadre_bs: validatedData.descuadreBs,
            descuadre_usd: validatedData.descuadreUsd,
            supervisor_uid: validatedData.supervisorUid,
            supervisor_nombre: validatedData.supervisorNombre,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error al cerrar turno:", error);
        return { success: false, error: error.message || 'No se pudo cerrar el turno.' };
    }
}
