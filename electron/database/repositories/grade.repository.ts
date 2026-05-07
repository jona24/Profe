import { eq, and } from 'drizzle-orm';
import { grades, assessments, students, groupCourses } from '../schema.js';
import type { Database } from '../db.js';

export class GradeRepository {
  constructor(private db: Database) {}

  getByAssessment(assessmentId: number) {
    const results = this.db
      .select({
        grade: grades,
        student: students,
      })
      .from(grades)
      .innerJoin(students, eq(grades.studentId, students.id))
      .where(eq(grades.assessmentId, assessmentId))
      .all();
    
    // Asegurar que student esté presente
    return results.map(r => ({
      grade: r.grade,
      student: r.student || { id: r.grade.studentId } as any,
    }));
  }

  getByStudent(studentId: number, groupCourseId?: number) {
    if (groupCourseId) {
      return this.db
        .select({
          grade: grades,
          assessment: assessments,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .where(
          and(
            eq(grades.studentId, studentId),
            eq(assessments.groupCourseId, groupCourseId)
          )
        )
        .all();
    }
    return this.db
      .select({
        grade: grades,
        assessment: assessments,
      })
      .from(grades)
      .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
      .where(eq(grades.studentId, studentId))
      .all();
  }

  bulkUpdate(assessmentId: number, gradesData: Array<{
    studentId: number;
    score?: number;
    rubricResultJson?: string;
    status?: string;
    notes?: string;
  }>) {
    const results = [];

    for (const gradeData of gradesData) {
      // Buscar si ya existe
      const existing = this.db
        .select()
        .from(grades)
        .where(
          and(
            eq(grades.assessmentId, assessmentId),
            eq(grades.studentId, gradeData.studentId)
          )
        )
        .get();

      if (existing) {
        // Actualizar
        const updated = this.db
          .update(grades)
          .set({
            ...gradeData,
            updatedAt: new Date(),
          })
          .where(eq(grades.id, existing.id))
          .returning()
          .get();
        results.push(updated);
      } else {
        // Crear nuevo
        const created = this.db
          .insert(grades)
          .values({
            assessmentId,
            ...gradeData,
            status: gradeData.status || 'present',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
          .get();
        results.push(created);
      }
    }

    return results;
  }

  update(id: number, data: Partial<typeof grades.$inferInsert>) {
    return this.db
      .update(grades)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(grades.id, id))
      .returning()
      .get();
  }
}

