'use client';

import { useState } from 'react';
import { useGateStore, Resource } from '@/store/useGateStore';
import { comparePlaylists, getEffectiveResourceHours } from '@/utils/plannerAlgorithm';
import { GitCompare, Sparkles, TrendingDown, BookOpen, AlertCircle, Play, Info } from 'lucide-react';

export default function ComparePage() {
  const { resources, preferences, hasHydrated } = useGateStore();
  
  // Filter playlist resources only
  const playlists = resources.filter((r) => r.type === 'youtube_playlist');

  const [playlistAId, setPlaylistAId] = useState('');
  const [playlistBId, setPlaylistBId] = useState('');

  if (!hasHydrated) {
    return (
      <div className="p-8 text-center text-zinc-500 font-semibold uppercase animate-pulse">
        Initializing comparison matrix...
      </div>
    );
  }

  // Pre-fill selectors if enough playlists are available
  if (playlists.length >= 2 && (!playlistAId || !playlistBId)) {
    setPlaylistAId(playlists[0].id);
    setPlaylistBId(playlists[1].id);
  }

  const playA = playlists.find(p => p.id === playlistAId);
  const playB = playlists.find(p => p.id === playlistBId);

  const getComparison = () => {
    if (!playA || !playB) return null;
    return comparePlaylists(playA, playB, preferences.dailyStudyHours, preferences.playbackSpeed);
  };

  const comp = getComparison();

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      
      {/* HEADER INFO */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/10 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-purple-400" />
            Resource Comparison Matrix
          </h2>
          <p className="text-xs text-zinc-400">Compare course playlist speed, coverage ratios, and study efficiency to identify optimal materials.</p>
        </div>
      </div>

      {playlists.length < 2 ? (
        <div className="glass-card p-10 rounded-xl text-center border border-zinc-800 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-zinc-500" />
          <h4 className="text-sm font-extrabold text-zinc-300">Insufficient Playlist Resources</h4>
          <p className="text-xs text-zinc-500 max-w-sm">
            You need to add at least two YouTube Playlists in the Resource Manager before you can run comparison analyses.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* SELECTORS ROW */}
          <div className="grid sm:grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Select Playlist A</label>
              <select 
                value={playlistAId} 
                onChange={(e) => setPlaylistAId(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
              >
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.instructor})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Select Playlist B</label>
              <select 
                value={playlistBId} 
                onChange={(e) => setPlaylistBId(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none"
              >
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.instructor})</option>
                ))}
              </select>
            </div>
          </div>

          {/* COMPARISON METRICS SHIELD */}
          {comp && playA && playB && (
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* PLAYLIST A METRICS CARD */}
              <div className="glass-card p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Resource A Summary</span>
                <h3 className="text-sm font-black text-white leading-snug">{playA.name}</h3>
                
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Instructor:</span>
                    <span className="font-semibold text-zinc-300">{playA.instructor}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Lecture Count:</span>
                    <span className="font-mono font-bold text-zinc-300">{playA.totalVideos} Videos</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Base Hours (1x):</span>
                    <span className="font-mono font-bold text-zinc-300">{comp.resourceA.totalDuration}h</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900 bg-purple-950/10 px-2 rounded">
                    <span className="text-purple-400 font-medium">Effective Hours ({preferences.playbackSpeed}x):</span>
                    <span className="font-mono font-black text-purple-300">
                      {getEffectiveResourceHours(playA, preferences.playbackSpeed).total}h
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Completion Duration:</span>
                    <span className="font-semibold text-zinc-300">
                      {Math.ceil(getEffectiveResourceHours(playA, preferences.playbackSpeed).total / preferences.dailyStudyHours)} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* STATS DIFFERENCE / COMPARISON ENGINE */}
              <div className="glass-panel p-5 rounded-xl border border-purple-500/10 flex flex-col justify-between gap-6">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase font-bold tracking-widest block mb-4">Comparison analytics</span>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Time Savings Potential</span>
                      <div className="text-3xl font-black text-white font-mono">
                        {comp.result.hoursSaved.toFixed(1)}h
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium block mt-1">
                        Difference of {comp.result.timeSavingsPercent}% in total preparation hours.
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Estimated Days Saved</span>
                      <div className="text-xl font-extrabold text-emerald-400 font-mono">
                        {comp.result.completionSpeedDays} Days
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 text-[10px] text-zinc-500 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span>
                    Calculations are based on a study pace of {preferences.dailyStudyHours}h/day and playback speed of {preferences.playbackSpeed}x.
                  </span>
                </div>
              </div>

              {/* PLAYLIST B METRICS CARD */}
              <div className="glass-card p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Resource B Summary</span>
                <h3 className="text-sm font-black text-white leading-snug">{playB.name}</h3>

                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Instructor:</span>
                    <span className="font-semibold text-zinc-300">{playB.instructor}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Lecture Count:</span>
                    <span className="font-mono font-bold text-zinc-300">{playB.totalVideos} Videos</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Base Hours (1x):</span>
                    <span className="font-mono font-bold text-zinc-300">{comp.resourceB.totalDuration}h</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900 bg-purple-950/10 px-2 rounded">
                    <span className="text-purple-400 font-medium">Effective Hours ({preferences.playbackSpeed}x):</span>
                    <span className="font-mono font-black text-purple-300">
                      {getEffectiveResourceHours(playB, preferences.playbackSpeed).total}h
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500">Completion Duration:</span>
                    <span className="font-semibold text-zinc-300">
                      {Math.ceil(getEffectiveResourceHours(playB, preferences.playbackSpeed).total / preferences.dailyStudyHours)} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* COGNITIVE RECOMENDATION BANNER */}
              <div className="col-span-1 md:col-span-3 glass-panel p-5 rounded-xl border border-purple-500/20 flex gap-4">
                <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-900/40 text-purple-400 h-fit">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white mb-1.5">AI Copilot Resource recommendation</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {comp.result.recommendation}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
