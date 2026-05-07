import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ipc } from '@/lib/ipc';
import { Plus, Edit, Trash2, School } from 'lucide-react';

export default function Colegios() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    logoPath: '',
    reportHeader: '',
    reportFooter: '',
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const data = await ipc.schools.getAll();
      setSchools(data);
    } catch (error) {
      console.error('Error cargando colegios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (school?: any) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        name: school.name || '',
        address: school.address || '',
        logoPath: school.logoPath || '',
        reportHeader: school.reportHeader || '',
        reportFooter: school.reportFooter || '',
      });
    } else {
      setEditingSchool(null);
      setFormData({
        name: '',
        address: '',
        logoPath: '',
        reportHeader: '',
        reportFooter: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingSchool) {
        await ipc.schools.update(editingSchool.id, formData);
      } else {
        await ipc.schools.create(formData);
      }
      setDialogOpen(false);
      loadSchools();
    } catch (error) {
      console.error('Error guardando colegio:', error);
      alert('Error al guardar el colegio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este colegio?')) return;
    try {
      await ipc.schools.delete(id);
      loadSchools();
    } catch (error) {
      console.error('Error eliminando colegio:', error);
      alert('Error al eliminar el colegio');
    }
  };

  const handleSelectLogo = async () => {
    try {
      // Electron: selector nativo con path
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await ipc.files.selectFile({
          filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }],
        });
        if (!result.canceled && result.filePaths.length > 0) {
          setFormData({ ...formData, logoPath: result.filePaths[0] });
        }
        return;
      }

      // Web: leer imagen y guardar como Data URL en la BD
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
          reader.readAsDataURL(file);
        });
        setFormData({ ...formData, logoPath: dataUrl });
      };
      input.click();
    } catch (error) {
      console.error('Error seleccionando logo:', error);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Colegios</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las instituciones educativas donde impartes clases
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Colegio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? 'Editar Colegio' : 'Nuevo Colegio'}
              </DialogTitle>
              <DialogDescription>
                {editingSchool
                  ? 'Modifica la información del colegio'
                  : 'Agrega un nuevo colegio al sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del colegio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección del colegio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo"
                    value={formData.logoPath}
                    onChange={(e) => setFormData({ ...formData, logoPath: e.target.value })}
                    placeholder="Ruta del logo"
                    readOnly
                  />
                  <Button type="button" variant="outline" onClick={handleSelectLogo}>
                    Seleccionar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="header">Encabezado para Reportes</Label>
                <textarea
                  id="header"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.reportHeader}
                  onChange={(e) => setFormData({ ...formData, reportHeader: e.target.value })}
                  placeholder="Texto que aparecerá en el encabezado de los reportes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer">Pie de Página para Reportes</Label>
                <textarea
                  id="footer"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.reportFooter}
                  onChange={(e) => setFormData({ ...formData, reportFooter: e.target.value })}
                  placeholder="Texto que aparecerá en el pie de página de los reportes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  <CardTitle>{school.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(school)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(school.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {school.address && (
                <p className="text-sm text-muted-foreground mb-2">
                  {school.address}
                </p>
              )}
              {school.logoPath && (
                <p className="text-xs text-muted-foreground">
                  Logo: {school.logoPath.split(/[/\\]/).pop()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay colegios registrados. Crea uno para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



