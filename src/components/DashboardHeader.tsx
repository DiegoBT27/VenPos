
"use client";

import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Flame, LogOut, User, PanelLeftOpen, Settings, ChevronDown, DollarSign, ShieldCheck, BarChart3, ShoppingCart } from "lucide-react";
import type { FirestoreUser, UserRole } from "@/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { useConfig } from "@/hooks/useConfig";
import { Skeleton } from "./ui/skeleton";

interface DashboardHeaderProps {
  firestoreUser: FirestoreUser | null;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashboardHeader({ firestoreUser, setSidebarOpen }: DashboardHeaderProps) {
  const router = useRouter();
  const { config, loading: configLoading } = useConfig();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const currentRole = firestoreUser?.rol || 'cajero';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card px-4 sm:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
          <PanelLeftOpen className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
        <div className="hidden items-center gap-3 md:flex">
          <h1 className="font-headline text-lg font-bold capitalize text-foreground">{currentRole}</h1>
        </div>
      </div>
      
      {/* Center Section */}
      <div className="flex flex-1 items-center justify-center">
        {configLoading ? (
            <Skeleton className="h-6 w-24" />
        ) : config ? (
            <div className="flex items-center gap-2 rounded-md border bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>Bs. {config.tasa_dolar.toFixed(2)}</span>
            </div>
        ) : null}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="hidden text-xs font-medium text-foreground sm:inline">{firestoreUser?.nombreCompleto}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/mi-perfil">
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </Link>
            </DropdownMenuItem>
            {firestoreUser?.rol === 'admin' && (
              <DropdownMenuItem asChild>
                 <Link href="/admin/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                 </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
