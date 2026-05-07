# Guía de Instalación - Gestor Académico

## Requisitos Previos

- **Node.js 18 o superior** - [Descargar Node.js](https://nodejs.org/)
- **npm** (viene con Node.js)
- **Windows 10/11** (para ejecutar la aplicación)

## Instalación Paso a Paso

### 1. Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias. Puede tardar varios minutos.

### 2. Ejecutar en Modo Desarrollo

Para probar la aplicación antes de construir el ejecutable:

```bash
npm run electron:dev
```

Esto iniciará:
- El servidor de desarrollo de Vite (en http://localhost:5173)
- La ventana de Electron con la aplicación

**Nota:** En modo desarrollo, las herramientas de desarrollador se abren automáticamente.

### 3. Construir Ejecutable para Windows

Para crear el instalador de Windows:

```bash
npm run electron:build
```

El proceso puede tardar varios minutos. Al finalizar, encontrarás:

- **Instalador:** `release/Gestor Académico Setup X.X.X.exe`
- **Carpeta descomprimida:** `release/win-unpacked/` (para ejecutar sin instalar)

### 4. Instalar la Aplicación

1. Ejecuta el archivo `Gestor Académico Setup X.X.X.exe`
2. Sigue el asistente de instalación
3. La aplicación se instalará en la ubicación que elijas

## Primera Ejecución

1. **Abrir la aplicación** desde el menú de inicio o el escritorio
2. **Configurar tus datos:**
   - Ve a "Configuración"
   - Completa tu nombre y datos personales
   - Configura encabezados y pies de página para reportes

3. **Crear tu primer colegio:**
   - Ve a "Colegios"
   - Haz clic en "Nuevo Colegio"
   - Completa la información

4. **Crear un año lectivo:**
   - Los años lectivos se pueden crear desde la base de datos o manualmente

5. **Crear grupos y agregar estudiantes:**
   - Ve a "Grupos" para crear grupos
   - Ve a "Estudiantes" para agregar estudiantes (puedes importar desde CSV)

## Solución de Problemas

### Error: "Cannot find module"

```bash
# Elimina node_modules y reinstala
rm -rf node_modules
npm install
```

### Error al construir el ejecutable

Asegúrate de tener todas las dependencias instaladas:

```bash
npm install --save-dev electron-builder
```

### La aplicación no inicia

1. Verifica que Node.js 18+ esté instalado: `node --version`
2. Revisa la consola para ver errores
3. Intenta ejecutar en modo desarrollo para ver errores detallados

### Error de permisos en Windows

Ejecuta la terminal como administrador si es necesario.

## Estructura de Archivos Generados

Después de la primera ejecución, se crearán:

```
%APPDATA%/gestor-academico/
├── database/
│   └── gestor_academico.db    # Base de datos SQLite
└── logos/                      # Logos de colegios (si se suben)
```

## Desarrollo

### Scripts Disponibles

- `npm run dev` - Solo servidor de desarrollo Vite
- `npm run electron:dev` - Vite + Electron en desarrollo
- `npm run build` - Construir aplicación completa
- `npm run lint` - Verificar código con ESLint

### Modificar Código

- **Frontend (React):** Edita archivos en `src/`
- **Backend (Electron):** Edita archivos en `electron/`
- **Base de datos:** El esquema está en `electron/database/schema.ts`

Los cambios se reflejan automáticamente en modo desarrollo.

## Notas Importantes

- **Datos locales:** Todos los datos se guardan localmente en tu computadora
- **Respaldos:** Exporta respaldos regularmente desde "Reportes"
- **Portabilidad:** Puedes copiar la carpeta `%APPDATA%/gestor-academico/` a otra PC y restaurar el respaldo

## Soporte

Si encuentras problemas:

1. Revisa los errores en la consola (F12 en modo desarrollo)
2. Verifica que todas las dependencias estén instaladas
3. Consulta el archivo `README.md` para más información



