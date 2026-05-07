# Arquitectura - Sistema de Gestión Académica para Profesores

## Decisión de Stack

### Tecnología Principal: **Electron**
**Razones:**
- ✅ Madurez y estabilidad del ecosistema
- ✅ Excelente soporte para SQLite (better-sqlite3)
- ✅ Amplia compatibilidad con librerías Node.js para PDFs
- ✅ Más fácil de depurar y desarrollar
- ✅ Mejor documentación y comunidad
- ✅ Tauri es más ligero pero requiere más configuración inicial

### Stack Tecnológico Completo

**Frontend:**
- React 18 + TypeScript
- Vite (build tool rápido)
- Tailwind CSS (estilos)
- shadcn/ui (componentes UI modernos)
- React Router (navegación)

**Backend (Electron Main Process):**
- Node.js
- better-sqlite3 (SQLite local)
- Drizzle ORM (gestión de base de datos)
- electron-store (configuración local)

**Utilidades:**
- pdf-lib (generación de PDFs)
- jszip (empaquetado de respaldos)
- papaparse (importación CSV de estudiantes)
- date-fns (manejo de fechas)

## Arquitectura de Módulos

```
┌─────────────────────────────────────────────────┐
│           ELECTRON MAIN PROCESS                 │
│  ┌──────────────────────────────────────────┐   │
│  │  Database Service (SQLite + Drizzle)     │   │
│  │  - SchoolRepository                       │   │
│  │  - GroupRepository                        │   │
│  │  - StudentRepository                      │   │
│  │  - CourseRepository                       │   │
│  │  - RubricRepository                       │   │
│  │  - AssessmentRepository                   │   │
│  │  - GradeRepository                        │   │
│  │  - AttendanceRepository                   │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  IPC Handlers (Comunicación con Renderer)│   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  Backup Service (Export/Import)          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────────────┐
│         ELECTRON RENDERER PROCESS               │
│  ┌──────────────────────────────────────────┐   │
│  │  React App (UI)                          │   │
│  │  - Configuración                         │   │
│  │  - Colegios                              │   │
│  │  - Grupos                                │   │
│  │  - Estudiantes                           │   │
│  │  - Cursos                                │   │
│  │  - Rúbricas                              │   │
│  │  - Actividades                           │   │
│  │  - Calificaciones                        │   │
│  │  - Asistencia                            │   │
│  │  - Reportes                              │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  IPC Client (Comunicación con Main)      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Estructura de Carpetas

```
gestor-academico/
├── electron/
│   ├── main.ts                 # Proceso principal de Electron
│   ├── preload.ts              # Script de preload (seguridad)
│   └── database/
│       ├── schema.ts           # Esquema Drizzle
│       ├── migrations/         # Migraciones de BD
│       ├── repositories/       # Repositorios de datos
│       └── services/           # Servicios de negocio
├── src/
│   ├── main.tsx                # Entry point React
│   ├── App.tsx                 # Componente raíz
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # shadcn/ui components
│   │   └── shared/             # Componentes compartidos
│   ├── pages/                  # Páginas principales
│   │   ├── Configuracion/
│   │   ├── Colegios/
│   │   ├── Grupos/
│   │   ├── Estudiantes/
│   │   ├── Cursos/
│   │   ├── Rubricas/
│   │   ├── Actividades/
│   │   ├── Calificaciones/
│   │   ├── Asistencia/
│   │   └── Reportes/
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilidades
│   │   ├── ipc.ts              # Cliente IPC
│   │   └── utils.ts            # Funciones auxiliares
│   └── types/                  # TypeScript types
├── public/                     # Assets estáticos
├── database/                   # SQLite file (generado)
├── backups/                    # Respaldos exportados
└── package.json
```

## Modelo de Datos

### Entidades Principales

1. **School** - Colegios/Instituciones
2. **AcademicYear** - Años lectivos
3. **Group** - Grupos de estudiantes
4. **Student** - Estudiantes
5. **GroupStudent** - Relación muchos a muchos
6. **Course** - Cursos/Materias
7. **GroupCourse** - Asignación curso-grupo
8. **RubricTemplate** - Plantillas de rúbricas
9. **RubricInstance** - Instancias de rúbrica por grupo-curso
10. **Assessment** - Actividades evaluativas
11. **Grade** - Calificaciones
12. **AttendanceSession** - Sesiones de clase
13. **AttendanceRecord** - Registros de asistencia

## Flujo de Datos

1. **UI (React)** → Llama a IPC client
2. **IPC Client** → Envía mensaje al Main Process
3. **IPC Handler** → Recibe mensaje y llama al Repository
4. **Repository** → Ejecuta query con Drizzle
5. **SQLite** → Persiste datos localmente
6. **Respuesta** → Vuelve por IPC al Renderer
7. **React** → Actualiza UI

## Características de Seguridad

- Preload script para exponer solo APIs necesarias
- Validación de datos en ambos procesos
- Sanitización de inputs
- Opcional: PIN/contraseña (encriptación local con crypto)

## Sistema de Respaldos

- Exportar: SQLite DB + carpeta de logos → archivo .zip
- Importar: Descomprimir .zip → reemplazar DB y logos
- Validación de integridad antes de importar



