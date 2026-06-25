'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarDays, 
  CheckSquare, 
  BarChart3, 
  GitCompare, 
  MessageSquareCode, 
  Zap,
  Flame,
  Clock
} from 'lucide-react';
import { useGateStore } from '@/store/useGateStore';
import { getSubjectHours } from '@/utils/plannerAlgorithm';

export default function Sidebar() {
  const pathname = usePathname();
  const { subjects, resources, habits, preferences, hasHydrated } = useGateStore();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Resource Manager', href: '/resources', icon: BookOpen },
    { name: 'AI Timeline Planner', href: '/planner', icon: CalendarDays },
    { name: 'PYQ & Mock Tracker', href: '/tracker', icon: CheckSquare },
    { name: 'Analytics Control', href: '/analytics', icon: BarChart3 },
    { name: 'Resource Comparison', href: '/compare', icon: GitCompare },
    { name: 'AI Chat Assistant', href: '/assistant', icon: MessageSquareCode },
  ];

  // Calculate stats for sidebar summary
  const getSidebarStats = () => {
    if (!hasHydrated) return { streak: 0, completedHours: 0 };
    
    // Streaks
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
    
    // Completed hours
    let completedHours = 0;
    subjects.forEach((sub) => {
      const hours = getSubjectHours(sub.id, resources, preferences.playbackSpeed);
      completedHours += hours.completed;
    });

    return {
      streak: maxStreak,
      completedHours: parseFloat(completedHours.toFixed(1)),
    };
  };

  const stats = getSidebarStats();

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-900 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center glow-primary">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">GATE 2027</h1>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">AI Command Center</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive 
                  ? 'bg-purple-600/15 border border-purple-500/25 text-purple-200' 
                  : 'text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Prep Summary */}
      <div className="p-4 border-t border-zinc-900 space-y-3 bg-zinc-950/30">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-[10.5px] text-zinc-400 font-medium">Preparation Streak</span>
          </div>
          <span className="text-xs font-black text-white font-mono">{stats.streak} Days</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-[10.5px] text-zinc-400 font-medium">Logged Study Time</span>
          </div>
          <span className="text-xs font-black text-white font-mono">{stats.completedHours}h</span>
        </div>
      </div>
    </aside>
  );
}
