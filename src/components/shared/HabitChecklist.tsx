'use client';

import { useState } from 'react';
import { Check, Plus, Trash2, Flame, Sparkles } from 'lucide-react';
import { useGateStore } from '@/store/useGateStore';
import confetti from 'canvas-confetti';

export default function HabitChecklist() {
  const { habits, toggleHabit, addHabit, deleteHabit, hasHydrated } = useGateStore();
  const [newHabitName, setNewHabitName] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggle = (id: string, name: string) => {
    const habit = habits.find(h => h.id === id);
    const wasCompleted = habit?.completedDates.includes(todayStr);
    
    toggleHabit(id, todayStr);

    if (!wasCompleted) {
      // Pop confetti!
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#7c3aed', '#3b82f6']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#7c3aed', '#3b82f6']
      });
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim());
    setNewHabitName('');
  };

  if (!hasHydrated) {
    return (
      <div className="glass-card p-4 rounded-xl animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-zinc-800 rounded"></div>
          <div className="h-10 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col h-full border border-purple-500/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase tracking-wider font-semibold">Daily Habit Tracker</span>
        </div>
        <span className="text-[10px] text-purple-300 font-semibold px-2 py-0.5 rounded bg-purple-950/40 border border-purple-900/30">
          Consistency Engine
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
        {habits.map((habit) => {
          const isCompletedToday = habit.completedDates.includes(todayStr);
          
          return (
            <div 
              key={habit.id} 
              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                isCompletedToday 
                  ? 'bg-purple-950/10 border-purple-500/30 text-zinc-200' 
                  : 'bg-zinc-950/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleToggle(habit.id, habit.name)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    isCompletedToday 
                      ? 'bg-purple-600 border-purple-500 text-white' 
                      : 'border-zinc-600 hover:border-purple-500 bg-zinc-900'
                  }`}
                >
                  {isCompletedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className={`text-xs font-medium ${isCompletedToday ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                  {habit.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {habit.streak > 0 && (
                  <div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-bold font-mono">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 stroke-none" />
                    <span>{habit.streak}d</span>
                  </div>
                )}
                {/* Only custom habits can be deleted */}
                {!['h1', 'h2', 'h3'].includes(habit.id) && (
                  <button 
                    onClick={() => deleteHabit(habit.id)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input 
          type="text" 
          placeholder="Add custom habit..." 
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          className="flex-1 text-xs bg-zinc-950/50 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-600"
        />
        <button 
          type="submit"
          className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 transition flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
