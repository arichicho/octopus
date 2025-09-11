import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTION_NAME = 'meeting_preferences';

export interface MeetingPreference {
  id?: string;
  userId: string;
  meetingTitle: string;
  needsPrep: boolean;
  confidence: number;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed: Date;
}

export interface MeetingPreferenceStats {
  totalDecisions: number;
  prepNeededCount: number;
  prepNotNeededCount: number;
  averageConfidence: number;
  mostRecentDecision?: MeetingPreference;
}

class MeetingPreferencesDBManager {
  private getCollection() {
    return collection(db, COLLECTION_NAME);
  }

  private getDocRef(id: string) {
    return doc(db, COLLECTION_NAME, id);
  }

  // Guardar o actualizar una preferencia de reunión
  async savePreference(
    userId: string, 
    meetingTitle: string, 
    needsPrep: boolean, 
    confidence: number = 1.0,
    durationMinutes: number = 15
  ): Promise<MeetingPreference> {
    try {
      // Buscar si ya existe una preferencia para esta reunión
      const existingPreference = await this.findPreference(userId, meetingTitle);
      
      if (existingPreference) {
        // Actualizar preferencia existente
        const updatedPreference: Partial<MeetingPreference> = {
          needsPrep,
          confidence,
          durationMinutes,
          updatedAt: new Date(),
          usageCount: existingPreference.usageCount + 1,
          lastUsed: new Date()
        };

        await updateDoc(this.getDocRef(existingPreference.id!), {
          ...updatedPreference,
          updatedAt: serverTimestamp(),
          lastUsed: serverTimestamp()
        });

        return {
          ...existingPreference,
          ...updatedPreference
        };
      } else {
        // Crear nueva preferencia
        const newPreference: Omit<MeetingPreference, 'id'> = {
          userId,
          meetingTitle,
          needsPrep,
          confidence,
          durationMinutes,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 1,
          lastUsed: new Date()
        };

        const docRef = await addDoc(this.getCollection(), {
          ...newPreference,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastUsed: serverTimestamp()
        });

        return {
          id: docRef.id,
          ...newPreference
        };
      }
    } catch (error) {
      console.error('Error saving meeting preference:', error);
      throw error;
    }
  }

  // Buscar una preferencia específica
  async findPreference(userId: string, meetingTitle: string): Promise<MeetingPreference | null> {
    try {
      const q = query(
        this.getCollection(),
        where('userId', '==', userId),
        where('meetingTitle', '==', meetingTitle),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastUsed: data.lastUsed?.toDate() || new Date()
      } as MeetingPreference;
    } catch (error) {
      console.error('Error finding meeting preference:', error);
      return null;
    }
  }

  // Obtener todas las preferencias de un usuario
  async getUserPreferences(userId: string): Promise<MeetingPreference[]> {
    try {
      const q = query(
        this.getCollection(),
        where('userId', '==', userId),
        orderBy('lastUsed', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate() || new Date()
        } as MeetingPreference;
      });
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return [];
    }
  }

  // Predecir si una reunión necesita preparación basado en el historial
  async predictPrepNeeded(userId: string, meetingTitle: string): Promise<{
    needsPrep: boolean;
    confidence: number;
    basedOnHistory: boolean;
  }> {
    try {
      // Buscar preferencia exacta
      const exactPreference = await this.findPreference(userId, meetingTitle);
      if (exactPreference) {
        return {
          needsPrep: exactPreference.needsPrep,
          confidence: Math.min(0.95, exactPreference.confidence + (exactPreference.usageCount * 0.1)),
          basedOnHistory: true
        };
      }

      // Buscar preferencias similares (títulos que contengan palabras clave)
      const allPreferences = await this.getUserPreferences(userId);
      const meetingWords = meetingTitle.toLowerCase().split(/\s+/);
      
      const similarPreferences = allPreferences.filter(pref => {
        const prefWords = pref.meetingTitle.toLowerCase().split(/\s+/);
        const commonWords = meetingWords.filter(word => 
          word.length > 3 && prefWords.includes(word)
        );
        return commonWords.length >= 2; // Al menos 2 palabras en común
      });

      if (similarPreferences.length > 0) {
        // Calcular promedio ponderado por uso
        const totalUsage = similarPreferences.reduce((sum, pref) => sum + pref.usageCount, 0);
        const weightedPrepCount = similarPreferences.reduce((sum, pref) => 
          sum + (pref.needsPrep ? pref.usageCount : 0), 0
        );
        
        const prepRatio = weightedPrepCount / totalUsage;
        const confidence = Math.min(0.8, 0.5 + (similarPreferences.length * 0.1));
        
        return {
          needsPrep: prepRatio > 0.5,
          confidence,
          basedOnHistory: true
        };
      }

      // Si no hay historial, usar heurísticas básicas
      const needsPrepKeywords = ['reunión', 'meeting', 'presentación', 'presentation', 'review', 'revisión', 'planning', 'planificación'];
      const noPrepKeywords = ['standup', 'daily', 'diario', 'check-in', 'sync', 'sincronización'];
      
      const titleLower = meetingTitle.toLowerCase();
      const hasPrepKeywords = needsPrepKeywords.some(keyword => titleLower.includes(keyword));
      const hasNoPrepKeywords = noPrepKeywords.some(keyword => titleLower.includes(keyword));
      
      if (hasPrepKeywords && !hasNoPrepKeywords) {
        return { needsPrep: true, confidence: 0.6, basedOnHistory: false };
      } else if (hasNoPrepKeywords) {
        return { needsPrep: false, confidence: 0.7, basedOnHistory: false };
      }

      // Por defecto, asumir que necesita preparación
      return { needsPrep: true, confidence: 0.4, basedOnHistory: false };
    } catch (error) {
      console.error('Error predicting prep needed:', error);
      return { needsPrep: true, confidence: 0.3, basedOnHistory: false };
    }
  }

  // Obtener estadísticas de preferencias del usuario
  async getUserPreferenceStats(userId: string): Promise<MeetingPreferenceStats> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (preferences.length === 0) {
        return {
          totalDecisions: 0,
          prepNeededCount: 0,
          prepNotNeededCount: 0,
          averageConfidence: 0
        };
      }

      const prepNeededCount = preferences.filter(p => p.needsPrep).length;
      const prepNotNeededCount = preferences.length - prepNeededCount;
      const averageConfidence = preferences.reduce((sum, p) => sum + p.confidence, 0) / preferences.length;
      const mostRecentDecision = preferences[0]; // Ya están ordenadas por lastUsed desc

      return {
        totalDecisions: preferences.length,
        prepNeededCount,
        prepNotNeededCount,
        averageConfidence,
        mostRecentDecision
      };
    } catch (error) {
      console.error('Error getting user preference stats:', error);
      return {
        totalDecisions: 0,
        prepNeededCount: 0,
        prepNotNeededCount: 0,
        averageConfidence: 0
      };
    }
  }

  // Aprender de una decisión del usuario
  async learnFromDecision(
    userId: string,
    meetingTitle: string,
    needsPrep: boolean,
    durationMinutes: number = 15
  ): Promise<void> {
    try {
      await this.savePreference(userId, meetingTitle, needsPrep, 1.0, durationMinutes);
      console.log('✅ Meeting preference learned and saved to database:', {
        userId,
        meetingTitle,
        needsPrep,
        durationMinutes
      });
    } catch (error) {
      console.error('Error learning from decision:', error);
    }
  }
}

export const MeetingPreferencesDBService = new MeetingPreferencesDBManager();
