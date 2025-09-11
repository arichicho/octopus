import { DailyPlannerSettings } from '@/types/daily-plan';
import { appConfig } from '@/lib/firebase/config';

// Default, fully-parametrizable settings for Mi Día.
// These are safe defaults and can be overridden by user/company settings later.
export const DEFAULT_MY_DAY_SETTINGS: DailyPlannerSettings = {
  timezone: appConfig.defaultTimezone || 'America/Mexico_City',
  language: 'es',
  workingHours: { start: '09:00', end: '18:00' },
  buffers: { prepMinutes: 10, postMinutes: 5 },
  blocks: { minBlockMinutes: 10, slotGranularityMinutes: 5 },
  quickWins: { maxMinutes: 15 },
  deepWork: { minMinutes: 60, maxPerDayMinutes: 180 },
  calls: { allowedHours: { start: '10:00', end: '17:30' } },
  followUps: { daysWithoutResponse: 3, maxPerDay: 6 },
  plan: { maxBlocks: 20, maxFocusBlocks: 3, includeTravelBuffer: false },
  privacy: { maxEmailLookbackDays: 14, redactPII: true },
  prep: { maxTasks: 6, maxEmails: 5, maxDocs: 5 },
  scoring: {
    weights: {
      priorityHigh: 3,
      dueToday: 3,
      dueTomorrow: 2,
      revenueTag: 2,
      relatedToTodayMeeting: 1,
      staleFollowUp: 2,
      shortEstimate: 1,
    },
  },
};
