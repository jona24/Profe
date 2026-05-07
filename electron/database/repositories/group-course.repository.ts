import { eq, and } from 'drizzle-orm';
import { groupCourses, courses, groups } from '../schema.js';
import type { Database } from '../db.js';

export class GroupCourseRepository {
  constructor(private db: Database) {}

  getByGroup(groupId: number) {
    return this.db
      .select({
        groupCourse: groupCourses,
        course: courses,
      })
      .from(groupCourses)
      .innerJoin(courses, eq(groupCourses.courseId, courses.id))
      .where(eq(groupCourses.groupId, groupId))
      .all();
  }

  assign(groupId: number, courseId: number) {
    // Verificar si ya existe
    const existing = this.db
      .select()
      .from(groupCourses)
      .where(
        and(
          eq(groupCourses.groupId, groupId),
          eq(groupCourses.courseId, courseId)
        )
      )
      .get();

    if (existing) {
      return existing;
    }

    return this.db
      .insert(groupCourses)
      .values({
        groupId,
        courseId,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  unassign(id: number) {
    return this.db.delete(groupCourses).where(eq(groupCourses.id, id)).run();
  }
}



