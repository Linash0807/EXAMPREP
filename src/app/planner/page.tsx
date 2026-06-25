'use client';

import { useState } from 'react';
import { useGateStore } from '@/store/useGateStore';
import { 
  generateTimeline, 
  checkPlanFeasibility, 
  TimelineBlock 
} from '@/utils/plannerAlgorithm';
import { 
  Sliders, 
  Calendar as CalendarIcon, 
  GanttChart, 
  Info, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PlannerPage() {
  const { subjects, resources, preferences, updatePreferences, hasHydrated } = useGateStore();
  const [activeView, setActiveView] = useState<'gantt' | 'calendar' | 'table'>('gantt');
  
  // Calendar month navigation
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  if (!hasHydrated) {
    return (
      <div className="p-8 text-center text-zinc-500 font-semibold uppercase animate-pulse">
        Generating AI Timeline Scheduler...
      </div>
    );
  }

  // Calculate timeline & feasibility details
  const timeline = generateTimeline(subjects, resources, preferences);
  const feasibility = checkPlanFeasibility(subjects, resources, preferences);

  // Helper for Gantt bar calculations
  // Get start date and end date of the entire study plan
  const getPrepDateBounds = () => {
    if (timeline.length === 0) return { start: new Date(), end: new Date(), totalDays: 1 };
    
    // Find min start and max end
    let minTime = Infinity;
    let maxTime = -Infinity;
    
    timeline.forEach((b) => {
      const start = new Date(b.startDate).getTime();
      const end = new Date(b.endDate).getTime();
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });

    // Make sure we include GATE date if it is later
    const gateTime = new Date(preferences.gateDate).getTime();
    if (gateTime > maxTime) maxTime = gateTime;

    return {
      start: new Date(minTime),
      end: new Date(maxTime),
      totalDays: Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1
    };
  };

  const bounds = getPrepDateBounds();

  // Gantt block positioning helper
  const getGanttStyles = (block: TimelineBlock) => {
    const start = new Date(block.startDate).getTime();
    const end = new Date(block.endDate).getTime();
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const offsetDays = Math.ceil((start - bounds.start.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (offsetDays / bounds.totalDays) * 100;
    const widthPercent = (duration / bounds.totalDays) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  // Get color by block type
  const getBlockColor = (type: TimelineBlock['type']) => {
    switch (type) {
      case 'learning':
        return 'bg-purple-600/80 border-purple-500 text-purple-100';
      case 'revision_1':
        return 'bg-indigo-600/70 border-indigo-500 text-indigo-100';
      case 'revision_2':
        return 'bg-blue-600/70 border-blue-500 text-blue-100';
      case 'revision_3':
        return 'bg-amber-600/70 border-amber-500 text-amber-100';
      case 'pyqs':
        return 'bg-pink-600/30 border-pink-500/40 text-pink-300';
      case 'mock_tests':
        return 'bg-emerald-600/30 border-emerald-500/40 text-emerald-300 animate-pulse';
      default:
        return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    }
  };

  // Monthly Calendar generator
  const getCalendarDays = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
    const totalMonthDays = new Date(year, month + 1, 0).getDate();
    
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month pad
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalMonthDays; i++) {
      const d = new Date(year, month, i + 1); // fix offset timezone
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: i,
        isCurrentMonth: true
      });
    }

    return days;
  };

  // Find timeline blocks for a specific date
  const getBlocksForDate = (dateStr: string) => {
    return timeline.filter(b => dateStr >= b.startDate && dateStr <= b.endDate);
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto w-full">
      
      {/* LEFT SECTION: AI Plan Parameters & Simulation Sliders */}
      <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0">
        
        {/* SLIDERS & CONTROLS CARD */}
        <div className="glass-panel p-5 rounded-xl border border-purple-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Scenario Simulator</h3>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Input 1: Study hours per day */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Daily Study Hours</span>
                <span className="text-purple-300 font-bold font-mono">{preferences.dailyStudyHours} Hours</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={12} 
                value={preferences.dailyStudyHours}
                onChange={(e) => updatePreferences({ dailyStudyHours: parseInt(e.target.value) })}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-[9px] text-zinc-500 leading-normal">Adjust study quota to check feasibility in real-time.</span>
            </div>

            {/* Input 2: Playback Speed */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Video Playback Speed</span>
                <span className="text-purple-300 font-bold font-mono">{preferences.playbackSpeed}x</span>
              </div>
              <select 
                value={preferences.playbackSpeed}
                onChange={(e) => updatePreferences({ playbackSpeed: parseFloat(e.target.value) })}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-655"
              >
                <option value="1.0">1.0x (Normal speed)</option>
                <option value="1.25">1.25x Speed</option>
                <option value="1.5">1.5x Speed (Recommended)</option>
                <option value="1.75">1.75x Speed</option>
                <option value="2.0">2.0x (Max Speed)</option>
              </select>
              <span className="text-[9px] text-zinc-500">Video durations are automatically divided by this speed.</span>
            </div>

            {/* Input 3: Weekly Off Days */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Weekly Off Days</span>
                <span className="text-purple-300 font-bold font-mono">{preferences.weeklyOffDays} Days</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={2} 
                value={preferences.weeklyOffDays}
                onChange={(e) => updatePreferences({ weeklyOffDays: parseInt(e.target.value) })}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-[9px] text-zinc-500">Number of rest days per week (Saturdays/Sundays skipped in scheduler).</span>
            </div>

            {/* Input 4: Revision Cycles */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Revision Cycles</span>
                <span className="text-purple-300 font-bold font-mono">{preferences.revisionCycles} Cycles</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={3} 
                value={preferences.revisionCycles}
                onChange={(e) => updatePreferences({ revisionCycles: parseInt(e.target.value) })}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-[9px] text-zinc-500">Number of revision iterations (Rev 1: 30%, Rev 2: 20%, Rev 3: 10% duration).</span>
            </div>

            {/* Input 5: Date Settings */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-900">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Start Date</label>
                <input 
                  type="date" 
                  value={preferences.startDate}
                  onChange={(e) => updatePreferences({ startDate: e.target.value })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">GATE Exam Date</label>
                <input 
                  type="date" 
                  value={preferences.gateDate}
                  onChange={(e) => updatePreferences({ gateDate: e.target.value })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-200"
                />
              </div>
            </div>

          </div>
        </div>

        {/* FEASIBILITY COMPARISON PANEL */}
        <div className="glass-card p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Feasibility Check</h3>
          </div>

          <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 text-center">
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Required Study Rate</span>
            <div className="text-3xl font-black text-white leading-none font-mono">
              {feasibility.dailyHoursRequiredToFinish}h
            </div>
            <span className="text-[9px] text-zinc-400 font-medium block mt-1">Study hours/day needed to finish before GATE</span>
          </div>

          <div>
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">Simulated Completion Scenarios</span>
            <div className="space-y-2">
              {feasibility.simulations.map((sim) => (
                <div 
                  key={sim.hoursPerDay} 
                  className={`p-2.5 rounded-lg border flex justify-between items-center text-xs transition-all ${
                    sim.isFeasible 
                      ? 'bg-emerald-950/5 border-emerald-950/30 text-emerald-200' 
                      : 'bg-red-950/5 border-red-950/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {sim.isFeasible ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="font-bold">{sim.hoursPerDay} Hours/Day</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold">
                    {new Date(sim.completionDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SECTION: Gantt, Calendar, or Table Views */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* View Switcher Header */}
        <div className="glass-card p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">AI Generated Preparation Roadmap</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Topologically ordered based on course dependencies & weightages</p>
          </div>

          <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-900">
            <button 
              onClick={() => setActiveView('gantt')}
              className={`px-3 py-1.5 text-xs rounded-md transition font-medium flex items-center gap-1 ${activeView === 'gantt' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <GanttChart className="w-3.5 h-3.5" />
              Gantt View
            </button>
            <button 
              onClick={() => setActiveView('calendar')}
              className={`px-3 py-1.5 text-xs rounded-md transition font-medium flex items-center gap-1 ${activeView === 'calendar' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar View
            </button>
            <button 
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 text-xs rounded-md transition font-medium flex items-center gap-1 ${activeView === 'table' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Summary Table
            </button>
          </div>
        </div>

        {/* GANTT CHART VIEW */}
        {activeView === 'gantt' && (
          <div className="glass-panel p-6 rounded-xl border border-zinc-800/80 overflow-x-auto">
            <div className="min-w-[640px]">
              
              {/* Timeline Header Months */}
              <div className="w-full h-8 flex relative border-b border-zinc-900 mb-6 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <div className="absolute left-0 top-0">Start ({bounds.start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})</div>
                <div className="absolute right-0 top-0">GATE Exam ({bounds.end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})</div>
                <div className="absolute left-1/2 -translate-x-1/2 top-0">Mid Prep ({new Date(bounds.start.getTime() + (bounds.end.getTime() - bounds.start.getTime()) / 2).toLocaleDateString('en-IN', { month: 'short' })})</div>
              </div>

              {/* Gantt Rows */}
              <div className="space-y-4 relative">
                {timeline.map((block) => {
                  const styles = getGanttStyles(block);
                  
                  return (
                    <div key={block.id} className="relative h-9 flex items-center">
                      {/* Subject label */}
                      <div className="w-40 pr-4 truncate text-xs font-semibold text-zinc-300 leading-tight">
                        {block.subjectName}
                        <span className="block text-[9px] text-zinc-550 font-normal uppercase mt-0.5">{block.type.replace('_', ' ')}</span>
                      </div>
                      
                      {/* Timeline Bar Track */}
                      <div className="flex-1 bg-zinc-950/40 border border-zinc-900/60 rounded h-full relative overflow-hidden">
                        <div 
                          className={`absolute top-1 bottom-1 rounded border px-2.5 flex items-center transition-all ${getBlockColor(block.type)}`}
                          style={styles}
                          title={`${block.subjectName} (${block.type}): ${block.startDate} to ${block.endDate} (${block.durationDays} days)`}
                        >
                          <span className="text-[10px] font-bold truncate leading-none">
                            {block.durationDays}d
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Color Legend */}
              <div className="mt-8 pt-4 border-t border-zinc-900 flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-600/80 border border-purple-500"></span>
                  <span>Syllabus Learning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-600/70 border border-indigo-500"></span>
                  <span>Revision Cycle 1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600/70 border border-blue-500"></span>
                  <span>Revision Cycle 2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-600/70 border border-amber-500"></span>
                  <span>Revision Cycle 3</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-pink-600/30 border border-pink-500/40"></span>
                  <span>PYQ Solving</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600/30 border border-emerald-500/40"></span>
                  <span>Mock Tests</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {activeView === 'calendar' && (
          <div className="glass-panel p-6 rounded-xl border border-zinc-800 flex flex-col gap-4">
            
            {/* Calendar navigation header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <h4 className="text-sm font-bold text-white font-mono">
                {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Week labels */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays().map((day, idx) => {
                const dayBlocks = getBlocksForDate(day.dateStr);
                const learningBlock = dayBlocks.find(b => b.type === 'learning');
                const activeBlock = learningBlock || dayBlocks[0]; // prioritize showing learning, else revision/etc.

                return (
                  <div 
                    key={idx} 
                    className={`min-h-[72px] p-1.5 rounded-lg border flex flex-col gap-1 justify-between transition-all ${
                      day.isCurrentMonth 
                        ? 'bg-zinc-950/20 border-zinc-900' 
                        : 'bg-zinc-950/5 border-transparent opacity-20'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-zinc-500 font-mono">{day.dayNum}</span>
                    
                    {activeBlock && (
                      <div className={`text-[9px] font-extrabold rounded p-1 truncate leading-tight border ${
                        activeBlock.type === 'learning' ? 'bg-purple-950/20 border-purple-500/20 text-purple-300' :
                        activeBlock.type.startsWith('revision') ? 'bg-blue-950/20 border-blue-500/20 text-blue-300' :
                        'bg-zinc-900 border-zinc-850 text-zinc-400'
                      }`}>
                        {activeBlock.subjectName.split(' ')[0]}
                        <span className="block opacity-60 font-semibold">{activeBlock.type.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUMMARY TABLE VIEW */}
        {activeView === 'table' && (
          <div className="glass-panel rounded-xl border border-zinc-850 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                    <th className="p-4">Subject</th>
                    <th className="p-4">Study Block Phase</th>
                    <th className="p-4 font-mono">Start Date</th>
                    <th className="p-4 font-mono">End Date</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-right">Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {timeline.map((block) => (
                    <tr key={block.id} className="hover:bg-zinc-950/20 transition-all text-zinc-300">
                      <td className="p-4 font-extrabold text-white">{block.subjectName}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          block.type === 'learning' ? 'bg-purple-950/50 border border-purple-900/40 text-purple-300' :
                          block.type.startsWith('revision') ? 'bg-blue-950/50 border border-blue-900/40 text-blue-300' :
                          'bg-zinc-900 text-zinc-400'
                        }`}>
                          {block.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] font-medium">{block.startDate}</td>
                      <td className="p-4 font-mono text-[11px] font-medium">{block.endDate}</td>
                      <td className="p-4 text-center font-bold font-mono text-purple-300">{block.durationDays} Days</td>
                      <td className="p-4 text-right font-mono font-semibold">{block.hoursAllocated}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
