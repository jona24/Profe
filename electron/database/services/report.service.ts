import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getDatabase } from '../db.js';
import { eq, and } from 'drizzle-orm';
import { students, groups, schools, groupCourses, courses, assessments, grades, attendanceSessions, attendanceRecords, groupStudents } from '../schema.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class ReportService {
  constructor(private db: ReturnType<typeof getDatabase>) {}

  async generateStudentReport(studentId: number, groupId: number, period?: string) {
    // Obtener datos del estudiante
    const student = this.db.select().from(students).where(eq(students.id, studentId)).get();
    if (!student) throw new Error('Estudiante no encontrado');

    // Obtener grupo
    const groupData = this.db
      .select({
        group: groups,
        school: schools,
      })
      .from(groups)
      .leftJoin(schools, eq(groups.schoolId, schools.id))
      .where(eq(groups.id, groupId))
      .get();
    if (!groupData) throw new Error('Grupo no encontrado');

    // Obtener cursos del grupo
    const groupCoursesData = this.db
      .select({
        groupCourse: groupCourses,
        course: courses,
      })
      .from(groupCourses)
      .innerJoin(courses, eq(groupCourses.courseId, courses.id))
      .where(eq(groupCourses.groupId, groupId))
      .all();

    // Obtener calificaciones por curso
    const courseGrades: any[] = [];
    for (const gc of groupCoursesData) {
      const assessmentsData = this.db
        .select()
        .from(assessments)
        .where(
          period
            ? and(
                eq(assessments.groupCourseId, gc.groupCourse.id),
                eq(assessments.period, period)
              )
            : eq(assessments.groupCourseId, gc.groupCourse.id)
        )
        .all();

      const courseGradeData = {
        course: gc.course,
        assessments: [] as any[],
        finalGrade: 0,
        totalWeight: 0,
      };

      for (const assessment of assessmentsData) {
        const grade = this.db
          .select()
          .from(grades)
          .where(
            and(
              eq(grades.assessmentId, assessment.id),
              eq(grades.studentId, studentId)
            )
          )
          .get();

        if (grade) {
          courseGradeData.assessments.push({
            assessment,
            grade,
          });
          if (grade.score !== null) {
            courseGradeData.finalGrade += (grade.score / assessment.maxScore) * assessment.weight;
            courseGradeData.totalWeight += assessment.weight;
          }
        }
      }

      if (courseGradeData.totalWeight > 0) {
        courseGradeData.finalGrade = (courseGradeData.finalGrade / courseGradeData.totalWeight) * 100;
      }

      courseGrades.push(courseGradeData);
    }

    // Obtener asistencia
    const attendanceData: any[] = [];
    for (const gc of groupCoursesData) {
      const sessions = this.db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.groupCourseId, gc.groupCourse.id))
        .all();

      let present = 0;
      let absent = 0;
      let late = 0;
      let justified = 0;

      for (const session of sessions) {
        const record = this.db
          .select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.sessionId, session.id),
              eq(attendanceRecords.studentId, studentId)
            )
          )
          .get();

        if (record) {
          if (record.status === 'present') present++;
          else if (record.status === 'absent') absent++;
          else if (record.status === 'late') late++;
          else if (record.status === 'justified') justified++;
        }
      }

      const total = present + absent + late + justified;
      attendanceData.push({
        course: gc.course,
        present,
        absent,
        late,
        justified,
        total,
        percentage: total > 0 ? ((present + justified) / total) * 100 : 0,
      });
    }

    // Generar PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const pageWidth = 495;

    // Logo del colegio (si existe)
    if (groupData.school?.logoPath && fs.existsSync(groupData.school.logoPath)) {
      try {
        const logoBytes = fs.readFileSync(groupData.school.logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoDims = logoImage.scale(0.2);
        page.drawImage(logoImage, {
          x: margin,
          y: y - logoDims.height,
          width: logoDims.width,
          height: logoDims.height,
        });
        y -= logoDims.height + 20;
      } catch (e) {
        // Si no es PNG, intentar JPG
        try {
          const logoBytes = fs.readFileSync(groupData.school.logoPath);
          const logoImage = await pdfDoc.embedJpg(logoBytes);
          const logoDims = logoImage.scale(0.2);
          page.drawImage(logoImage, {
            x: margin,
            y: y - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
          y -= logoDims.height + 20;
        } catch (e2) {
          // Ignorar si no se puede cargar
        }
      }
    }

    // Encabezado
    if (groupData.school?.reportHeader) {
      page.drawText(groupData.school.reportHeader, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 30;
    }

    // Título
    page.drawText('REPORTE ACADÉMICO', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
    });
    y -= 30;

    // Datos del estudiante
    page.drawText(`Estudiante: ${student.fullName}`, {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 20;
    page.drawText(`Identificación: ${student.identifier}`, {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= 20;
    page.drawText(`Grupo: ${groupData.group.name}`, {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= 20;
    if (period) {
      page.drawText(`Periodo: ${period}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 20;
    }
    y -= 10;

    // Calificaciones por curso
    page.drawText('CALIFICACIONES', {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 25;

    for (const courseGrade of courseGrades) {
      page.drawText(`${courseGrade.course.name}: ${courseGrade.finalGrade.toFixed(2)}%`, {
        x: margin + 20,
        y,
        size: 10,
        font,
      });
      y -= 15;

      // Detalle de actividades
      for (const item of courseGrade.assessments) {
        const score = item.grade.score !== null ? item.grade.score : 0;
        const percentage = (score / item.assessment.maxScore) * 100;
        page.drawText(
          `  - ${item.assessment.title}: ${score}/${item.assessment.maxScore} (${percentage.toFixed(1)}%) - Peso: ${item.assessment.weight}%`,
          {
            x: margin + 40,
            y,
            size: 9,
            font,
          }
        );
        y -= 12;
      }
      y -= 5;
    }

    y -= 10;

    // Asistencia
    page.drawText('ASISTENCIA', {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 25;

    for (const att of attendanceData) {
      page.drawText(
        `${att.course.name}: ${att.percentage.toFixed(1)}% (${att.present + att.justified}/${att.total})`,
        {
          x: margin + 20,
          y,
          size: 10,
          font,
        }
      );
      y -= 15;
    }

    // Pie de página
    if (groupData.school?.reportFooter) {
      y = 50;
      page.drawText(groupData.school.reportFooter, {
        x: margin,
        y,
        size: 9,
        font,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generateGroupReport(groupId: number, groupCourseId?: number, period?: string) {
    // Similar a generateStudentReport pero para todo el grupo
    // Implementación simplificada - se puede expandir
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Obtener grupo y estudiantes
    const groupData = this.db
      .select({
        group: groups,
        school: schools,
      })
      .from(groups)
      .leftJoin(schools, eq(groups.schoolId, schools.id))
      .where(eq(groups.id, groupId))
      .get();

    if (!groupData) throw new Error('Grupo no encontrado');

    const studentsData = this.db
      .select({
        student: students,
      })
      .from(students)
      .innerJoin(groupStudents, eq(students.id, groupStudents.studentId))
      .where(eq(groupStudents.groupId, groupId))
      .all()
      .map((row) => row.student);

    let y = 800;
    const margin = 50;

    // Encabezado
    page.drawText(`REPORTE DE GRUPO: ${groupData.group.name}`, {
      x: margin,
      y,
      size: 16,
      font: boldFont,
    });
    y -= 40;

    // Tabla de estudiantes
    for (const student of studentsData) {
      // Calcular promedio si hay groupCourseId
      let average = 0;
      if (groupCourseId) {
        const assessmentsData = this.db
          .select()
          .from(assessments)
          .where(
            period
              ? and(
                  eq(assessments.groupCourseId, groupCourseId),
                  eq(assessments.period, period)
                )
              : eq(assessments.groupCourseId, groupCourseId)
          )
          .all();

        let totalWeight = 0;
        let weightedSum = 0;

        for (const assessment of assessmentsData) {
          const grade = this.db
            .select()
            .from(grades)
            .where(
              and(
                eq(grades.assessmentId, assessment.id),
                eq(grades.studentId, student.id)
              )
            )
            .get();

          if (grade && grade.score !== null) {
            weightedSum += (grade.score / assessment.maxScore) * assessment.weight;
            totalWeight += assessment.weight;
          }
        }

        if (totalWeight > 0) {
          average = (weightedSum / totalWeight) * 100;
        }
      }

      page.drawText(
        `${student.fullName}: ${average.toFixed(2)}%`,
        {
          x: margin,
          y,
          size: 10,
          font,
        }
      );
      y -= 15;

      if (y < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        y = 800;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}



