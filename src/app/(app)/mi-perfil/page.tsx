"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function MiPerfilPage() {
  const { firestoreUser } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Mi Perfil</h1>
          <p className="text-sm text-muted-foreground">Información de tu cuenta de usuario.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Usuario</CardTitle>
          <CardDescription>Estos son los datos asociados a tu sesión.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {firestoreUser ? (
            <>
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Nombre Completo</p>
                  <p className="text-muted-foreground">{firestoreUser.nombreCompleto}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Correo Electrónico</p>
                  <p className="text-muted-foreground">{firestoreUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Rol</p>
                  <p className="text-muted-foreground capitalize">{firestoreUser.rol}</p>
                </div>
              </div>
               <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Fecha de Registro</p>
                  <p className="text-muted-foreground">
                    {firestoreUser.fechaRegistro ? new Date(firestoreUser.fechaRegistro.seconds * 1000).toLocaleDateString() : 'No disponible'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
