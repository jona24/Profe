import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ipc } from '@/lib/ipc';
import { FileBarChart, Download, FileDown } from 'lucide-react';

export default function Reportes() {
  const isWeb = typeof window !== 'undefined' && !(window as any).electronAPI;
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadStudents();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const data = await ipc.groups.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Error cargando grupos:', error);
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

  const handleGenerateStudentReport = async () => {
    if (!selectedStudent || !selectedGroup) {
      alert('Por favor seleccione un estudiante y un grupo');
      return;
    }

    try {
      if (isWeb) {
        alert('Generación de PDF/respaldos está disponible en la versión de escritorio (Electron).');
        return;
      }
      const pdfBuffer = await ipc.reports.generateStudentReport(selectedStudent, selectedGroup);
      
      const result = await ipc.files.saveFile({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `reporte_estudiante_${selectedStudent}.pdf`,
      });

      if (!result.canceled && result.filePath) {
        const writeResult = await ipc.files.writeFile(result.filePath, pdfBuffer);
        if (writeResult.success) {
          alert('Reporte generado exitosamente');
        } else {
          alert('Error al guardar el archivo: ' + writeResult.error);
        }
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte');
    }
  };

  const handleGenerateGroupReport = async () => {
    if (!selectedGroup) {
      alert('Por favor seleccione un grupo');
      return;
    }

    try {
      if (isWeb) {
        alert('Generación de PDF/respaldos está disponible en la versión de escritorio (Electron).');
        return;
      }
      const pdfBuffer = await ipc.reports.generateGroupReport(selectedGroup);
      
      const result = await ipc.files.saveFile({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `reporte_grupo_${selectedGroup}.pdf`,
      });

      if (!result.canceled && result.filePath) {
        const writeResult = await ipc.files.writeFile(result.filePath, pdfBuffer);
        if (writeResult.success) {
          alert('Reporte generado exitosamente');
        } else {
          alert('Error al guardar el archivo: ' + writeResult.error);
        }
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte');
    }
  };

  const handleExportBackup = async () => {
    try {
      if (isWeb) {
        alert('Respaldos están disponibles en la versión de escritorio (Electron).');
        return;
      }
      const result = await ipc.files.saveFile({
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
        defaultPath: `respaldo_${new Date().toISOString().split('T')[0]}.zip`,
      });

      if (!result.canceled && result.filePath) {
        await ipc.backup.export(result.filePath);
        alert('Respaldo exportado exitosamente');
      }
    } catch (error) {
      console.error('Error exportando respaldo:', error);
      alert('Error al exportar el respaldo');
    }
  };

  const handleImportBackup = async () => {
    try {
      if (isWeb) {
        alert('Respaldos están disponibles en la versión de escritorio (Electron).');
        return;
      }
      const result = await ipc.files.selectFile({
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        if (!confirm('¿Está seguro de importar este respaldo? Se reemplazará la base de datos actual.')) {
          return;
        }
        await ipc.backup.import(result.filePaths[0]);
        alert('Respaldo importado exitosamente. Por favor recargue la aplicación.');
      }
    } catch (error) {
      console.error('Error importando respaldo:', error);
      alert('Error al importar el respaldo');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes y Respaldos</h1>
        <p className="text-muted-foreground mt-2">
          Genera reportes académicos y gestiona respaldos del sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reporte por Estudiante</CardTitle>
            <CardDescription>
              Genera un reporte detallado de un estudiante específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedGroup || ''}
                onChange={(e) => {
                  setSelectedGroup(e.target.value ? parseInt(e.target.value) : null);
                  setSelectedStudent(null);
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
                <label className="text-sm font-medium">Estudiante</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Seleccione un estudiante</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button 
              onClick={handleGenerateStudentReport} 
              disabled={!selectedStudent || !selectedGroup || isWeb}
              className="w-full"
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              Generar Reporte PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte por Grupo</CardTitle>
            <CardDescription>
              Genera un reporte resumen de todo el grupo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedGroup || ''}
                onChange={(e) => setSelectedGroup(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Seleccione un grupo</option>
                {groups.map((item) => (
                  <option key={item.group.id} value={item.group.id}>
                    {item.group.name}
                  </option>
                ))}
              </select>
            </div>
            <Button 
              onClick={handleGenerateGroupReport} 
              disabled={!selectedGroup || isWeb}
              className="w-full"
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              Generar Reporte PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportar Respaldo</CardTitle>
            <CardDescription>
              Crea una copia de seguridad de todos tus datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportBackup} className="w-full" disabled={isWeb}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Respaldo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importar Respaldo</CardTitle>
            <CardDescription>
              Restaura datos desde un archivo de respaldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleImportBackup} variant="outline" className="w-full" disabled={isWeb}>
              <FileDown className="h-4 w-4 mr-2" />
              Importar Respaldo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

