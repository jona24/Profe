import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase, closeDatabase, getDatabasePath } from './database/db.js';
import { SchoolRepository } from './database/repositories/school.repository.js';
import { AcademicYearRepository } from './database/repositories/academic-year.repository.js';
import { GroupRepository } from './database/repositories/group.repository.js';
import { StudentRepository } from './database/repositories/student.repository.js';
import { CourseRepository } from './database/repositories/course.repository.js';
import { GroupCourseRepository } from './database/repositories/group-course.repository.js';
import { RubricRepository } from './database/repositories/rubric.repository.js';
import { AssessmentRepository } from './database/repositories/assessment.repository.js';
import { GradeRepository } from './database/repositories/grade.repository.js';
import { AttendanceRepository } from './database/repositories/attendance.repository.js';
import { ConfigRepository } from './database/repositories/config.repository.js';
import { ReportService } from './database/services/report.service.js';
import { BackupService } from './database/services/backup.service.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  
  // Verificar que el preload existe
  if (!fs.existsSync(preloadPath)) {
    console.error(`ERROR: No se encontró el archivo preload en: ${preloadPath}`);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false, // No mostrar hasta que esté listo
  });

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Cargar la aplicación
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // En desarrollo, esperar un poco y luego cargar
    const loadDevURL = () => {
      if (mainWindow) {
        mainWindow.loadURL('http://localhost:5173').catch((err) => {
          console.error('Error cargando URL, reintentando en 1 segundo...', err.message);
          // Reintentar después de un segundo
          setTimeout(loadDevURL, 1000);
        });
      }
    };
    
    // Esperar un momento para que Vite esté completamente listo
    setTimeout(loadDevURL, 500);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    // Inicializar base de datos
    console.log('Inicializando base de datos...');
    initDatabase();
    console.log('Base de datos inicializada correctamente');

    // Registrar IPC handlers antes de crear la ventana
    console.log('Registrando IPC handlers...');
    registerIpcHandlers();
    console.log('IPC handlers registrados');

    // Crear ventana
    console.log('Creando ventana...');
    createWindow();
    console.log('Aplicación iniciada correctamente');
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('No se pudo obtener la instancia de la base de datos');
    }

    const schoolRepo = new SchoolRepository(db);
  const academicYearRepo = new AcademicYearRepository(db);
  const groupRepo = new GroupRepository(db);
  const studentRepo = new StudentRepository(db);
  const courseRepo = new CourseRepository(db);
  const groupCourseRepo = new GroupCourseRepository(db);
  const rubricRepo = new RubricRepository(db);
  const assessmentRepo = new AssessmentRepository(db);
  const gradeRepo = new GradeRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const configRepo = new ConfigRepository(db);
  const reportService = new ReportService(db);
  const backupService = new BackupService();

  // ========== ESCUELAS ==========
  ipcMain.handle('schools:getAll', async () => {
    return schoolRepo.getAll();
  });

  ipcMain.handle('schools:getById', async (_, id: number) => {
    return schoolRepo.getById(id);
  });

  ipcMain.handle('schools:create', async (_, data: any) => {
    return schoolRepo.create(data);
  });

  ipcMain.handle('schools:update', async (_, id: number, data: any) => {
    return schoolRepo.update(id, data);
  });

  ipcMain.handle('schools:delete', async (_, id: number) => {
    return schoolRepo.delete(id);
  });

  // ========== AÑOS LECTIVOS ==========
  ipcMain.handle('academicYears:getAll', async () => {
    return academicYearRepo.getAll();
  });

  ipcMain.handle('academicYears:create', async (_, data: any) => {
    return academicYearRepo.create(data);
  });

  ipcMain.handle('academicYears:update', async (_, id: number, data: any) => {
    return academicYearRepo.update(id, data);
  });

  ipcMain.handle('academicYears:delete', async (_, id: number) => {
    return academicYearRepo.delete(id);
  });

  // ========== GRUPOS ==========
  ipcMain.handle('groups:getAll', async (_, schoolId?: number) => {
    return groupRepo.getAll(schoolId);
  });

  ipcMain.handle('groups:getById', async (_, id: number) => {
    return groupRepo.getById(id);
  });

  ipcMain.handle('groups:create', async (_, data: any) => {
    return groupRepo.create(data);
  });

  ipcMain.handle('groups:update', async (_, id: number, data: any) => {
    return groupRepo.update(id, data);
  });

  ipcMain.handle('groups:delete', async (_, id: number) => {
    return groupRepo.delete(id);
  });

  // ========== ESTUDIANTES ==========
  ipcMain.handle('students:getAll', async (_, groupId?: number) => {
    return studentRepo.getAll(groupId);
  });

  ipcMain.handle('students:getById', async (_, id: number) => {
    return studentRepo.getById(id);
  });

  ipcMain.handle('students:create', async (_, data: any) => {
    return studentRepo.create(data);
  });

  ipcMain.handle('students:update', async (_, id: number, data: any) => {
    return studentRepo.update(id, data);
  });

  ipcMain.handle('students:delete', async (_, id: number) => {
    return studentRepo.delete(id);
  });

  ipcMain.handle('students:importFromCSV', async (_, csvData: string, groupId: number) => {
    return studentRepo.importFromCSV(csvData, groupId);
  });

  // ========== CURSOS ==========
  ipcMain.handle('courses:getAll', async () => {
    return courseRepo.getAll();
  });

  ipcMain.handle('courses:getById', async (_, id: number) => {
    return courseRepo.getById(id);
  });

  ipcMain.handle('courses:create', async (_, data: any) => {
    return courseRepo.create(data);
  });

  ipcMain.handle('courses:update', async (_, id: number, data: any) => {
    return courseRepo.update(id, data);
  });

  ipcMain.handle('courses:delete', async (_, id: number) => {
    return courseRepo.delete(id);
  });

  // ========== GRUPO-CURSOS ==========
  ipcMain.handle('groupCourses:getByGroup', async (_, groupId: number) => {
    return groupCourseRepo.getByGroup(groupId);
  });

  ipcMain.handle('groupCourses:assign', async (_, groupId: number, courseId: number) => {
    return groupCourseRepo.assign(groupId, courseId);
  });

  ipcMain.handle('groupCourses:unassign', async (_, id: number) => {
    return groupCourseRepo.unassign(id);
  });

  // ========== RÚBRICAS ==========
  ipcMain.handle('rubrics:templates:getAll', async (_, courseId?: number) => {
    return rubricRepo.getAllTemplates(courseId);
  });

  ipcMain.handle('rubrics:templates:getById', async (_, id: number) => {
    return rubricRepo.getTemplateById(id);
  });

  ipcMain.handle('rubrics:templates:create', async (_, data: any) => {
    return rubricRepo.createTemplate(data);
  });

  ipcMain.handle('rubrics:templates:update', async (_, id: number, data: any) => {
    return rubricRepo.updateTemplate(id, data);
  });

  ipcMain.handle('rubrics:templates:delete', async (_, id: number) => {
    return rubricRepo.deleteTemplate(id);
  });

  ipcMain.handle('rubrics:templates:clone', async (_, id: number, newVersion: string) => {
    return rubricRepo.cloneTemplate(id, newVersion);
  });

  ipcMain.handle('rubrics:instances:getByGroupCourse', async (_, groupCourseId: number) => {
    return rubricRepo.getInstancesByGroupCourse(groupCourseId);
  });

  ipcMain.handle('rubrics:instances:create', async (_, data: any) => {
    return rubricRepo.createInstance(data);
  });

  ipcMain.handle('rubrics:instances:update', async (_, id: number, data: any) => {
    return rubricRepo.updateInstance(id, data);
  });

  // ========== ACTIVIDADES ==========
  ipcMain.handle('assessments:getByGroupCourse', async (_, groupCourseId: number, period?: string) => {
    return assessmentRepo.getByGroupCourse(groupCourseId, period);
  });

  ipcMain.handle('assessments:getById', async (_, id: number) => {
    return assessmentRepo.getById(id);
  });

  ipcMain.handle('assessments:create', async (_, data: any) => {
    return assessmentRepo.create(data);
  });

  ipcMain.handle('assessments:update', async (_, id: number, data: any) => {
    return assessmentRepo.update(id, data);
  });

  ipcMain.handle('assessments:delete', async (_, id: number) => {
    return assessmentRepo.delete(id);
  });

  // ========== CALIFICACIONES ==========
  ipcMain.handle('grades:getByAssessment', async (_, assessmentId: number) => {
    return gradeRepo.getByAssessment(assessmentId);
  });

  ipcMain.handle('grades:getByStudent', async (_, studentId: number, groupCourseId?: number) => {
    return gradeRepo.getByStudent(studentId, groupCourseId);
  });

  ipcMain.handle('grades:bulkUpdate', async (_, assessmentId: number, grades: any[]) => {
    return gradeRepo.bulkUpdate(assessmentId, grades);
  });

  ipcMain.handle('grades:update', async (_, id: number, data: any) => {
    return gradeRepo.update(id, data);
  });

  // ========== ASISTENCIA ==========
  ipcMain.handle('attendance:sessions:getByGroupCourse', async (_, groupCourseId: number) => {
    return attendanceRepo.getSessionsByGroupCourse(groupCourseId);
  });

  ipcMain.handle('attendance:sessions:create', async (_, data: any) => {
    return attendanceRepo.createSession(data);
  });

  ipcMain.handle('attendance:sessions:delete', async (_, id: number) => {
    return attendanceRepo.deleteSession(id);
  });

  ipcMain.handle('attendance:records:getBySession', async (_, sessionId: number) => {
    return attendanceRepo.getRecordsBySession(sessionId);
  });

  ipcMain.handle('attendance:records:bulkUpdate', async (_, sessionId: number, records: any[]) => {
    return attendanceRepo.bulkUpdateRecords(sessionId, records);
  });

  ipcMain.handle('attendance:getByStudent', async (_, studentId: number, groupCourseId: number) => {
    return attendanceRepo.getByStudent(studentId, groupCourseId);
  });

  // ========== CONFIGURACIÓN ==========
  ipcMain.handle('config:get', async () => {
    return configRepo.get();
  });

  ipcMain.handle('config:update', async (_, data: any) => {
    return configRepo.update(data);
  });

  // ========== REPORTES ==========
  ipcMain.handle('reports:generateStudentReport', async (_, studentId: number, groupId: number, period?: string) => {
    return reportService.generateStudentReport(studentId, groupId, period);
  });

  ipcMain.handle('reports:generateGroupReport', async (_, groupId: number, groupCourseId?: number, period?: string) => {
    return reportService.generateGroupReport(groupId, groupCourseId, period);
  });

  // ========== RESPALDOS ==========
  ipcMain.handle('backup:export', async (_, filePath: string) => {
    return backupService.export(filePath);
  });

  ipcMain.handle('backup:import', async (_, filePath: string) => {
    return backupService.import(filePath);
  });

  // ========== ARCHIVOS ==========
  ipcMain.handle('files:selectFile', async (_, options: any) => {
    const result = await dialog.showOpenDialog(mainWindow!, options);
    return result;
  });

  ipcMain.handle('files:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result;
  });

  ipcMain.handle('files:saveFile', async (_, options: any) => {
    const result = await dialog.showSaveDialog(mainWindow!, options);
    return result;
  });

  ipcMain.handle('files:readFile', async (_, filePath: string) => {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('files:writeFile', async (_, filePath: string, data: Buffer) => {
    try {
      fs.writeFileSync(filePath, data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  } catch (error) {
    console.error('Error al registrar IPC handlers:', error);
    throw error;
  }
}

