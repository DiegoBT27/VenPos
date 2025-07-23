
"use client";

import { Flame } from 'lucide-react';
import { SignupForm } from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-primary p-3 text-primary-foreground">
          <Flame className="h-8 w-8" />
        </div>
        <h1 className="font-headline text-2xl font-bold text-foreground">Crear Cuenta de Administrador</h1>
        <p className="text-sm text-muted-foreground">El primer usuario registrado será el administrador del sistema.</p>
      </div>
      <SignupForm />
    </>
  );
}
