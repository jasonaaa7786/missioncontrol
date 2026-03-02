import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-mission-400">Mission Control</h1>
          <p className="text-xs text-gray-400 mt-1">OpenClaw Operations</p>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <NavItem to="/dashboard" icon="📊">Dashboard</NavItem>
          <NavItem to="/projects" icon="📁">Projects</NavItem>
          <NavItem to="/agents" icon="🤖">Agents</NavItem>
          <NavItem to="/scheduler" icon="⏰">Scheduler</NavItem>
          <NavItem to="/settings" icon="⚙️">Settings</NavItem>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-mission-600 flex items-center justify-center text-white font-medium">
              {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-mission-600 text-white'
            : 'text-gray-300 hover:bg-gray-700'
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </NavLink>
  );
}
