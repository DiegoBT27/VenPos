
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'cajero' | 'supervisor';

export const ALL_ROLES: UserRole[] = ['admin', 'cajero', 'supervisor'];

export interface FirestoreUser {
  uid: string;
  nombreCompleto: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  fechaRegistro: Timestamp;
}
