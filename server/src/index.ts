import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db, pool, healthcheckDb } from './db.js';
import * as schema from './schema.js';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const CLIENT_DIST_DIR = path.resolve(__dirname, '../../dist');

async function ensureSchema() {
  // DDL idempotente para Railway (sin drizzle-kit).
  // Mantiene nombres de tablas/columnas del proyecto original.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schools (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      logo_path TEXT,
      report_header TEXT,
      report_footer TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      level TEXT,
      section TEXT,
      schedule TEXT,
      academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
      period TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS students_identifier_uq ON students(identifier);

    CREATE TABLE IF NOT EXISTS group_students (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS group_courses (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rubric_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      version TEXT NOT NULL,
      definition_json TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rubric_instances (
      id SERIAL PRIMARY KEY,
      template_id INTEGER NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,
      group_course_id INTEGER NOT NULL REFERENCES group_courses(id) ON DELETE CASCADE,
      overrides_json TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
      group_course_id INTEGER NOT NULL REFERENCES group_courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      weight REAL NOT NULL,
      max_score REAL NOT NULL,
      rubric_instance_id INTEGER REFERENCES rubric_instances(id) ON DELETE SET NULL,
      grading_mode TEXT NOT NULL DEFAULT 'direct',
      period TEXT,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS grades (
      id SERIAL PRIMARY KEY,
      assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      score REAL,
      rubric_result_json TEXT,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id SERIAL PRIMARY KEY,
      group_course_id INTEGER NOT NULL REFERENCES group_courses(id) ON DELETE CASCADE,
      date TIMESTAMP NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'present',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS teacher_config (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      personal_logo_path TEXT,
      default_report_header TEXT,
      default_report_footer TEXT,
      period_type TEXT NOT NULL DEFAULT 'trimestre',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Seed mínimo
  const existing = await db.select().from(schema.teacherConfig).limit(1).execute();
  if (existing.length === 0) {
    await db
      .insert(schema.teacherConfig)
      .values({ name: 'Profesor', periodType: 'trimestre', updatedAt: new Date() })
      .execute();
  }
}

function jsonDateReviver(_key: string, value: unknown) {
  // Convierte timestamps serializados por el frontend en Date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return value;
}

async function main() {
  await ensureSchema();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb', reviver: jsonDateReviver as any }));

  // Health
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      const ok = await healthcheckDb();
      res.json({ ok });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message ?? 'db error' });
    }
  });

  // ===== Schools =====
  app.get('/api/schools', async (_req: Request, res: Response) => {
    const rows = await db.select().from(schema.schools).execute();
    res.json(rows);
  });

  app.get('/api/schools/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(schema.schools).where(eq(schema.schools.id, id)).limit(1).execute();
    res.json(rows[0] ?? null);
  });

  app.post('/api/schools', async (req: Request, res: Response) => {
    const now = new Date();
    const [row] = await db
      .insert(schema.schools)
      .values({ ...req.body, createdAt: now, updatedAt: now })
      .returning()
      .execute();
    res.json(row);
  });

  app.put('/api/schools/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.schools)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.schools.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.delete('/api/schools/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.schools).where(eq(schema.schools.id, id)).execute();
    res.json({ ok: true });
  });

  // ===== Academic Years =====
  app.get('/api/academicYears', async (_req: Request, res: Response) => {
    const rows = await db.select().from(schema.academicYears).execute();
    res.json(rows);
  });

  app.post('/api/academicYears', async (req: Request, res: Response) => {
    const [row] = await db.insert(schema.academicYears).values(req.body).returning().execute();
    res.json(row);
  });

  app.put('/api/academicYears/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.academicYears)
      .set(req.body)
      .where(eq(schema.academicYears.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.delete('/api/academicYears/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.academicYears).where(eq(schema.academicYears.id, id)).execute();
    res.json({ ok: true });
  });

  // ===== Groups =====
  app.get('/api/groups', async (req: Request, res: Response) => {
    const schoolId = req.query.schoolId ? Number(req.query.schoolId) : undefined;
    const q = db
      .select({
        group: schema.groups,
        school: schema.schools,
        academicYear: schema.academicYears,
      })
      .from(schema.groups)
      .leftJoin(schema.schools, eq(schema.groups.schoolId, schema.schools.id))
      .leftJoin(schema.academicYears, eq(schema.groups.academicYearId, schema.academicYears.id));

    const rows = schoolId ? await q.where(eq(schema.groups.schoolId, schoolId)).execute() : await q.execute();
    res.json(rows);
  });

  app.get('/api/groups/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db
      .select({
        group: schema.groups,
        school: schema.schools,
        academicYear: schema.academicYears,
      })
      .from(schema.groups)
      .leftJoin(schema.schools, eq(schema.groups.schoolId, schema.schools.id))
      .leftJoin(schema.academicYears, eq(schema.groups.academicYearId, schema.academicYears.id))
      .where(eq(schema.groups.id, id))
      .limit(1)
      .execute();
    res.json(rows[0] ?? null);
  });

  app.post('/api/groups', async (req: Request, res: Response) => {
    const now = new Date();
    const [row] = await db
      .insert(schema.groups)
      .values({ ...req.body, createdAt: now, updatedAt: now })
      .returning()
      .execute();
    res.json(row);
  });

  app.put('/api/groups/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.groups)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.groups.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.delete('/api/groups/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.groups).where(eq(schema.groups.id, id)).execute();
    res.json({ ok: true });
  });

  // ===== Students =====
  app.get('/api/students', async (req: Request, res: Response) => {
    const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
    if (!groupId) {
      const rows = await db.select().from(schema.students).execute();
      return res.json(rows);
    }
    const rows = await db
      .select({ student: schema.students })
      .from(schema.groupStudents)
      .innerJoin(schema.students, eq(schema.groupStudents.studentId, schema.students.id))
      .where(eq(schema.groupStudents.groupId, groupId))
      .execute();
    res.json(rows.map((r) => r.student));
  });

  app.get('/api/students/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(schema.students).where(eq(schema.students.id, id)).limit(1).execute();
    res.json(rows[0] ?? null);
  });

  app.post('/api/students', async (req: Request, res: Response) => {
    const now = new Date();
    const [row] = await db
      .insert(schema.students)
      .values({ ...req.body, createdAt: now, updatedAt: now })
      .returning()
      .execute();
    res.json(row);
  });

  app.put('/api/students/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.students)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.students.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.delete('/api/students/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.students).where(eq(schema.students.id, id)).execute();
    res.json({ ok: true });
  });

  // Import CSV (frontend envía ya parseado o CSV string; aquí dejamos passthrough básico)
  app.post('/api/students/importFromCSV', async (req: Request, res: Response) => {
    const { csvData, groupId } = req.body as { csvData: string; groupId: number };
    if (!csvData || !groupId) return res.status(400).json({ ok: false, error: 'csvData y groupId requeridos' });

    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    const results: any[] = [];
    const errors: string[] = [];
    const now = new Date();

    for (const row of parsed.data as any[]) {
      try {
        const identifier = row.identificador || row.cedula || row.id || '';
        const fullName = row.nombre || row['nombre completo'] || row.nombre_completo || '';

        if (!identifier || !fullName) {
          errors.push(`Fila inválida: ${JSON.stringify(row)}`);
          continue;
        }

        const existing = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.identifier, String(identifier)))
          .limit(1)
          .execute();

        let student = existing[0];
        if (!student) {
          const [created] = await db
            .insert(schema.students)
            .values({
              identifier: String(identifier),
              fullName: String(fullName),
              email: row.email || row.correo || null,
              phone: row.telefono || row.phone || null,
              notes: row.observaciones || row.notes || null,
              createdAt: now,
              updatedAt: now,
            })
            .returning()
            .execute();
          student = created;
        }

        const existingLink = await db
          .select()
          .from(schema.groupStudents)
          .where(and(eq(schema.groupStudents.groupId, groupId), eq(schema.groupStudents.studentId, student.id)))
          .limit(1)
          .execute();

        if (!existingLink[0]) {
          await db
            .insert(schema.groupStudents)
            .values({ groupId, studentId: student.id, createdAt: now })
            .execute();
        }

        results.push(student);
      } catch (e: any) {
        errors.push(`Error procesando fila: ${e?.message ?? String(e)}`);
      }
    }

    res.json({ results, errors });
  });

  // ===== Courses =====
  app.get('/api/courses', async (_req: Request, res: Response) => {
    const rows = await db.select().from(schema.courses).execute();
    res.json(rows);
  });

  app.post('/api/courses', async (req: Request, res: Response) => {
    const now = new Date();
    const [row] = await db
      .insert(schema.courses)
      .values({ ...req.body, createdAt: now, updatedAt: now })
      .returning()
      .execute();
    res.json(row);
  });

  app.put('/api/courses/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.courses)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.courses.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.delete('/api/courses/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.courses).where(eq(schema.courses.id, id)).execute();
    res.json({ ok: true });
  });

  // ===== Group-Courses =====
  app.get('/api/groupCourses/byGroup/:groupId', async (req: Request, res: Response) => {
    const groupId = Number(req.params.groupId);
    const rows = await db
      .select({
        groupCourse: schema.groupCourses,
        course: schema.courses,
      })
      .from(schema.groupCourses)
      .innerJoin(schema.courses, eq(schema.groupCourses.courseId, schema.courses.id))
      .where(eq(schema.groupCourses.groupId, groupId))
      .execute();
    res.json(rows);
  });

  app.post('/api/groupCourses/assign', async (req: Request, res: Response) => {
    const { groupId, courseId } = req.body as { groupId: number; courseId: number };
    const existing = await db
      .select()
      .from(schema.groupCourses)
      .where(and(eq(schema.groupCourses.groupId, groupId), eq(schema.groupCourses.courseId, courseId)))
      .limit(1)
      .execute();
    if (existing[0]) return res.json(existing[0]);

    const [row] = await db.insert(schema.groupCourses).values({ groupId, courseId }).returning().execute();
    res.json(row);
  });

  app.delete('/api/groupCourses/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.groupCourses).where(eq(schema.groupCourses.id, id)).execute();
    res.json({ ok: true });
  });

  // ===== Rubrics =====
  app.get('/api/rubrics/templates', async (req: Request, res: Response) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const q = db.select().from(schema.rubricTemplates);
    const rows = courseId ? await q.where(eq(schema.rubricTemplates.courseId, courseId)).execute() : await q.execute();
    res.json(rows);
  });

  app.get('/api/rubrics/templates/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(schema.rubricTemplates).where(eq(schema.rubricTemplates.id, id)).limit(1).execute();
    res.json(rows[0] ?? null);
  });

  app.post('/api/rubrics/templates', async (req: Request, res: Response) => {
    const now = new Date();
    const [row] = await db
      .insert(schema.rubricTemplates)
      .values({ ...req.body, createdAt: now, updatedAt: now })
      .returning()
      .execute();
    res.json(row);
  });

  app.put('/api/rubrics/templates/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.rubricTemplates)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.rubricTemplates.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.post('/api/rubrics/templates/:id/clone', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { newVersion } = req.body as { newVersion: string };
    const orig = await db.select().from(schema.rubricTemplates).where(eq(schema.rubricTemplates.id, id)).limit(1).execute();
    if (!orig[0]) return res.status(404).json({ ok: false });
    const now = new Date();
    const [row] = await db
      .insert(schema.rubricTemplates)
      .values({
        name: orig[0].name,
        courseId: orig[0].courseId,
        version: newVersion,
        definitionJson: orig[0].definitionJson,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .execute();
    res.json(row);
  });

  app.delete('/api/rubrics/templates/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.rubricTemplates).where(eq(schema.rubricTemplates.id, id)).execute();
    res.json({ ok: true });
  });

  app.get('/api/rubrics/instances/byGroupCourse/:groupCourseId', async (req: Request, res: Response) => {
    const groupCourseId = Number(req.params.groupCourseId);
    const rows = await db
      .select()
      .from(schema.rubricInstances)
      .where(eq(schema.rubricInstances.groupCourseId, groupCourseId))
      .execute();
    res.json(rows);
  });

  app.post('/api/rubrics/instances', async (req: Request, res: Response) => {
    const [row] = await db.insert(schema.rubricInstances).values(req.body).returning().execute();
    res.json(row);
  });

  app.put('/api/rubrics/instances/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.rubricInstances)
      .set(req.body)
      .where(eq(schema.rubricInstances.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  // ===== Assessments =====
  app.get('/api/assessments/byGroupCourse/:groupCourseId', async (req: Request, res: Response) => {
    const groupCourseId = Number(req.params.groupCourseId);
    const period = req.query.period ? String(req.query.period) : undefined;
    const condition = period
      ? and(eq(schema.assessments.groupCourseId, groupCourseId), eq(schema.assessments.period, period))
      : eq(schema.assessments.groupCourseId, groupCourseId);
    const rows = await db.select().from(schema.assessments).where(condition).execute();
    res.json(rows);
  });

  app.get('/api/assessments/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).limit(1).execute();
    res.json(rows[0] ?? null);
  });

  app.post('/api/assessments', async (req: Request, res: Response) => {
    const now = new Date();
    const [row] = await db
      .insert(schema.assessments)
      .values({ ...req.body, createdAt: now, updatedAt: now })
      .returning()
      .execute();
    res.json(row);
  });

  app.put('/api/assessments/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.assessments)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.assessments.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  app.delete('/api/assessments/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.assessments).where(eq(schema.assessments.id, id)).execute();
    res.json({ ok: true });
  });

  // ===== Grades =====
  app.get('/api/grades/byAssessment/:assessmentId', async (req: Request, res: Response) => {
    const assessmentId = Number(req.params.assessmentId);
    const rows = await db.select().from(schema.grades).where(eq(schema.grades.assessmentId, assessmentId)).execute();
    res.json(rows);
  });

  app.get('/api/grades/byStudent/:studentId', async (req: Request, res: Response) => {
    const studentId = Number(req.params.studentId);
    const rows = await db.select().from(schema.grades).where(eq(schema.grades.studentId, studentId)).execute();
    res.json(rows);
  });

  app.post('/api/grades/bulkUpdate', async (req: Request, res: Response) => {
    const { assessmentId, grades } = req.body as { assessmentId: number; grades: any[] };
    // Simplificación: upsert manual por (assessmentId, studentId) no existe constraint; hacemos delete+insert.
    await db.delete(schema.grades).where(eq(schema.grades.assessmentId, assessmentId)).execute();
    const now = new Date();
    const inserted = grades.length
      ? await db
          .insert(schema.grades)
          .values(
            grades.map((g) => ({
              ...g,
              assessmentId,
              createdAt: now,
              updatedAt: now,
            })),
          )
          .returning()
          .execute()
      : [];
    res.json(inserted);
  });

  app.put('/api/grades/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [row] = await db
      .update(schema.grades)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.grades.id, id))
      .returning()
      .execute();
    res.json(row ?? null);
  });

  // ===== Attendance =====
  app.get('/api/attendance/sessions/byGroupCourse/:groupCourseId', async (req: Request, res: Response) => {
    const groupCourseId = Number(req.params.groupCourseId);
    const rows = await db
      .select()
      .from(schema.attendanceSessions)
      .where(eq(schema.attendanceSessions.groupCourseId, groupCourseId))
      .execute();
    res.json(rows);
  });

  app.post('/api/attendance/sessions', async (req: Request, res: Response) => {
    const [row] = await db.insert(schema.attendanceSessions).values(req.body).returning().execute();
    res.json(row);
  });

  app.delete('/api/attendance/sessions/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await db.delete(schema.attendanceSessions).where(eq(schema.attendanceSessions.id, id)).execute();
    res.json({ ok: true });
  });

  app.get('/api/attendance/records/bySession/:sessionId', async (req: Request, res: Response) => {
    const sessionId = Number(req.params.sessionId);
    const rows = await db
      .select()
      .from(schema.attendanceRecords)
      .where(eq(schema.attendanceRecords.sessionId, sessionId))
      .execute();
    res.json(rows);
  });

  app.post('/api/attendance/records/bulkUpdate', async (req: Request, res: Response) => {
    const { sessionId, records } = req.body as { sessionId: number; records: any[] };
    await db.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.sessionId, sessionId)).execute();
    const inserted = records.length
      ? await db.insert(schema.attendanceRecords).values(records.map((r) => ({ ...r, sessionId }))).returning().execute()
      : [];
    res.json(inserted);
  });

  app.get('/api/config', async (_req: Request, res: Response) => {
    const rows = await db.select().from(schema.teacherConfig).orderBy(schema.teacherConfig.id).limit(1).execute();
    res.json(rows[0] ?? null);
  });

  app.put('/api/config', async (req: Request, res: Response) => {
    const rows = await db.select().from(schema.teacherConfig).orderBy(schema.teacherConfig.id).limit(1).execute();
    if (!rows[0]) {
      const [created] = await db.insert(schema.teacherConfig).values({ ...req.body, updatedAt: new Date() }).returning().execute();
      return res.json(created);
    }
    const [updated] = await db
      .update(schema.teacherConfig)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.teacherConfig.id, rows[0].id))
      .returning()
      .execute();
    res.json(updated ?? null);
  });

  // Static frontend (Railway)
  app.use(express.static(CLIENT_DIST_DIR));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server escuchando en puerto ${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

