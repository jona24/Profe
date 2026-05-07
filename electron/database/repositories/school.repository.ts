import { eq } from 'drizzle-orm';
import { schools } from '../schema.js';
import type { Database } from '../db.js';

export class SchoolRepository {
  constructor(private db: Database) {}

  getAll() {
    return this.db.select().from(schools).all();
  }

  getById(id: number) {
    return this.db.select().from(schools).where(eq(schools.id, id)).get();
  }

  create(data: {
    name: string;
    address?: string;
    logoPath?: string;
    reportHeader?: string;
    reportFooter?: string;
  }) {
    const now = new Date();
    return this.db
      .insert(schools)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  }

  update(id: number, data: Partial<typeof schools.$inferInsert>) {
    return this.db
      .update(schools)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, id))
      .returning()
      .get();
  }

  delete(id: number) {
    return this.db.delete(schools).where(eq(schools.id, id)).run();
  }
}



