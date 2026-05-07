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
import { Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Grupos() {
  const [groups, setGroups] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [selectedGroupForCourse, setSelectedGroupForCourse] = useState<number | null>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    schoolId: '',
    name: '',
    level: '',
    section: '',
    schedule: '',
    academicYearId: '',
    period: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsData, schoolsData, yearsData, coursesData] = await Promise.all([
        ipc.groups.getAll(),
        ipc.schools.getAll(),
        ipc.academicYears.getAll(),
        ipc.courses.getAll(),
      ]);
      setGroups(groupsData);
      setSchools(schoolsData);
      setAcademicYears(yearsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (group?: any) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        schoolId: group.group.schoolId.toString(),
        name: group.group.name || '',
        level: group.group.level || '',
        section: group.group.section || '',
        schedule: group.group.schedule || '',
        academicYearId: group.group.academicYearId.toString(),
        period: group.group.period || '',
      });
    } else {
      setEditingGroup(null);
      setFormData({
        schoolId: '',
        name: '',
        level: '',
        section: '',
        schedule: '',
        academicYearId: '',
        period: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        schoolId: parseInt(formData.schoolId),
        academicYearId: parseInt(formData.academicYearId),
      };
      if (editingGroup) {
        await ipc.groups.update(editingGroup.group.id, data);
      } else {
        await ipc.groups.create(data);
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error guardando grupo:', error);
      alert('Error al guardar el grupo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este grupo?')) return;
    try {
      await ipc.groups.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      alert('Error al eliminar el grupo');
    }
  };

  const handleAssignCourse = async (groupId: number, courseId: number) => {
    try {
      await ipc.groupCourses.assign(groupId, courseId);
      alert('Curso asignado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error asignando curso:', error);
      alert('Error al asignar el curso');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grupos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los grupos de estudiantes por colegio y año lectivo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="schoolId">Colegio *</Label>
                <select
                  id="schoolId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                >
                  <option value="">Seleccione un colegio</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: 10-2 Nocturno"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <Input
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="Ej: 10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section">Sección</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="Ej: A, B, 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Jornada</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="Ej: Nocturno, Diurno"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYearId">Año Lectivo *</Label>
                  <select
                    id="academicYearId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                  >
                    <option value="">Seleccione un año</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.label}
                      </option>
                    ))}
                  </select>
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.schoolId || !formData.academicYearId}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((item) => (
          <Card key={item.group.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle className="text-lg">{item.group.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(item)}
                    title="Editar grupo"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.group.id)}
                    title="Eliminar grupo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.school?.name}
              </p>
              {item.academicYear && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.academicYear.label}
                </p>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.location.href = `/estudiantes?groupId=${item.group.id}`}
                >
                  Ver Estudiantes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setSelectedGroupForCourse(item.group.id);
                    setCourseDialogOpen(true);
                  }}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Asignar Curso
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay grupos registrados. Crea uno para comenzar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para asignar cursos */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Curso al Grupo</DialogTitle>
            <DialogDescription>
              Selecciona un curso para asignar a este grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {courses.map((course) => (
              <Button
                key={course.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (selectedGroupForCourse) {
                    handleAssignCourse(selectedGroupForCourse, course.id);
                    setCourseDialogOpen(false);
                  }
                }}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {course.name}
                {course.code && <span className="ml-2 text-muted-foreground">({course.code})</span>}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
