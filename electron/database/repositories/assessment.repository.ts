import { eq, and } from 'drizzle-orm';
import { assessments, groupCourses } from '../schema.js';
import type { Database } from '../db.js';

export class AssessmentRepository {
  constructor(private db: Database) {}

  getByGroupCourse(groupCourseId: number, period?: string) {
    if (period) {
      return this.db
        .select()
        .from(assessments)
        .where(
          and(
            eq(assessments.groupCourseId, groupCourseId),
            eq(assessments.period, period)
          )
        )
        .all();
    }
    return this.db
      .select()
      .from(assessments)
      .where(eq(assessments.groupCourseId, groupCourseId))
      .all();
  }

  getById(id: number) {
    return this.db.select().from(assessments).where(eq(assessments.id, id)).get();
  }

  create(data: {
    groupCourseId: number;
    title: string;
    type: string;
    date: Date;
    weight: number;
    maxScore: number;
    rubricInstanceId?: number;
    gradingMode: 'direct' | 'rubric';
    period?: string;
    description?: string;
  }) {
    const now = new Date();
    return this.db
      .insert(assessments)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  }

  update(id: number, data: Partial<typeof assessments.$inferInsert>) {
    return this.db
      .update(assessments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, id))
      .returning()
      .get();
  }

  delete(id: number) {
    return this.db.delete(assessments).where(eq(assessments.id, id)).run();
  }
}



