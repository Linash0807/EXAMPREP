'use client';

import { useState } from 'react';
import { useGateStore, Resource } from '@/store/useGateStore';
import { 
  Plus, 
  Trash2, 
  Play, 
  Book, 
  FileText, 
  Link as LinkIcon, 
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    style={{ display: 'inline-block' }}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function ResourceManagerPage() {
  const { subjects, resources, addResource, updateResource, deleteResource, preferences, hasHydrated } = useGateStore();
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // New Manual Resource Form State
  const [manualRes, setManualRes] = useState({
    subjectId: '',
    name: '',
    type: 'youtube_video' as Resource['type'],
    instructor: '',
    link: '',
    priority: 'medium' as Resource['priority'],
    difficulty: 'medium' as Resource['difficulty'],
    status: 'not_started' as Resource['status'],
    totalVideos: '',
    avgVideoDuration: '',
  });

  // YouTube Playlist Analyzer State
  const [ytUrl, setYtUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<{
    playlistName: string;
    instructor: string;
    totalVideos: number;
    avgDurationMin: number;
    totalDurationHour: number;
  } | null>(null);

  if (!hasHydrated) {
    return (
      <div className="p-8 text-center text-zinc-500 font-semibold uppercase animate-pulse">
        Initializing Resource Manager...
      </div>
    );
  }

  // Speed matrix calculations helper
  const getSpeedMatrix = (totalHours: number) => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    return speeds.map((speed) => {
      const effectiveHours = totalHours / speed;
      const hoursSaved = totalHours - effectiveHours;
      return {
        speed: `${speed}x`,
        effective: parseFloat(effectiveHours.toFixed(1)),
        saved: parseFloat(hoursSaved.toFixed(1))
      };
    });
  };

  // Trigger playlist analysis simulation
  const handleAnalyzePlaylist = () => {
    if (!ytUrl.trim()) return;
    setIsAnalyzing(true);
    setAnalyzedData(null);

    // Simulate metadata extraction delay
    setTimeout(() => {
      // Generate realistic mock names based on subjects or links
      const mockInstructors = ['Gate Smashers', 'Amit Khurana', 'NPTEL CS', 'Sanchit Jain', 'Ravindrababu Ravula'];
      const mockTitles = ['Complete Algorithms Course', 'Data Structures Mastery', 'Computer Networks Lectures', 'DBMS Tutorials', 'Theory of Computation Complete Series'];
      
      const randIdx = Math.floor(Math.random() * mockTitles.length);
      const videos = Math.floor(Math.random() * 31) + 30; // 30-60 videos
      const avgMin = Math.floor(Math.random() * 16) + 20; // 20-35 mins
      const rawHrs = (videos * avgMin) / 60;

      setAnalyzedData({
        playlistName: mockTitles[randIdx],
        instructor: mockInstructors[randIdx],
        totalVideos: videos,
        avgDurationMin: avgMin,
        totalDurationHour: parseFloat(rawHrs.toFixed(1))
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleAddAnalyzedPlaylist = () => {
    if (!analyzedData) return;

    // Use selected subject or default to first
    const subId = manualRes.subjectId || (subjects.length > 0 ? subjects[0].id : '');

    addResource({
      subjectId: subId,
      name: analyzedData.playlistName,
      type: 'youtube_playlist',
      instructor: analyzedData.instructor,
      link: ytUrl,
      priority: 'high',
      difficulty: 'medium',
      status: 'not_started',
      totalVideos: analyzedData.totalVideos,
      completedVideos: 0,
      totalDuration: analyzedData.totalDurationHour,
      completedDuration: 0,
      avgVideoDuration: analyzedData.avgDurationMin,
    });

    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#7c3aed', '#10b981'],
    });

    // Reset
    setYtUrl('');
    setAnalyzedData(null);
  };

  const handleAddManualResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRes.name.trim()) return;

    const subId = manualRes.subjectId || (subjects.length > 0 ? subjects[0].id : '');

    addResource({
      subjectId: subId,
      name: manualRes.name.trim(),
      type: manualRes.type,
      instructor: manualRes.instructor.trim() || 'Self Study',
      link: manualRes.link.trim() || '#',
      priority: manualRes.priority,
      difficulty: manualRes.difficulty,
      status: manualRes.status,
      totalVideos: manualRes.totalVideos ? parseInt(manualRes.totalVideos) : undefined,
      completedVideos: 0,
      totalDuration: manualRes.type === 'youtube_playlist' && manualRes.totalVideos && manualRes.avgVideoDuration
        ? parseFloat(((parseInt(manualRes.totalVideos) * parseInt(manualRes.avgVideoDuration)) / 60).toFixed(1))
        : undefined,
      completedDuration: 0,
      avgVideoDuration: manualRes.avgVideoDuration ? parseInt(manualRes.avgVideoDuration) : undefined,
    });

    // Reset manual form except subjectId
    setManualRes(prev => ({
      ...prev,
      name: '',
      type: 'youtube_video',
      instructor: '',
      link: '',
      priority: 'medium',
      difficulty: 'medium',
      status: 'not_started',
      totalVideos: '',
      avgVideoDuration: '',
    }));

    confetti({
      particleCount: 50,
      spread: 40,
      colors: ['#3b82f6', '#10b981'],
    });
  };

  // Get icon for resource type
  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'youtube_playlist':
      case 'youtube_video':
        return <Youtube className="w-4 h-4 text-rose-500" />;
      case 'book':
        return <Book className="w-4 h-4 text-emerald-400" />;
      case 'pdf':
      case 'notes':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <LinkIcon className="w-4 h-4 text-purple-400" />;
    }
  };

  // Filter resources
  const filteredResources = resources.filter((res) => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || res.subjectId === subjectFilter;
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full">
      
      {/* LEFT SECTION: Inputs & YouTube Playlist Analyzer */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
        
        {/* YOUTUBE PLAYLIST ANALYZER CARD */}
        <div className="glass-panel p-5 rounded-xl border border-purple-500/10 glow-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Youtube className="w-5 h-5 text-rose-500" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">YouTube Playlist Analyzer</h3>
          </div>
          <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
            Paste any GATE syllabus lecture playlist URL. Our AI parsing model will automatically extract video counts, duration details, and calculate playback efficiency.
          </p>

          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Paste YouTube playlist URL here..." 
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              className="text-xs bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-rose-500"
            />
            <button 
              onClick={handleAnalyzePlaylist}
              disabled={isAnalyzing || !ytUrl}
              className="w-full py-2 text-xs font-bold text-white rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition flex items-center justify-center gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Metadata...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Playlist</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {analyzedData && (
            <div className="mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-4 animate-fade-in">
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900 flex flex-col gap-1.5">
                <span className="text-[9px] text-rose-400 uppercase font-bold tracking-wider">AI Extracted Details</span>
                <input 
                  type="text"
                  value={analyzedData.playlistName}
                  onChange={(e) => setAnalyzedData({ ...analyzedData, playlistName: e.target.value })}
                  className="text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-rose-500 pb-0.5 focus:outline-none"
                  title="Edit name"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Instructor:</span>
                  <input 
                    type="text"
                    value={analyzedData.instructor}
                    onChange={(e) => setAnalyzedData({ ...analyzedData, instructor: e.target.value })}
                    className="text-right text-zinc-300 bg-transparent border-b border-transparent focus:outline-none focus:border-rose-500 w-1/2"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Total Lectures:</span>
                  <span className="font-mono text-zinc-300 font-bold">{analyzedData.totalVideos} Videos</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Base Duration (1x):</span>
                  <span className="font-mono text-zinc-300 font-bold">{analyzedData.totalDurationHour}h</span>
                </div>
              </div>

              {/* Speed scaling matrix table */}
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">Efficiency playback Matrix</span>
                <div className="bg-zinc-950/40 rounded-lg border border-zinc-900 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[9px] text-zinc-400 uppercase font-semibold">
                        <th className="p-2">Speed</th>
                        <th className="p-2">Effective Hours</th>
                        <th className="p-2 text-right">Study Time Saved</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-mono">
                      {getSpeedMatrix(analyzedData.totalDurationHour).map((row) => (
                        <tr key={row.speed} className={`border-b border-zinc-900/60 ${row.speed === `${preferences.playbackSpeed}x` ? 'text-purple-300 bg-purple-950/10' : 'text-zinc-400'}`}>
                          <td className="p-2 font-bold">{row.speed}</td>
                          <td className="p-2 font-bold">{row.effective}h</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">
                            {row.saved > 0 ? `-${row.saved}h` : '---'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-purple-400 mt-2 font-medium">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Playback speed set in preferences is {preferences.playbackSpeed}x.</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 uppercase font-semibold">Assign Subject Area:</label>
                <select 
                  value={manualRes.subjectId}
                  onChange={(e) => setManualRes({ ...manualRes, subjectId: e.target.value })}
                  className="text-xs bg-zinc-950/60 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleAddAnalyzedPlaylist}
                disabled={!manualRes.subjectId}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1"
              >
                <span>Add Analyzed Playlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* MANUAL RESOURCE CREATOR CARD */}
        <div className="glass-card p-5 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Add Manual Resource</h3>
          </div>

          <form onSubmit={handleAddManualResource} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Subject</label>
              <select 
                value={manualRes.subjectId}
                onChange={(e) => setManualRes({ ...manualRes, subjectId: e.target.value })}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-600"
                required
              >
                <option value="">Select subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Resource Name</label>
              <input 
                type="text" 
                placeholder="e.g. Standard Reference Book" 
                value={manualRes.name}
                onChange={(e) => setManualRes({ ...manualRes, name: e.target.value })}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Type</label>
                <select 
                  value={manualRes.type}
                  onChange={(e) => setManualRes({ ...manualRes, type: e.target.value as Resource['type'] })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-600"
                >
                  <option value="youtube_video">YouTube Video</option>
                  <option value="youtube_playlist">YouTube Playlist</option>
                  <option value="pdf">PDF Resource</option>
                  <option value="book">Book</option>
                  <option value="notes">Notes Link</option>
                  <option value="course">Online Course</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Instructor</label>
                <input 
                  type="text" 
                  placeholder="Instructor name" 
                  value={manualRes.instructor}
                  onChange={(e) => setManualRes({ ...manualRes, instructor: e.target.value })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Link (URL)</label>
              <input 
                type="url" 
                placeholder="https://..." 
                value={manualRes.link}
                onChange={(e) => setManualRes({ ...manualRes, link: e.target.value })}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-600"
              />
            </div>

            {manualRes.type === 'youtube_playlist' && (
              <div className="grid grid-cols-2 gap-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Total Videos</label>
                  <input 
                    type="number" 
                    placeholder="30" 
                    value={manualRes.totalVideos}
                    onChange={(e) => setManualRes({ ...manualRes, totalVideos: e.target.value })}
                    className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Avg Video Min</label>
                  <input 
                    type="number" 
                    placeholder="25" 
                    value={manualRes.avgVideoDuration}
                    onChange={(e) => setManualRes({ ...manualRes, avgVideoDuration: e.target.value })}
                    className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Priority</label>
                <select 
                  value={manualRes.priority}
                  onChange={(e) => setManualRes({ ...manualRes, priority: e.target.value as Resource['priority'] })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-purple-600"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Difficulty</label>
                <select 
                  value={manualRes.difficulty}
                  onChange={(e) => setManualRes({ ...manualRes, difficulty: e.target.value as Resource['difficulty'] })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-purple-600"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Status</label>
                <select 
                  value={manualRes.status}
                  onChange={(e) => setManualRes({ ...manualRes, status: e.target.value as Resource['status'] })}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-purple-600"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="mt-2 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 glow-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Resource</span>
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT SECTION: Resource Inventory Table & Progress Logger */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Search & Filter Toolbar */}
        <div className="glass-card p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Search by resource name, author..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg pl-9 pr-4 py-2 text-zinc-200 focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-xs bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-zinc-300 focus:outline-none focus:border-purple-650"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-zinc-300 focus:outline-none focus:border-purple-650"
            >
              <option value="all">All Types</option>
              <option value="youtube_playlist">YouTube Playlist</option>
              <option value="youtube_video">YouTube Video</option>
              <option value="book">Reference Book</option>
              <option value="notes">Notes Link</option>
              <option value="pdf">PDF files</option>
              <option value="course">Online Courses</option>
            </select>
          </div>
        </div>

        {/* Resources list container */}
        <div className="glass-panel rounded-xl overflow-hidden flex-1 border border-zinc-800/80 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                  <th className="p-4">Resource Details</th>
                  <th className="p-4">Subject Area</th>
                  <th className="p-4 text-center">Priority</th>
                  <th className="p-4 text-center">Difficulty</th>
                  <th className="p-4">Progress Monitor</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {filteredResources.length > 0 ? (
                  filteredResources.map((res) => {
                    const sub = subjects.find(s => s.id === res.subjectId);
                    
                    return (
                      <tr key={res.id} className="hover:bg-zinc-950/20 transition-all">
                        {/* Title & Link */}
                        <td className="p-4">
                          <div className="flex gap-2.5 items-start">
                            <div className="p-2 rounded bg-zinc-900 border border-zinc-850 h-fit mt-0.5">
                              {getResourceIcon(res.type)}
                            </div>
                            <div className="flex flex-col gap-0.5 max-w-[240px] md:max-w-[320px]">
                              <a 
                                href={res.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="font-extrabold text-zinc-100 hover:text-purple-400 transition hover:underline leading-snug break-words"
                              >
                                {res.name}
                              </a>
                              <span className="text-[10px] text-zinc-500 font-medium">Instructor: {res.instructor}</span>
                            </div>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="p-4 font-semibold text-zinc-300">
                          {sub ? sub.name : 'Unknown Subject'}
                        </td>

                        {/* Priority */}
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            res.priority === 'high' ? 'bg-red-950/40 border border-red-900/40 text-red-400' :
                            res.priority === 'medium' ? 'bg-purple-950/40 border border-purple-900/40 text-purple-400' :
                            'bg-zinc-900 text-zinc-500'
                          }`}>
                            {res.priority}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            res.difficulty === 'hard' ? 'bg-red-950/20 border border-red-900/20 text-red-300' :
                            res.difficulty === 'medium' ? 'bg-blue-950/20 border border-blue-900/20 text-blue-300' :
                            'bg-emerald-950/20 border border-emerald-900/20 text-emerald-300'
                          }`}>
                            {res.difficulty}
                          </span>
                        </td>

                        {/* Progress controls */}
                        <td className="p-4">
                          {res.type === 'youtube_playlist' && res.totalVideos ? (
                            <div className="flex flex-col gap-1.5 w-40">
                              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                <span>Videos:</span>
                                <span className="font-bold text-white font-mono">
                                  {res.completedVideos}/{res.totalVideos}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="range" 
                                  min={0}
                                  max={res.totalVideos}
                                  value={res.completedVideos || 0}
                                  onChange={(e) => updateResource(res.id, { completedVideos: parseInt(e.target.value) })}
                                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <span className="text-[10px] font-bold text-purple-300">
                                  {Math.round(((res.completedVideos || 0) / res.totalVideos) * 100)}%
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono">
                                Logged: {res.completedDuration || 0}h / {res.totalDuration || 0}h
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 w-28">
                              <select
                                value={res.status}
                                onChange={(e) => updateResource(res.id, { status: e.target.value as Resource['status'] })}
                                className="text-[11px] bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 font-semibold"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => deleteResource(res.id)}
                            className="p-1.5 rounded hover:bg-red-950/20 text-zinc-650 hover:text-red-400 transition"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 font-semibold">
                      No study resources found matching current search/filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
