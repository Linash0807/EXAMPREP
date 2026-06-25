'use client';

import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Trophy } from 'lucide-react';
import { useTimerStore } from '@/store/useGateStore';

export default function PomodoroTimer() {
  const { pomodoro, startPomodoro, pausePomodoro, tickPomodoro, resetPomodoro } = useTimerStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio beep using browser Web Audio API
  const playAlert = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      // Dual-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  };

  useEffect(() => {
    if (pomodoro.isRunning) {
      timerRef.current = setInterval(() => {
        const prevMode = pomodoro.mode;
        tickPomodoro();
        
        // Check if mode switched after tick
        const currentStoreState = useTimerStore.getState().pomodoro;
        if (currentStoreState.mode !== prevMode) {
          playAlert();
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pomodoro.isRunning, tickPomodoro, pomodoro.mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((pomodoro.duration - pomodoro.timeLeft) / pomodoro.duration) * 100;

  return (
    <div className="glass-card p-4 rounded-xl relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background progress indicator bar */}
      <div 
        className="absolute bottom-0 left-0 h-1 gradient-accent transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />
      
      <div className="flex items-center gap-2 mb-2">
        {pomodoro.mode === 'work' ? (
          <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
        ) : (
          <Coffee className="w-4 h-4 text-blue-400" />
        )}
        <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
          {pomodoro.mode === 'work' ? 'Deep Work Session' : 'Short Break'}
        </span>
      </div>

      <div className="text-3xl font-extrabold tracking-tighter text-white glow-text-primary mb-3 font-mono">
        {formatTime(pomodoro.timeLeft)}
      </div>

      <div className="flex items-center gap-3">
        {pomodoro.isRunning ? (
          <button 
            onClick={pausePomodoro}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Pause Timer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button 
            onClick={startPomodoro}
            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition glow-primary"
            title="Start Timer"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        )}
        
        <button 
          onClick={() => resetPomodoro()}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button 
          onClick={() => resetPomodoro(pomodoro.mode === 'work' ? 'break' : 'work')}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold uppercase tracking-wider transition underline"
        >
          Switch to {pomodoro.mode === 'work' ? 'Break' : 'Work'}
        </button>
      </div>

      {pomodoro.completedSessions > 0 && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-500">
          <Trophy className="w-3 h-3 text-amber-500" />
          <span>Sessions Completed Today: {pomodoro.completedSessions}</span>
        </div>
      )}
    </div>
  );
}
