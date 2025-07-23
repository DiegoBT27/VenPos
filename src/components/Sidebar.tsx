
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LayoutDashboard, ShoppingCart, BarChart3, Package, Users, Settings, X, User, PlusCircle, Archive, History } from "lucide-react";
import type { FirestoreUser, UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SidebarProps {
  firestoreUser: FirestoreUser;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navLinks: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/nueva-venta", label: "Nueva Venta", icon: PlusCircle },
    { href: "/admin/cajas", label: "Cierre de Caja", icon: Archive },
    { href: "/admin/turnos/historial", label: "Historial de Cierres", icon: History },
    { href: "/admin/ventas/historial", label: "Historial Ventas", icon: ShoppingCart },
    { href: "/admin/productos", label: "Productos", icon: Package },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
  ],
  cajero: [
    { href: "/cajero", label: "Dashboard", icon: LayoutDashboard },
    { href: "/nueva-venta", label: "Nueva Venta", icon: PlusCircle },
    { href: "/cajero/reporte", label: "Mi Reporte", icon: BarChart3 },
  ],
  supervisor: [
    { href: "/supervisor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/supervisor/cajas", label: "Cierre de Caja", icon: Archive },
    { href: "/admin/turnos/historial", label: "Historial de Cierres", icon: History },
    { href: "/admin/ventas/historial", label: "Historial Ventas", icon: ShoppingCart },
    { href: "/supervisor/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/supervisor/inventario", label: "Inventario", icon: Package },
  ],
};

export default function Sidebar({ firestoreUser, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const userLinks = navLinks[firestoreUser.rol] || [];

  const handleLinkClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href={`/${firestoreUser.rol}`} className="flex items-center gap-3" onClick={handleLinkClick}>
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold text-foreground">VenPOS</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {userLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                (pathname === link.href || (pathname.startsWith(link.href) && link.href !== `/${firestoreUser.rol}` && !['/admin/turnos/historial', '/admin/ventas/historial'].includes(link.href) ) || (pathname.startsWith(link.href) && (link.href === '/admin/turnos/historial' || link.href === '/admin/ventas/historial') ) )
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t p-4">
           <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground">{firestoreUser.nombreCompleto}</p>
                <p className="text-xs capitalize text-muted-foreground">{firestoreUser.rol}</p>
            </div>
           </div>
        </div>
      </aside>
    </>
  );
}
