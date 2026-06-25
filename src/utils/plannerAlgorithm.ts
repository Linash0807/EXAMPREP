import { Subject, Resource, UserPreferences, MockTest } from '@/store/useGateStore';
import { getSortedSubjects } from './dependencyGraph';

export interface TimelineBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  type: 'learning' | 'revision_1' | 'revision_2' | 'revision_3' | 'pyqs' | 'mock_tests';
  startDate: string;
  endDate: string;
  durationDays: number;
  hoursAllocated: number;
}

export interface FeasibilityResult {
  isFeasible: boolean;
  syllabusCompletionDate: string;
  revision1CompletionDate: string;
  revision2CompletionDate: string;
  revision3CompletionDate: string;
  bufferDays: number;
  totalHoursNeeded: number;
  dailyHoursRequiredToFinish: number;
  simulations: {
    hoursPerDay: number;
    completionDate: string;
    isFeasible: boolean;
  }[];
}

/**
 * Calculates effective hours for resources based on type and playback speed.
 */
export function getEffectiveResourceHours(res: Resource, playbackSpeed: number): { total: number; completed: number; remaining: number } {
  // Determine raw duration
  let rawTotal = 0;
  if (res.totalDuration) {
    rawTotal = res.totalDuration;
  } else if (res.totalVideos && res.avgVideoDuration) {
    rawTotal = (res.totalVideos * res.avgVideoDuration) / 60;
  } else {
    // Standard baseline weights if not specified
    const defaults: Record<string, number> = {
      youtube_playlist: 30,
      youtube_video: 2,
      pdf: 8,
      book: 40,
      notes: 10,
      course: 30,
    };
    rawTotal = defaults[res.type] || 15;
  }

  let rawCompleted = 0;
  if (res.completedDuration !== undefined) {
    rawCompleted = res.completedDuration;
  } else if (res.completedVideos !== undefined && res.avgVideoDuration) {
    rawCompleted = (res.completedVideos * res.avgVideoDuration) / 60;
  } else if (res.status === 'completed') {
    rawCompleted = rawTotal;
  } else if (res.status === 'in_progress') {
    rawCompleted = rawTotal * 0.5; // Guess 50%
  }

  // Speed only applies to video content
  const isVideo = res.type === 'youtube_playlist' || res.type === 'youtube_video';
  const speed = isVideo ? playbackSpeed : 1.0;

  const total = rawTotal / speed;
  const completed = rawCompleted / speed;
  const remaining = Math.max(0, total - completed);

  return {
    total: parseFloat(total.toFixed(2)),
    completed: parseFloat(completed.toFixed(2)),
    remaining: parseFloat(remaining.toFixed(2)),
  };
}

/**
 * Gets total effective study hours for a subject.
 */
export function getSubjectHours(subjectId: string, resources: Resource[], playbackSpeed: number) {
  const subResources = resources.filter(r => r.subjectId === subjectId);
  
  if (subResources.length === 0) {
    // If no resources are added yet, assume a default study duration based on weightage
    // High = 45h, Medium = 30h, Low = 15h
    return { total: 35, completed: 0, remaining: 35 };
  }

  let total = 0;
  let completed = 0;
  let remaining = 0;

  subResources.forEach((res) => {
    const hours = getEffectiveResourceHours(res, playbackSpeed);
    total += hours.total;
    completed += hours.completed;
    remaining += hours.remaining;
  });

  return {
    total: parseFloat(total.toFixed(2)),
    completed: parseFloat(completed.toFixed(2)),
    remaining: parseFloat(remaining.toFixed(2)),
  };
}

/**
 * Date progression helper that skips weekly off days.
 */
