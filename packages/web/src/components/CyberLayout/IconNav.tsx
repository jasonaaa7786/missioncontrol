import { NavLink } from 'react-router-dom';
import { 
  ChartLine, 
  MagnifyingGlass, 
  FolderOpen, 
  Robot, 
  CalendarBlank, 
  ChatCircle, 
  Gear,
  FlowArrow
} from '@phosphor-icons/react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <ChartLine size={24} />, label: 'Overview' },
  { to: '/artist-research', icon: <MagnifyingGlass size={24} />, label: 'Scout' },
  { to: '/projects', icon: <FolderOpen size={24} />, label: 'Projects' },
  { to: '/agents', icon: <Robot size={24} />, label: 'Agents' },
  { to: '/pipeline', icon: <FlowArrow size={24} />, label: 'Pipeline' },
  { to: '/scheduler', icon: <CalendarBlank size={24} />, label: 'Scheduler' },
  { to: '/chat', icon: <ChatCircle size={24} />, label: 'Chat' },
  { to: '/settings', icon: <Gear size={24} />, label: 'Settings' },
];

export default function IconNav() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-[62px] bg-cyber-bg-secondary border-r border-cyber-border flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center font-heading text-xs font-bold">
          CTRL
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-cyber-cyan text-cyber-bg-primary shadow-[0_0_20px_rgba(0,217,255,0.5)]'
                  : 'text-cyber-text-secondary hover:text-cyber-cyan hover:bg-cyber-bg-tertiary'
              }`
            }
          >
            {item.icon}
            
            {/* Tooltip */}
            <div className="absolute left-14 px-3 py-1.5 bg-cyber-bg-tertiary border border-cyber-border rounded-md 
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                          transition-all duration-200 whitespace-nowrap z-50
                          font-body text-sm font-medium">
              {item.label}
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 
                            border-t-[4px] border-t-transparent 
                            border-r-[4px] border-r-cyber-border 
                            border-b-[4px] border-b-transparent" />
            </div>
          </NavLink>
        ))}
      </div>

      {/* Status Indicator */}
      <div className="mt-auto">
        <div className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_10px_rgba(0,255,136,0.8)] animate-pulse" />
      </div>
    </nav>
  );
}
