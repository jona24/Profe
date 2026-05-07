// Cliente unificado:
// - En Electron: usa `window.electronAPI` (IPC)
// - En Web (Railway): usa HTTP contra el backend (`/api/...`)
declare global {
  interface Window {
    electronAPI: {
      schools: {
        getAll: () => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      academicYears: {
        getAll: () => Promise<any[]>;
        create: (data: any) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      groups: {
        getAll: (schoolId?: number) => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      students: {
        getAll: (groupId?: number) => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
        importFromCSV: (csvData: string, groupId: number) => Promise<any>;
      };
      courses: {
        getAll: () => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      groupCourses: {
        getByGroup: (groupId: number) => Promise<any[]>;
        assign: (groupId: number, courseId: number) => Promise<any>;
        unassign: (id: number) => Promise<any>;
      };
      rubrics: {
        templates: {
          getAll: (courseId?: number) => Promise<any[]>;
          getById: (id: number) => Promise<any>;
          create: (data: any) => Promise<any>;
          update: (id: number, data: any) => Promise<any>;
          delete: (id: number) => Promise<any>;
          clone: (id: number, newVersion: string) => Promise<any>;
        };
        instances: {
          getByGroupCourse: (groupCourseId: number) => Promise<any[]>;
          create: (data: any) => Promise<any>;
          update: (id: number, data: any) => Promise<any>;
        };
      };
      assessments: {
        getByGroupCourse: (groupCourseId: number, period?: string) => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      grades: {
        getByAssessment: (assessmentId: number) => Promise<any[]>;
        getByStudent: (studentId: number, groupCourseId?: number) => Promise<any[]>;
        bulkUpdate: (assessmentId: number, grades: any[]) => Promise<any[]>;
        update: (id: number, data: any) => Promise<any>;
      };
      attendance: {
        sessions: {
          getByGroupCourse: (groupCourseId: number) => Promise<any[]>;
          create: (data: any) => Promise<any>;
          delete: (id: number) => Promise<any>;
        };
        records: {
          getBySession: (sessionId: number) => Promise<any[]>;
          bulkUpdate: (sessionId: number, records: any[]) => Promise<any[]>;
        };
        getByStudent: (studentId: number, groupCourseId: number) => Promise<any[]>;
      };
      config: {
        get: () => Promise<any>;
        update: (data: any) => Promise<any>;
      };
      reports: {
        generateStudentReport: (studentId: number, groupId: number, period?: string) => Promise<Buffer>;
        generateGroupReport: (groupId: number, groupCourseId?: number, period?: string) => Promise<Buffer>;
      };
      backup: {
        export: (filePath: string) => Promise<any>;
        import: (filePath: string) => Promise<any>;
      };
      files: {
        selectFile: (options: any) => Promise<any>;
        selectDirectory: () => Promise<any>;
        saveFile: (options: any) => Promise<any>;
        readFile: (filePath: string) => Promise<any>;
        writeFile: (filePath: string, data: Buffer) => Promise<any>;
      };
    };
  }
}

function getElectronApi() {
  if (typeof window === 'undefined') return null;
  return window.electronAPI || null;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

async function http<T>(method: string, url: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${method} ${url}${text ? `: ${text}` : ''}`);
  }
  return (await res.json()) as T;
}

function notAvailable(name: string) {
  return () => Promise.reject(new Error(`${name} no está disponible en modo Web`));
}

const webApi: typeof window.electronAPI = {
  schools: {
    getAll: () => http('GET', '/api/schools'),
    getById: (id) => http('GET', `/api/schools/${id}`),
    create: (data) => http('POST', '/api/schools', data),
    update: (id, data) => http('PUT', `/api/schools/${id}`, data),
    delete: (id) => http('DELETE', `/api/schools/${id}`),
  },
  academicYears: {
    getAll: () => http('GET', '/api/academicYears'),
    create: (data) => http('POST', '/api/academicYears', data),
    update: (id, data) => http('PUT', `/api/academicYears/${id}`, data),
    delete: (id) => http('DELETE', `/api/academicYears/${id}`),
  },
  groups: {
    getAll: (schoolId) => http('GET', `/api/groups${schoolId ? `?schoolId=${schoolId}` : ''}`),
    getById: (id) => http('GET', `/api/groups/${id}`),
    create: (data) => http('POST', '/api/groups', data),
    update: (id, data) => http('PUT', `/api/groups/${id}`, data),
    delete: (id) => http('DELETE', `/api/groups/${id}`),
  },
  students: {
    getAll: (groupId) => http('GET', `/api/students${groupId ? `?groupId=${groupId}` : ''}`),
    getById: (id) => http('GET', `/api/students/${id}`),
    create: (data) => http('POST', '/api/students', data),
    update: (id, data) => http('PUT', `/api/students/${id}`, data),
    delete: (id) => http('DELETE', `/api/students/${id}`),
    importFromCSV: (_csvData, _groupId) => http('POST', '/api/students/importFromCSV', { csvData: _csvData, groupId: _groupId }),
  },
  courses: {
    getAll: () => http('GET', '/api/courses'),
    getById: (id) => http('GET', `/api/courses/${id}`),
    create: (data) => http('POST', '/api/courses', data),
    update: (id, data) => http('PUT', `/api/courses/${id}`, data),
    delete: (id) => http('DELETE', `/api/courses/${id}`),
  },
  groupCourses: {
    getByGroup: (groupId) => http('GET', `/api/groupCourses/byGroup/${groupId}`),
    assign: (groupId, courseId) => http('POST', '/api/groupCourses/assign', { groupId, courseId }),
    unassign: (id) => http('DELETE', `/api/groupCourses/${id}`),
  },
  rubrics: {
    templates: {
      getAll: (courseId) => http('GET', `/api/rubrics/templates${courseId ? `?courseId=${courseId}` : ''}`),
      getById: (id) => http('GET', `/api/rubrics/templates/${id}`),
      create: (data) => http('POST', '/api/rubrics/templates', data),
      update: (id, data) => http('PUT', `/api/rubrics/templates/${id}`, data),
      delete: (id) => http('DELETE', `/api/rubrics/templates/${id}`),
      clone: (id, newVersion) => http('POST', `/api/rubrics/templates/${id}/clone`, { newVersion }),
    },
    instances: {
      getByGroupCourse: (groupCourseId) => http('GET', `/api/rubrics/instances/byGroupCourse/${groupCourseId}`),
      create: (data) => http('POST', '/api/rubrics/instances', data),
      update: (id, data) => http('PUT', `/api/rubrics/instances/${id}`, data),
    },
  },
  assessments: {
    getByGroupCourse: (groupCourseId, period) =>
      http('GET', `/api/assessments/byGroupCourse/${groupCourseId}${period ? `?period=${encodeURIComponent(period)}` : ''}`),
    getById: (id) => http('GET', `/api/assessments/${id}`),
    create: (data) => http('POST', '/api/assessments', data),
    update: (id, data) => http('PUT', `/api/assessments/${id}`, data),
    delete: (id) => http('DELETE', `/api/assessments/${id}`),
  },
  grades: {
    getByAssessment: (assessmentId) => http('GET', `/api/grades/byAssessment/${assessmentId}`),
    getByStudent: (studentId) => http('GET', `/api/grades/byStudent/${studentId}`),
    bulkUpdate: (assessmentId, grades) => http('POST', '/api/grades/bulkUpdate', { assessmentId, grades }),
    update: (id, data) => http('PUT', `/api/grades/${id}`, data),
  },
  attendance: {
    sessions: {
      getByGroupCourse: (groupCourseId) => http('GET', `/api/attendance/sessions/byGroupCourse/${groupCourseId}`),
      create: (data) => http('POST', '/api/attendance/sessions', data),
      delete: (id) => http('DELETE', `/api/attendance/sessions/${id}`),
    },
    records: {
      getBySession: (sessionId) => http('GET', `/api/attendance/records/bySession/${sessionId}`),
      bulkUpdate: (sessionId, records) => http('POST', '/api/attendance/records/bulkUpdate', { sessionId, records }),
    },
    getByStudent: (studentId, _groupCourseId) => http('GET', `/api/grades/byStudent/${studentId}`),
  },
  config: {
    get: () => http('GET', '/api/config'),
    update: (data) => http('PUT', '/api/config', data),
  },
  reports: {
    generateStudentReport: notAvailable('reports.generateStudentReport'),
    generateGroupReport: notAvailable('reports.generateGroupReport'),
  },
  backup: {
    export: notAvailable('backup.export'),
    import: notAvailable('backup.import'),
  },
  files: {
    selectFile: notAvailable('files.selectFile'),
    selectDirectory: notAvailable('files.selectDirectory'),
    saveFile: notAvailable('files.saveFile'),
    readFile: notAvailable('files.readFile'),
    writeFile: notAvailable('files.writeFile'),
  },
};

export const ipc = new Proxy({} as typeof window.electronAPI, {
  get(_target, prop: string) {
    const electronApi = getElectronApi();
    const api = electronApi ?? webApi;
    const value = (api as any)[prop];
    if (typeof value === 'function') return value.bind(api);
    return value;
  },
});

