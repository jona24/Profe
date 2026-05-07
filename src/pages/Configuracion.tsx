import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ipc } from '@/lib/ipc';
import { Save } from 'lucide-react';

export default function Configuracion() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Esperar un poco para que electronAPI esté disponible
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const data = await ipc.config.get();
      setConfig(data);
    } catch (error: any) {
      console.error('Error cargando configuración:', error);
      // Configuración por defecto si falla
      setConfig({
        name: 'Profesor',
        periodType: 'trimestre',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await ipc.config.update(config);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Configura tus datos personales y preferencias del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Profesor</CardTitle>
          <CardDescription>
            Información personal que aparecerá en los reportes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={config?.name || ''}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={config?.email || ''}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodType">Tipo de Periodo</Label>
            <select
              id="periodType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config?.periodType || 'trimestre'}
              onChange={(e) => setConfig({ ...config, periodType: e.target.value })}
            >
              <option value="trimestre">Trimestre</option>
              <option value="semestre">Semestre</option>
              <option value="corte">Corte</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultHeader">Encabezado por Defecto para Reportes</Label>
            <textarea
              id="defaultHeader"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config?.defaultReportHeader || ''}
              onChange={(e) => setConfig({ ...config, defaultReportHeader: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultFooter">Pie de Página por Defecto para Reportes</Label>
            <textarea
              id="defaultFooter"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config?.defaultReportFooter || ''}
              onChange={(e) => setConfig({ ...config, defaultReportFooter: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

