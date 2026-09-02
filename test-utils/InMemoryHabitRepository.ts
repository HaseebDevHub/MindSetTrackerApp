import type {
  HabitCreateInput,
  HabitRepository,
  HabitUpdateInput,
} from '../src/database/repositories/types';
import type { HabitItem } from '../src/types/models';
import type { HabitActionType } from '../src/types/models';
import { getDateStatus, isDateKey, toDateKey } from '../src/utils/dates';

const cloneHabit = (habit: HabitItem): HabitItem => ({
  ...habit,
  completedDates: [...habit.completedDates],
  progressEntries: habit.progressEntries?.map(entry => ({ ...entry })),
});

export class InMemoryHabitRepository implements HabitRepository {
  private habits = new Map<string, HabitItem>();
  private nextId = 1;

  failImport = false;
  failCreate = false;
  failUpdate = false;
  failDelete = false;
  failCompletion = false;
  failOnboarding = false;
  loadCalls = 0;
  importCalls = 0;
  createCalls = 0;
  updateCalls = 0;
  deleteCalls = 0;
  completionCalls = 0;
  onboardingCalls = 0;

  constructor(habits: HabitItem[] = []) {
    this.seed(habits);
  }

  seed(habits: HabitItem[]) {
    habits.forEach(habit => this.habits.set(habit.id, cloneHabit(habit)));
  }

  clear() {
    this.habits.clear();
  }

  completionRowCount(habitId: string, dateKey: string) {
    return this.habits.get(habitId)?.completedDates.includes(dateKey) ? 1 : 0;
  }

  async loadAllHabits() {
    this.loadCalls += 1;
    return [...this.habits.values()].map(cloneHabit);
  }

  async createHabit(habit: HabitCreateInput) {
    this.createCalls += 1;
    if (this.failCreate) throw new Error('create failed');
    const created: HabitItem = {
      ...habit,
      id: `generated-${this.nextId++}`,
      completedDates: [],
      streakCount: 0,
      frequency: habit.frequency ?? 'EVERYDAY',
      createdAt: habit.createdAt ?? toDateKey(new Date()),
    };
    this.habits.set(created.id, cloneHabit(created));
    return cloneHabit(created);
  }

  async updateHabit(id: string, updates: HabitUpdateInput) {
    this.updateCalls += 1;
    if (this.failUpdate) throw new Error('update failed');
    const habit = this.habits.get(id);
    if (!habit) return false;
    this.habits.set(id, { ...habit, ...updates });
    return true;
  }

  async deleteHabit(id: string) {
    this.deleteCalls += 1;
    if (this.failDelete) throw new Error('delete failed');
    return this.habits.delete(id);
  }

  async setArchived(id: string, archived: boolean, archivedAt?: string) {
    return this.updateHabit(id, {
      archived,
      archivedAt: archived ? archivedAt : undefined,
    });
  }

  async setHabitCompletion(
    habitId: string,
    dateKey: string,
    completed: boolean,
  ) {
    this.completionCalls += 1;
    if (this.failCompletion) throw new Error('completion failed');
    const habit = this.habits.get(habitId);
    if (!habit || !isDateKey(dateKey) || getDateStatus(dateKey) === 'future') {
      return false;
    }
    habit.completedDates = completed
      ? [...new Set([...habit.completedDates, dateKey])].sort()
      : habit.completedDates.filter(date => date !== dateKey);
    return true;
  }

  async isHabitCompleted(habitId: string, dateKey: string) {
    return this.habits.get(habitId)?.completedDates.includes(dateKey) ?? false;
  }

  async setHabitAction(
    habitId: string,
    dateKey: string,
    actionType: HabitActionType,
    value = 1,
  ) {
    const habit = this.habits.get(habitId);
    if (!habit) return false;
    const entries = (habit.progressEntries ?? []).filter(
      entry => entry.dateKey !== dateKey || entry.actionType !== actionType,
    );
    habit.progressEntries = [...entries, { dateKey, actionType, value }];
    return true;
  }

  async removeHabitAction(
    habitId: string,
    dateKey: string,
    actionType: HabitActionType,
  ) {
    const habit = this.habits.get(habitId);
    if (!habit) return false;
    habit.progressEntries = (habit.progressEntries ?? []).filter(
      entry => entry.dateKey !== dateKey || entry.actionType !== actionType,
    );
    return true;
  }

  async importLegacyHabits(habits: HabitItem[]) {
    this.importCalls += 1;
    if (this.failImport) throw new Error('import failed');
    const next = new Map(
      [...this.habits.entries()].map(([id, habit]) => [id, cloneHabit(habit)]),
    );
    habits.forEach(habit => {
      const existing = next.get(habit.id);
      next.set(
        habit.id,
        existing
          ? {
              ...existing,
              completedDates: [
                ...new Set([
                  ...existing.completedDates,
                  ...habit.completedDates.filter(isDateKey),
                ]),
              ].sort(),
            }
          : cloneHabit({
              ...habit,
              completedDates: [
                ...new Set(habit.completedDates.filter(isDateKey)),
              ].sort(),
            }),
      );
    });
    this.habits = next;
  }

  async ensureOnboardingHabit(habit: HabitItem) {
    this.onboardingCalls += 1;
    if (this.failOnboarding) throw new Error('onboarding failed');
    const existing = [...this.habits.values()].find(
      item =>
        item.id === habit.id ||
        item.title.toLowerCase() === habit.title.toLowerCase(),
    );
    if (existing) return existing.id;
    this.habits.set(habit.id, cloneHabit(habit));
    return habit.id;
  }
}