function addDaysWithOffDays(startDateStr: string, hoursNeeded: number, dailyHours: number, weeklyOffDays: number): { endDateStr: string; calendarDaysUsed: number; timelineDays: { dateStr: string; isOffDay: boolean; hoursStudied: number }[] } {
  const timelineDays: { dateStr: string; isOffDay: boolean; hoursStudied: number }[] = [];
  let currentDate = new Date(startDateStr);
  let remainingHours = hoursNeeded;

  if (hoursNeeded <= 0) {
    return {
      endDateStr: startDateStr,
      calendarDaysUsed: 0,
      timelineDays: [],
    };
  }

  while (remainingHours > 0) {
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
    let isOffDay = false;

    if (weeklyOffDays === 1 && dayOfWeek === 0) {
      // 1 off day: Sunday off
      isOffDay = true;
    } else if (weeklyOffDays === 2 && (dayOfWeek === 0 || dayOfWeek === 6)) {
      // 2 off days: Saturday and Sunday off
      isOffDay = true;
    }

    const dateStr = currentDate.toISOString().split('T')[0];
    const hoursStudied = isOffDay ? 0 : Math.min(dailyHours, remainingHours);

    timelineDays.push({
      dateStr,
      isOffDay,
      hoursStudied,
    });

    if (!isOffDay) {
      remainingHours -= hoursStudied;
    }

    // Only increment date if there is remaining hours, or advance to cover the end date
    if (remainingHours > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return {
    endDateStr: currentDate.toISOString().split('T')[0],
    calendarDaysUsed: timelineDays.length,
    timelineDays,
  };
}

/**
 * Generates the complete timeline blocks for syllabus, revisions, PYQs, and mock tests.
 */
export function generateTimeline(
  subjects: Subject[],
  resources: Resource[],
  prefs: UserPreferences
): TimelineBlock[] {
  const sortedSubjects = getSortedSubjects(subjects);
  const blocks: TimelineBlock[] = [];
  let currentDateStr = prefs.startDate;

  // 1. Learning + Revision 1 (30%) + PYQs
  // Revision 1 & PYQs are done right after learning each subject
  sortedSubjects.forEach((sub) => {
    const hours = getSubjectHours(sub.id, resources, prefs.playbackSpeed);
    
    // Learning Block
    if (hours.remaining > 0) {
      const learningCalc = addDaysWithOffDays(currentDateStr, hours.remaining, prefs.dailyStudyHours, prefs.weeklyOffDays);
      blocks.push({
        id: `learn_${sub.id}`,
        subjectId: sub.id,
        subjectName: sub.name,
        type: 'learning',
        startDate: currentDateStr,
        endDate: learningCalc.endDateStr,
        durationDays: learningCalc.calendarDaysUsed,
        hoursAllocated: hours.remaining,
      });

      // Update currentDateStr to day after learning end
      const nextDate = new Date(learningCalc.endDateStr);
      nextDate.setDate(nextDate.getDate() + 1);
      currentDateStr = nextDate.toISOString().split('T')[0];
    }

    // Revision 1 Block (30% of learning hours)
    const rev1Hours = parseFloat((hours.total * 0.30).toFixed(2));
    if (rev1Hours > 0) {
      const rev1Calc = addDaysWithOffDays(currentDateStr, rev1Hours, prefs.dailyStudyHours, prefs.weeklyOffDays);
      blocks.push({
        id: `rev1_${sub.id}`,
        subjectId: sub.id,
        subjectName: sub.name,
        type: 'revision_1',
        startDate: currentDateStr,
        endDate: rev1Calc.endDateStr,
        durationDays: rev1Calc.calendarDaysUsed,
        hoursAllocated: rev1Hours,
      });

      // Also append a parallel PYQ Block during this time
      blocks.push({
        id: `pyq_${sub.id}`,
        subjectId: sub.id,
        subjectName: sub.name,
        type: 'pyqs',
        startDate: currentDateStr,
        endDate: rev1Calc.endDateStr,
        durationDays: rev1Calc.calendarDaysUsed,
        hoursAllocated: 0, // Integrated with revision
      });

      const nextDate = new Date(rev1Calc.endDateStr);
      nextDate.setDate(nextDate.getDate() + 1);
      currentDateStr = nextDate.toISOString().split('T')[0];
    }
  });

  // 2. Revision 2 (20%) - Scheduled as a block for all subjects sequentially
  if (prefs.revisionCycles >= 2) {
    sortedSubjects.forEach((sub) => {
      const hours = getSubjectHours(sub.id, resources, prefs.playbackSpeed);
      const rev2Hours = parseFloat((hours.total * 0.20).toFixed(2));
      if (rev2Hours > 0) {
        const rev2Calc = addDaysWithOffDays(currentDateStr, rev2Hours, prefs.dailyStudyHours, prefs.weeklyOffDays);
        blocks.push({
          id: `rev2_${sub.id}`,
          subjectId: sub.id,
          subjectName: sub.name,
          type: 'revision_2',
          startDate: currentDateStr,
          endDate: rev2Calc.endDateStr,
          durationDays: rev2Calc.calendarDaysUsed,
          hoursAllocated: rev2Hours,
        });

        const nextDate = new Date(rev2Calc.endDateStr);
        nextDate.setDate(nextDate.getDate() + 1);
        currentDateStr = nextDate.toISOString().split('T')[0];
      }
    });
  }

  // 3. Revision 3 (10%) + Mock Tests - Final push phase
  if (prefs.revisionCycles >= 3) {
    sortedSubjects.forEach((sub) => {
      const hours = getSubjectHours(sub.id, resources, prefs.playbackSpeed);
      const rev3Hours = parseFloat((hours.total * 0.10).toFixed(2));
      if (rev3Hours > 0) {
        const rev3Calc = addDaysWithOffDays(currentDateStr, rev3Hours, prefs.dailyStudyHours, prefs.weeklyOffDays);
        blocks.push({
          id: `rev3_${sub.id}`,
          subjectId: sub.id,
          subjectName: sub.name,
          type: 'revision_3',
          startDate: currentDateStr,
          endDate: rev3Calc.endDateStr,
          durationDays: rev3Calc.calendarDaysUsed,
          hoursAllocated: rev3Hours,
        });

        const nextDate = new Date(rev3Calc.endDateStr);
        nextDate.setDate(nextDate.getDate() + 1);
        currentDateStr = nextDate.toISOString().split('T')[0];
      }
    });
  }

  // Mock Tests Block - Schedule parallel blocks representing mock tests
  // Starting when Revision 2 begins, repeating based on frequency
  const rev2StartBlock = blocks.find(b => b.type === 'revision_2');
  if (rev2StartBlock) {
    const mockStartStr = rev2StartBlock.startDate;
    const mockEndStr = currentDateStr; // Up to final revision completion
    const durationDays = Math.ceil((new Date(mockEndStr).getTime() - new Date(mockStartStr).getTime()) / (1000 * 60 * 60 * 24));
    
    if (durationDays > 0) {
      blocks.push({
        id: 'mock_test_block',
        subjectId: 'all',
        subjectName: 'Mock Test Series',
        type: 'mock_tests',
        startDate: mockStartStr,
        endDate: mockEndStr,
        durationDays: durationDays,
        hoursAllocated: 0,
      });
    }
  }

  return blocks;
}

/**
 * Evaluates feasibility of the study plan against the GATE exam date.
 */
export function checkPlanFeasibility(
  subjects: Subject[],
  resources: Resource[],
  prefs: UserPreferences
): FeasibilityResult {
  const blocks = generateTimeline(subjects, resources, prefs);
  
  // Find completion dates
  const learningBlocks = blocks.filter(b => b.type === 'learning');
  const rev1Blocks = blocks.filter(b => b.type === 'revision_1');
  const rev2Blocks = blocks.filter(b => b.type === 'revision_2');
  const rev3Blocks = blocks.filter(b => b.type === 'revision_3');

  const syllabusCompletionDate = learningBlocks.length > 0 ? learningBlocks[learningBlocks.length - 1].endDate : prefs.startDate;
  const revision1CompletionDate = rev1Blocks.length > 0 ? rev1Blocks[rev1Blocks.length - 1].endDate : syllabusCompletionDate;
  const revision2CompletionDate = rev2Blocks.length > 0 ? rev2Blocks[rev2Blocks.length - 1].endDate : revision1CompletionDate;
  const revision3CompletionDate = rev3Blocks.length > 0 ? rev3Blocks[rev3Blocks.length - 1].endDate : revision2CompletionDate;

  // Final end date is the end of the last phase scheduled
  let finalCompletionDate = revision1CompletionDate;
  if (prefs.revisionCycles === 2) finalCompletionDate = revision2CompletionDate;
  if (prefs.revisionCycles === 3) finalCompletionDate = revision3CompletionDate;

  const gateDateObj = new Date(prefs.gateDate);
  const completionDateObj = new Date(finalCompletionDate);
  const timeDifference = gateDateObj.getTime() - completionDateObj.getTime();
  const bufferDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  const isFeasible = bufferDays >= 0;

  // Calculate total hours needed
  let totalHoursNeeded = 0;
  blocks.forEach(b => {
    if (b.type !== 'mock_tests' && b.type !== 'pyqs') {
      totalHoursNeeded += b.hoursAllocated;
    }
  });

  // Calculate required study hours per day to finish exactly on time
  const daysUntilGate = Math.max(1, Math.ceil((gateDateObj.getTime() - new Date(prefs.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  
  // Adjust for off days in the remaining days
  const weeksAvailable = daysUntilGate / 7;
  const studyDaysAvailable = Math.max(1, daysUntilGate - (weeksAvailable * prefs.weeklyOffDays));
  const dailyHoursRequiredToFinish = parseFloat((totalHoursNeeded / studyDaysAvailable).toFixed(1));

  // Run simulations for different daily hour targets
  const targetScenarios = [4, 5, 6, 8];
  const simulations = targetScenarios.map((hours) => {
    const simulatedPrefs = { ...prefs, dailyStudyHours: hours };
    const simBlocks = generateTimeline(subjects, resources, simulatedPrefs);
    
    let simCompletion = prefs.startDate;
    const simR1 = simBlocks.filter(b => b.type === 'revision_1');
    const simR2 = simBlocks.filter(b => b.type === 'revision_2');
    const simR3 = simBlocks.filter(b => b.type === 'revision_3');

    if (prefs.revisionCycles === 1 && simR1.length > 0) simCompletion = simR1[simR1.length - 1].endDate;
    else if (prefs.revisionCycles === 2 && simR2.length > 0) simCompletion = simR2[simR2.length - 1].endDate;
    else if (simR3.length > 0) simCompletion = simR3[simR3.length - 1].endDate;
    else if (simBlocks.length > 0) simCompletion = simBlocks[simBlocks.length - 1].endDate;

    const simBuffer = Math.floor((gateDateObj.getTime() - new Date(simCompletion).getTime()) / (1000 * 60 * 60 * 24));

    return {
      hoursPerDay: hours,
      completionDate: simCompletion,
      isFeasible: simBuffer >= 0,
    };
  });

  return {
    isFeasible,
    syllabusCompletionDate,
    revision1CompletionDate,
    revision2CompletionDate,
    revision3CompletionDate,
    bufferDays,
    totalHoursNeeded: parseFloat(totalHoursNeeded.toFixed(1)),
    dailyHoursRequiredToFinish,
    simulations,
  };
}

/**
 * Calculates readiness score based on syllabus completion, revision progress, and mock scores.
 */
export function calculateReadinessScore(
  subjects: Subject[],
  resources: Resource[],
  mockTests: MockTest[],
  playbackSpeed: number
): { score: number; label: 'Beginner' | 'Intermediate' | 'Strong' | 'Exam Ready'; breakdown: { completion: number; revision: number; mock: number } } {
  
  // 1. Syllabus Completion (50%)
  let totalHours = 0;
  let completedHours = 0;

  subjects.forEach((sub) => {
    const hours = getSubjectHours(sub.id, resources, playbackSpeed);
    totalHours += hours.total;
    completedHours += hours.completed;
  });

  const completionPercent = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

  // 2. Revision Completion (30%)
  // Sum of revisionProgress of all subjects divided by number of subjects
  const totalRevisionProgress = subjects.reduce((acc, sub) => acc + sub.revisionProgress, 0);
  const avgRevisionPercent = subjects.length > 0 ? totalRevisionProgress / subjects.length : 0;

  // 3. Mock Tests (20%)
  // We can look at:
  // - Number of mock tests taken (each test adds points up to 5 tests)
  // - Average score / accuracy in mock tests
  let mockPercent = 0;
  if (mockTests.length > 0) {
    const avgScore = mockTests.reduce((acc, mt) => acc + mt.score, 0) / mockTests.length;
    // Scale average score (e.g. 70/100 is 100% preparation quality indicator, let's cap score ratio)
    const scoreFactor = Math.min(100, (avgScore / 75) * 100); 
    const testCountFactor = Math.min(100, (mockTests.length / 5) * 100);
    mockPercent = (scoreFactor * 0.7) + (testCountFactor * 0.3);
  }

  const finalScore = Math.round(
    (completionPercent * 0.50) + 
    (avgRevisionPercent * 0.30) + 
    (mockPercent * 0.20)
  );

  let label: 'Beginner' | 'Intermediate' | 'Strong' | 'Exam Ready' = 'Beginner';
  if (finalScore > 90) label = 'Exam Ready';
  else if (finalScore > 70) label = 'Strong';
  else if (finalScore > 40) label = 'Intermediate';

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    label,
    breakdown: {
      completion: Math.round(completionPercent),
      revision: Math.round(avgRevisionPercent),
      mock: Math.round(mockPercent),
    }
  };
}

/**
 * Compares two playlist resources for speed, coverage, and efficiency.
 */
export interface ResourceComparisonResult {
  hoursSaved: number;
  timeSavingsPercent: number;
  coverageRatio: number; // Ratio of videos
  efficiencyFactor: number; // Duration per video
  completionSpeedDays: number;
  recommendation: string;
}

export function comparePlaylists(
  playA: Resource,
  playB: Resource,
  dailyStudyHours: number,
  playbackSpeed: number
): { result: ResourceComparisonResult; resourceA: Resource; resourceB: Resource } {
  
  const hoursA = getEffectiveResourceHours(playA, playbackSpeed).total;
  const hoursB = getEffectiveResourceHours(playB, playbackSpeed).total;

  const rawHoursA = getEffectiveResourceHours(playA, 1.0).total;
  const rawHoursB = getEffectiveResourceHours(playB, 1.0).total;

  const savingsA = rawHoursA - hoursA;
  const savingsB = rawHoursB - hoursB;

  const videosA = playA.totalVideos || 0;
  const videosB = playB.totalVideos || 0;

  const avgDurA = playA.avgVideoDuration || 0;
  const avgDurB = playB.avgVideoDuration || 0;

  // Let's compute recommendations
  let recommendation = '';
  if (hoursA < hoursB) {
    const diff = (hoursB - hoursA).toFixed(1);
    recommendation = `"${playA.name}" is more time-efficient, saving you ${diff} effective hours compared to "${playB.name}". It is recommended for a fast-track coverage.`;
  } else if (hoursB < hoursA) {
    const diff = (hoursA - hoursB).toFixed(1);
    recommendation = `"${playB.name}" is more compact, saving you ${diff} effective hours compared to "${playA.name}". It is recommended for a fast-track coverage.`;
  } else {
    recommendation = `Both resources have similar coverage durations. Choose based on instructor preference ("${playA.instructor}" vs "${playB.instructor}").`;
  }

  if (videosA > videosB + 15 && hoursA < hoursB) {
    recommendation += ` Note: "${playA.name}" has more videos but shorter average length, which might offer more modular revision points.`;
  }

  const result: ResourceComparisonResult = {
    hoursSaved: Math.abs(hoursA - hoursB),
    timeSavingsPercent: parseFloat((Math.abs(hoursA - hoursB) / Math.max(hoursA, hoursB) * 100).toFixed(1)),
    coverageRatio: parseFloat((videosA / Math.max(1, videosB)).toFixed(2)),
    efficiencyFactor: parseFloat((avgDurA / Math.max(1, avgDurB)).toFixed(2)),
    completionSpeedDays: Math.ceil(Math.abs(hoursA - hoursB) / dailyStudyHours),
    recommendation,
  };

  return {
    result,
    resourceA: { ...playA, totalDuration: rawHoursA },
    resourceB: { ...playB, totalDuration: rawHoursB }
  };
}

export interface BacklogItem {
  subjectId: string;
  subjectName: string;
  missedHours: number;
  expectedHours: number;
  actualHours: number;
  recoveryPlan: string;
}

export function detectBacklogs(
  subjects: Subject[],
  resources: Resource[],
  prefs: UserPreferences,
  blocks: TimelineBlock[]
): BacklogItem[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  
  const backlogs: BacklogItem[] = [];

  // Filter learning blocks
  const learnBlocks = blocks.filter(b => b.type === 'learning');

  learnBlocks.forEach((block) => {
    const blockStart = new Date(block.startDate);
    const blockEnd = new Date(block.endDate);
    
    // If the subject study period has started
    if (blockStart <= today) {
      const hours = getSubjectHours(block.subjectId, resources, prefs.playbackSpeed);
      
      // Calculate how many study days have elapsed from block start to today
      let elapsedStudyDays = 0;
      const cursor = new Date(blockStart);
      const limit = today < blockEnd ? today : blockEnd;

      while (cursor <= limit) {
        const dayOfWeek = cursor.getDay();
        let isOffDay = false;
        if (prefs.weeklyOffDays === 1 && dayOfWeek === 0) isOffDay = true;
        else if (prefs.weeklyOffDays === 2 && (dayOfWeek === 0 || dayOfWeek === 6)) isOffDay = true;

        if (!isOffDay) {
          elapsedStudyDays++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      const expectedHours = Math.min(block.hoursAllocated, elapsedStudyDays * prefs.dailyStudyHours);
      const actualHours = hours.completed;

      if (actualHours < expectedHours - 0.5) { // minor delta tolerance
        const missedHours = parseFloat((expectedHours - actualHours).toFixed(1));
        
        // Calculate recovery plan: e.g. recover in 10 days
        const recoveryDays = 10;
        const extraHoursPerDay = parseFloat((missedHours / recoveryDays).toFixed(1));

        backlogs.push({
          subjectId: block.subjectId,
          subjectName: block.subjectName,
          missedHours,
          expectedHours: parseFloat(expectedHours.toFixed(1)),
          actualHours: parseFloat(actualHours.toFixed(1)),
          recoveryPlan: `Need +${extraHoursPerDay} Hours/Day for ${recoveryDays} days to recover.`
        });
      }
    }
  });

  return backlogs;
}

