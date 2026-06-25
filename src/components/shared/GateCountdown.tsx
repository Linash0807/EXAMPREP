'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useGateStore } from '@/store/useGateStore';

export default function GateCountdown() {
  const { preferences, hasHydrated } = useGateStore();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [prepProgress, setPrepProgress] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    const calculateTime = () => {
      const gateTime = new Date(`${preferences.gateDate}T09:00:00`).getTime();
      const now = new Date().getTime();
      const difference = gateTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setPrepProgress(100);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      // Calculate progress of preparation time elapsed
      const startSecs = new Date(preferences.startDate).getTime();
      const totalPrepTime = gateTime - startSecs;
      const elapsedPrepTime = now - startSecs;
      
      const percent = Math.min(100, Math.max(0, (elapsedPrepTime / totalPrepTime) * 100));
      setPrepProgress(parseFloat(percent.toFixed(2)));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [preferences.gateDate, preferences.startDate, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="glass-card px-4 py-3.5 rounded-xl flex items-center justify-center h-16 animate-pulse">
        <span className="text-sm text-zinc-500 font-medium">Synchronizing Countdown...</span>
      </div>
    );
  }

  const formatUnit = (val: number) => val.toString().padStart(2, '0');

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col justify-between h-full border border-purple-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase tracking-wider font-semibold">GATE 2027 Countdown</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          {new Date(preferences.gateDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center my-1.5">
        <div className="bg-zinc-950/40 rounded p-1.5 border border-zinc-900">
          <div className="text-2xl font-black text-white leading-none font-mono">{timeLeft.days}</div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Days</div>
        </div>
        <div className="bg-zinc-950/40 rounded p-1.5 border border-zinc-900">
          <div className="text-2xl font-black text-purple-200 leading-none font-mono">{formatUnit(timeLeft.hours)}</div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Hrs</div>
        </div>
        <div className="bg-zinc-950/40 rounded p-1.5 border border-zinc-900">
          <div className="text-2xl font-black text-purple-300 leading-none font-mono">{formatUnit(timeLeft.minutes)}</div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Mins</div>
        </div>
        <div className="bg-zinc-950/40 rounded p-1.5 border border-zinc-900">
          <div className="text-2xl font-black text-purple-400 leading-none font-mono animate-pulse">{formatUnit(timeLeft.seconds)}</div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Secs</div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-[9px] text-zinc-500 mb-1">
          <span>Preparation Timeline Elapsed</span>
          <span className="font-semibold text-purple-300">{prepProgress}%</span>
        </div>
        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
          <div 
            className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 h-full rounded-full transition-all duration-1000"
            style={{ width: `${prepProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
