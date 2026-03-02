import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-mission-400">Mission Control</h1>
          <p className="text-xs text-gray-400 mt-1">OpenClaw Operations</p>
        </div>
        
        <nav className="p-4 space-y-2">
          <NavItem to="/dashboard" icon="📊">Dashboard</NavItem>
          <NavItem to="/projects" icon="📁">Projects</NavItem>
          <NavItem to="/agents" icon="🤖">Agents</NavItem>
          <NavItem to="/scheduler" icon="⏰">Scheduler</NavItem>
          <NavItem to="/settings" icon="⚙️">Settings</NavItem>
        </nav>
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
