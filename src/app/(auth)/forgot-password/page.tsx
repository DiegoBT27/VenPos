import { Flame } from 'lucide-react';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-primary p-3 text-primary-foreground">
          <Flame className="h-8 w-8" />
        </div>
        <h1 className="font-headline text-2xl font-bold text-foreground">Recuperar Contraseña</h1>
        <p className="text-sm text-muted-foreground">Ingresa tu correo para recibir un enlace de recuperación.</p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
