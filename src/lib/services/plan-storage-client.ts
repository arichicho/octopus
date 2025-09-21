"use client";

import type { DailyPlanResponse } from '@/types/daily-plan';

export interface SavedPlan {
  id: string;
  date: string; // YYYY-MM-DD format
  plan: DailyPlanResponse; // The full plan object
  generatedAt: string; // ISO timestamp
  userId: string;
  context?: any; // Store the context used to generate the plan for learning
}

export class PlanStorageClientService {
  private static readonly STORAGE_KEY = 'my-day-plans';
  private static readonly MAX_PLANS = 30; // Keep only last 30 days

  /**
   * Get all saved plans from localStorage
   */
  static getSavedPlans(): SavedPlan[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      return JSON.parse(stored) as SavedPlan[];
    } catch (error) {
      console.error('Error reading saved plans from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a plan to localStorage
   */
  static savePlan(plan: DailyPlanResponse, userId: string, context?: any): void {
    try {
      if (typeof window === 'undefined') return;
      
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
      
      const recentPlans = updatedPlans
        .filter(p => p.date >= cutoffDate)
        .slice(-this.MAX_PLANS); // Keep only last MAX_PLANS

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentPlans));
      console.log('💾 Plan saved to localStorage:', { planDate, userId, totalPlans: recentPlans.length });
    } catch (error) {
      console.error('Error saving plan to localStorage:', error);
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
      if (typeof window === 'undefined') return;
      
      const existingPlans = this.getSavedPlans();
      const updatedPlans = existingPlans.filter(p => !(p.id === planId && p.userId === userId));
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPlans));
    } catch (error) {
      console.error('Error deleting plan from localStorage:', error);
    }
  }

  /**
   * Clear all plans for a user
   */
  static clearAllPlans(userId: string): void {
    try {
      if (typeof window === 'undefined') return;
      
      const existingPlans = this.getSavedPlans();
      const updatedPlans = existingPlans.filter(p => p.userId !== userId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPlans));
    } catch (error) {
      console.error('Error clearing plans from localStorage:', error);
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
      if (typeof window === 'undefined') return;
      
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

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPlans));
    } catch (error) {
      console.error('Error updating plan completion:', error);
    }
  }

  /**
   * Get storage size information for debugging
   */
  static getStorageInfo(): { size: number; plans: number; maxSize: number } {
    try {
      if (typeof window === 'undefined') return { size: 0, plans: 0, maxSize: 0 };
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const size = stored ? new Blob([stored]).size : 0;
      const plans = this.getSavedPlans().length;
      
      return {
        size,
        plans,
        maxSize: 5 * 1024 * 1024 // 5MB limit for localStorage
      };
    } catch (error) {
      return { size: 0, plans: 0, maxSize: 0 };
    }
  }
}





