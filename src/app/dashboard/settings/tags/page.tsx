'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { getTagService } from '@/lib/services/tag-management';
import { TagDefinition, TagCategory, TagSettings } from '@/types/tags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, TrendingUp, Settings, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function TagsSettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<TagSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  useEffect(() => {
    if (user?.uid) {
      loadTagSettings();
    }
  }, [user?.uid]);

  const loadTagSettings = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const tagService = getTagService(user.uid);
      const tagSettings = await tagService.getTagSettings();
      setSettings(tagSettings);
    } catch (error) {
      console.error('Error loading tag settings:', error);
      toast.error('Error al cargar configuración de tags');
    } finally {
      setLoading(false);
    }
  };

  const addCustomTag = async () => {
    if (!user?.uid || !newTagName.trim() || !newTagCategory.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const tagService = getTagService(user.uid);
      const newTag = await tagService.addCustomTag({
        name: newTagName.trim(),
        category: newTagCategory.trim(),
        color: newTagColor,
        isDefault: false,
        isActive: true
      });

      // Actualizar estado local
      if (settings) {
        const updatedSettings = {
          ...settings,
          customTags: [...settings.customTags, newTag],
          updatedAt: new Date()
        };
        setSettings(updatedSettings);
      }

      setNewTagName('');
      setNewTagCategory('');
      setNewTagColor('#3b82f6');
      toast.success('Tag agregado exitosamente');
    } catch (error) {
      console.error('Error adding custom tag:', error);
      toast.error('Error al agregar tag');
    }
  };

  const filteredTags = (tags: TagDefinition[]) => {
    if (!searchQuery) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getCategoryColor = (categoryName: string) => {
    const category = settings?.categories.find(c => c.name === categoryName);
    return category?.color || '#6b7280';
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = settings?.categories.find(c => c.name === categoryName);
    return category?.icon || '🏷️';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Error al cargar configuración de tags</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Tags</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura tags predeterminados y personalizados para mejorar la organización y el aprendizaje automático
        </p>
      </div>

      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Agregar nuevo tag */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Tag Personalizado
              </CardTitle>
              <CardDescription>
                Crea tags personalizados para organizar mejor tus tareas y eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre del tag</label>
                  <Input
                    placeholder="ej: importante"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <Input
                    placeholder="ej: Prioridad"
                    value={newTagCategory}
                    onChange={(e) => setNewTagCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={addCustomTag} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Tag
              </Button>
            </CardContent>
          </Card>

          {/* Tags predeterminados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags Predeterminados
              </CardTitle>
              <CardDescription>
                Tags predefinidos que se usan para el aprendizaje automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTags(settings.defaultTags).map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <span>{getCategoryIcon(tag.category)}</span>
                          {tag.category}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tag.usageCount} usos
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags personalizados */}
          {settings.customTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tags Personalizados
                </CardTitle>
                <CardDescription>
                  Tags que has creado personalmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTags(settings.customTags).map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <span>{getCategoryIcon(tag.category)}</span>
                            {tag.category}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {tag.usageCount} usos
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Tags</CardTitle>
              <CardDescription>
                Organiza tus tags en categorías para mejor gestión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {[...settings.defaultTags, ...settings.customTags].filter(t => t.category === category.name).length} tags
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics de Tags
              </CardTitle>
              <CardDescription>
                Estadísticas de uso de tus tags para mejorar la organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Los analytics de tags se generarán automáticamente conforme uses el sistema.
                  El aprendizaje automático analizará tus patrones de uso para sugerir tags relevantes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
