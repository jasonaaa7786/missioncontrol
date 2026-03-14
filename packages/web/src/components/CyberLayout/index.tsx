import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import IconNav from './IconNav';
import ActivityFeed from './ActivityFeed';
import '../../styles/cyberpunk.css';

export default function CyberLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Atmospheric Background */}
      <div className="cyber-bg" />

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-cyber-bg-secondary border-b border-cyber-border z-50 flex items-center justify-between px-4">
        <button
          onClick={() => { setMobileNavOpen(true); setMobileActivityOpen(false); }}
          className="p-2 text-cyber-text-secondary hover:text-cyber-cyan transition-colors"
        >
          <List size={24} />
        </button>
        <div className="w-8 h-8 rounded-lg overflow-hidden">
          <img src="/assets/l3-logo.jpg" alt="L3" className="w-full h-full object-contain" />
        </div>
        <button
          onClick={() => { setMobileActivityOpen(!mobileActivityOpen); setMobileNavOpen(false); }}
          className="p-2 text-cyber-text-secondary hover:text-cyber-cyan transition-colors text-xs font-heading uppercase"
        >
          Feed
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-[62px]"
            onClick={(e) => e.stopPropagation()}
          >
            <IconNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Activity Overlay */}
      {mobileActivityOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 pt-14"
          onClick={() => setMobileActivityOpen(false)}
        >
          <div
            className="absolute right-0 top-14 h-[calc(100%-3.5rem)] w-[300px] max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <ActivityFeed />
          </div>
        </div>
      )}

      {/* Left Icon Navigation — desktop only */}
      <div className="hidden lg:block">
        <IconNav />
      </div>

      {/* Main Content Area */}
      <main
        className="lg:ml-[62px] lg:mr-[272px] min-h-screen relative z-10 pt-14 lg:pt-0"
        style={{ minHeight: '100vh' }}
      >
        <div className="p-2 sm:p-3 lg:p-4">
          <Outlet />
        </div>
      </main>

      {/* Right Activity Feed — desktop only */}
      <div className="hidden lg:block">
        <ActivityFeed />
      </div>
    </div>
  );
}
