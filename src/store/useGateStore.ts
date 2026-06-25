import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  DEFAULT_SUBJECTS, 
  DEFAULT_RESOURCES, 
  DEFAULT_PREFERENCES, 
  DEFAULT_MOCK_TESTS, 
  DEFAULT_HABITS 
} from '@/utils/mockData';

export interface Resource {
  id: string;
  subjectId: string;
  name: string;
  type: 'youtube_playlist' | 'youtube_video' | 'pdf' | 'book' | 'notes' | 'course';
  instructor: string;
  link: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'not_started' | 'in_progress' | 'completed';
  totalVideos?: number;
  completedVideos?: number;
  totalDuration?: number; // In hours
  completedDuration?: number; // In hours
  avgVideoDuration?: number; // In minutes
}

export interface Subject {
  id: string;
  name: string;
  weightage: 'high' | 'medium' | 'low';
  approxMarks: number;
  dependencies: string[];
  status: 'locked' | 'ready' | 'in_progress' | 'completed';
  totalPYQs: number;
  solvedPYQs: number;
  pyqAccuracy: number;
  revisionProgress: number; 
}

export interface MockTest {
  id: string;
  name: string;
  date: string;
  score: number;
  rank: number;
  accuracy: number;
}

export interface UserPreferences {
  gateDate: string;
  startDate: string;
  dailyStudyHours: number;
  weeklyOffDays: number;
  playbackSpeed: number;
  revisionCycles: number;
  mockTestFrequency: 'weekly' | 'biweekly' | 'monthly';
}

export interface Habit {
  id: string;
  name: string;
  completedDates: string[]; // ISO Date Strings (YYYY-MM-DD)
  streak: number;
}

export interface GateState {
  subjects: Subject[];
  resources: Resource[];
  mockTests: MockTest[];
  habits: Habit[];
  preferences: UserPreferences;
  hasHydrated: boolean;
  
  // Hydration helper
  setHasHydrated: (state: boolean) => void;
  
