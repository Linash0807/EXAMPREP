'use client';

import { useGateStore } from '@/store/useGateStore';
import { getSubjectHours } from '@/utils/plannerAlgorithm';
import { BarChart3, TrendingUp, PieChart as PieIcon, LineChart as LineIcon, Activity } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsPage() {
  const { subjects, resources, mockTests, preferences, hasHydrated } = useGateStore();

  if (!hasHydrated) {
    return (
      <div className="p-8 text-center text-zinc-500 font-semibold uppercase animate-pulse">
        Generating Preparation Analytics...
      </div>
    );
  }

  // 1. Prepare Subject Hours Data
  const subjectHoursData = subjects.map((sub) => {
    const hours = getSubjectHours(sub.id, resources, preferences.playbackSpeed);
    return {
      name: sub.name.split(' ').slice(0, 2).join(' '), // shorten name
      'Total Hours': hours.total,
      'Completed Hours': hours.completed,
      'Remaining Hours': hours.remaining,
    };
  });

  // 2. Prepare Pie Chart Data for Syllabus distribution
  let totalSyllabusHours = 0;
  let completedSyllabusHours = 0;
  subjects.forEach((sub) => {
    const hours = getSubjectHours(sub.id, resources, preferences.playbackSpeed);
    totalSyllabusHours += hours.total;
    completedSyllabusHours += hours.completed;
  });

  const remainingSyllabusHours = Math.max(0, totalSyllabusHours - completedSyllabusHours);
  const pieData = [
    { name: 'Completed Hours', value: parseFloat(completedSyllabusHours.toFixed(1)) },
    { name: 'Remaining Hours', value: parseFloat(remainingSyllabusHours.toFixed(1)) },
  ];

  const PIE_COLORS = ['#7c3aed', '#1f1f2e'];

  // 3. Prepare Mock Test Chronological Data
  const sortedMocks = [...mockTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const mockTrendData = sortedMocks.map((mt, index) => ({
    index: `Mock ${index + 1}`,
    name: mt.name,
    Score: mt.score,
    Accuracy: mt.accuracy,
    Rank: mt.rank,
  }));

  // 4. Progress Timeline Forecast
  // We can construct a hypothetical progress path based on subjects
  let cumTotal = 0;
  let cumCompleted = 0;
  const progressTrendData = subjects.map((sub, idx) => {
    const hours = getSubjectHours(sub.id, resources, preferences.playbackSpeed);
    cumTotal += hours.total;
    cumCompleted += hours.completed;
    return {
      subject: sub.name.substring(0, 6),
      Syllabus: Math.min(100, Math.round(cumTotal > 0 ? (cumCompleted / cumTotal) * 100 : 0)),
      Revision: sub.revisionProgress,
    };
  });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      
      {/* HEADER CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/10 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-400" />
            Preparation Analytics Console
          </h2>
          <p className="text-xs text-zinc-400">High-fidelity Recharts engine parsing daily logs, syllabus quotas, and mock test scores.</p>
        </div>
      </div>

      {/* CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Subject-wise Hours */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-800 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Subject study hours analysis</h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                <XAxis dataKey="name" stroke="#60606a" style={{ fontSize: 9 }} />
                <YAxis stroke="#60606a" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                <Legend style={{ fontSize: 10 }} />
                <Bar dataKey="Completed Hours" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Remaining Hours" fill="#1f1f2e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Mock Test Trend */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-800 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <LineIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Mock test trends (Score & Accuracy)</h3>
          </div>

          <div className="h-72 w-full">
            {mockTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                  <XAxis dataKey="index" stroke="#60606a" style={{ fontSize: 10 }} />
                  <YAxis stroke="#60606a" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                  <Legend style={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="Score" stroke="#a78bfa" strokeWidth={3} name="Score (100)" />
                  <Line type="monotone" dataKey="Accuracy" stroke="#10b981" strokeWidth={2} name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-550 font-semibold text-xs">
                Log mock tests in PYQ & Mock tab to build analytics.
              </div>
            )}
          </div>
        </div>

        {/* CHART 3: Progress & Revision Forecast */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-800 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Syllabus completion & Revision progress</h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                <XAxis dataKey="subject" stroke="#60606a" style={{ fontSize: 10 }} />
                <YAxis stroke="#60606a" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                <Legend style={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Syllabus" stroke="#7c3aed" fillOpacity={0.1} fill="#7c3aed" name="Syllabus %" />
                <Area type="monotone" dataKey="Revision" stroke="#3b82f6" fillOpacity={0.05} fill="#3b82f6" name="Revision %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Remaining Hours Burden */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-800 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Preparation burden breakdown</h3>
          </div>

          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-around gap-4">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-600 block"></span>
                <div className="text-xs">
                  <span className="text-zinc-400">Completed:</span>{' '}
                  <span className="font-extrabold text-white font-mono">{completedSyllabusHours.toFixed(1)}h</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#1f1f2e] border border-zinc-850 block"></span>
                <div className="text-xs">
                  <span className="text-zinc-400">Remaining:</span>{' '}
                  <span className="font-extrabold text-white font-mono">{remainingSyllabusHours.toFixed(1)}h</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 text-center">
                <span className="text-[10px] text-zinc-550 uppercase font-bold block">Efficiency Multiplier</span>
                <span className="text-sm font-extrabold text-purple-300 font-mono">{preferences.playbackSpeed}x Speed</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
