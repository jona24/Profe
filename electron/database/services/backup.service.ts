import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDatabasePath } from '../db.js';

export class BackupService {
  async export(filePath: string) {
    const zip = new JSZip();

    // Agregar base de datos
    const dbPath = getDatabasePath();
    if (fs.existsSync(dbPath)) {
      const dbData = fs.readFileSync(dbPath);
      zip.file('gestor_academico.db', dbData);
    }

    // Agregar logos y archivos
    const userDataPath = app.getPath('userData');
    const logosDir = path.join(userDataPath, 'logos');

    if (fs.existsSync(logosDir)) {
      const files = fs.readdirSync(logosDir);
      for (const file of files) {
        const filePath = path.join(logosDir, file);
        if (fs.statSync(filePath).isFile()) {
          const fileData = fs.readFileSync(filePath);
          zip.file(`logos/${file}`, fileData);
        }
      }
    }

    // Generar archivo ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(filePath, zipBuffer);

    return { success: true, path: filePath };
  }

  async import(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo de respaldo no encontrado');
    }

    const zipData = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(zipData);

    const userDataPath = app.getPath('userData');
    const dbPath = getDatabasePath();
    const dbDir = path.dirname(dbPath);

    // Crear directorio si no existe
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Extraer base de datos
    const dbFile = zip.file('gestor_academico.db');
    if (dbFile) {
      const dbBuffer = await dbFile.async('nodebuffer');
      fs.writeFileSync(dbPath, dbBuffer);
    }

    // Extraer logos
    const logosDir = path.join(userDataPath, 'logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    const logosFolder = zip.folder('logos');
    if (logosFolder) {
      for (const [filename, file] of Object.entries(logosFolder.files)) {
        if (!file.dir) {
          const fileBuffer = await file.async('nodebuffer');
          const targetPath = path.join(logosDir, filename);
          fs.writeFileSync(targetPath, fileBuffer);
        }
      }
    }

    return { success: true };
  }
}



