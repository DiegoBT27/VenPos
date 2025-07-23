
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

const formSchema = z.object({
  nombreCompleto: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreCompleto: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Verificar si ya existen usuarios
      const usersCollection = collection(db, 'usuarios');
      const existingUsersSnapshot = await getDocs(usersCollection);
      
      if (!existingUsersSnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Registro no permitido',
          description: 'Ya existe un administrador. Los nuevos usuarios solo pueden ser creados desde el panel de administración.',
        });
        setLoading(false);
        return;
      }

      // Si no hay usuarios, proceder a crear el primer admin
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.nombreCompleto });

      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, {
        nombreCompleto: values.nombreCompleto,
        email: values.email,
        rol: 'admin', // El primer usuario es el admin
        activo: true,
        fechaRegistro: serverTimestamp(),
      });

      toast({
        title: '¡Cuenta de Administrador Creada!',
        description: 'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
      });
      router.push('/login');

    } catch (error: any) {
      let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este correo electrónico ya está registrado.';
      }
      toast({
        variant: 'destructive',
        title: 'Error al registrar',
        description: description,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Registro de Administrador</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                    <Input placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2" />Registrarme</>}
            </Button>
            <div className="text-xs">
              <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
