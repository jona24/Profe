import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ipc } from '@/lib/ipc';
import { GraduationCap, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Calificaciones() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupCourses, setGroupCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, Record<number, number>>>({});
  const [saving, setSaving] = useState(false);

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
      loadAssessments();
      loadGrades();
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

  const loadAssessments = async () => {
    if (!selectedCourse) return;
    try {
      const data = await ipc.assessments.getByGroupCourse(selectedCourse);
      setAssessments(data);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  };

  const loadGrades = async () => {
    if (!selectedCourse || assessments.length === 0) return;
    try {
      const gradesData: Record<string, Record<number, number>> = {};
      for (const assessment of assessments) {
        const assessmentGrades = await ipc.grades.getByAssessment(assessment.id);
        gradesData[assessment.id] = {};
        for (const grade of assessmentGrades) {
          gradesData[assessment.id][grade.student.id] = grade.grade.score || 0;
        }
      }
      setGrades(gradesData);
    } catch (error) {
      console.error('Error cargando calificaciones:', error);
    }
  };

  const handleGradeChange = (assessmentId: number, studentId: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setGrades(prev => ({
      ...prev,
      [assessmentId]: {
        ...prev[assessmentId],
        [studentId]: numValue,
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedCourse || assessments.length === 0 || students.length === 0) {
      alert('Por favor seleccione un grupo y curso con actividades');
      return;
    }
    setSaving(true);
    try {
      for (const assessment of assessments) {
        const assessmentGrades = students.map(student => {
          const score = grades[assessment.id]?.[student.id];
          return {
            studentId: student.id,
            score: score && score > 0 ? score : null,
            status: 'present' as const,
          };
        });
        await ipc.grades.bulkUpdate(assessment.id, assessmentGrades);
      }
      alert('Calificaciones guardadas exitosamente');
      // Recargar para verificar
      loadGrades();
    } catch (error) {
      console.error('Error guardando calificaciones:', error);
      alert('Error al guardar las calificaciones');
    } finally {
      setSaving(false);
    }
  };

  const calculateAverage = (studentId: number): number => {
    if (assessments.length === 0) return 0;
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const assessment of assessments) {
      const score = grades[assessment.id]?.[studentId] || 0;
      if (score > 0) {
        const percentage = (score / assessment.maxScore) * 100;
        weightedSum += percentage * assessment.weight;
        totalWeight += assessment.weight;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las calificaciones de los estudiantes
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

            {selectedCourse && assessments.length > 0 && students.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Calificaciones</h3>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold sticky left-0 bg-background z-10">Estudiante</th>
                        {assessments.map((assessment) => (
                          <th key={assessment.id} className="text-center p-2 font-semibold min-w-[120px]">
                            <div className="text-xs">{assessment.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {assessment.weight}% | Max: {assessment.maxScore}
                            </div>
                          </th>
                        ))}
                        <th className="text-center p-2 font-semibold bg-muted">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b">
                          <td className="p-2 sticky left-0 bg-background z-10 font-medium">
                            {student.fullName}
                          </td>
                          {assessments.map((assessment) => (
                            <td key={assessment.id} className="p-2">
                              <Input
                                type="number"
                                step="0.1"
                                className="w-full text-center"
                                value={grades[assessment.id]?.[student.id] || ''}
                                onChange={(e) => handleGradeChange(assessment.id, student.id, e.target.value)}
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center font-semibold bg-muted">
                            {calculateAverage(student.id).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedCourse && assessments.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay actividades evaluativas para este curso. Crea actividades primero.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
