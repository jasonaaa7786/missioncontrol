import { Outlet } from 'react-router-dom';
import IconNav from './IconNav';
import ActivityFeed from './ActivityFeed';
import '../../styles/cyberpunk.css';

export default function CyberLayout() {
  return (
    <div className="relative min-h-screen">
      {/* Atmospheric Background */}
      <div className="cyber-bg" />

      {/* Left Icon Navigation */}
      <IconNav />

      {/* Main Content Area */}
      <main 
        className="ml-[62px] mr-[272px] min-h-screen relative z-10"
        style={{ 
          minHeight: '100vh',
        }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Right Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
