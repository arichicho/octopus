// Types for the Daily Planner feature (Mi Día)
// These are intentionally self-contained to avoid touching existing types.

export type BlockType =
  | 'meeting'
  | 'event'
  | 'prep'
  | 'post'
  | 'focus'
  | 'followup'
  | 'call'
  | 'quickwin';

export type BlockStatus = 'suggested' | 'fixed' | 'accepted';

export interface DailyPlanBlockRelations {
  taskId?: string | null;
  meetingId?: string | null;
  personIds?: string[];
  companyId?: string | null;
  docId?: string | null;
}

export interface DailyPlanBlock {
  id: string;
  type: BlockType;
  status: BlockStatus;
  start: string; // ISO-8601
  end: string; // ISO-8601
  title: string;
  reason?: string;
  confidence?: number; // 0..1
  relations?: DailyPlanBlockRelations;
}

export interface DailyPlanFollowUpDraft {
  subject: string;
  body: string;
}

export interface DailyPlanFollowUpWindow {
  start: string; // ISO-8601
  end: string;   // ISO-8601
}

export interface DailyPlanFollowUp {
  personId: string;
  companyId?: string | null;
  channel: 'email' | 'call';
  subject: string;
  reason: string;
  urgency: number; // 1..5
  suggestedWindow?: DailyPlanFollowUpWindow;
  draft?: DailyPlanFollowUpDraft;
}

export interface DailyPlanSummary {
  meetingsCount: number;
  freeMinutes: number;
  criticalCount: number;
  notes?: string;
}

export interface DailyPlanResponse {
  date: string; // YYYY-MM-DD
  summary: DailyPlanSummary;
  blocks: DailyPlanBlock[];
  followUps: DailyPlanFollowUp[];
  warnings?: string[];
}

// Settings (parametrizable desde Settings UI en el futuro)
export interface DailyPlannerSettings {
  timezone: string;
  language?: string; // e.g., 'es' | 'en'
  workingHours: { start: string; end: string }; // HH:mm (local in timezone)
  buffers: { prepMinutes: number; postMinutes: number };
  blocks: { minBlockMinutes: number; slotGranularityMinutes: number };
  quickWins: { maxMinutes: number };
  deepWork: { minMinutes: number; maxPerDayMinutes: number };
  calls: { allowedHours: { start: string; end: string } };
  followUps: { daysWithoutResponse: number; maxPerDay: number };
  plan: { maxBlocks: number; maxFocusBlocks: number; includeTravelBuffer: boolean };
  privacy: { maxEmailLookbackDays: number; redactPII: boolean };
  scoring: { weights: Record<string, number> };
  prep?: { maxTasks: number; maxEmails: number; maxDocs: number };
}

// Context Pack interfaces (input para el plan)
export interface ContextEvent {
  id: string;
  title: string;
  start: string; // ISO-8601
  end: string; // ISO-8601
  allDay?: boolean; // marks all-day (non-time-blocking)
  attendees?: Array<{ email: string; personId?: string }>;
  isExternal?: boolean;
  location?: string | null;
  onlineMeetingUrl?: string | null;
  companyId?: string | null;
  personIds?: string[];
  status?: BlockStatus; // meetings should come as 'fixed'
}

export interface ContextTask {
  id: string;
  title: string;
  priority: 'H' | 'M' | 'L';
  dueDate?: string | null; // YYYY-MM-DD
  estimateMinutes?: number | null;
  tags?: string[];
  companyId?: string | null;
  personIds?: string[];
  status?: 'open' | 'blocked' | 'done';
}

export interface ContextEmailThread {
  threadId: string;
  personIds?: string[];
  companyId?: string | null;
  lastMessageAt: string; // ISO-8601
  lastFrom: string;
  subject: string;
  unansweredDays: number;
}

export interface ContextDocSummary {
  docId: string;
  title: string;
  type: 'minuta' | 'nota' | 'otro';
  meetingId?: string | null;
  personIds?: string[];
  companyId?: string | null;
  decisions?: string[];
  openItems?: string[];
}

export interface PeopleIndexRecord {
  name: string;
  email: string;
  companyId?: string | null;
}

export type PeopleIndex = Record<string, PeopleIndexRecord>;

export interface ContextPack {
  dateISO: string; // date to plan for
  settings: DailyPlannerSettings;
  events: ContextEvent[];
  tasks: ContextTask[];
  emailThreads: ContextEmailThread[];
  docs: ContextDocSummary[];
  peopleIndex: PeopleIndex;
}

// Meeting prep types
export interface MeetingPrepChecklistItem {
  title: string;
  done?: boolean;
}

export interface MeetingPrepLink {
  label: string;
  url: string;
}

export interface MeetingPrep {
  meetingId: string;
  contextSummary: string;
  checklists: MeetingPrepChecklistItem[];
  links: MeetingPrepLink[];
  relatedTasks: Array<{ id: string; title: string; priority?: string; dueDate?: string | null }>;
  relatedEmails: Array<{ threadId: string; subject: string; lastFrom: string; lastMessageAt: string }>;
  relatedDocs: Array<{ docId: string; title: string; url?: string | null }>;
  talkingPoints?: string[];
  decisions?: string[];
  risks?: string[];
  openQuestions?: string[];
  prepEstimateMinutes?: number;
  warnings?: string[];
}
