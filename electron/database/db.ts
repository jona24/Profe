import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: ReturnType<typeof drizzle> | null = null;
let sqliteDb: Database.Database | null = null;

export type Database = ReturnType<typeof drizzle>;

export function initDatabase(): Database {
  if (db) {
    return db;
  }

  // Determinar ruta de la base de datos
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  
  // Crear directorio si no existe
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'gestor_academico.db');
  
  // Crear conexión SQLite
  sqliteDb = new Database(dbPath);
  
  // Habilitar foreign keys
  sqliteDb.pragma('foreign_keys = ON');
  
  // Crear instancia de Drizzle
  db = drizzle(sqliteDb, { schema });

  // Ejecutar migraciones
  try {
    const migrationsFolder = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsFolder)) {
      migrate(db, { migrationsFolder });
    } else {
      // Si no hay migraciones, crear tablas manualmente
      console.log('No se encontró carpeta de migraciones, creando tablas directamente...');
      createTablesIfNotExist();
    }
  } catch (error: any) {
    console.error('Error en migraciones:', error);
    // Si no hay migraciones, crear tablas manualmente
    createTablesIfNotExist();
  }

  // Inicializar configuración del profesor si no existe
  initializeTeacherConfig();

  return db;
}

function createTablesIfNotExist() {
  if (!sqliteDb) {
    console.error('SQLite database no está inicializada');
    return;
  }
  
  console.log('Creando tablas en la base de datos...');

  // Crear tablas si no existen (fallback si no hay migraciones)
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      logo_path TEXT,
      report_header TEXT,
      report_footer TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      level TEXT,
      section TEXT,
      schedule TEXT,
      academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
      period TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rubric_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      version TEXT NOT NULL,
      definition_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rubric_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,
      group_course_id INTEGER NOT NULL REFERENCES group_courses(id) ON DELETE CASCADE,
      overrides_json TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_course_id INTEGER NOT NULL REFERENCES group_courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      date INTEGER NOT NULL,
      weight REAL NOT NULL,
      max_score REAL NOT NULL,
      rubric_instance_id INTEGER REFERENCES rubric_instances(id) ON DELETE SET NULL,
      grading_mode TEXT NOT NULL DEFAULT 'direct',
      period TEXT,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      score REAL,
      rubric_result_json TEXT,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_course_id INTEGER NOT NULL REFERENCES group_courses(id) ON DELETE CASCADE,
      date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'present',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teacher_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      personal_logo_path TEXT,
      default_report_header TEXT,
      default_report_footer TEXT,
      period_type TEXT NOT NULL DEFAULT 'trimestre',
      updated_at INTEGER NOT NULL
    );
  `);
}

function initializeTeacherConfig() {
  if (!db) return;

  const existing = db.select().from(schema.teacherConfig).limit(1).all();
  
  if (existing.length === 0) {
    db.insert(schema.teacherConfig).values({
      name: 'Profesor',
      periodType: 'trimestre',
    }).run();
  }
}

export function getDatabase(): ReturnType<typeof drizzle> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function closeDatabase() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    db = null;
  }
}

export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'database', 'gestor_academico.db');
}

