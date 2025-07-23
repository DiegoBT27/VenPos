
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreUser } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UsuarioForm } from '@/components/UsuarioForm';
import { useToast } from '@/hooks/use-toast';
import { updateUserStatus } from '@/actions/userActions';
import { PlusCircle, Search, MoreHorizontal, Edit, UserCheck, UserX, Users } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<FirestoreUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const usuariosRef = collection(db, 'usuarios');
    const q = firestoreQuery(usuariosRef, orderBy('nombreCompleto'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usuariosData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as FirestoreUser[];
      setUsuarios(usuariosData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener usuarios:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los usuarios.' });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const usuariosFiltrados = useMemo(() =>
    usuarios.filter(u =>
      (u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())) &&
      (filtroRol === 'todos' || u.rol === filtroRol)
    ), [usuarios, busqueda, filtroRol]);

  const handleOpenForm = (usuario: FirestoreUser | null = null) => {
    setUsuarioSeleccionado(usuario);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setUsuarioSeleccionado(null);
    setIsFormOpen(false);
  };

  const handleStatusChange = async (usuario: FirestoreUser, newStatus: boolean) => {
    // Optimistic UI update
    setUsuarios(prev => prev.map(u => u.uid === usuario.uid ? { ...u, activo: newStatus } : u));
    
    const result = await updateUserStatus(usuario.uid, newStatus);
    
    if (result.success) {
      toast({
        title: 'Estado actualizado',
        description: `El usuario ${usuario.nombreCompleto} ha sido ${newStatus ? 'activado' : 'desactivado'}.`,
      });
    } else {
      // Revert optimistic update on failure
      setUsuarios(prev => prev.map(u => u.uid === usuario.uid ? { ...u, activo: !newStatus } : u));
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: result.error || 'No se pudo cambiar el estado del usuario.',
      });
    }
  };

  const getBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'secondary';
      default: return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 self-start">
            <Users className="h-8 w-8 text-primary" />
            <div>
                <h1 className="font-headline text-2xl font-bold">Gestión de Usuarios</h1>
                <p className="text-sm text-muted-foreground">Administra los accesos y roles del personal.</p>
            </div>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Personal</CardTitle>
          <CardDescription>Consulta y administra los usuarios del sistema.</CardDescription>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative sm:col-span-1 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por nombre o correo..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>
            <Select value={filtroRol} onValueChange={setFiltroRol}>
                <SelectTrigger>
                    <SelectValue placeholder="Filtrar por rol..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="supervisor">Supervisores</SelectItem>
                    <SelectItem value="cajero">Cajeros</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Rol</TableHead>
                  <TableHead className="text-center">Estado (Activo)</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map(usuario => (
                    <TableRow key={usuario.uid}>
                      <TableCell className="font-medium">{usuario.nombreCompleto}</TableCell>
                      <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getBadgeVariant(usuario.rol)} className="capitalize">{usuario.rol}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={usuario.activo}
                          onCheckedChange={(newStatus) => handleStatusChange(usuario, newStatus)}
                          aria-label={`Activar o desactivar a ${usuario.nombreCompleto}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenForm(usuario)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {usuario.activo ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(usuario, false)} className="text-destructive">
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desactivar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(usuario, true)}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activar
                                </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <UsuarioForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        usuario={usuarioSeleccionado}
      />
    </div>
  );
}
