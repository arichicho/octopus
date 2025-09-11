import { ContextTask } from '@/types/daily-plan';

export interface SmartSuggestion {
  id: string;
  type: 'quickwin' | 'deepwork';
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  reason: string;
  confidence: number; // 0-1, qué tan seguro está el sistema de esta sugerencia
}

export interface UserPreferences {
  preferredQuickWinTypes: string[];
  preferredDeepWorkTypes: string[];
  averageQuickWinDuration: number;
  averageDeepWorkDuration: number;
  mostProductiveHours: string[];
  leastProductiveHours: string[];
  preferredTaskTypes: string[];
  completedSuggestions: string[];
  rejectedSuggestions: string[];
}

export class SmartSuggestionsService {
  private static readonly STORAGE_KEY = 'smart-suggestions-preferences';

  /**
   * Obtener preferencias del usuario desde localStorage
   */
  static getUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }

    // Preferencias por defecto
    return {
      preferredQuickWinTypes: [],
      preferredDeepWorkTypes: [],
      averageQuickWinDuration: 15,
      averageDeepWorkDuration: 60,
      mostProductiveHours: ['09:00', '10:00', '14:00', '15:00'],
      leastProductiveHours: ['12:00', '13:00', '17:00', '18:00'],
      preferredTaskTypes: [],
      completedSuggestions: [],
      rejectedSuggestions: []
    };
  }

  /**
   * Guardar preferencias del usuario
   */
  static saveUserPreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Generar sugerencias inteligentes basadas en tareas y contexto
   */
  static generateSmartSuggestions(
    tasks: ContextTask[],
    availableMinutes: number,
    currentHour: number,
    userPreferences: UserPreferences
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Analizar tareas para entender patrones
    const taskAnalysis = this.analyzeTasks(tasks);
    
    // Generar sugerencias de Quick Wins
    if (availableMinutes >= 10 && availableMinutes <= 30) {
      const quickWinSuggestions = this.generateQuickWinSuggestions(
        taskAnalysis,
        availableMinutes,
        currentHour,
        userPreferences
      );
      suggestions.push(...quickWinSuggestions);
    }

    // Generar sugerencias de Deep Work
    if (availableMinutes >= 45) {
      const deepWorkSuggestions = this.generateDeepWorkSuggestions(
        taskAnalysis,
        availableMinutes,
        currentHour,
        userPreferences
      );
      suggestions.push(...deepWorkSuggestions);
    }

    // Ordenar por confianza y prioridad
    return suggestions.sort((a, b) => {
      const scoreA = a.confidence * (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1);
      const scoreB = b.confidence * (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1);
      return scoreB - scoreA;
    });
  }

  /**
   * Analizar tareas para extraer patrones
   */
  private static analyzeTasks(tasks: ContextTask[]) {
    const analysis = {
      commonTags: new Map<string, number>(),
      commonCompanies: new Map<string, number>(),
      averageEstimate: 0,
      highPriorityCount: 0,
      mediumPriorityCount: 0,
      lowPriorityCount: 0,
      totalTasks: tasks.length
    };

    let totalEstimate = 0;
    let tasksWithEstimate = 0;

    tasks.forEach(task => {
      // Analizar tags
      task.tags?.forEach(tag => {
        analysis.commonTags.set(tag, (analysis.commonTags.get(tag) || 0) + 1);
      });

      // Analizar empresas
      if (task.companyId && task.companyId !== 'default-company') {
        analysis.commonCompanies.set(task.companyId, (analysis.commonCompanies.get(task.companyId) || 0) + 1);
      }

      // Analizar estimaciones
      if (task.estimateMinutes) {
        totalEstimate += task.estimateMinutes;
        tasksWithEstimate++;
      }

      // Analizar prioridades
      if (task.priority === 'H') analysis.highPriorityCount++;
      else if (task.priority === 'M') analysis.mediumPriorityCount++;
      else analysis.lowPriorityCount++;
    });

    analysis.averageEstimate = tasksWithEstimate > 0 ? totalEstimate / tasksWithEstimate : 30;

    return analysis;
  }

  /**
   * Generar sugerencias de Quick Wins
   */
  private static generateQuickWinSuggestions(
    analysis: any,
    availableMinutes: number,
    currentHour: number,
    preferences: UserPreferences
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Sugerencia 1: Revisar emails pendientes
    if (this.isGoodTimeForQuickWin(currentHour, preferences)) {
      suggestions.push({
        id: 'quickwin-emails',
        type: 'quickwin',
        title: 'Revisar emails pendientes',
        description: 'Revisar y responder emails importantes que requieren respuesta rápida',
        estimatedMinutes: Math.min(availableMinutes, 15),
        priority: 'high',
        tags: ['email', 'comunicación'],
        reason: 'Mantener comunicación fluida con clientes y equipo',
        confidence: 0.8
      });
    }

    // Sugerencia 2: Actualizar estado de tareas
    if (analysis.totalTasks > 0) {
      suggestions.push({
        id: 'quickwin-update-tasks',
        type: 'quickwin',
        title: 'Actualizar estado de tareas',
        description: 'Marcar tareas completadas y actualizar el progreso de proyectos activos',
        estimatedMinutes: Math.min(availableMinutes, 10),
        priority: 'medium',
        tags: ['organización', 'seguimiento'],
        reason: 'Mantener el seguimiento actualizado de proyectos',
        confidence: 0.7
      });
    }

    // Sugerencia 3: Preparar próxima reunión
    if (currentHour >= 9 && currentHour <= 17) {
      suggestions.push({
        id: 'quickwin-meeting-prep',
        type: 'quickwin',
        title: 'Preparar próxima reunión',
        description: 'Revisar agenda y documentos para la próxima reunión del día',
        estimatedMinutes: Math.min(availableMinutes, 20),
        priority: 'high',
        tags: ['reunión', 'preparación'],
        reason: 'Asegurar que las reuniones sean productivas',
        confidence: 0.6
      });
    }

    // Sugerencia 4: Basada en tags comunes
    if (analysis.commonTags.size > 0) {
      const mostCommonTag = Array.from(analysis.commonTags.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommonTag && mostCommonTag[1] > 1) {
        suggestions.push({
          id: `quickwin-${mostCommonTag[0]}`,
          type: 'quickwin',
          title: `Tareas de ${mostCommonTag[0]}`,
          description: `Revisar y avanzar en tareas relacionadas con ${mostCommonTag[0]}`,
          estimatedMinutes: Math.min(availableMinutes, 15),
          priority: 'medium',
          tags: [mostCommonTag[0], 'seguimiento'],
          reason: `Tienes ${mostCommonTag[1]} tareas relacionadas con ${mostCommonTag[0]}`,
          confidence: 0.5
        });
      }
    }

    return suggestions;
  }

  /**
   * Generar sugerencias de Deep Work
   */
  private static generateDeepWorkSuggestions(
    analysis: any,
    availableMinutes: number,
    currentHour: number,
    preferences: UserPreferences
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Sugerencia 1: Trabajo en tareas de alta prioridad
    if (analysis.highPriorityCount > 0) {
      suggestions.push({
        id: 'deepwork-high-priority',
        type: 'deepwork',
        title: 'Trabajo en tareas de alta prioridad',
        description: 'Enfocarse en completar las tareas más importantes del día',
        estimatedMinutes: Math.min(availableMinutes, 90),
        priority: 'high',
        tags: ['prioridad', 'concentración'],
        reason: `Tienes ${analysis.highPriorityCount} tareas de alta prioridad pendientes`,
        confidence: 0.9
      });
    }

    // Sugerencia 2: Trabajo creativo/estratégico
    if (this.isGoodTimeForDeepWork(currentHour, preferences)) {
      suggestions.push({
        id: 'deepwork-creative',
        type: 'deepwork',
        title: 'Trabajo creativo y estratégico',
        description: 'Dedicar tiempo a pensar, planificar y desarrollar ideas nuevas',
        estimatedMinutes: Math.min(availableMinutes, 60),
        priority: 'medium',
        tags: ['creatividad', 'estrategia'],
        reason: 'Momento ideal para trabajo que requiere concentración profunda',
        confidence: 0.7
      });
    }

    // Sugerencia 3: Basada en empresa más común
    if (analysis.commonCompanies.size > 0) {
      const mostCommonCompany = Array.from(analysis.commonCompanies.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommonCompany && mostCommonCompany[1] > 1) {
        suggestions.push({
          id: `deepwork-company-${mostCommonCompany[0]}`,
          type: 'deepwork',
          title: `Proyectos de ${mostCommonCompany[0]}`,
          description: `Trabajar en proyectos importantes para ${mostCommonCompany[0]}`,
          estimatedMinutes: Math.min(availableMinutes, 75),
          priority: 'high',
          tags: ['proyecto', 'empresa'],
          reason: `Tienes ${mostCommonCompany[1]} tareas relacionadas con esta empresa`,
          confidence: 0.6
        });
      }
    }

    return suggestions;
  }

  /**
   * Verificar si es buen momento para Quick Wins
   */
  private static isGoodTimeForQuickWin(currentHour: number, preferences: UserPreferences): boolean {
    const hourStr = `${currentHour.toString().padStart(2, '0')}:00`;
    return !preferences.leastProductiveHours.includes(hourStr);
  }

  /**
   * Verificar si es buen momento para Deep Work
   */
  private static isGoodTimeForDeepWork(currentHour: number, preferences: UserPreferences): boolean {
    const hourStr = `${currentHour.toString().padStart(2, '0')}:00`;
    return preferences.mostProductiveHours.includes(hourStr);
  }

  /**
   * Aprender de la interacción del usuario
   */
  static learnFromInteraction(
    suggestionId: string,
    action: 'completed' | 'rejected' | 'modified',
    userPreferences: UserPreferences
  ): UserPreferences {
    const updatedPreferences = { ...userPreferences };

    if (action === 'completed') {
      updatedPreferences.completedSuggestions.push(suggestionId);
    } else if (action === 'rejected') {
      updatedPreferences.rejectedSuggestions.push(suggestionId);
    }

    // Limitar el historial para evitar que crezca demasiado
    if (updatedPreferences.completedSuggestions.length > 100) {
      updatedPreferences.completedSuggestions = updatedPreferences.completedSuggestions.slice(-50);
    }
    if (updatedPreferences.rejectedSuggestions.length > 100) {
      updatedPreferences.rejectedSuggestions = updatedPreferences.rejectedSuggestions.slice(-50);
    }

    return updatedPreferences;
  }
}
