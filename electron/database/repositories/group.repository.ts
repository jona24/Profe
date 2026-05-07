import { eq, and } from 'drizzle-orm';
import { groups, schools, academicYears } from '../schema.js';
import type { Database } from '../db.js';

export class GroupRepository {
  constructor(private db: Database) {}

  getAll(schoolId?: number) {
    if (schoolId) {
      return this.db
        .select({
          group: groups,
          school: schools,
          academicYear: academicYears,
        })
        .from(groups)
        .leftJoin(schools, eq(groups.schoolId, schools.id))
        .leftJoin(academicYears, eq(groups.academicYearId, academicYears.id))
        .where(eq(groups.schoolId, schoolId))
        .all();
    }
    return this.db
      .select({
        group: groups,
        school: schools,
        academicYear: academicYears,
      })
      .from(groups)
      .leftJoin(schools, eq(groups.schoolId, schools.id))
      .leftJoin(academicYears, eq(groups.academicYearId, academicYears.id))
      .all();
  }

  getById(id: number) {
    return this.db
      .select({
        group: groups,
        school: schools,
        academicYear: academicYears,
      })
      .from(groups)
      .leftJoin(schools, eq(groups.schoolId, schools.id))
      .leftJoin(academicYears, eq(groups.academicYearId, academicYears.id))
      .where(eq(groups.id, id))
      .get();
  }

  create(data: {
    schoolId: number;
    name: string;
    level?: string;
    section?: string;
    schedule?: string;
    academicYearId: number;
    period?: string;
  }) {
    const now = new Date();
    return this.db
      .insert(groups)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  }

  update(id: number, data: Partial<typeof groups.$inferInsert>) {
    return this.db
      .update(groups)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, id))
      .returning()
      .get();
  }

  delete(id: number) {
    return this.db.delete(groups).where(eq(groups.id, id)).run();
  }
}



