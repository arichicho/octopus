import { Territory } from '@/types/music';

interface ScheduledUpdate {
  id: string;
  territory: Territory;
  period: 'daily' | 'weekly';
  time: string; // "10:00" or "07:00"
  timezone: string; // "America/Argentina/Buenos_Aires"
  lastRun: Date | null;
  nextRun: Date;
  enabled: boolean;
}

class MusicTrendsScheduler {
  private schedules: ScheduledUpdate[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeSchedules();
  }

  private initializeSchedules() {
    const territories: Territory[] = ['argentina', 'spain', 'mexico', 'global'];
    
    // Daily updates at 10:00 AM Argentina time
    territories.forEach(territory => {
      this.schedules.push({
        id: `daily-${territory}`,
        territory,
        period: 'daily',
        time: '10:00',
        timezone: 'America/Argentina/Buenos_Aires',
        lastRun: null,
        nextRun: this.calculateNextRun('10:00', 'America/Argentina/Buenos_Aires'),
        enabled: true
      });
    });

    // Weekly updates at 7:00 AM Argentina time (Mondays)
    territories.forEach(territory => {
      this.schedules.push({
        id: `weekly-${territory}`,
        territory,
        period: 'weekly',
        time: '07:00',
        timezone: 'America/Argentina/Buenos_Aires',
        lastRun: null,
        nextRun: this.calculateNextRun('07:00', 'America/Argentina/Buenos_Aires', 1), // Monday
        enabled: true
      });
    });
  }

  private calculateNextRun(time: string, timezone: string, dayOfWeek?: number): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to Argentina timezone
    const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    let nextRun = new Date(argentinaTime);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If it's a weekly schedule, find the next Monday
    if (dayOfWeek !== undefined) {
      const daysUntilTarget = (dayOfWeek - nextRun.getDay() + 7) % 7;
      if (daysUntilTarget === 0 && nextRun <= argentinaTime) {
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      }
    } else {
      // Daily schedule
      if (nextRun <= argentinaTime) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }
    
    return nextRun;
  }

  public start() {
    console.log('🎵 Starting Music Trends Scheduler...');
    
    this.schedules.forEach(schedule => {
      if (schedule.enabled) {
        this.scheduleUpdate(schedule);
      }
    });
  }

  public stop() {
    console.log('🛑 Stopping Music Trends Scheduler...');
    
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
  }

  private scheduleUpdate(schedule: ScheduledUpdate) {
    const now = new Date();
    const timeUntilNext = schedule.nextRun.getTime() - now.getTime();
    
    if (timeUntilNext > 0) {
      console.log(`⏰ Scheduling ${schedule.period} update for ${schedule.territory} at ${schedule.nextRun.toLocaleString()}`);
      
      const timeout = setTimeout(() => {
        this.executeUpdate(schedule);
        this.rescheduleUpdate(schedule);
      }, timeUntilNext);
      
      this.intervals.set(schedule.id, timeout);
    } else {
      // If the time has passed, schedule for the next occurrence
      this.rescheduleUpdate(schedule);
    }
  }

  private rescheduleUpdate(schedule: ScheduledUpdate) {
    schedule.lastRun = new Date();
    schedule.nextRun = this.calculateNextRun(
      schedule.time, 
      schedule.timezone, 
      schedule.period === 'weekly' ? 1 : undefined
    );
    
    this.scheduleUpdate(schedule);
  }

  private async executeUpdate(schedule: ScheduledUpdate) {
    try {
      console.log(`🔄 Executing ${schedule.period} update for ${schedule.territory}...`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/music-trends/auto-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
        },
        body: JSON.stringify({
          territory: schedule.territory,
          period: schedule.period
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ ${schedule.period} update for ${schedule.territory} completed successfully`);
        } else {
          console.error(`❌ ${schedule.period} update for ${schedule.territory} failed:`, result.error);
        }
      } else {
        console.error(`❌ ${schedule.period} update for ${schedule.territory} failed with status:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Error executing ${schedule.period} update for ${schedule.territory}:`, error);
    }
  }

  public getScheduleStatus(): ScheduledUpdate[] {
    return this.schedules.map(schedule => ({
      ...schedule,
      nextRun: this.calculateNextRun(
        schedule.time, 
        schedule.timezone, 
        schedule.period === 'weekly' ? 1 : undefined
      )
    }));
  }

  public enableSchedule(id: string) {
    const schedule = this.schedules.find(s => s.id === id);
    if (schedule) {
      schedule.enabled = true;
      this.scheduleUpdate(schedule);
    }
  }

  public disableSchedule(id: string) {
    const schedule = this.schedules.find(s => s.id === id);
    if (schedule) {
      schedule.enabled = false;
      const interval = this.intervals.get(id);
      if (interval) {
        clearTimeout(interval);
        this.intervals.delete(id);
      }
    }
  }

  public triggerManualUpdate(territory: Territory, period: 'daily' | 'weekly') {
    const schedule = this.schedules.find(s => s.territory === territory && s.period === period);
    if (schedule) {
      this.executeUpdate(schedule);
    }
  }
}

// Singleton instance
let schedulerInstance: MusicTrendsScheduler | null = null;

export const getMusicTrendsScheduler = (): MusicTrendsScheduler => {
  if (!schedulerInstance) {
    schedulerInstance = new MusicTrendsScheduler();
  }
  return schedulerInstance;
};

export const startMusicTrendsScheduler = () => {
  const scheduler = getMusicTrendsScheduler();
  scheduler.start();
};

export const stopMusicTrendsScheduler = () => {
  const scheduler = getMusicTrendsScheduler();
  scheduler.stop();
};
