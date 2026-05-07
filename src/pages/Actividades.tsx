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
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Actividades() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupCourses, setGroupCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'tarea',
    date: new Date().toISOString().split('T')[0],
    weight: '',
    maxScore: '100',
    period: '',
    description: '',
  });

  useEffect(() => {
    // Verificar si hay un groupId en la URL
    const groupIdParam = searchParams.get('groupId');
    if (groupIdParam) {
      setSelectedGroup(parseInt(groupIdParam));
    }
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupCourses();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedCourse) {
      loadAssessments();
    }
  }, [selectedCourse]);

  const loadGroups = async () => {
    try {
      const data = await ipc.groups.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Error cargando grupos:', error);
    }
  };

  const loadGroupCourses = async () => {
    if (!selectedGroup) return;
    try {
      const data = await ipc.groupCourses.getByGroup(selectedGroup);
      setGroupCourses(data);
    } catch (error) {
      console.error('Error cargando cursos del grupo:', error);
    }
  };

  const loadAssessments = async () => {
    if (!selectedCourse) return;
    try {
      const data = await ipc.assessments.getByGroupCourse(selectedCourse);
      setAssessments(data);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  };

  const handleOpenDialog = (assessment?: any) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setFormData({
        title: assessment.title || '',
        type: assessment.type || 'tarea',
        date: assessment.date ? new Date(assessment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        weight: assessment.weight?.toString() || '',
        maxScore: assessment.maxScore?.toString() || '100',
        period: assessment.period || '',
        description: assessment.description || '',
      });
    } else {
      setEditingAssessment(null);
      setFormData({
        title: '',
        type: 'tarea',
        date: new Date().toISOString().split('T')[0],
        weight: '',
        maxScore: '100',
        period: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCourse) {
      alert('Por favor seleccione un curso');
      return;
    }
    try {
      const data = {
        groupCourseId: selectedCourse,
        title: formData.title,
        type: formData.type,
        date: new Date(formData.date),
        weight: parseFloat(formData.weight),
        maxScore: parseFloat(formData.maxScore),
        gradingMode: 'direct' as const,
        period: formData.period || undefined,
        description: formData.description || undefined,
      };
      if (editingAssessment) {
        await ipc.assessments.update(editingAssessment.id, data);
      } else {
        await ipc.assessments.create(data);
      }
      setDialogOpen(false);
      loadAssessments();
    } catch (error) {
      console.error('Error guardando actividad:', error);
      alert('Error al guardar la actividad');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta actividad?')) return;
    try {
      await ipc.assessments.delete(id);
      loadAssessments();
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      alert('Error al eliminar la actividad');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Actividades Evaluativas</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las actividades de evaluación por grupo y curso
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleccione un Grupo</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedGroup || ''}
                onChange={(e) => {
                  setSelectedGroup(e.target.value ? parseInt(e.target.value) : null);
                  setSelectedCourse(null);
                  setAssessments([]);
                }}
              >
                <option value="">Seleccione un grupo</option>
                {groups.map((item) => (
                  <option key={item.group.id} value={item.group.id}>
                    {item.group.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedGroup && (
              <div className="space-y-2">
                <Label>Seleccione un Curso</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCourse || ''}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value ? parseInt(e.target.value) : null);
                  }}
                >
                  <option value="">Seleccione un curso</option>
                  {groupCourses.map((item) => (
                    <option key={item.groupCourse.id} value={item.groupCourse.id}>
                      {item.course.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCourse && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Actividades</h3>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Actividad
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAssessment ? 'Editar Actividad' : 'Nueva Actividad'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Título *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nombre de la actividad"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">Tipo *</Label>
                            <select
                              id="type"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={formData.type}
                              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                              <option value="tarea">Tarea</option>
                              <option value="examen">Examen</option>
                              <option value="proyecto">Proyecto</option>
                              <option value="practica">Práctica</option>
                              <option value="laboratorio">Laboratorio</option>
                              <option value="otro">Otro</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date">Fecha *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={formData.date}
                              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="weight">Peso (%) *</Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.1"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="Ej: 20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxScore">Puntaje Máximo *</Label>
                            <Input
                              id="maxScore"
                              type="number"
                              step="0.1"
                              value={formData.maxScore}
                              onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                              placeholder="Ej: 100"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="period">Periodo</Label>
                          <Input
                            id="period"
                            value={formData.period}
                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                            placeholder="Ej: Trimestre 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Descripción</Label>
                          <textarea
                            id="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descripción de la actividad"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!formData.title || !formData.weight || !formData.maxScore}>
                          Guardar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {assessments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No hay actividades registradas. Crea una para comenzar.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    assessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{assessment.title}</CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(assessment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(assessment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tipo: </span>
                              <span className="capitalize">{assessment.type}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Peso: </span>
                              <span>{assessment.weight}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Máx: </span>
                              <span>{assessment.maxScore}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fecha: </span>
                              <span>{formatDate(assessment.date)}</span>
                            </div>
                          </div>
                          {assessment.period && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Periodo: {assessment.period}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
