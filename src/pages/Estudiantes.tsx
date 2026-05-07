import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Plus, Edit, Trash2, User, Upload } from 'lucide-react';

export default function Estudiantes() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    identifier: '',
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    // Verificar si hay un grupoId en la URL
    const groupIdParam = searchParams.get('groupId');
    if (groupIdParam) {
      setSelectedGroup(parseInt(groupIdParam));
    }
    loadGroups();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedGroup]);

  const loadData = async () => {
    try {
      const [studentsData, groupsData] = await Promise.all([
        ipc.students.getAll(selectedGroup || undefined),
        ipc.groups.getAll(),
      ]);
      setStudents(studentsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (student?: any) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        identifier: student.identifier || '',
        fullName: student.fullName || '',
        email: student.email || '',
        phone: student.phone || '',
        notes: student.notes || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        identifier: '',
        fullName: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingStudent) {
        await ipc.students.update(editingStudent.id, formData);
      } else {
        await ipc.students.create(formData);
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error guardando estudiante:', error);
      alert('Error al guardar el estudiante');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este estudiante?')) return;
    try {
      await ipc.students.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      alert('Error al eliminar el estudiante');
    }
  };

  const handleImportCSV = async () => {
    if (!selectedGroup) {
      alert('Por favor seleccione un grupo primero');
      return;
    }

    try {
      let csvData: string | null = null;

      // Electron: selector nativo + lectura por IPC
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await ipc.files.selectFile({
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (result.canceled || !result.filePaths.length) return;

        const filePath = result.filePaths[0];
        const fileResult = await ipc.files.readFile(filePath);
        if (!fileResult.success) throw new Error(fileResult.error);
        csvData = fileResult.data;
      } else {
        // Web: input file + FileReader
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv';
        csvData = await new Promise<string | null>((resolve, reject) => {
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('No se pudo leer el CSV'));
            reader.readAsText(file);
          };
          input.click();
        });
        if (!csvData) return;
      }

      const importResult = await ipc.students.importFromCSV(csvData, selectedGroup);
      
      if (importResult.errors && importResult.errors.length > 0) {
        alert(`Importación completada con algunos errores:\n${importResult.errors.join('\n')}`);
      } else {
        alert(`Se importaron ${importResult.results.length} estudiantes exitosamente`);
      }
      loadData();
    } catch (error) {
      console.error('Error importando CSV:', error);
      alert('Error al importar el archivo CSV.');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estudiantes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los estudiantes de tus grupos
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedGroup || ''}
            onChange={(e) => setSelectedGroup(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Todos los grupos</option>
            {groups.map((item) => (
              <option key={item.group.id} value={item.group.id}>
                {item.group.name}
              </option>
            ))}
          </select>
          {selectedGroup && (
            <Button variant="outline" onClick={handleImportCSV}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Identificación *</Label>
                  <Input
                    id="identifier"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    placeholder="Cédula o ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nombre completo del estudiante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observaciones</Label>
                  <textarea
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!formData.identifier || !formData.fullName}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle className="text-lg">{student.fullName}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(student)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(student.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ID: {student.identifier}
              </p>
              {student.email && (
                <p className="text-sm text-muted-foreground">
                  {student.email}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay estudiantes registrados. Crea uno para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

