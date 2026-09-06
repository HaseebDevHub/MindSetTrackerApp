import type { JourneyRepository } from '../src/database/repositories/types';
import type {
  ActiveJourneyItem,
  JourneyId,
} from '../src/types/models';

const clone = (item: ActiveJourneyItem): ActiveJourneyItem => ({
  ...item,
  taskCompletions: item.taskCompletions.map(completion => ({ ...completion })),
});

export class InMemoryJourneyRepository implements JourneyRepository {
  private enrollments = new Map<string, ActiveJourneyItem>();
  private nextId = 1;

  failStart = false;
  failToggle = false;
  failRemove = false;
  startCalls = 0;
  toggleCalls = 0;
  removeCalls = 0;

  constructor(enrollments: ActiveJourneyItem[] = []) {
    enrollments.forEach(item => this.enrollments.set(item.id, clone(item)));
  }

  async loadActiveJourneys() {
    return [...this.enrollments.values()]
      .filter(item => item.isActive)
      .map(clone);
  }

  async startJourney(journeyId: JourneyId, startedDateKey: string) {
    this.startCalls += 1;
    if (this.failStart) throw new Error('start failed');
    const existing = [...this.enrollments.values()].find(
      item => item.journeyId === journeyId,
    );
    if (existing) {
      existing.isActive = true;
      existing.removedDateKey = undefined;
      return clone(existing);
    }
    const created: ActiveJourneyItem = {
      id: `active-journey-${this.nextId++}`,
      journeyId,
      startedDateKey,
      isActive: true,
      taskCompletions: [],
    };
    this.enrollments.set(created.id, created);
    return clone(created);
  }

  async setTaskCompletion(
    activeJourneyId: string,
    taskId: string,
    dateKey: string,
    completed: boolean,
  ) {
    this.toggleCalls += 1;
    if (this.failToggle) throw new Error('toggle failed');
    const enrollment = this.enrollments.get(activeJourneyId);
    if (!enrollment?.isActive) return false;
    const remaining = enrollment.taskCompletions.filter(
      item => item.taskId !== taskId || item.dateKey !== dateKey,
    );
    enrollment.taskCompletions = completed
      ? [...remaining, { taskId, dateKey }]
      : remaining;
    return true;
  }

  async removeActiveJourney(
    activeJourneyId: string,
    removedDateKey: string,
  ) {
    this.removeCalls += 1;
    if (this.failRemove) throw new Error('remove failed');
    const enrollment = this.enrollments.get(activeJourneyId);
    if (!enrollment) return false;
    enrollment.isActive = false;
    enrollment.removedDateKey = removedDateKey;
    return true;
  }

  get(id: string) {
    const item = this.enrollments.get(id);
    return item ? clone(item) : undefined;
  }
}
