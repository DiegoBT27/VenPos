
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query as firestoreQuery, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Turno } from '@/types/turno';
import type { FirestoreUser } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from "lucide-react";
import { Button } from '@/components/ui/button';
import { CierreDetalleModal } from '@/components/CierreDetalleModal';

export default function HistorialTurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [usuarios, setUsuarios] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usuariosRef = collection(db, 'usuarios');
        const usuariosSnapshot = await getDocs(usuariosRef);
        const usuariosMap = new Map<string, string>();
        usuariosSnapshot.forEach(doc => {
          const userData = doc.data() as FirestoreUser;
          usuariosMap.set(doc.id, userData.nombreCompleto);
        });
        setUsuarios(usuariosMap);

        const turnosRef = collection(db, 'turnos');
        const q = firestoreQuery(turnosRef, where('estado', '==', 'cerrado'));
        const querySnapshot = await getDocs(q);
        const turnosData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fecha_apertura: data.fecha_apertura?.toDate(),
                fecha_cierre: data.fecha_cierre?.toDate(),
            } as Turno;
        });

        turnosData.sort((a, b) => {
            const dateA = a.fecha_cierre ? new Date(a.fecha_cierre).getTime() : 0;
            const dateB = b.fecha_cierre ? new Date(b.fecha_cierre).getTime() : 0;
            return dateB - dateA;
        });

        setTurnos(turnosData);
      } catch (error) {
        console.error("Error al obtener el historial de turnos: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-headline text-2xl font-bold">Historial de Cierres de Caja</h1>
            <p className="text-sm text-muted-foreground">Consulta todos los arqueos de caja realizados.</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Cierres Registrados</CardTitle>
            <CardDescription>Audita los turnos cerrados por los supervisores.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Cierre</TableHead>
                    <TableHead>Cajero</TableHead>
                    <TableHead>Cerrado Por</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : turnos.length > 0 ? (
                    turnos.map(turno => (
                      <TableRow key={turno.id}>
                        <TableCell className="text-sm">{turno.fecha_cierre ? new Date(turno.fecha_cierre).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="font-medium">{usuarios.get(turno.usuario_uid) || 'Usuario desconocido'}</TableCell>
                        <TableCell className="font-medium">{turno.supervisor_nombre || 'No registrado'}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" onClick={() => setSelectedTurno(turno)}>
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No se encontraron cierres de caja.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CierreDetalleModal 
        isOpen={!!selectedTurno}
        onClose={() => setSelectedTurno(null)}
        turno={selectedTurno}
      />
    </>
  );
}
