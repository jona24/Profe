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
import { Calendar, Plus, Save, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Asistencia() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupCourses, setGroupCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupCourses();
      loadStudents();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedCourse) {
      loadSessions();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSession) {
      loadAttendance();
    }
  }, [selectedSession]);

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
      console.error('Error cargando cursos:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedGroup) return;
    try {
      const data = await ipc.students.getAll(selectedGroup);
      setStudents(data);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    }
  };

  const loadSessions = async () => {
    if (!selectedCourse) return;
    try {
      const data = await ipc.attendance.sessions.getByGroupCourse(selectedCourse);
      setSessions(data);
    } catch (error) {
      console.error('Error cargando sesiones:', error);
    }
  };

  const loadAttendance = async () => {
    if (!selectedSession) return;
    try {
      const records = await ipc.attendance.records.getBySession(selectedSession);
      const attendanceData: Record<number, string> = {};
      for (const record of records) {
        attendanceData[record.record.studentId] = record.record.status;
      }
      // Inicializar todos los estudiantes
      for (const student of students) {
        if (!attendanceData[student.id]) {
          attendanceData[student.id] = 'present';
        }
      }
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error cargando asistencia:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedCourse) return;
    try {
      await ipc.attendance.sessions.create({
        groupCourseId: selectedCourse,
        date: new Date(sessionDate),
        notes: '',
      });
      setDialogOpen(false);
      loadSessions();
    } catch (error) {
      console.error('Error creando sesión:', error);
      alert('Error al crear la sesión');
    }
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const records = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id] || 'present',
      }));
      await ipc.attendance.records.bulkUpdate(selectedSession, records);
      alert('Asistencia guardada exitosamente');
    } catch (error) {
      console.error('Error guardando asistencia:', error);
      alert('Error al guardar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta sesión?')) return;
    try {
      await ipc.attendance.sessions.delete(id);
      loadSessions();
      if (selectedSession === id) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      alert('Error al eliminar la sesión');
    }
  };

  const getAttendanceStats = () => {
    if (!selectedSession || students.length === 0) return { present: 0, absent: 0, late: 0, justified: 0 };
    let present = 0, absent = 0, late = 0, justified = 0;
    for (const student of students) {
      const status = attendance[student.id] || 'present';
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'justified') justified++;
    }
    return { present, absent, late, justified };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Asistencia</h1>
        <p className="text-muted-foreground mt-2">
          Registra y gestiona la asistencia de los estudiantes
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grupo</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedGroup || ''}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value ? parseInt(e.target.value) : null);
                    setSelectedCourse(null);
                    setSelectedSession(null);
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
                  <Label>Curso</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedCourse || ''}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value ? parseInt(e.target.value) : null);
                      setSelectedSession(null);
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
            </div>

            {selectedCourse && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Sesiones de Clase</Label>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Sesión
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva Sesión de Asistencia</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="sessionDate">Fecha *</Label>
                          <Input
                            id="sessionDate"
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateSession}>
                          Crear Sesión
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {sessions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Seleccione una Sesión</Label>
                    <div className="grid gap-2">
                      {sessions.map((session) => (
                        <Card key={session.id} className={selectedSession === session.id ? 'border-primary' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={selectedSession === session.id}
                                  onChange={() => setSelectedSession(session.id)}
                                  className="h-4 w-4"
                                />
                                <span>{formatDate(session.date)}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSession && students.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Registro de Asistencia</h3>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-green-600">Presente: {stats.present}</span>
                          <span className="text-red-600">Ausente: {stats.absent}</span>
                          <span className="text-yellow-600">Tardía: {stats.late}</span>
                          <span className="text-blue-600">Justificada: {stats.justified}</span>
                        </div>
                      </div>
                      <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Guardando...' : 'Guardar Asistencia'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {students.map((student) => (
                        <Card key={student.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{student.fullName}</span>
                              <select
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={attendance[student.id] || 'present'}
                                onChange={(e) => setAttendance({
                                  ...attendance,
                                  [student.id]: e.target.value
                                })}
                              >
                                <option value="present">Presente</option>
                                <option value="absent">Ausente</option>
                                <option value="late">Tardía</option>
                                <option value="justified">Justificada</option>
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse && sessions.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay sesiones registradas. Crea una sesión para comenzar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
