import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Configuracion from './pages/Configuracion';
import Colegios from './pages/Colegios';
import AñosLectivos from './pages/AñosLectivos';
import Grupos from './pages/Grupos';
import Estudiantes from './pages/Estudiantes';
import Cursos from './pages/Cursos';
import Rubricas from './pages/Rubricas';
import Actividades from './pages/Actividades';
import Calificaciones from './pages/Calificaciones';
import Asistencia from './pages/Asistencia';
import Reportes from './pages/Reportes';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/colegios" replace />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/colegios" element={<Colegios />} />
            <Route path="/años-lectivos" element={<AñosLectivos />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/estudiantes" element={<Estudiantes />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/rubricas" element={<Rubricas />} />
            <Route path="/actividades" element={<Actividades />} />
            <Route path="/calificaciones" element={<Calificaciones />} />
            <Route path="/asistencia" element={<Asistencia />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

