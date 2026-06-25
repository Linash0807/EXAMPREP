'use client';

import { useState, useRef, useEffect } from 'react';
import { useGateStore } from '@/store/useGateStore';
import { 
  generateTimeline, 
  checkPlanFeasibility, 
  detectBacklogs,
  calculateReadinessScore
} from '@/utils/plannerAlgorithm';
import { MessageSquareCode, Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AssistantPage() {
  const { subjects, resources, mockTests, preferences, hasHydrated } = useGateStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Hello! I am your GATE 2027 AI Prep Coach. I have analyzed your study resources, dependencies, and mock scores.

Here are some things you can ask me:
1. "What should I study next?"
2. "Is my timeline feasible?"
3. "Do I have any backlogs?"
4. "How can I improve my readiness score?"`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!hasHydrated) {
    return (
      <div className="p-8 text-center text-zinc-500 font-semibold uppercase animate-pulse">
        Initializing AI Assistant...
      </div>
    );
  }

  // AI Response Router based on user local prep state
  const getAIResponse = (query: string): string => {
    const text = query.toLowerCase();

    // 1. Study Next Subject
    if (text.includes('next') || text.includes('study next') || text.includes('what subject')) {
      const timeline = generateTimeline(subjects, resources, preferences);
      const sorted = timeline.filter(b => b.type === 'learning');
      const nextBlock = sorted.find((block) => {
        const sub = subjects.find(s => s.id === block.subjectId);
        return sub && sub.status !== 'completed';
      });

      if (nextBlock) {
        return `Based on subject dependencies and marks weightage, you should study **${nextBlock.subjectName}** next.
        
Our current schedule allocates **${preferences.dailyStudyHours} hours/day** for this subject, starting on **${nextBlock.startDate}** and ending on **${nextBlock.endDate}**. Ensure you complete its Revision 1 & PYQs immediately after to solidify the concepts.`;
      }
      return `Awesome work! You have finished syllabus learning for all subjects. You should now dedicate your time to Revision Cycle 2 and full-length mock exams.`;
    }

    // 2. Feasibility
    if (text.includes('feasible') || text.includes('finish') || text.includes('before gate') || text.includes('exam date')) {
      const feasibility = checkPlanFeasibility(subjects, resources, preferences);
      if (feasibility.isFeasible) {
        return `Yes, your current plan is **highly feasible**!
        
You are projected to finish all learning and revision cycles by **${feasibility.revision3CompletionDate}**, which leaves you with a buffer of **${feasibility.bufferDays} days** before the GATE exam on ${preferences.gateDate}. Keep studying at your current rate of **${preferences.dailyStudyHours} hours/day**!`;
      } else {
        return `Currently, **NO**. Your plan is not feasible at your current pace.
        
You are projected to finish on **${feasibility.revision3CompletionDate}**, which is **${Math.abs(feasibility.bufferDays)} days AFTER** the GATE exam.
        
**How to fix:**
You need to increase your daily study quota to **${feasibility.dailyHoursRequiredToFinish} hours/day** to complete on time. Alternatively, consider increasing your video playback speed or reducing weekly off days.`;
      }
    }

    // 3. Backlogs
    if (text.includes('backlog') || text.includes('delay') || text.includes('recover') || text.includes('behind')) {
      const timeline = generateTimeline(subjects, resources, preferences);
      const backlogs = detectBacklogs(subjects, resources, preferences, timeline);

      if (backlogs.length > 0) {
        const items = backlogs.map((b) => `- **${b.subjectName}**: You are behind by **${b.missedHours} hours**. Recovery Plan: *${b.recoveryPlan}*`).join('\n');
        return `I have detected studies backlog in the following subject areas:\n\n${items}\n\nI recommend utilizing your next study session to address these gaps to maintain timeline integrity.`;
      }
      return `Excellent consistency! I did not detect any study backlogs. Your logged study hours align perfectly with your generated planner timeline.`;
    }

    // 4. Readiness Score improvement
    if (text.includes('readiness') || text.includes('score') || text.includes('improve') || text.includes('better')) {
      const readiness = calculateReadinessScore(subjects, resources, mockTests, preferences.playbackSpeed);
      return `Your current preparation Readiness Score is **${readiness.score}/100** (Classified as **${readiness.label}**).
      
Here is the breakdown:
- Syllabus completion quality: **${readiness.breakdown.completion}%**
- Revision coverage cycles: **${readiness.breakdown.revision}%**
- Mock test metrics: **${readiness.breakdown.mock}%**
      
**To increase this score:**
1. Log completions for your remaining resources to push syllabus coverage.
2. Update your revision progress indicators as you review subjects.
3. Take and log more Mock Tests. Each test with a higher score calibrates your exam readiness up to a strong target.`;
    }

    // 5. Default GATE strategy advice
    return `GATE preparation requires a strategic approach. Here is my AI blueprint recommendation:
- **Dependency First**: Complete foundational subjects first (e.g. C Programming -> Data Structures -> Algorithms).
- **Consolidated Revisions**: Spend at least 30% of your time on first-cycle revision with PYQ solving.
- **Mock Calibrations**: Log mock tests regularly. Focus on maintaining an accuracy above 75% to hit a top double-digit rank.
    
Let me know if you want me to analyze your specific subjects, timeline feasibility, or backlog recovery!`;
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const userMsg: ChatMessage = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate AI thinking and typing delay
    setTimeout(() => {
      const aiReply = getAIResponse(textToSend);
      const aiMsg: ChatMessage = {
        id: 'ai_' + Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1000px] mx-auto w-full h-[calc(100vh-5rem)]">
      
      {/* HEADER CARD */}
      <div className="glass-panel p-4 rounded-xl border border-purple-500/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">GATE AI Preparation Assistant</h3>
            <p className="text-[10px] text-emerald-400 font-medium">Online • Preparing personalized feedback</p>
          </div>
        </div>
      </div>

      {/* CHAT DISPLAY BODY */}
      <div className="flex-1 glass-panel rounded-xl border border-zinc-800 p-5 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[80%] ${isAI ? 'self-start' : 'self-end flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isAI ? 'bg-purple-950/40 border-purple-500/20 text-purple-400' : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Text Bubble */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                isAI ? 'bg-zinc-950/60 border border-zinc-900 text-zinc-200' : 'bg-purple-600 text-white font-medium glow-primary/10'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>
                <span className={`text-[8.5px] block mt-1.5 text-right ${isAI ? 'text-zinc-650' : 'text-purple-200'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 self-start">
            <div className="w-8 h-8 rounded-lg bg-purple-955/40 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-zinc-950/40 border border-zinc-900 p-3 rounded-2xl flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      <div className="flex flex-wrap gap-2 shrink-0">
        <button 
          onClick={() => handleSendMessage('What should I study next?')}
          className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 text-[10.5px] font-semibold text-zinc-400 hover:text-white transition"
        >
          ✦ Next subject priority
        </button>
        <button 
          onClick={() => handleSendMessage('Is my timeline feasible?')}
          className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 text-[10.5px] font-semibold text-zinc-400 hover:text-white transition"
        >
          ✦ Plan Feasibility Check
        </button>
        <button 
          onClick={() => handleSendMessage('Do I have any backlogs?')}
          className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 text-[10.5px] font-semibold text-zinc-400 hover:text-white transition"
        >
          ✦ Check Backlogs & recovery
        </button>
        <button 
          onClick={() => handleSendMessage('How can I improve my readiness score?')}
          className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 text-[10.5px] font-semibold text-zinc-400 hover:text-white transition"
        >
          ✦ Maximize Readiness
        </button>
      </div>

      {/* INPUT PANEL */}
      <div className="flex gap-2 shrink-0">
        <input 
          type="text" 
          placeholder="Ask your study coach anything about your schedule..." 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputVal)}
          className="flex-1 text-xs bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-650"
        />
        <button 
          onClick={() => handleSendMessage(inputVal)}
          disabled={!inputVal.trim()}
          className="px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-900 disabled:text-zinc-650 text-white font-bold transition flex items-center justify-center glow-primary"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
