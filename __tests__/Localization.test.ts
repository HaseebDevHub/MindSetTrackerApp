import {
  isLanguageRTL,
  languageLocales,
  languages,
  setSelectedLanguage,
  t,
} from '../src/localization';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';

describe('localization', () => {
  afterEach(() => {
    setSelectedLanguage('English');
  });

  test('provides a locale and real translation for every supported language', () => {
    const expectedToday = {
      English: 'TODAY',
      Urdu: 'آج',
      Spanish: 'HOY',
      French: "AUJOURD'HUI",
      German: 'HEUTE',
    } as const;

    languages.forEach(language => {
      expect(languageLocales[language]).toBeTruthy();
      expect(t('today', undefined, language)).toBe(expectedToday[language]);
    });
  });

  test('marks only Urdu as right-to-left', () => {
    expect(isLanguageRTL('Urdu')).toBe(true);
    expect(
      languages
        .filter(language => language !== 'Urdu')
        .every(language => !isLanguageRTL(language)),
    ).toBe(true);
  });

  test('interpolates dynamic values using the selected language structure', () => {
    expect(
      t('habits_finished_count', { finished: 2, total: 5 }, 'English'),
    ).toBe('2/5 finished');
    expect(t('habits_finished_count', { finished: 2, total: 5 }, 'Urdu')).toBe(
      '5 میں سے 2 مکمل',
    );
    expect(
      t('record_relapse_message', { habitTitle: 'No sugar' }, 'Spanish'),
    ).toContain('No sugar');
  });

  test('persists the selected language as the shared app preference', () => {
    storage.remove(STORAGE_KEYS.APP_LANGUAGE);

    expect(setSelectedLanguage('German')).toBe(true);
    expect(storage.getString(STORAGE_KEYS.APP_LANGUAGE)).toBe('German');
    expect(t('today_button')).toBe('Heute');
  });

  test('provides localized habit creation and detail copy in every language', () => {
    const expectedCreateTitles = {
      English: 'Create a new habit',
      Urdu: 'نئی عادت بنائیں',
      Spanish: 'Crear un nuevo hábito',
      French: 'Créer une nouvelle habitude',
      German: 'Neue Gewohnheit erstellen',
    } as const;

    languages.forEach(language => {
      expect(t('habit_create_title', undefined, language)).toBe(
        expectedCreateTitles[language],
      );
      expect(t('habit_delete_message', { title: 'Read' }, language)).toContain(
        'Read',
      );
      expect(t('habit_detail_title', undefined, language)).toBeTruthy();
    });
  });

  test('provides localized journey catalog and dynamic progress copy', () => {
    const expectedWalkTitles = {
      English: 'Walk everyday for health',
      Urdu: 'صحت کے لیے روزانہ چلیں',
      Spanish: 'Camina cada día por tu salud',
      French: 'Marcher chaque jour pour sa santé',
      German: 'Jeden Tag gehen für die Gesundheit',
    } as const;

    languages.forEach(language => {
      expect(t('journey_walk_title', undefined, language)).toBe(
        expectedWalkTitles[language],
      );
      expect(
        t('journey_tasks_completed', { completed: 2, total: 3 }, language),
      ).toContain('2');
      expect(
        t('journey_sleep_task_bedtime_title', undefined, language),
      ).toBeTruthy();
    });
  });

  test('provides localized History navigation and progress copy', () => {
    const expectedHistoryTitles = {
      English: 'HISTORY',
      Urdu: 'تاریخ',
      Spanish: 'HISTORIAL',
      French: 'HISTORIQUE',
      German: 'VERLAUF',
    } as const;

    languages.forEach(language => {
      expect(t('history_title', undefined, language)).toBe(
        expectedHistoryTitles[language],
      );
      expect(
        t(
          'history_day_progress_accessibility',
          { percentage: 50, achieved: 1, target: 2 },
          language,
        ),
      ).toContain('50');
      expect(
        t('history_achievement_perfect_day_many', { count: 3 }, language),
      ).toContain('3');
    });
  });
});
