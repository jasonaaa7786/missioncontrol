import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CyberLayout from './components/CyberLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Agents from './pages/Agents';
import Scheduler from './pages/Scheduler';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import ArtistResearch from './pages/ArtistResearch';
import VenueSearch from './pages/VenueSearch';
import DatabaseSearch from './pages/DatabaseSearch';
import Pipeline from './pages/Pipeline';
import Reports from './pages/Reports';
import { Toaster } from './components/ui/sonner';
import './styles/cyberpunk.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CyberLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="artist-research" element={<ArtistResearch />} />
            <Route path="venue-search" element={<VenueSearch />} />
            <Route path="database-search" element={<DatabaseSearch />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="agents" element={<Agents />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="scheduler" element={<Scheduler />} />
            <Route path="documents" element={<Documents />} />
            <Route path="chat" element={<Chat />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
