'use client';

import { useGateStore } from '@/store/useGateStore';
import { 
  generateTimeline, 
  checkPlanFeasibility, 
  calculateReadinessScore, 
  detectBacklogs,
  getSubjectHours
} from '@/utils/plannerAlgorithm';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GateCountdown from '@/components/shared/GateCountdown';
import PomodoroTimer from '@/components/shared/PomodoroTimer';
import DailyTimer from '@/components/shared/DailyTimer';
import HabitChecklist from '@/components/shared/HabitChecklist';
import confetti from 'canvas-confetti';

import { 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Hourglass, 
  BookOpen, 
  ListTodo, 
  Play, 
  Sparkles,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { subjects, resources, mockTests, preferences, hasHydrated } = useGateStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasHydrated) {
    return (
      <div className="p-8 flex flex-col gap-6 w-full h-full justify-center items-center">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-sm text-zinc-500 font-semibold uppercase tracking-widest">Hydrating Command Center...</span>
      </div>
    );
  }

  // 1. Core Planning Calculations
  const timeline = generateTimeline(subjects, resources, preferences);
  const feasibility = checkPlanFeasibility(subjects, resources, preferences);
  const readiness = calculateReadinessScore(subjects, resources, mockTests, preferences.playbackSpeed);
  const backlogs = detectBacklogs(subjects, resources, preferences, timeline);

  // 2. Dashboard Card stats
  const totalSubjectsCount = subjects.length;
  const totalResourcesCount = resources.length;
  const totalVideosCount = resources.reduce((acc, res) => acc + (res.totalVideos || 0), 0);
  
  // Total study hours & remaining
  let totalStudyHoursRaw = 0;
  let remainingStudyHoursRaw = 0;
  let completedHoursRaw = 0;
  subjects.forEach((sub) => {
    const hours = getSubjectHours(sub.id, resources, preferences.playbackSpeed);
    totalStudyHoursRaw += hours.total;
    remainingStudyHoursRaw += hours.remaining;
    completedHoursRaw += hours.completed;
  });

  const completionPercentage = totalStudyHoursRaw > 0 
    ? (completedHoursRaw / totalStudyHoursRaw) * 100 
    : 0;

  // Days until gate
  const gateTime = new Date(preferences.gateDate).getTime();
  const diffTime = gateTime - new Date().getTime();
  const daysUntilGate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Revision state summary
  const revisionProgressAvg = Math.round(subjects.reduce((acc, s) => acc + s.revisionProgress, 0) / subjects.length);

  // 3. AI recommendation logic
  const getStudyRecommendation = () => {
    // Find the next uncompleted subject in topological dependency order
    const sorted = timeline.filter(b => b.type === 'learning');
    const nextBlock = sorted.find((block) => {
      const sub = subjects.find(s => s.id === block.subjectId);
      return sub && sub.status !== 'completed';
    });

    if (nextBlock) {
      return {
        subjectName: nextBlock.subjectName,
        action: `Resume Syllabus Learning for "${nextBlock.subjectName}"`,
        details: `Your next sequential subject is ${nextBlock.subjectName}. Plan calls for ${preferences.dailyStudyHours} hours/day.`
      };
    }
    return {
      subjectName: 'None',
      action: 'Syllabus Fully Covered!',
      details: 'All resources marked completed. Focus on Revision Cycles 2 & 3 and Mock Test performance!'
    };
  };

  const currentStudyPriority = getStudyRecommendation();

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto w-full">
      {/* LEFT PANEL: Core Dashboard Widgets */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Welcome Banner */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-500/10 glow-primary/5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">AI Preparation Engine Active</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-2">GATE 2027 Command Center</h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Analyzing study patterns, resolving dependencies, and tracking mock test performance to optimize your percentile.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                useGateStore.getState().syncNotionData();
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#7c3aed', '#3b82f6', '#10b981'],
                });
                alert('Notion CSE Prep Page Synced! 13 Subject Playlists integrated. Phase 0 tasks marked completed. General Aptitude tracker activated.');
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 glow-primary border border-purple-500/30"
              title="Sync study progress and checklists from Notion GATE 2027 page"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Notion</span>
            </button>
            
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Feasibility Verdict</span>
              <span className={`text-xs font-extrabold ${feasibility.isFeasible ? 'text-emerald-400 glow-text-success' : 'text-red-400'}`}>
                {feasibility.isFeasible ? '✓ COMPLETE BEFORE EXAM' : '✗ TIME REALLOCATION REQUIRED'}
              </span>
            </div>
          </div>
        </div>

        {/* 11 METRIC STAT CARDS */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Subjects */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Total Subjects</span>
            <div className="text-2xl font-black text-white"><AnimatedCounter value={totalSubjectsCount} /></div>
            <span className="text-[9px] text-zinc-500 font-medium">GATE Core Syllabus</span>
          </div>

          {/* Card 2: Total Resources */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Total Resources</span>
            <div className="text-2xl font-black text-purple-300"><AnimatedCounter value={totalResourcesCount} /></div>
            <span className="text-[9px] text-zinc-500 font-medium">Added to Portal</span>
          </div>

          {/* Card 3: Total Videos */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Total Videos</span>
            <div className="text-2xl font-black text-indigo-300"><AnimatedCounter value={totalVideosCount} /></div>
            <span className="text-[9px] text-zinc-500 font-medium">Playlist Lecture Count</span>
          </div>

          {/* Card 4: Total Study Hours */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Total Hours (Eff.)</span>
            <div className="text-2xl font-black text-blue-300"><AnimatedCounter value={totalStudyHoursRaw} decimals={1} suffix="h" /></div>
            <span className="text-[9px] text-zinc-500 font-medium">Scaled by Playback Speed</span>
          </div>

          {/* Card 5: Remaining Hours */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Remaining Hours</span>
            <div className="text-2xl font-black text-amber-300"><AnimatedCounter value={remainingStudyHoursRaw} decimals={1} suffix="h" /></div>
            <span className="text-[9px] text-zinc-500 font-medium">To Syllabus Complete</span>
          </div>

          {/* Card 6: Completion Percentage */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Syllabus Complete</span>
            <div className="text-2xl font-black text-emerald-400"><AnimatedCounter value={completionPercentage} decimals={1} suffix="%" /></div>
            <div className="w-full bg-zinc-900 rounded-full h-1 mt-1">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          {/* Card 7: Days Until GATE */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Days Until GATE</span>
            <div className="text-2xl font-black text-rose-400"><AnimatedCounter value={daysUntilGate} /></div>
            <span className="text-[9px] text-zinc-500 font-medium">Until Feb 6, 2027</span>
          </div>

          {/* Card 8: Predicted Completion */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Est. Completion</span>
            <div className="text-sm font-black text-white mt-1.5 leading-none font-mono">
              {new Date(feasibility.revision3CompletionDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <span className="text-[9px] text-zinc-500 font-medium block mt-1">Includes 3 Revisions</span>
          </div>

          {/* Card 9: Buffer Days */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Buffer Days Available</span>
            <div className={`text-2xl font-black ${feasibility.bufferDays >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <AnimatedCounter value={Math.abs(feasibility.bufferDays)} prefix={feasibility.bufferDays < 0 ? '-' : '+'} />
            </div>
            <span className="text-[9px] text-zinc-500 font-medium">Days remaining after prep</span>
          </div>

          {/* Card 10: Revision Status */}
          <div className="glass-card p-4 rounded-xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Revision Coverage</span>
            <div className="text-2xl font-black text-purple-300"><AnimatedCounter value={revisionProgressAvg} suffix="%" /></div>
            <span className="text-[9px] text-zinc-500 font-medium">Across all cycles</span>
          </div>

          {/* Card 11: Readiness Score */}
          <div className="glass-card p-4 rounded-xl col-span-2 bg-gradient-to-br from-zinc-950/20 to-purple-950/5 border-purple-500/10">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Readiness Score</span>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-white glow-text-primary"><AnimatedCounter value={readiness.score} /></div>
              <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                readiness.score > 90 ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300' :
                readiness.score > 70 ? 'bg-purple-950/50 border border-purple-500/30 text-purple-300' :
                readiness.score > 40 ? 'bg-blue-950/50 border border-blue-500/30 text-blue-300' :
                'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}>
                {readiness.label}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-medium">Weighted Syllabus, Revision & Mocks</span>
          </div>

        </section>

        {/* AI RECOMMENDATION ENGINE */}
        <section className="glass-panel p-5 rounded-xl border-purple-500/10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">AI Copilot Recommendation Engine</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Priority Study Box */}
            <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900 flex gap-3.5">
              <div className="p-2 rounded bg-purple-950/50 border border-purple-800/40 h-fit">
                <BookOpen className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <span className="text-[9px] text-purple-400 uppercase font-bold tracking-wider">Current Focus Priority</span>
                <h4 className="text-xs font-black text-white mb-1">{currentStudyPriority.action}</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">{currentStudyPriority.details}</p>
              </div>
            </div>

            {/* Backlog Alert Box */}
            <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900 flex gap-3.5">
              {backlogs.length > 0 ? (
                <>
                  <div className="p-2 rounded bg-red-950/50 border border-red-800/40 h-fit text-red-400 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-red-400 uppercase font-bold tracking-wider">Backlog Alert Detected</span>
                    <h4 className="text-xs font-black text-white mb-1">
                      {backlogs[0].subjectName}: {backlogs[0].missedHours}h behind
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      {backlogs[0].recoveryPlan} (Planned {backlogs[0].expectedHours}h vs logged {backlogs[0].actualHours}h).
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded bg-emerald-950/50 border border-emerald-800/40 h-fit text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider">Backlog Analysis</span>
                    <h4 className="text-xs font-black text-white mb-1">Preparation is On-Schedule</h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      No study backlogs detected. You are keeping pace with your daily study hours!
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* READINESS ENGINE BREAKDOWN */}
        <section className="glass-card p-5 rounded-xl border border-zinc-800">
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-white mb-4">Readiness Engine Analysis</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            
            {/* Syllabus completion breakdown */}
            <div className="flex flex-col gap-2 bg-zinc-950/30 p-3 rounded-lg border border-zinc-900">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Syllabus Completion</span>
                <span className="font-bold text-white">{readiness.breakdown.completion}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${readiness.breakdown.completion}%` }}></div>
              </div>
              <span className="text-[9px] text-zinc-500 font-medium">Weight: 50% of Readiness score</span>
            </div>

            {/* Revision completion breakdown */}
            <div className="flex flex-col gap-2 bg-zinc-950/30 p-3 rounded-lg border border-zinc-900">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Active Revisions</span>
                <span className="font-bold text-purple-300">{readiness.breakdown.revision}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${readiness.breakdown.revision}%` }}></div>
              </div>
              <span className="text-[9px] text-zinc-500 font-medium">Weight: 30% of Readiness score</span>
            </div>

            {/* Mock Test completion breakdown */}
            <div className="flex flex-col gap-2 bg-zinc-950/30 p-3 rounded-lg border border-zinc-900">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Mock Test Performance</span>
                <span className="font-bold text-blue-300">{readiness.breakdown.mock}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${readiness.breakdown.mock}%` }}></div>
              </div>
              <span className="text-[9px] text-zinc-500 font-medium">Weight: 20% of Readiness score</span>
            </div>

          </div>
        </section>

      </div>

      {/* RIGHT PANEL: Floating Toolbar, Timer, and Habits */}
      <div className="w-full xl:w-80 flex flex-col gap-6">
        {/* Live Countdown widget */}
        <div className="h-44">
          <GateCountdown />
        </div>

        {/* Daily Study Stopwatch timer */}
        <DailyTimer />

        {/* Pomodoro Focus Timer */}
        <PomodoroTimer />

        {/* Daily Habits checklist */}
        <div className="flex-1 min-h-[300px]">
          <HabitChecklist />
        </div>
      </div>
    </div>
  );
}