  // Preferences actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  
  // Resource actions
  addResource: (resource: Omit<Resource, 'id'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  
  // Subject actions
  updateSubjectProgress: (subjectId: string, solvedPYQs: number, pyqAccuracy: number, revisionProgress: number) => void;
  recomputeSubjectStatuses: () => void;
  
  // Mock Test actions
  addMockTest: (test: Omit<MockTest, 'id'>) => void;
  deleteMockTest: (id: string) => void;
  
  // Habit actions
  toggleHabit: (id: string, dateStr: string) => void;
  addHabit: (name: string) => void;
  deleteHabit: (id: string) => void;
  
  // Log study session
  logStudySession: (subjectId: string, hours: number) => void;
  syncNotionData: () => void;
}

export const useGateStore = create<GateState>()(
  persist(
    (set, get) => ({
      subjects: DEFAULT_SUBJECTS,
      resources: DEFAULT_RESOURCES,
      mockTests: DEFAULT_MOCK_TESTS,
      habits: DEFAULT_HABITS,
      preferences: DEFAULT_PREFERENCES,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      updatePreferences: (prefs) => {
        set((state) => {
          const newPrefs = { ...state.preferences, ...prefs };
          return { preferences: newPrefs };
        });
        get().recomputeSubjectStatuses();
      },

      addResource: (res) => {
        const id = 'res_' + Math.random().toString(36).substring(2, 9);
        const newResource: Resource = {
          ...res,
          id,
          completedVideos: res.completedVideos ?? 0,
          completedDuration: res.completedDuration ?? 0,
        };

        // Recalculate duration/videos cascade
        if (newResource.type === 'youtube_playlist' && newResource.totalVideos) {
          const totalDuration = newResource.totalDuration || 
            ((newResource.totalVideos * (newResource.avgVideoDuration || 0)) / 60);
          newResource.totalDuration = parseFloat(totalDuration.toFixed(2));
          newResource.completedDuration = parseFloat((((newResource.completedVideos || 0) * (newResource.avgVideoDuration || 0)) / 60).toFixed(2));
        }

        set((state) => ({
          resources: [...state.resources, newResource]
        }));
        get().recomputeSubjectStatuses();
      },

      updateResource: (id, updates) => {
        set((state) => {
          const updatedResources = state.resources.map((res) => {
            if (res.id !== id) return res;
            
            const updated = { ...res, ...updates };

            // Cascade logic for playlists
            if (updated.type === 'youtube_playlist') {
              if (updates.completedVideos !== undefined && updated.totalVideos && updated.avgVideoDuration) {
                updated.completedDuration = parseFloat(((updates.completedVideos * updated.avgVideoDuration) / 60).toFixed(2));
              }
              if (updated.totalVideos && updated.completedVideos !== undefined) {
                if (updated.completedVideos === updated.totalVideos) {
                  updated.status = 'completed';
                } else if (updated.completedVideos > 0) {
                  updated.status = 'in_progress';
                } else {
                  updated.status = 'not_started';
                }
              }
            }
            return updated;
          });

          return { resources: updatedResources };
        });
        get().recomputeSubjectStatuses();
      },

      deleteResource: (id) => {
        set((state) => ({
          resources: state.resources.filter((res) => res.id !== id)
        }));
        get().recomputeSubjectStatuses();
      },

      updateSubjectProgress: (subjectId, solvedPYQs, pyqAccuracy, revisionProgress) => {
        set((state) => {
          const updatedSubjects = state.subjects.map((sub) => {
            if (sub.id !== subjectId) return sub;
            return {
              ...sub,
              solvedPYQs,
              pyqAccuracy,
              revisionProgress,
            };
          });
          return { subjects: updatedSubjects };
        });
      },

      recomputeSubjectStatuses: () => {
        set((state) => {
          const { resources, subjects } = state;
          
          // Helper to get total study status for a subject
          const getSubjectStatus = (subId: string): 'locked' | 'ready' | 'in_progress' | 'completed' => {
            const sub = subjects.find(s => s.id === subId);
            if (!sub) return 'locked';

            // Check if dependencies are completed
            const dependenciesCompleted = sub.dependencies.every((depId) => {
              const depSub = subjects.find(s => s.id === depId);
              if (!depSub) return true;
              return depSub.status === 'completed';
            });

            if (!dependenciesCompleted) return 'locked';

            // Determine status based on resources
            const subResources = resources.filter((r) => r.subjectId === subId);
            if (subResources.length === 0) return 'ready';

            const allCompleted = subResources.every(r => r.status === 'completed');
            const anyStarted = subResources.some(r => r.status === 'in_progress' || r.status === 'completed');

            if (allCompleted) return 'completed';
            if (anyStarted) return 'in_progress';
            return 'ready';
          };

          const updatedSubjects = subjects.map((sub) => ({
            ...sub,
            status: getSubjectStatus(sub.id),
          }));

          return { subjects: updatedSubjects };
        });
      },

      addMockTest: (test) => {
        const id = 'mock_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          mockTests: [...state.mockTests, { ...test, id }]
        }));
      },

      deleteMockTest: (id) => {
        set((state) => ({
          mockTests: state.mockTests.filter((mt) => mt.id !== id)
        }));
      },

      toggleHabit: (id, dateStr) => {
        set((state) => {
          const updatedHabits = state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const isCompleted = habit.completedDates.includes(dateStr);
            let newDates = [...habit.completedDates];

            if (isCompleted) {
              newDates = newDates.filter(d => d !== dateStr);
            } else {
              newDates.push(dateStr);
            }

            // Simple streak recalculation: check consecutive backward days starting today
            newDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); 
            
            let streak = 0;
            if (newDates.length > 0) {
              const today = new Date();
              today.setHours(0,0,0,0);
              let currentCheck = new Date(today);
              
              const hasCompletedCheck = (d: Date) => {
                const checkStr = d.toISOString().split('T')[0];
                return newDates.includes(checkStr);
              };

              if (hasCompletedCheck(currentCheck)) {
                streak = 1;
                while (true) {
                  currentCheck.setDate(currentCheck.getDate() - 1);
                  if (hasCompletedCheck(currentCheck)) {
                    streak++;
                  } else {
                    break;
                  }
                }
              } else {
                currentCheck.setDate(currentCheck.getDate() - 1);
                if (hasCompletedCheck(currentCheck)) {
                  streak = 1;
                  while (true) {
                    currentCheck.setDate(currentCheck.getDate() - 1);
                    if (hasCompletedCheck(currentCheck)) {
                      streak++;
                    } else {
                      break;
                    }
                  }
                }
              }
            }

            return {
              ...habit,
              completedDates: newDates,
              streak,
            };
          });

          return { habits: updatedHabits };
        });
      },

      addHabit: (name) => {
        const id = 'habit_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          habits: [...state.habits, { id, name, completedDates: [], streak: 0 }]
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id)
        }));
      },

      logStudySession: (subjectId, hours) => {
        set((state) => {
          const subjectResources = state.resources.filter(r => r.subjectId === subjectId);
          if (subjectResources.length === 0) return {};
          
          let targetResource = subjectResources.find(r => r.status !== 'completed');
          if (!targetResource) targetResource = subjectResources[0];

          const updatedResources = state.resources.map((res) => {
            if (res.id !== targetResource.id) return res;
            
            const newCompletedDuration = Math.min(
              res.totalDuration || 999,
              (res.completedDuration || 0) + hours
            );

            let newCompletedVideos = res.completedVideos;
            if (res.type === 'youtube_playlist' && res.avgVideoDuration && res.totalVideos) {
              newCompletedVideos = Math.min(
                res.totalVideos,
                Math.round((newCompletedDuration * 60) / res.avgVideoDuration)
              );
            }

            const updatedRes = {
              ...res,
              completedDuration: parseFloat(newCompletedDuration.toFixed(2)),
              completedVideos: newCompletedVideos,
            };

            if (updatedRes.totalVideos && updatedRes.completedVideos !== undefined) {
              if (updatedRes.completedVideos === updatedRes.totalVideos) {
                updatedRes.status = 'completed';
              } else if (updatedRes.completedVideos > 0) {
                updatedRes.status = 'in_progress';
              } else {
                updatedRes.status = 'not_started';
              }
            } else {
              updatedRes.status = 'in_progress';
            }

            return updatedRes;
          });

          return { resources: updatedResources };
        });
        get().recomputeSubjectStatuses();
      },

      syncNotionData: () => {
        set((state) => {
          const defaultMap = new Map(DEFAULT_RESOURCES.map(r => [r.id, r]));
          
          let updatedResources = state.resources.map(res => {
            const defaultRes = defaultMap.get(res.id);
            if (defaultRes) {
              return {
                ...res,
                name: defaultRes.name,
                link: defaultRes.link,
                instructor: defaultRes.instructor,
                totalVideos: defaultRes.totalVideos,
                totalDuration: defaultRes.totalDuration,
                avgVideoDuration: defaultRes.avgVideoDuration,
              };
            }
            return res;
          });

          // Ensure any missing default resources are added
          DEFAULT_RESOURCES.forEach(defRes => {
            if (!updatedResources.some(r => r.id === defRes.id)) {
              updatedResources.push({ ...defRes });
            }
          });

          // Sync checklist state: General Aptitude playlist progress updated
          updatedResources = updatedResources.map(res => {
            if (res.id === 'r_aptitude') {
              return {
                ...res,
                status: 'in_progress' as const,
                completedVideos: Math.max(res.completedVideos || 0, 12),
                completedDuration: Math.max(res.completedDuration || 0, 6),
              };
            }
            return res;
          });

          const updatedSubjects = state.subjects.map(sub => {
            if (sub.id === 'aptitude') {
              return {
                ...sub,
                status: 'in_progress' as const,
                solvedPYQs: Math.max(sub.solvedPYQs, 15),
                pyqAccuracy: Math.max(sub.pyqAccuracy, 80),
              };
            }
            return sub;
          });

          // Sync Habits and checklist
          const updatedHabits = state.habits.map(habit => {
            if (habit.id === 'h1' || habit.id === 'h2') {
              const todayStr = new Date().toISOString().split('T')[0];
              if (!habit.completedDates.includes(todayStr)) {
                return {
                  ...habit,
                  completedDates: [...habit.completedDates, todayStr],
                  streak: habit.streak + 1
                };
              }
            }
            return habit;
          });

          return {
            subjects: updatedSubjects,
            resources: updatedResources,
            habits: updatedHabits
          };
        });

        get().recomputeSubjectStatuses();
      },
    }),
    {
      name: 'gate-dashboard-store-v2',
      skipHydration: true,
      partialize: (state) => ({
        subjects: state.subjects,
        resources: state.resources,
        mockTests: state.mockTests,
        habits: state.habits,
        preferences: state.preferences,
      }),
    }
  )
);

