import { eq } from 'drizzle-orm';
import { teacherConfig } from '../schema.js';
import type { Database } from '../db.js';

export class ConfigRepository {
  constructor(private db: Database) {}

  get() {
    const config = this.db.select().from(teacherConfig).limit(1).get();
    if (!config) {
      // Crear configuración por defecto
      return this.db
        .insert(teacherConfig)
        .values({
          name: 'Profesor',
          periodType: 'trimestre',
          updatedAt: new Date(),
        })
        .returning()
        .get();
    }
    return config;
  }

  update(data: Partial<typeof teacherConfig.$inferInsert>) {
    const existing = this.get();
    return this.db
      .update(teacherConfig)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teacherConfig.id, existing.id))
      .returning()
      .get();
  }
}

