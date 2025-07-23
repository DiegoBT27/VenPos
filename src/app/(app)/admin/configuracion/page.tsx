"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building, CircleDollarSign, SlidersHorizontal } from "lucide-react";
import { ConfiguracionForm } from "@/components/ConfiguracionForm";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">Configuración del Negocio</h1>
          <p className="text-sm text-muted-foreground">Ajustes generales, fiscales y de sistema.</p>
        </div>
      </div>
      
      <ConfiguracionForm />

    </div>
  );
}
