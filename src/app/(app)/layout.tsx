
"use client";

import { useAuth } from "@/hooks/useAuth";
import { redirect, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, firestoreUser, loading, handleLogout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Si la carga ha finalizado y no hay usuario, redirige a login.
    if (!loading && !user) {
      redirect('/login');
    }
  }, [loading, user]);

  if (loading || !firestoreUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Si después de cargar no hay usuario o datos de Firestore, no renderiza nada.
  // El useEffect de arriba se encargará de la redirección.
  if (!user) {
    return null; 
  }

  if (!firestoreUser.activo) {
    handleLogout(); // Usamos handleLogout para asegurar la limpieza del estado
    redirect('/login?error=inactive');
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar firestoreUser={firestoreUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col transition-all duration-300 ease-in-out md:pl-64">
        <DashboardHeader firestoreUser={firestoreUser} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
