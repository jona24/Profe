import { Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  School, 
  Users, 
  User, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  GraduationCap, 
  Calendar,
  FileBarChart,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Colegios', href: '/colegios', icon: School },
  { name: 'Años Lectivos', href: '/años-lectivos', icon: CalendarDays },
  { name: 'Grupos', href: '/grupos', icon: Users },
  { name: 'Estudiantes', href: '/estudiantes', icon: User },
  { name: 'Cursos', href: '/cursos', icon: BookOpen },
  { name: 'Rúbricas', href: '/rubricas', icon: ClipboardList },
  { name: 'Actividades', href: '/actividades', icon: FileText },
  { name: 'Calificaciones', href: '/calificaciones', icon: GraduationCap },
  { name: 'Asistencia', href: '/asistencia', icon: Calendar },
  { name: 'Reportes', href: '/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary">Gestor Académico</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de gestión para profesores</p>
          </div>
          <nav className="px-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

