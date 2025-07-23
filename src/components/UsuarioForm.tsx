
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { FirestoreUser, UserRole } from '@/types/user';
import { ALL_ROLES } from '@/types/user';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth as mainAuth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, getAuth, signInWithCredential, EmailAuthProvider } from 'firebase/auth';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save, UserPlus } from 'lucide-react';
import { updateUser as updateUserAction, updateUserStatus } from '@/actions/userActions';


const createSchema = z.object({
  nombreCompleto: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Correo electrónico no válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  rol: z.enum(ALL_ROLES, { required_error: 'Debe seleccionar un rol.' }),
});

const editSchema = z.object({
  nombreCompleto: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  rol: z.enum(ALL_ROLES, { required_error: 'Debe seleccionar un rol.' }),
});


interface UsuarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: FirestoreUser | null;
}

export function UsuarioForm({ isOpen, onClose, usuario }: UsuarioFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditing = !!usuario;

  const form = useForm({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: {
      nombreCompleto: '',
      email: '',
      password: '',
      rol: 'cajero' as UserRole,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        form.reset({
          nombreCompleto: usuario.nombreCompleto,
          email: usuario.email,
          rol: usuario.rol,
          password: '',
        });
      } else {
        form.reset({
          nombreCompleto: '',
          email: '',
          password: '',
          rol: 'cajero',
        });
      }
    }
  }, [usuario, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof createSchema | typeof editSchema>) => {
    setLoading(true);
    if (isEditing && usuario) {
      // Lógica de Edición
      const result = await updateUserAction(usuario.uid, values as z.infer<typeof editSchema>);
      if (result.success) {
        toast({ title: 'Usuario actualizado', description: `Los datos de ${values.nombreCompleto} han sido modificados.` });
        onClose();
      } else {
        toast({ variant: 'destructive', title: 'Error al actualizar', description: result.error });
      }
    } else {
      // Lógica de Creación
      const createValues = values as z.infer<typeof createSchema>;

      // Se crea una instancia de app secundaria para crear usuarios sin desloguear al admin.
      const apps = getApps();
      const secondaryAppName = 'secondary-auth-app';
      let secondaryApp = apps.find(app => app.name === secondaryAppName);
      if (secondaryApp) {
          deleteApp(secondaryApp);
      }

      secondaryApp = initializeApp(mainAuth.app.options, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, createValues.email, createValues.password);
        const newUser = userCredential.user;

        const userDocRef = doc(db, 'usuarios', newUser.uid);
        await setDoc(userDocRef, {
          nombreCompleto: createValues.nombreCompleto,
          email: createValues.email,
          rol: createValues.rol,
          activo: true,
          fechaRegistro: serverTimestamp(),
        });

        toast({ title: 'Usuario creado', description: `${createValues.nombreCompleto} ha sido añadido al sistema.` });
        onClose();

      } catch (error: any) {
        let description = 'No se pudo crear el usuario. Inténtelo de nuevo.';
        if (error.code === 'auth/email-already-in-use') {
          description = 'El correo electrónico ya está en uso por otra cuenta.';
        }
        toast({
          variant: 'destructive',
          title: 'Error de creación',
          description,
        });
      } finally {
        await deleteApp(secondaryApp);
      }
    }
    setLoading(false);
  };
  
  const handleClose = () => {
    if (loading) return;
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los detalles del usuario.' : 'Completa el formulario para registrar un nuevo usuario en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ejemplo@correo.com" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en el sistema</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_ROLES.map(role => (
                        <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : isEditing ? (
                  <><Save className="mr-2" /> Guardar Cambios</>
                ) : (
                  <><UserPlus className="mr-2" /> Crear Usuario</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
