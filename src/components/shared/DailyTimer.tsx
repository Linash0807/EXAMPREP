'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Save, CheckCircle } from 'lucide-react';
import { useGateStore, useTimerStore } from '@/store/useGateStore';
import confetti from 'canvas-confetti';

export default function DailyTimer() {
  const { dailyTimer, startDailyTimer, pauseDailyTimer, tickDailyTimer, resetDailyTimer } = useTimerStore();
  const { subjects, logStudySession } = useGateStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    if (dailyTimer.isRunning) {
      timerRef.current = setInterval(() => {
        tickDailyTimer();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dailyTimer.isRunning, tickDailyTimer]);

  // Set default subject if empty
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      // Find the first ready or in_progress subject
      const activeSub = subjects.find(s => s.status === 'in_progress') || subjects.find(s => s.status === 'ready') || subjects[0];
      setSelectedSubjectId(activeSub.id);
    }
  }, [subjects, selectedSubjectId]);

  const formatStopwatch = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const handleLogSession = () => {
    if (dailyTimer.elapsedTime < 60) {
      alert('Study session must be at least 1 minute to log!');
      return;
    }

    const hoursToLog = parseFloat((dailyTimer.elapsedTime / 3600).toFixed(2));
    logStudySession(selectedSubjectId, hoursToLog);
    
    // Confetti pop!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#7c3aed', '#3b82f6', '#10b981'],
    });

    resetDailyTimer();
    setIsLogging(false);
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2 w-2">
          {dailyTimer.isRunning && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dailyTimer.isRunning ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
        </span>
        <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
          Live Study Tracker
        </span>
      </div>

      <div className="text-3xl font-extrabold tracking-tighter text-white glow-text-success mb-3 font-mono">
        {formatStopwatch(dailyTimer.elapsedTime)}
      </div>

      {!isLogging ? (
        <div className="flex items-center gap-3">
          {dailyTimer.isRunning ? (
            <button 
              onClick={pauseDailyTimer}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Pause Tracker"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={startDailyTimer}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition glow-success"
              title="Start Study Timer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          <button 
            onClick={resetDailyTimer}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
            title="Reset stopwatch"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {dailyTimer.elapsedTime >= 60 && (
            <button 
              onClick={() => setIsLogging(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition font-medium glow-primary"
            >
              <Save className="w-3 h-3" />
              <span>Log</span>
            </button>
          )}
        </div>
      ) : (
        <div className="w-full mt-1 flex flex-col gap-2">
          <label className="text-[10px] text-zinc-400 uppercase font-semibold">Allocate study hours to:</label>
          <select 
            value={selectedSubjectId} 
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2 w-full">
            <button 
              onClick={handleLogSession}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition font-semibold"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirm
            </button>
            <button 
              onClick={() => setIsLogging(false)}
              className="flex-1 py-1.5 text-[11px] rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
