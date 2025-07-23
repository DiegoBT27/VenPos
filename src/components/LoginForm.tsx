
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import type { FirestoreUser } from '@/types/user';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    if (!auth || !db) {
      toast({
        variant: 'destructive',
        title: 'Error de configuración',
        description: 'La configuración de Firebase no está disponible. Contacta al administrador.',
      });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const firestoreUser = userDoc.data() as Omit<FirestoreUser, 'uid'>;
        if (!firestoreUser.activo) {
          await auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Inicio de sesión denegado',
            description: 'Tu cuenta está inactiva. Contacta al administrador.',
          });
        } else {
          toast({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente.',
          });
          router.push(`/${firestoreUser.rol}`);
        }
      } else {
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se encontraron datos de usuario. Contacta al administrador.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: 'Correo electrónico o contraseña incorrectos.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Iniciar Sesión</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2" />
                  Entrar
                </>
              )}
            </Button>
            <div className="flex w-full justify-between text-xs">
              <Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                Crear una cuenta
              </Link>
              <Link href="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
