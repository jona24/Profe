import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Tabla: Colegios/Instituciones
export const schools = sqliteTable('schools', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  logoPath: text('logo_path'),
  reportHeader: text('report_header'),
  reportFooter: text('report_footer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Años Lectivos
export const academicYears = sqliteTable('academic_years', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(), // Ej: "2026", "2025-2026"
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Grupos
export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolId: integer('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Ej: "10-2 Nocturno"
  level: text('level'), // Ej: "10", "11", "12"
  section: text('section'), // Ej: "A", "B", "2"
  schedule: text('schedule'), // Ej: "Nocturno", "Diurno", "Vespertino"
  academicYearId: integer('academic_year_id').notNull().references(() => academicYears.id),
  period: text('period'), // Ej: "Trimestre 1", "Semestre 1"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Estudiantes
export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  identifier: text('identifier').notNull().unique(), // Cédula, ID único
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Relación Grupo-Estudiante
export const groupStudents = sqliteTable('group_students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Cursos/Materias
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code'), // Código opcional
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Relación Grupo-Curso
export const groupCourses = sqliteTable('group_courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Plantillas de Rúbricas
export const rubricTemplates = sqliteTable('rubric_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  version: text('version').notNull(), // Ej: "v1", "2025-v1"
  definitionJson: text('definition_json').notNull(), // JSON con criterios y niveles
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Instancias de Rúbrica (por grupo-curso)
export const rubricInstances = sqliteTable('rubric_instances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').notNull().references(() => rubricTemplates.id, { onDelete: 'cascade' }),
  groupCourseId: integer('group_course_id').notNull().references(() => groupCourses.id, { onDelete: 'cascade' }),
  overridesJson: text('overrides_json'), // Ajustes específicos del grupo
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Actividades Evaluativas
export const assessments = sqliteTable('assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupCourseId: integer('group_course_id').notNull().references(() => groupCourses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(), // "tarea", "examen", "proyecto", "practica", etc.
  date: integer('date', { mode: 'timestamp' }).notNull(),
  weight: real('weight').notNull(), // Porcentaje (0-100)
  maxScore: real('max_score').notNull(),
  rubricInstanceId: integer('rubric_instance_id').references(() => rubricInstances.id, { onDelete: 'set null' }),
  gradingMode: text('grading_mode').notNull().default('direct'), // "direct" o "rubric"
  period: text('period'), // Ej: "Trimestre 1"
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Calificaciones
export const grades = sqliteTable('grades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assessmentId: integer('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  score: real('score'), // Nota numérica
  rubricResultJson: text('rubric_result_json'), // Resultado de rúbrica en JSON
  status: text('status').notNull().default('present'), // "present", "absent", "not_submitted", "justified"
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Sesiones de Asistencia
export const attendanceSessions = sqliteTable('attendance_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupCourseId: integer('group_course_id').notNull().references(() => groupCourses.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Registros de Asistencia
export const attendanceRecords = sqliteTable('attendance_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => attendanceSessions.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('present'), // "present", "absent", "late", "justified"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabla: Configuración del Profesor
export const teacherConfig = sqliteTable('teacher_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  personalLogoPath: text('personal_logo_path'),
  defaultReportHeader: text('default_report_header'),
  defaultReportFooter: text('default_report_footer'),
  periodType: text('period_type').notNull().default('trimestre'), // "trimestre", "semestre", "corte"
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relaciones
export const schoolsRelations = relations(schools, ({ many }) => ({
  groups: many(groups),
}));

export const academicYearsRelations = relations(academicYears, ({ many }) => ({
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  school: one(schools, {
    fields: [groups.schoolId],
    references: [schools.id],
  }),
  academicYear: one(academicYears, {
    fields: [groups.academicYearId],
    references: [academicYears.id],
  }),
  groupStudents: many(groupStudents),
  groupCourses: many(groupCourses),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  groupStudents: many(groupStudents),
  grades: many(grades),
  attendanceRecords: many(attendanceRecords),
}));

export const groupStudentsRelations = relations(groupStudents, ({ one }) => ({
  group: one(groups, {
    fields: [groupStudents.groupId],
    references: [groups.id],
  }),
  student: one(students, {
    fields: [groupStudents.studentId],
    references: [students.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  groupCourses: many(groupCourses),
  rubricTemplates: many(rubricTemplates),
}));

export const groupCoursesRelations = relations(groupCourses, ({ one, many }) => ({
  group: one(groups, {
    fields: [groupCourses.groupId],
    references: [groups.id],
  }),
  course: one(courses, {
    fields: [groupCourses.courseId],
    references: [courses.id],
  }),
  assessments: many(assessments),
  rubricInstances: many(rubricInstances),
  attendanceSessions: many(attendanceSessions),
}));

export const rubricTemplatesRelations = relations(rubricTemplates, ({ one, many }) => ({
  course: one(courses, {
    fields: [rubricTemplates.courseId],
    references: [courses.id],
  }),
  instances: many(rubricInstances),
}));

export const rubricInstancesRelations = relations(rubricInstances, ({ one, many }) => ({
  template: one(rubricTemplates, {
    fields: [rubricInstances.templateId],
    references: [rubricTemplates.id],
  }),
  groupCourse: one(groupCourses, {
    fields: [rubricInstances.groupCourseId],
    references: [groupCourses.id],
  }),
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  groupCourse: one(groupCourses, {
    fields: [assessments.groupCourseId],
    references: [groupCourses.id],
  }),
  rubricInstance: one(rubricInstances, {
    fields: [assessments.rubricInstanceId],
    references: [rubricInstances.id],
  }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  assessment: one(assessments, {
    fields: [grades.assessmentId],
    references: [assessments.id],
  }),
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
  groupCourse: one(groupCourses, {
    fields: [attendanceSessions.groupCourseId],
    references: [groupCourses.id],
  }),
  records: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  session: one(attendanceSessions, {
    fields: [attendanceRecords.sessionId],
    references: [attendanceSessions.id],
  }),
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
}));