// SECONDARY TIMER STORE (NON-PERSISTED TO PREVENT LOCALSTORAGE BURDEN & GLOBAL RE-RENDERS)
export interface PomodoroState {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  completedSessions: number;
}

export interface DailyTimerState {
  elapsedTime: number; 
  isRunning: boolean;
}

export interface TimerState {
  pomodoro: PomodoroState;
  dailyTimer: DailyTimerState;
  
  startPomodoro: () => void;
  pausePomodoro: () => void;
  tickPomodoro: () => void;
  resetPomodoro: (mode?: 'work' | 'break') => void;
  
  startDailyTimer: () => void;
  pauseDailyTimer: () => void;
  tickDailyTimer: () => void;
  resetDailyTimer: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  pomodoro: {
    timeLeft: 1500,
    duration: 1500,
    isRunning: false,
    mode: 'work',
    completedSessions: 0,
  },
  dailyTimer: {
    elapsedTime: 0,
    isRunning: false,
  },

  startPomodoro: () => set((state) => ({
    pomodoro: { ...state.pomodoro, isRunning: true }
  })),

  pausePomodoro: () => set((state) => ({
    pomodoro: { ...state.pomodoro, isRunning: false }
  })),

  tickPomodoro: () => set((state) => {
    const { timeLeft, isRunning, mode, duration, completedSessions } = state.pomodoro;
    if (!isRunning) return {};

    if (timeLeft <= 1) {
      const nextMode = mode === 'work' ? 'break' : 'work';
      const nextDuration = nextMode === 'work' ? 1500 : 300; 
      return {
        pomodoro: {
          timeLeft: nextDuration,
          duration: nextDuration,
          isRunning: false, 
          mode: nextMode,
          completedSessions: mode === 'work' ? completedSessions + 1 : completedSessions,
        }
      };
    }

    return {
      pomodoro: { ...state.pomodoro, timeLeft: timeLeft - 1 }
    };
  }),

  resetPomodoro: (mode) => set((state) => {
    const activeMode = mode || state.pomodoro.mode;
    const nextDuration = activeMode === 'work' ? 1500 : 300;
    return {
      pomodoro: {
        ...state.pomodoro,
        timeLeft: nextDuration,
        duration: nextDuration,
        isRunning: false,
        mode: activeMode,
      }
    };
  }),

  startDailyTimer: () => set((state) => ({
    dailyTimer: { ...state.dailyTimer, isRunning: true }
  })),

  pauseDailyTimer: () => set((state) => ({
    dailyTimer: { ...state.dailyTimer, isRunning: false }
  })),

  tickDailyTimer: () => set((state) => {
    if (!state.dailyTimer.isRunning) return {};
    return {
      dailyTimer: {
        ...state.dailyTimer,
        elapsedTime: state.dailyTimer.elapsedTime + 1,
      }
    };
  }),

  resetDailyTimer: () => set({
    dailyTimer: {
      elapsedTime: 0,
      isRunning: false,
    }
  }),
}));
