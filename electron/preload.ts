import { contextBridge, ipcRenderer } from 'electron';

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Escuelas
  schools: {
    getAll: () => ipcRenderer.invoke('schools:getAll'),
    getById: (id: number) => ipcRenderer.invoke('schools:getById', id),
    create: (data: any) => ipcRenderer.invoke('schools:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('schools:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('schools:delete', id),
  },

  // Años Lectivos
  academicYears: {
    getAll: () => ipcRenderer.invoke('academicYears:getAll'),
    create: (data: any) => ipcRenderer.invoke('academicYears:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('academicYears:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('academicYears:delete', id),
  },

  // Grupos
  groups: {
    getAll: (schoolId?: number) => ipcRenderer.invoke('groups:getAll', schoolId),
    getById: (id: number) => ipcRenderer.invoke('groups:getById', id),
    create: (data: any) => ipcRenderer.invoke('groups:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('groups:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('groups:delete', id),
  },

  // Estudiantes
  students: {
    getAll: (groupId?: number) => ipcRenderer.invoke('students:getAll', groupId),
    getById: (id: number) => ipcRenderer.invoke('students:getById', id),
    create: (data: any) => ipcRenderer.invoke('students:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('students:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('students:delete', id),
    importFromCSV: (csvData: string, groupId: number) => ipcRenderer.invoke('students:importFromCSV', csvData, groupId),
  },

  // Cursos
  courses: {
    getAll: () => ipcRenderer.invoke('courses:getAll'),
    getById: (id: number) => ipcRenderer.invoke('courses:getById', id),
    create: (data: any) => ipcRenderer.invoke('courses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('courses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('courses:delete', id),
  },

  // Grupo-Cursos
  groupCourses: {
    getByGroup: (groupId: number) => ipcRenderer.invoke('groupCourses:getByGroup', groupId),
    assign: (groupId: number, courseId: number) => ipcRenderer.invoke('groupCourses:assign', groupId, courseId),
    unassign: (id: number) => ipcRenderer.invoke('groupCourses:unassign', id),
  },

  // Rúbricas
  rubrics: {
    templates: {
      getAll: (courseId?: number) => ipcRenderer.invoke('rubrics:templates:getAll', courseId),
      getById: (id: number) => ipcRenderer.invoke('rubrics:templates:getById', id),
      create: (data: any) => ipcRenderer.invoke('rubrics:templates:create', data),
      update: (id: number, data: any) => ipcRenderer.invoke('rubrics:templates:update', id, data),
      delete: (id: number) => ipcRenderer.invoke('rubrics:templates:delete', id),
      clone: (id: number, newVersion: string) => ipcRenderer.invoke('rubrics:templates:clone', id, newVersion),
    },
    instances: {
      getByGroupCourse: (groupCourseId: number) => ipcRenderer.invoke('rubrics:instances:getByGroupCourse', groupCourseId),
      create: (data: any) => ipcRenderer.invoke('rubrics:instances:create', data),
      update: (id: number, data: any) => ipcRenderer.invoke('rubrics:instances:update', id, data),
    },
  },

  // Actividades
  assessments: {
    getByGroupCourse: (groupCourseId: number, period?: string) => ipcRenderer.invoke('assessments:getByGroupCourse', groupCourseId, period),
    getById: (id: number) => ipcRenderer.invoke('assessments:getById', id),
    create: (data: any) => ipcRenderer.invoke('assessments:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('assessments:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('assessments:delete', id),
  },

  // Calificaciones
  grades: {
    getByAssessment: (assessmentId: number) => ipcRenderer.invoke('grades:getByAssessment', assessmentId),
    getByStudent: (studentId: number, groupCourseId?: number) => ipcRenderer.invoke('grades:getByStudent', studentId, groupCourseId),
    bulkUpdate: (assessmentId: number, grades: any[]) => ipcRenderer.invoke('grades:bulkUpdate', assessmentId, grades),
    update: (id: number, data: any) => ipcRenderer.invoke('grades:update', id, data),
  },

  // Asistencia
  attendance: {
    sessions: {
      getByGroupCourse: (groupCourseId: number) => ipcRenderer.invoke('attendance:sessions:getByGroupCourse', groupCourseId),
      create: (data: any) => ipcRenderer.invoke('attendance:sessions:create', data),
      delete: (id: number) => ipcRenderer.invoke('attendance:sessions:delete', id),
    },
    records: {
      getBySession: (sessionId: number) => ipcRenderer.invoke('attendance:records:getBySession', sessionId),
      bulkUpdate: (sessionId: number, records: any[]) => ipcRenderer.invoke('attendance:records:bulkUpdate', sessionId, records),
    },
    getByStudent: (studentId: number, groupCourseId: number) => ipcRenderer.invoke('attendance:getByStudent', studentId, groupCourseId),
  },

  // Configuración
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (data: any) => ipcRenderer.invoke('config:update', data),
  },

  // Reportes
  reports: {
    generateStudentReport: (studentId: number, groupId: number, period?: string) => 
      ipcRenderer.invoke('reports:generateStudentReport', studentId, groupId, period),
    generateGroupReport: (groupId: number, groupCourseId?: number, period?: string) => 
      ipcRenderer.invoke('reports:generateGroupReport', groupId, groupCourseId, period),
  },

  // Respaldos
  backup: {
    export: (filePath: string) => ipcRenderer.invoke('backup:export', filePath),
    import: (filePath: string) => ipcRenderer.invoke('backup:import', filePath),
  },

  // Archivos
  files: {
    selectFile: (options: any) => ipcRenderer.invoke('files:selectFile', options),
    selectDirectory: () => ipcRenderer.invoke('files:selectDirectory'),
    saveFile: (options: any) => ipcRenderer.invoke('files:saveFile', options),
    readFile: (filePath: string) => ipcRenderer.invoke('files:readFile', filePath),
    writeFile: (filePath: string, data: Buffer) => ipcRenderer.invoke('files:writeFile', filePath, data),
  },
});

// Los tipos están definidos en src/lib/ipc.ts

