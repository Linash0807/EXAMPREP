'use client';

import { useState } from 'react';
import { useGateStore, Subject, MockTest } from '@/store/useGateStore';
import { 
  CheckSquare, 
  Trophy, 
  Plus, 
  Trash2, 
  TrendingUp, 
  LineChart as LineChartIcon,
  Percent, 
  Award, 
  BookmarkCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import confetti from 'canvas-confetti';

export default function TrackerPage() {
  const { subjects, mockTests, updateSubjectProgress, addMockTest, deleteMockTest, hasHydrated } = useGateStore();
  const [activeTab, setActiveTab] = useState<'pyqs' | 'mocks'>('pyqs');

  // PYQ Form state
  const [selectedSubId, setSelectedSubId] = useState('');
  const [pyqSolved, setPyqSolved] = useState('');
  const [pyqAccuracy, setPyqAccuracy] = useState('');
  const [revisionProgress, setRevisionProgress] = useState('20');

  // Mock Form state
  const [mockName, setMockName] = useState('');
  const [mockDate, setMockDate] = useState(new Date().toISOString().split('T')[0]);
  const [mockScore, setMockScore] = useState('');
  const [mockRank, setMockRank] = useState('');
  const [mockAccuracy, setMockAccuracy] = useState('');

  // Recharts Chart tab selection
  const [chartMetric, setChartMetric] = useState<'score' | 'rank' | 'accuracy'>('score');

  if (!hasHydrated) {
    return (
      <div className="p-8 text-center text-zinc-500 font-semibold uppercase animate-pulse">
        Initializing Progress Trackers...
      </div>
    );
  }

  // Pre-fill default subject
  if (subjects.length > 0 && !selectedSubId) {
    setSelectedSubId(subjects[0].id);
  }

  const handleUpdatePYQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId) return;

    const sub = subjects.find(s => s.id === selectedSubId);
    if (!sub) return;

    const solvedVal = pyqSolved ? parseInt(pyqSolved) : sub.solvedPYQs;
    const accuracyVal = pyqAccuracy ? parseInt(pyqAccuracy) : sub.pyqAccuracy;
    const revProgressVal = revisionProgress ? parseInt(revisionProgress) : sub.revisionProgress;

    updateSubjectProgress(selectedSubId, solvedVal, accuracyVal, revProgressVal);

    // Confetti!
    confetti({
      particleCount: 40,
      spread: 30,
      colors: ['#7c3aed', '#10b981']
    });

    // Reset fields
    setPyqSolved('');
    setPyqAccuracy('');
  };

  const handleAddMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockName.trim() || !mockScore || !mockRank || !mockAccuracy) return;

    addMockTest({
      name: mockName.trim(),
      date: mockDate,
      score: parseFloat(mockScore),
      rank: parseInt(mockRank),
      accuracy: parseInt(mockAccuracy)
    });

    confetti({
      particleCount: 60,
      spread: 50,
      colors: ['#7c3aed', '#3b82f6', '#10b981']
    });

    // Reset Form
    setMockName('');
    setMockScore('');
    setMockRank('');
    setMockAccuracy('');
  };

  // Sort mock tests chronologically for trends
  const sortedMockData = [...mockTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // PYQ summaries
  const totalPYQsSum = subjects.reduce((acc, s) => acc + s.totalPYQs, 0);
  const solvedPYQsSum = subjects.reduce((acc, s) => acc + s.solvedPYQs, 0);
  const remainingPYQsSum = Math.max(0, totalPYQsSum - solvedPYQsSum);
  const pyqProgressPercent = totalPYQsSum > 0 ? Math.round((solvedPYQsSum / totalPYQsSum) * 100) : 0;
  
  const avgPYQAccuracy = Math.round(
    subjects.filter(s => s.solvedPYQs > 0).reduce((acc, s) => acc + s.pyqAccuracy, 0) / 
    Math.max(1, subjects.filter(s => s.solvedPYQs > 0).length)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      
      {/* TABS HEADER */}
      <div className="flex flex-wrap border-b border-zinc-900 pb-px">
        <button
          onClick={() => setActiveTab('pyqs')}
          className={`px-6 py-3 text-sm font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'pyqs' 
              ? 'border-purple-500 text-white font-black' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          PYQ Accuracy Tracker
        </button>
        <button
          onClick={() => setActiveTab('mocks')}
          className={`px-6 py-3 text-sm font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'mocks' 
              ? 'border-purple-500 text-white font-black' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Mock Test Performance
        </button>
      </div>

      {/* PYQ TRACKER VIEW */}
      {activeTab === 'pyqs' && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* PYQ Log form left */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
            
            {/* Quick Summary card */}
            <div className="glass-panel p-5 rounded-xl border border-purple-500/10 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Overall PYQ Progress</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">{solvedPYQsSum}</span>
                  <span className="text-zinc-500 text-xs">/ {totalPYQsSum} Solved</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-850">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pyqProgressPercent}%` }}></div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Avg Accuracy</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">{avgPYQAccuracy}%</span>
              </div>
              <div className="pt-2 border-t border-zinc-900">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Remaining PYQs</span>
                <span className="text-xl font-extrabold text-amber-300 font-mono">{remainingPYQsSum}</span>
              </div>
            </div>

            {/* Log form */}
            <div className="glass-card p-5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <BookmarkCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Log PYQ Progress</h3>
              </div>

              <form onSubmit={handleUpdatePYQ} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Select Subject</label>
                  <select 
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Solved PYQs</label>
                    <input 
                      type="number"
                      placeholder="e.g. 50"
                      value={pyqSolved}
                      onChange={(e) => setPyqSolved(e.target.value)}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Accuracy %</label>
                    <input 
                      type="number"
                      placeholder="e.g. 80"
                      max={100}
                      value={pyqAccuracy}
                      onChange={(e) => setPyqAccuracy(e.target.value)}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                    <span>Revision Progress</span>
                    <span className="text-purple-300 font-bold font-mono">{revisionProgress}%</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={100}
                    value={revisionProgress}
                    onChange={(e) => setRevisionProgress(e.target.value)}
                    className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <button 
                  type="submit"
                  className="mt-2 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition glow-primary"
                >
                  Save Progress
                </button>
              </form>
            </div>

          </div>

          {/* PYQ subject table right */}
          <div className="flex-1 glass-panel rounded-xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                    <th className="p-4">Subject</th>
                    <th className="p-4 text-center">Total PYQs</th>
                    <th className="p-4 text-center">Solved</th>
                    <th className="p-4 text-center">Remaining</th>
                    <th className="p-4 text-center">Progress Gauge</th>
                    <th className="p-4 text-right">Accuracy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                  {subjects.map((sub) => {
                    const remaining = Math.max(0, sub.totalPYQs - sub.solvedPYQs);
                    const percent = Math.round((sub.solvedPYQs / sub.totalPYQs) * 100);
                    
                    return (
                      <tr key={sub.id} className="hover:bg-zinc-950/20 transition-all">
                        <td className="p-4 font-extrabold text-white">{sub.name}</td>
                        <td className="p-4 text-center font-semibold font-mono">{sub.totalPYQs}</td>
                        <td className="p-4 text-center font-bold font-mono text-purple-300">{sub.solvedPYQs}</td>
                        <td className="p-4 text-center font-mono text-zinc-500">{remaining}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-24 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-zinc-400">{percent}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-400 font-mono">
                          {sub.solvedPYQs > 0 ? `${sub.pyqAccuracy}%` : '---'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MOCK PERFORMANCE VIEW */}
      {activeTab === 'mocks' && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mock Input Form left */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
            
            {/* Quick average stats */}
            <div className="glass-panel p-5 rounded-xl border border-purple-500/10 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Mock Exams Logged</span>
                <div className="text-3xl font-black text-white mt-0.5">{mockTests.length} Tests</div>
              </div>

              <div className="pt-2 border-t border-zinc-900">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Average Score</span>
                <span className="text-xl font-extrabold text-purple-300 font-mono">
                  {mockTests.length > 0 
                    ? (mockTests.reduce((acc, mt) => acc + mt.score, 0) / mockTests.length).toFixed(1)
                    : '---'
                  }
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-900">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Best Rank</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  {mockTests.length > 0 
                    ? Math.min(...mockTests.map(m => m.rank))
                    : '---'
                  }
                </span>
              </div>
            </div>

            {/* Mock Test Log Form */}
            <div className="glass-card p-5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Log Mock Test</h3>
              </div>

              <form onSubmit={handleAddMock} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Mock Test Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FLT 1 Made Easy" 
                    value={mockName}
                    onChange={(e) => setMockName(e.target.value)}
                    className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Exam Date</label>
                  <input 
                    type="date" 
                    value={mockDate}
                    onChange={(e) => setMockDate(e.target.value)}
                    className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Score</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="45.5" 
                      value={mockScore}
                      onChange={(e) => setMockScore(e.target.value)}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Rank</label>
                    <input 
                      type="number" 
                      placeholder="1200" 
                      value={mockRank}
                      onChange={(e) => setMockRank(e.target.value)}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Accuracy</label>
                    <input 
                      type="number" 
                      placeholder="75%" 
                      value={mockAccuracy}
                      onChange={(e) => setMockAccuracy(e.target.value)}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="mt-2 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition glow-primary"
                >
                  Log Mock Result
                </button>
              </form>
            </div>

          </div>

          {/* Charts & Mock logs right */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Recharts Trends */}
            <div className="glass-panel p-5 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Mock test performance trends</h3>
                </div>

                {/* Sub tab selectors for charts */}
                <div className="flex rounded-md bg-zinc-950 p-1 border border-zinc-900 text-[10px] font-bold uppercase tracking-wider">
                  <button 
                    onClick={() => setChartMetric('score')}
                    className={`px-2.5 py-1 rounded transition ${chartMetric === 'score' ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
                  >
                    Score
                  </button>
                  <button 
                    onClick={() => setChartMetric('rank')}
                    className={`px-2.5 py-1 rounded transition ${chartMetric === 'rank' ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
                  >
                    Rank
                  </button>
                  <button 
                    onClick={() => setChartMetric('accuracy')}
                    className={`px-2.5 py-1 rounded transition ${chartMetric === 'accuracy' ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
                  >
                    Accuracy
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                {sortedMockData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sortedMockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                      <XAxis dataKey="date" stroke="#60606a" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                      
                      {chartMetric === 'rank' ? (
                        // Invert rank axis so 1 is at the top
                        <YAxis reversed stroke="#60606a" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                      ) : (
                        <YAxis stroke="#60606a" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                      )}
                      
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                      />
                      
                      {chartMetric === 'score' && (
                        <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={3} activeDot={{ r: 6 }} name="Mock Score" dot={{ strokeWidth: 2 }} />
                      )}
                      {chartMetric === 'rank' && (
                        <Line type="monotone" dataKey="rank" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} name="Mock Rank" dot={{ strokeWidth: 2 }} />
                      )}
                      {chartMetric === 'accuracy' && (
                        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} name="Mock Accuracy %" dot={{ strokeWidth: 2 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 font-semibold">
                    Log at least one mock test to see performance trends.
                  </div>
                )}
              </div>
            </div>

            {/* List of Mock Tests */}
            <div className="glass-panel rounded-xl border border-zinc-850 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                      <th className="p-4">Mock Test details</th>
                      <th className="p-4">Test Date</th>
                      <th className="p-4 text-center">Score (100)</th>
                      <th className="p-4 text-center">All India Rank</th>
                      <th className="p-4 text-center">Accuracy %</th>
                      <th className="p-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                    {mockTests.length > 0 ? (
                      mockTests.map((mt) => (
                        <tr key={mt.id} className="hover:bg-zinc-950/20 transition-all">
                          <td className="p-4 font-extrabold text-white">{mt.name}</td>
                          <td className="p-4 font-mono text-[11px] text-zinc-400">
                            {new Date(mt.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-4 text-center font-bold font-mono text-purple-300">{mt.score}</td>
                          <td className="p-4 text-center font-bold font-mono text-blue-300">#{mt.rank}</td>
                          <td className="p-4 text-center font-bold font-mono text-emerald-400">{mt.accuracy}%</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => deleteMockTest(mt.id)}
                              className="p-1.5 rounded hover:bg-red-950/20 text-zinc-650 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500 font-semibold">
                          No Mock Test entries recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
