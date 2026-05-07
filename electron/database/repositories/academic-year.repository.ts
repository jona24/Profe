import { eq } from 'drizzle-orm';
import { academicYears } from '../schema.js';
import type { Database } from '../db.js';

export class AcademicYearRepository {
  constructor(private db: Database) {}

  getAll() {
    return this.db.select().from(academicYears).all();
  }

  getById(id: number) {
    return this.db.select().from(academicYears).where(eq(academicYears.id, id)).get();
  }

  create(data: {
    label: string;
    startDate: Date;
    endDate: Date;
  }) {
    return this.db
      .insert(academicYears)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  update(id: number, data: Partial<typeof academicYears.$inferInsert>) {
    return this.db
      .update(academicYears)
      .set(data)
      .where(eq(academicYears.id, id))
      .returning()
      .get();
  }

  delete(id: number) {
    return this.db.delete(academicYears).where(eq(academicYears.id, id)).run();
  }
}



