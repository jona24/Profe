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
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AñosLectivos() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [formData, setFormData] = useState({
    label: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      const data = await ipc.academicYears.getAll();
      setAcademicYears(data);
    } catch (error) {
      console.error('Error cargando años lectivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (year?: any) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        label: year.label || '',
        startDate: year.startDate ? new Date(year.startDate).toISOString().split('T')[0] : '',
        endDate: year.endDate ? new Date(year.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingYear(null);
      const currentYear = new Date().getFullYear();
      setFormData({
        label: `${currentYear}`,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        label: formData.label,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };
      if (editingYear) {
        await ipc.academicYears.update(editingYear.id, data);
      } else {
        await ipc.academicYears.create(data);
      }
      setDialogOpen(false);
      loadAcademicYears();
    } catch (error) {
      console.error('Error guardando año lectivo:', error);
      alert('Error al guardar el año lectivo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este año lectivo?')) return;
    try {
      await ipc.academicYears.delete(id);
      loadAcademicYears();
    } catch (error) {
      console.error('Error eliminando año lectivo:', error);
      alert('Error al eliminar el año lectivo');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Años Lectivos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los años lectivos para organizar tus grupos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Año Lectivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingYear ? 'Editar Año Lectivo' : 'Nuevo Año Lectivo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Etiqueta *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ej: 2026, 2025-2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.label || !formData.startDate || !formData.endDate}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {academicYears.map((year) => (
          <Card key={year.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>{year.label}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(year)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(year.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatDate(year.startDate)} - {formatDate(year.endDate)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {academicYears.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay años lectivos registrados. Crea uno para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



