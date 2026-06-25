'use client';

import { usePathname } from 'next/navigation';
import { Clock, Play, HelpCircle, Bell, Settings, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGateStore } from '@/store/useGateStore';

export default function Header() {
  const pathname = usePathname();
  const { preferences, hasHydrated, toggleSidebar } = useGateStore();
  const [timeStr, setTimeStr] = useState('');

  // Clock ticks every second
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeStr(date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Command Center';
      case '/resources':
        return 'Resource Manager';
      case '/planner':
        return 'AI Timeline Planner';
      case '/tracker':
        return 'PYQ & Mock Tracker';
      case '/analytics':
        return 'Analytics Control';
      case '/compare':
        return 'Resource Comparison';
      case '/assistant':
        return 'AI Chat Assistant';
      default:
        return 'Command Center';
    }
  };

  const getDaysUntilGate = () => {
    if (!hasHydrated) return '---';
    const gateTime = new Date(preferences.gateDate).getTime();
    const now = new Date().getTime();
    const diff = gateTime - now;
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Title & Mobile Hamburger Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleSidebar()}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900/50 border border-zinc-800 md:hidden transition active:scale-95"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-extrabold text-white tracking-tight uppercase">{getPageTitle()}</h2>
          <p className="text-[10px] text-zinc-500 font-medium">GATE 2027 Preparation Portal</p>
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center gap-6">
        {/* Countdown Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/20 border border-purple-500/25">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="text-[10.5px] font-bold text-purple-200">
            {getDaysUntilGate()} Days to GATE
          </span>
        </div>

        {/* Clock Pill */}
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10.5px] bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800/80">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-300 font-bold">{timeStr || '--:--:--'}</span>
        </div>

        {/* Small icons */}
        <div className="flex items-center gap-3 text-zinc-500 border-l border-zinc-800 pl-4">
          <button 
            className="hover:text-zinc-300 transition" 
            title="Syllabus Info"
            onClick={() => alert("GATE CS 2027 Official Syllabus: 10 Technical Subjects + General Aptitude + Math. Full weightage rules configured in weightage engine.")}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="relative">
            <button className="hover:text-zinc-300 transition" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
