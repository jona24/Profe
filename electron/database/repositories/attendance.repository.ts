import { eq, and } from 'drizzle-orm';
import { attendanceSessions, attendanceRecords, students } from '../schema.js';
import type { Database } from '../db.js';

export class AttendanceRepository {
  constructor(private db: Database) {}

  // ========== SESIONES ==========
  getSessionsByGroupCourse(groupCourseId: number) {
    return this.db
      .select()
      .from(attendanceSessions)
      .where(eq(attendanceSessions.groupCourseId, groupCourseId))
      .orderBy(attendanceSessions.date)
      .all();
  }

  createSession(data: {
    groupCourseId: number;
    date: Date;
    notes?: string;
  }) {
    return this.db
      .insert(attendanceSessions)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  deleteSession(id: number) {
    return this.db.delete(attendanceSessions).where(eq(attendanceSessions.id, id)).run();
  }

  // ========== REGISTROS ==========
  getRecordsBySession(sessionId: number) {
    const results = this.db
      .select({
        record: attendanceRecords,
        student: students,
      })
      .from(attendanceRecords)
      .innerJoin(students, eq(attendanceRecords.studentId, students.id))
      .where(eq(attendanceRecords.sessionId, sessionId))
      .all();
    
    // Asegurar que student esté presente
    return results.map(r => ({
      record: r.record,
      student: r.student || { id: r.record.studentId } as any,
    }));
  }

  bulkUpdateRecords(sessionId: number, records: Array<{
    studentId: number;
    status: string;
  }>) {
    const results = [];

    for (const recordData of records) {
      // Buscar si ya existe
      const existing = this.db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.sessionId, sessionId),
            eq(attendanceRecords.studentId, recordData.studentId)
          )
        )
        .get();

      if (existing) {
        // Actualizar
        const updated = this.db
          .update(attendanceRecords)
          .set({
            status: recordData.status,
          })
          .where(eq(attendanceRecords.id, existing.id))
          .returning()
          .get();
        results.push(updated);
      } else {
        // Crear nuevo
        const created = this.db
          .insert(attendanceRecords)
          .values({
            sessionId,
            studentId: recordData.studentId,
            status: recordData.status,
            createdAt: new Date(),
          })
          .returning()
          .get();
        results.push(created);
      }
    }

    return results;
  }

  getByStudent(studentId: number, groupCourseId: number) {
    return this.db
      .select({
        record: attendanceRecords,
        session: attendanceSessions,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .where(
        and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceSessions.groupCourseId, groupCourseId)
        )
      )
      .all();
  }
}

