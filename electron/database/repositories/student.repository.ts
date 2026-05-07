import { eq, and } from 'drizzle-orm';
import { students, groupStudents } from '../schema.js';
import { sql } from 'drizzle-orm';
import Papa from 'papaparse';
import type { Database } from '../db.js';

export class StudentRepository {
  constructor(private db: Database) {}

  getAll(groupId?: number) {
    if (groupId) {
      return this.db
        .select({
          student: students,
        })
        .from(students)
        .innerJoin(groupStudents, eq(students.id, groupStudents.studentId))
        .where(eq(groupStudents.groupId, groupId))
        .all()
        .map((row) => row.student);
    }
    return this.db.select().from(students).all();
  }

  getById(id: number) {
    return this.db.select().from(students).where(eq(students.id, id)).get();
  }

  create(data: {
    identifier: string;
    fullName: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) {
    const now = new Date();
    return this.db
      .insert(students)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  }

  update(id: number, data: Partial<typeof students.$inferInsert>) {
    return this.db
      .update(students)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning()
      .get();
  }

  delete(id: number) {
    return this.db.delete(students).where(eq(students.id, id)).run();
  }

  importFromCSV(csvData: string, groupId: number) {
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    const results: any[] = [];
    const errors: string[] = [];

    for (const row of parsed.data as any[]) {
      try {
        const identifier = row.identificador || row.cedula || row.id || '';
        const fullName = row.nombre || row['nombre completo'] || row.nombre_completo || '';

        if (!identifier || !fullName) {
          errors.push(`Fila inválida: ${JSON.stringify(row)}`);
          continue;
        }

        // Buscar si el estudiante ya existe
        let student = this.db
          .select()
          .from(students)
          .where(eq(students.identifier, identifier))
          .get();

        if (!student) {
          // Crear nuevo estudiante
          student = this.create({
            identifier,
            fullName,
            email: row.email || row.correo || undefined,
            phone: row.telefono || row.phone || undefined,
            notes: row.observaciones || row.notes || undefined,
          });
        }

        // Verificar si ya está en el grupo
        const existing = this.db
          .select()
          .from(groupStudents)
          .where(
            and(
              eq(groupStudents.groupId, groupId),
              eq(groupStudents.studentId, student.id)
            )
          )
          .get();

        if (!existing) {
          // Asignar al grupo
          this.db
            .insert(groupStudents)
            .values({
              groupId,
              studentId: student.id,
              createdAt: new Date(),
            })
            .run();
        }

        results.push(student);
      } catch (error: any) {
        errors.push(`Error procesando fila: ${error.message}`);
      }
    }

    return { results, errors };
  }
}



