import { Subject } from '@/store/useGateStore';

/**
 * Performs a topological sort on GATE subjects, prioritizing high weightage and higher marks
 * when subjects have their dependencies satisfied (in-degree 0).
 */
export function getSortedSubjects(subjects: Subject[]): Subject[] {
  const result: Subject[] = [];
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  // Initialize
  subjects.forEach((sub) => {
    inDegree[sub.id] = 0;
    adjList[sub.id] = [];
  });

  // Build the graph
  subjects.forEach((sub) => {
    sub.dependencies.forEach((depId) => {
      // depId must be studied BEFORE sub.id
      // So edge is depId -> sub.id
      if (adjList[depId]) {
        adjList[depId].push(sub.id);
        inDegree[sub.id]++;
      }
    });
  });

  // Nodes with in-degree 0 are ready to be studied
  const queue: string[] = subjects
    .filter((sub) => inDegree[sub.id] === 0)
    .map((sub) => sub.id);

  // Helper to sort the queue by weightage (high -> medium -> low) and marks (descending)
  const sortQueue = (q: string[]) => {
    return q.sort((aId, bId) => {
      const a = subjects.find((s) => s.id === aId)!;
      const b = subjects.find((s) => s.id === bId)!;

      // Prioritize weightage
      const weightScore = { high: 3, medium: 2, low: 1 };
      const aWeight = weightScore[a.weightage] || 0;
      const bWeight = weightScore[b.weightage] || 0;

      if (aWeight !== bWeight) {
        return bWeight - aWeight; // higher weightage first
      }

      // Prioritize marks
      if (a.approxMarks !== b.approxMarks) {
        return b.approxMarks - a.approxMarks; // higher marks first
      }

      // Fallback alphabetical
      return a.name.localeCompare(b.name);
    });
  };

  // Run Kahn's algorithm
  while (queue.length > 0) {
    // Sort current ready nodes to select the highest priority one
    sortQueue(queue);
    const currId = queue.shift()!;
    const currSub = subjects.find((s) => s.id === currId)!;
    result.push(currSub);

    const neighbors = adjList[currId] || [];
    neighbors.forEach((neighborId) => {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        queue.push(neighborId);
      }
    });
  }

  // Handle cycle detection (fallback for disconnected or cyclic graphs)
  if (result.length < subjects.length) {
    const missing = subjects.filter((sub) => !result.some((r) => r.id === sub.id));
    return [...result, ...missing];
  }

  return result;
}
