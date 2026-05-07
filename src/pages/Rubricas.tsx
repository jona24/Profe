import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Edit, Trash2, ClipboardList, Copy } from 'lucide-react';

export default function Rubricas() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    version: '',
    definitionJson: JSON.stringify({
      criteria: [],
      levels: ['Excelente', 'Bueno', 'Regular', 'Deficiente'],
      mode: 'levels', // 'levels' o 'points'
    }, null, 2),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, coursesData] = await Promise.all([
        ipc.rubrics.templates.getAll(),
        ipc.courses.getAll(),
      ]);
      setTemplates(templatesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.template.name || '',
        courseId: template.template.courseId?.toString() || '',
        version: template.template.version || '',
        definitionJson: template.template.definitionJson || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        courseId: '',
        version: 'v1',
        definitionJson: JSON.stringify({
          criteria: [],
          levels: ['Excelente', 'Bueno', 'Regular', 'Deficiente'],
          mode: 'levels',
        }, null, 2),
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        courseId: formData.courseId ? parseInt(formData.courseId) : undefined,
        definitionJson: formData.definitionJson,
      };
      if (editingTemplate) {
        await ipc.rubrics.templates.update(editingTemplate.template.id, data);
      } else {
        await ipc.rubrics.templates.create(data);
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error guardando rúbrica:', error);
      alert('Error al guardar la rúbrica');
    }
  };

  const handleClone = async (id: number) => {
    const newVersion = prompt('Ingrese la nueva versión (ej: v2, 2026-v1):');
    if (!newVersion) return;
    try {
      await ipc.rubrics.templates.clone(id, newVersion);
      loadData();
    } catch (error) {
      console.error('Error clonando rúbrica:', error);
      alert('Error al clonar la rúbrica');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta rúbrica?')) return;
    try {
      await ipc.rubrics.templates.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando rúbrica:', error);
      alert('Error al eliminar la rúbrica');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rúbricas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona plantillas de rúbricas reutilizables
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Rúbrica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Rúbrica' : 'Nueva Rúbrica'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Versión *</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="v1, 2025-v1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseId">Curso Sugerido</Label>
                <select
                  id="courseId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                >
                  <option value="">Ninguno</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="definitionJson">Definición JSON *</Label>
                <textarea
                  id="definitionJson"
                  className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={formData.definitionJson}
                  onChange={(e) => setFormData({ ...formData, definitionJson: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: {"{"} "criteria": [], "levels": [], "mode": "levels" {"}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.version}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((item) => (
          <Card key={item.template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <CardTitle className="text-lg">{item.template.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClone(item.template.id)}
                    title="Clonar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Versión: {item.template.version}
              </p>
              {item.course && (
                <p className="text-sm text-muted-foreground">
                  Curso: {item.course.name}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay rúbricas registradas. Crea una para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



