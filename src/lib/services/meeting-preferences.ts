import { MeetingPreferencesDBService, MeetingPreference, MeetingPreferenceStats } from './meeting-preferences-db';

class MeetingPreferencesManager {
  private userId: string | null = null;

  // Establecer el usuario actual
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Aprender de una decisión del usuario
  async learnFromDecision(meetingTitle: string, needsPrep: boolean, durationMinutes: number = 15): Promise<void> {
    if (!this.userId) {
      console.warn('No user ID set for meeting preferences');
      return;
    }

    try {
      await MeetingPreferencesDBService.learnFromDecision(
        this.userId,
        meetingTitle,
        needsPrep,
        durationMinutes
      );
    } catch (error) {
      console.error('Error learning from decision:', error);
    }
  }

  // Predecir si una reunión necesita preparación
  async predictPrepNeeded(meetingTitle: string): Promise<{ needsPrep: boolean; confidence: number }> {
    if (!this.userId) {
      // Fallback sin usuario
      return this.getFallbackPrediction(meetingTitle);
    }

    try {
      const prediction = await MeetingPreferencesDBService.predictPrepNeeded(this.userId, meetingTitle);
      return {
        needsPrep: prediction.needsPrep,
        confidence: prediction.confidence
      };
    } catch (error) {
      console.error('Error predicting prep needed:', error);
      return this.getFallbackPrediction(meetingTitle);
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<MeetingPreferenceStats> {
    if (!this.userId) {
      return {
        totalDecisions: 0,
        prepNeededCount: 0,
        prepNotNeededCount: 0,
        averageConfidence: 0
      };
    }

    try {
      return await MeetingPreferencesDBService.getUserPreferenceStats(this.userId);
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalDecisions: 0,
        prepNeededCount: 0,
        prepNotNeededCount: 0,
        averageConfidence: 0
      };
    }
  }

  // Obtener todas las preferencias del usuario
  async getUserPreferences(): Promise<MeetingPreference[]> {
    if (!this.userId) {
      return [];
    }

    try {
      return await MeetingPreferencesDBService.getUserPreferences(this.userId);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return [];
    }
  }

  // Predicción de fallback cuando no hay usuario o hay error
  private getFallbackPrediction(meetingTitle: string): { needsPrep: boolean; confidence: number } {
    const needsPrepKeywords = ['reunión', 'meeting', 'presentación', 'presentation', 'review', 'revisión', 'planning', 'planificación'];
    const noPrepKeywords = ['standup', 'daily', 'diario', 'check-in', 'sync', 'sincronización'];
    
    const titleLower = meetingTitle.toLowerCase();
    const hasPrepKeywords = needsPrepKeywords.some(keyword => titleLower.includes(keyword));
    const hasNoPrepKeywords = noPrepKeywords.some(keyword => titleLower.includes(keyword));
    
    if (hasPrepKeywords && !hasNoPrepKeywords) {
      return { needsPrep: true, confidence: 0.6 };
    } else if (hasNoPrepKeywords) {
      return { needsPrep: false, confidence: 0.7 };
    }

    return { needsPrep: true, confidence: 0.4 };
  }
}

export const MeetingPreferencesService = new MeetingPreferencesManager();