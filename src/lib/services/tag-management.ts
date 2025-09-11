import { 
  TagDefinition, 
  TagCategory, 
  TagUsagePattern, 
  TagLearningData, 
  TagSuggestion,
  TagSettings,
  DEFAULT_TAGS,
  DEFAULT_TAG_CATEGORIES
} from '@/types/tags';
import { db } from '@/lib/firebase/config';

const COLLECTIONS = {
  TAG_SETTINGS: 'tag_settings',
  TAG_USAGE: 'tag_usage',
  TAG_LEARNING: 'tag_learning'
};

export class TagManagementService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Inicializar tags predeterminados para un usuario
  async initializeDefaultTags(): Promise<TagSettings> {
    const now = new Date();
    
    // Crear categorías predeterminadas
    const categories: TagCategory[] = DEFAULT_TAG_CATEGORIES.map(cat => ({
      ...cat,
      id: `cat_${cat.name.toLowerCase().replace(/\s+/g, '_')}`,
      createdAt: now,
      updatedAt: now
    }));

    // Crear tags predeterminados
    const defaultTags: TagDefinition[] = DEFAULT_TAGS.map(tag => ({
      ...tag,
      id: `tag_${tag.name.toLowerCase().replace(/\s+/g, '_')}`,
      createdAt: now,
      updatedAt: now
    }));

    const settings: TagSettings = {
      userId: this.userId,
      defaultTags,
      customTags: [],
      categories,
      learningEnabled: true,
      autoSuggestions: true,
      createdAt: now,
      updatedAt: now
    };

    // Guardar en Firestore
    await db.collection(COLLECTIONS.TAG_SETTINGS).doc(this.userId).set(settings);
    
    return settings;
  }

  // Obtener configuración de tags del usuario
  async getTagSettings(): Promise<TagSettings | null> {
    try {
      const doc = await db.collection(COLLECTIONS.TAG_SETTINGS).doc(this.userId).get();
      if (!doc.exists) {
        return await this.initializeDefaultTags();
      }
      return doc.data() as TagSettings;
    } catch (error) {
      console.error('Error getting tag settings:', error);
      return null;
    }
  }

  // Agregar tag personalizado
  async addCustomTag(tag: Omit<TagDefinition, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<TagDefinition> {
    const now = new Date();
    const newTag: TagDefinition = {
      ...tag,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const settings = await this.getTagSettings();
    if (settings) {
      settings.customTags.push(newTag);
      settings.updatedAt = now;
      await db.collection(COLLECTIONS.TAG_SETTINGS).doc(this.userId).set(settings);
    }

    return newTag;
  }

  // Registrar uso de tag
  async recordTagUsage(tagId: string, context: 'task' | 'meeting' | 'event', elementId: string, duration?: number): Promise<void> {
    try {
      const usageData = {
        userId: this.userId,
        tagId,
        context,
        elementId,
        duration: duration || null,
        timestamp: new Date(),
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      };

      await db.collection(COLLECTIONS.TAG_USAGE).add(usageData);

      // Actualizar contador de uso en settings
      const settings = await this.getTagSettings();
      if (settings) {
        const tag = [...settings.defaultTags, ...settings.customTags].find(t => t.id === tagId);
        if (tag) {
          tag.usageCount++;
          tag.lastUsed = new Date();
          tag.updatedAt = new Date();
          settings.updatedAt = new Date();
          await db.collection(COLLECTIONS.TAG_SETTINGS).doc(this.userId).set(settings);
        }
      }
    } catch (error) {
      console.error('Error recording tag usage:', error);
    }
  }

  // Analizar patrones de uso
  async analyzeUsagePatterns(): Promise<TagUsagePattern[]> {
    try {
      const usageSnapshot = await db.collection(COLLECTIONS.TAG_USAGE)
        .where('userId', '==', this.userId)
        .orderBy('timestamp', 'desc')
        .limit(1000)
        .get();

      const usageData = usageSnapshot.docs.map(doc => doc.data());
      const patterns: TagUsagePattern[] = [];

      // Agrupar por tag
      const tagGroups = usageData.reduce((acc, usage) => {
        if (!acc[usage.tagId]) {
          acc[usage.tagId] = [];
        }
        acc[usage.tagId].push(usage);
        return acc;
      }, {} as Record<string, any[]>);

      // Analizar cada tag
      for (const [tagId, usages] of Object.entries(tagGroups)) {
        const tagName = usages[0]?.tagName || tagId;
        const contexts = [...new Set(usages.map(u => u.context))];
        const hours = [...new Set(usages.map(u => u.hour))];
        const days = [...new Set(usages.map(u => u.dayOfWeek))];
        const avgDuration = usages
          .filter(u => u.duration)
          .reduce((sum, u) => sum + u.duration, 0) / usages.filter(u => u.duration).length;

        patterns.push({
          tagId,
          tagName,
          context: contexts[0] as 'task' | 'meeting' | 'event',
          frequency: usages.length,
          avgDuration: avgDuration || undefined,
          commonTimes: hours.map(h => `${h}:00`),
          commonDays: days.map(d => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d]),
          relatedTags: [], // TODO: Implementar análisis de tags relacionados
          lastUsed: new Date(Math.max(...usages.map(u => u.timestamp.toDate().getTime())))
        });
      }

      // Guardar análisis
      const learningData: TagLearningData = {
        userId: this.userId,
        tagPatterns: patterns,
        suggestions: [],
        lastAnalyzed: new Date()
      };

      await db.collection(COLLECTIONS.TAG_LEARNING).doc(this.userId).set(learningData);

      return patterns;
    } catch (error) {
      console.error('Error analyzing usage patterns:', error);
      return [];
    }
  }

  // Generar sugerencias de tags
  async generateTagSuggestions(context: 'task' | 'meeting' | 'event', elementId: string): Promise<TagSuggestion[]> {
    try {
      const learningData = await db.collection(COLLECTIONS.TAG_LEARNING).doc(this.userId).get();
      if (!learningData.exists) {
        return [];
      }

      const data = learningData.data() as TagLearningData;
      const suggestions: TagSuggestion[] = [];

      // Sugerir tags basados en patrones
      for (const pattern of data.tagPatterns) {
        if (pattern.context === context && pattern.frequency > 3) {
          suggestions.push({
            tagId: pattern.tagId,
            tagName: pattern.tagName,
            reason: `Usado ${pattern.frequency} veces en ${context}s`,
            confidence: Math.min(0.9, pattern.frequency / 10),
            context,
            suggestedFor: elementId
          });
        }
      }

      // Ordenar por confianza
      return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      return [];
    }
  }

  // Obtener tags más usados
  async getMostUsedTags(limit: number = 10): Promise<TagDefinition[]> {
    try {
      const settings = await this.getTagSettings();
      if (!settings) return [];

      const allTags = [...settings.defaultTags, ...settings.customTags];
      return allTags
        .filter(tag => tag.isActive)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting most used tags:', error);
      return [];
    }
  }

  // Buscar tags por nombre
  async searchTags(query: string): Promise<TagDefinition[]> {
    try {
      const settings = await this.getTagSettings();
      if (!settings) return [];

      const allTags = [...settings.defaultTags, ...settings.customTags];
      const lowerQuery = query.toLowerCase();

      return allTags
        .filter(tag => 
          tag.isActive && 
          (tag.name.toLowerCase().includes(lowerQuery) || 
           tag.description?.toLowerCase().includes(lowerQuery))
        )
        .sort((a, b) => b.usageCount - a.usageCount);
    } catch (error) {
      console.error('Error searching tags:', error);
      return [];
    }
  }
}

// Instancia singleton
let tagService: TagManagementService | null = null;

export const getTagService = (userId: string): TagManagementService => {
  if (!tagService || tagService['userId'] !== userId) {
    tagService = new TagManagementService(userId);
  }
  return tagService;
};
