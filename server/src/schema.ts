import { pgTable, serial, text, integer, real, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  // En web, se recomienda guardar como Data URL (base64) o URL externa
  logoPath: text('logo_path'),
  reportHeader: text('report_header'),
  reportFooter: text('report_footer'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const academicYears = pgTable('academic_years', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  startDate: timestamp('start_date', { withTimezone: false }).notNull(),
  endDate: timestamp('end_date', { withTimezone: false }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  level: text('level'),
  section: text('section'),
  schedule: text('schedule'),
  academicYearId: integer('academic_year_id').notNull().references(() => academicYears.id),
  period: text('period'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const groupStudents = pgTable('group_students', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const groupCourses = pgTable('group_courses', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const rubricTemplates = pgTable('rubric_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  version: text('version').notNull(),
  definitionJson: text('definition_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const rubricInstances = pgTable('rubric_instances', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').notNull().references(() => rubricTemplates.id, { onDelete: 'cascade' }),
  groupCourseId: integer('group_course_id').notNull().references(() => groupCourses.id, { onDelete: 'cascade' }),
  overridesJson: text('overrides_json'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  groupCourseId: integer('group_course_id').notNull().references(() => groupCourses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(),
  date: timestamp('date', { withTimezone: false }).notNull(),
  weight: real('weight').notNull(),
  maxScore: real('max_score').notNull(),
  rubricInstanceId: integer('rubric_instance_id').references(() => rubricInstances.id, { onDelete: 'set null' }),
  gradingMode: text('grading_mode').notNull().default('direct'),
  period: text('period'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  score: real('score'),
  rubricResultJson: text('rubric_result_json'),
  status: text('status').notNull().default('present'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const attendanceSessions = pgTable('attendance_sessions', {
  id: serial('id').primaryKey(),
  groupCourseId: integer('group_course_id').notNull().references(() => groupCourses.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: false }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => attendanceSessions.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('present'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const teacherConfig = pgTable('teacher_config', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  personalLogoPath: text('personal_logo_path'),
  defaultReportHeader: text('default_report_header'),
  defaultReportFooter: text('default_report_footer'),
  periodType: text('period_type').notNull().default('trimestre'),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// Relaciones (mantiene las mismas para facilitar port de repositorios)
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

