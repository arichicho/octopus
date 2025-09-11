import { DailyPlannerSettings } from '@/types/daily-plan';
import { DEFAULT_MY_DAY_SETTINGS } from './my-day';

// Settings defaults for Mi dAI. Start from My Day settings and
// allow future divergence without touching the existing feature.
export const DEFAULT_MI_DAI_SETTINGS: DailyPlannerSettings = {
  ...DEFAULT_MY_DAY_SETTINGS,
  // Room for Mi dAI specific tuning later
};

export const MIDAI_FEATURE_FLAGS = {
  enabled: process.env.NEXT_PUBLIC_AI_ENABLED === 'true',
  insights: true,
  meetingPrepPredictor: true,
  optimizer: true,
};

