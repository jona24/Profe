import { eq } from 'drizzle-orm';
import { courses } from '../schema.js';
import type { Database } from '../db.js';

export class CourseRepository {
  constructor(private db: Database) {}

  getAll() {
    return this.db.select().from(courses).all();
  }

  getById(id: number) {
    return this.db.select().from(courses).where(eq(courses.id, id)).get();
  }

  create(data: {
    name: string;
    code?: string;
    description?: string;
  }) {
    const now = new Date();
    return this.db
      .insert(courses)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  }

  update(id: number, data: Partial<typeof courses.$inferInsert>) {
    return this.db
      .update(courses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning()
      .get();
  }

  delete(id: number) {
    return this.db.delete(courses).where(eq(courses.id, id)).run();
  }
}



