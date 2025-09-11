import { cookies } from 'next/headers';
import type { DailyPlanResponse } from '@/types/daily-plan';

export interface SavedPlan {
  id: string;
  date: string; // YYYY-MM-DD format
  plan: DailyPlanResponse; // The full plan object
  generatedAt: string; // ISO timestamp
  userId: string;
  context?: any; // Store the context used to generate the plan for learning
}

export class PlanStorageService {
  private static readonly COOKIE_NAME = 'my-day-plans';
  private static readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

  /**
   * Get all saved plans from cookies
   */
  static getSavedPlans(): SavedPlan[] {
    try {
      const cookieStore = cookies();
      const plansCookie = cookieStore.get(this.COOKIE_NAME);
      
      if (!plansCookie?.value) {
        return [];
      }

      return JSON.parse(plansCookie.value) as SavedPlan[];
    } catch (error) {
      console.error('Error reading saved plans from cookies:', error);
      return [];
    }
  }

  /**
   * Save a plan to cookies
   */
  static savePlan(plan: DailyPlanResponse, userId: string, context?: any): void {
    try {
      const cookieStore = cookies();
      const existingPlans = this.getSavedPlans();
      const planId = `plan-${Date.now()}`;
      const planDate = plan.date; // Use the date from the plan itself
      
      const newPlan: SavedPlan = {
        id: planId,
        date: planDate,
        plan,
        generatedAt: new Date().toISOString(),
        userId,
        context
      };

      // Remove any existing plan for the same date
      const filteredPlans = existingPlans.filter(p => p.date !== planDate || p.userId !== userId);
      
      // Add the new plan
      const updatedPlans = [...filteredPlans, newPlan];
      
      // Keep only last 30 days of plans
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const recentPlans = updatedPlans.filter(p => p.date >= cutoffDate);

      cookieStore.set(this.COOKIE_NAME, JSON.stringify(recentPlans), {
        maxAge: this.COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (error) {
      console.error('Error saving plan to cookies:', error);
    }
  }

  /**
   * Get today's plan if it exists
   */
  static getTodaysPlan(userId: string): SavedPlan | null {
    const today = new Date().toISOString().split('T')[0];
    const savedPlans = this.getSavedPlans();
    
    return savedPlans.find(p => p.date === today && p.userId === userId) || null;
  }

  /**
   * Get plan for a specific date
   */
  static getPlanForDate(date: string, userId: string): SavedPlan | null {
    const savedPlans = this.getSavedPlans();
    
    return savedPlans.find(p => p.date === date && p.userId === userId) || null;
  }

  /**
   * Get all available dates with saved plans
   */
  static getAvailableDates(userId: string): string[] {
    const savedPlans = this.getSavedPlans();
    
    return savedPlans
      .filter(p => p.userId === userId)
      .map(p => p.date)
      .sort((a, b) => b.localeCompare(a)); // Most recent first
  }

  /**
   * Delete a specific plan
   */
  static deletePlan(planId: string, userId: string): void {
    try {
      const cookieStore = cookies();
      const existingPlans = this.getSavedPlans();
      
      const updatedPlans = existingPlans.filter(p => !(p.id === planId && p.userId === userId));
      
      cookieStore.set(this.COOKIE_NAME, JSON.stringify(updatedPlans), {
        maxAge: this.COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (error) {
      console.error('Error deleting plan from cookies:', error);
    }
  }

  /**
   * Clear all plans for a user
   */
  static clearAllPlans(userId: string): void {
    try {
      const cookieStore = cookies();
      const existingPlans = this.getSavedPlans();
      
      const updatedPlans = existingPlans.filter(p => p.userId !== userId);
      
      cookieStore.set(this.COOKIE_NAME, JSON.stringify(updatedPlans), {
        maxAge: this.COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (error) {
      console.error('Error clearing plans from cookies:', error);
    }
  }

  /**
   * Get plan statistics for learning
   */
  static getPlanStats(userId: string): {
    totalPlans: number;
    averageBlocksPerPlan: number;
    mostCommonBlockTypes: Record<string, number>;
    averageCompletionRate: number;
    preferredWorkingHours: { start: string; end: string };
  } {
    const userPlans = this.getSavedPlans().filter(p => p.userId === userId);
    
    if (userPlans.length === 0) {
      return {
        totalPlans: 0,
        averageBlocksPerPlan: 0,
        mostCommonBlockTypes: {},
        averageCompletionRate: 0,
        preferredWorkingHours: { start: '09:00', end: '17:00' }
      };
    }

    const totalBlocks = userPlans.reduce((sum, plan) => sum + plan.plan.blocks.length, 0);
    const averageBlocksPerPlan = totalBlocks / userPlans.length;

    // Count block types
    const blockTypeCounts: Record<string, number> = {};
    userPlans.forEach(plan => {
      plan.plan.blocks.forEach(block => {
        blockTypeCounts[block.type] = (blockTypeCounts[block.type] || 0) + 1;
      });
    });

    // Calculate completion rate (simplified - based on completed blocks)
    const completedBlocks = userPlans.reduce((sum, plan) => 
      sum + plan.plan.blocks.filter(block => block.status === 'completed').length, 0
    );
    const averageCompletionRate = totalBlocks > 0 ? completedBlocks / totalBlocks : 0;

    // Analyze working hours from plans (simplified)
    const preferredWorkingHours = { start: '09:00', end: '17:00' };

    return {
      totalPlans: userPlans.length,
      averageBlocksPerPlan,
      mostCommonBlockTypes: blockTypeCounts,
      averageCompletionRate,
      preferredWorkingHours
    };
  }

  /**
   * Get recent plans for pattern analysis
   */
  static getRecentPlans(userId: string, days: number = 7): SavedPlan[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    return this.getSavedPlans()
      .filter(p => p.userId === userId && p.date >= cutoffDateStr)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Update plan with completion status
   */
  static updatePlanCompletion(planId: string, userId: string, completedBlocks: string[]): void {
    try {
      const cookieStore = cookies();
      const existingPlans = this.getSavedPlans();
      
      const updatedPlans = existingPlans.map(plan => {
        if (plan.id === planId && plan.userId === userId) {
          const updatedPlan = {
            ...plan,
            plan: {
              ...plan.plan,
              blocks: plan.plan.blocks.map(block => ({
                ...block,
                status: completedBlocks.includes(block.id) ? 'completed' as const : block.status
              }))
            }
          };
          return updatedPlan;
        }
        return plan;
      });

      cookieStore.set(this.COOKIE_NAME, JSON.stringify(updatedPlans), {
        maxAge: this.COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (error) {
      console.error('Error updating plan completion:', error);
    }
  }
}
