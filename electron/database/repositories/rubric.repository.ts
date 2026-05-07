import { eq, and } from 'drizzle-orm';
import { rubricTemplates, rubricInstances, courses } from '../schema.js';
import type { Database } from '../db.js';

export class RubricRepository {
  constructor(private db: Database) {}

  // ========== PLANTILLAS ==========
  getAllTemplates(courseId?: number) {
    if (courseId) {
      return this.db
        .select({
          template: rubricTemplates,
          course: courses,
        })
        .from(rubricTemplates)
        .leftJoin(courses, eq(rubricTemplates.courseId, courses.id))
        .where(eq(rubricTemplates.courseId, courseId))
        .all();
    }
    return this.db
      .select({
        template: rubricTemplates,
        course: courses,
      })
      .from(rubricTemplates)
      .leftJoin(courses, eq(rubricTemplates.courseId, courses.id))
      .all();
  }

  getTemplateById(id: number) {
    return this.db
      .select({
        template: rubricTemplates,
        course: courses,
      })
      .from(rubricTemplates)
      .leftJoin(courses, eq(rubricTemplates.courseId, courses.id))
      .where(eq(rubricTemplates.id, id))
      .get();
  }

  createTemplate(data: {
    name: string;
    courseId?: number;
    version: string;
    definitionJson: string;
  }) {
    const now = new Date();
    return this.db
      .insert(rubricTemplates)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  }

  updateTemplate(id: number, data: Partial<typeof rubricTemplates.$inferInsert>) {
    return this.db
      .update(rubricTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(rubricTemplates.id, id))
      .returning()
      .get();
  }

  deleteTemplate(id: number) {
    return this.db.delete(rubricTemplates).where(eq(rubricTemplates.id, id)).run();
  }

  cloneTemplate(id: number, newVersion: string) {
    const original = this.getTemplateById(id);
    if (!original) {
      throw new Error('Plantilla no encontrada');
    }

    return this.createTemplate({
      name: original.template.name,
      courseId: original.template.courseId || undefined,
      version: newVersion,
      definitionJson: original.template.definitionJson,
    });
  }

  // ========== INSTANCIAS ==========
  getInstancesByGroupCourse(groupCourseId: number) {
    return this.db
      .select({
        instance: rubricInstances,
        template: rubricTemplates,
      })
      .from(rubricInstances)
      .innerJoin(rubricTemplates, eq(rubricInstances.templateId, rubricTemplates.id))
      .where(eq(rubricInstances.groupCourseId, groupCourseId))
      .all();
  }

  createInstance(data: {
    templateId: number;
    groupCourseId: number;
    overridesJson?: string;
    active?: boolean;
  }) {
    return this.db
      .insert(rubricInstances)
      .values({
        ...data,
        active: data.active ?? true,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  updateInstance(id: number, data: Partial<typeof rubricInstances.$inferInsert>) {
    return this.db
      .update(rubricInstances)
      .set(data)
      .where(eq(rubricInstances.id, id))
      .returning()
      .get();
  }
}



