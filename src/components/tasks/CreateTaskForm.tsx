'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Plus, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskFormData, TaskPriority } from '@/types/task';
import { useCompanyStore } from '@/lib/store/useCompanyStore';

interface CreateTaskFormProps {
  companies: Array<{ id: string; name: string; color: string }>;
  users: Array<{ id: string; name: string; email: string }>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CreateTaskForm({ companies, users, onSubmit, onCancel, loading = false }: CreateTaskFormProps) {
  const { currentCompany } = useCompanyStore();
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    companyId: currentCompany?.id || '',
    priority: 'medium',
    assignedTo: [],
    dueDate: undefined,
    tags: [],
    parentTaskId: undefined
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar companyId cuando cambie la empresa actual
  useEffect(() => {
    if (currentCompany?.id) {
      setFormData(prev => ({ ...prev, companyId: currentCompany.id }));
    }
  }, [currentCompany?.id]);

  // Validación en tiempo real
  const validateField = (field: string, value: unknown) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'El título es obligatorio';
        } else if (value.length < 3) {
          newErrors.title = 'El título debe tener al menos 3 caracteres';
        } else {
          delete newErrors.title;
        }
        break;
      
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'La descripción es obligatoria';
        } else if (value.length < 10) {
          newErrors.description = 'La descripción debe tener al menos 10 caracteres';
        } else {
          delete newErrors.description;
        }
        break;
      
      case 'companyId':
        if (!value) {
          newErrors.companyId = 'Debes seleccionar una empresa';
        } else {
          delete newErrors.companyId;
        }
        break;
      
      case 'dueDate':
        if (value && value < new Date()) {
          newErrors.dueDate = 'La fecha no puede ser anterior a hoy';
        } else {
          delete newErrors.dueDate;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TaskFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const tag = newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const isTitleValid = validateField('title', formData.title);
    const isDescriptionValid = validateField('description', formData.description);
    const isCompanyValid = validateField('companyId', formData.companyId);
    const isDueDateValid = validateField('dueDate', formData.dueDate);
    
    if (isTitleValid && isDescriptionValid && isCompanyValid && isDueDateValid) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.title.trim() && 
                     formData.description.trim() && 
                     formData.companyId &&
                     Object.keys(errors).length === 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nueva Tarea</CardTitle>
        <CardDescription>
          Completa los campos para crear una nueva tarea. Los campos marcados con * son obligatorios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título * <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ej: Revisar propuesta de cliente"
              className={cn(errors.title && "border-red-500 focus:border-red-500")}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción * <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe detalladamente qué hay que hacer..."
              rows={4}
              className={cn(errors.description && "border-red-500 focus:border-red-500")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company">
              Empresa * <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) => handleInputChange('companyId', value)}
            >
              <SelectTrigger className={cn(errors.companyId && "border-red-500 focus:border-red-500")}>
                <SelectValue placeholder="Selecciona una empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: company.color }}
                      />
                      <span>{company.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentCompany && (
              <p className="text-xs text-muted-foreground">
                Empresa predeterminada: {currentCompany.name}
              </p>
            )}
            {errors.companyId && (
              <p className="text-sm text-red-500">{errors.companyId}</p>
            )}
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: TaskPriority) => handleInputChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de vencimiento */}
          <div className="space-y-2">
            <Label>
              Fecha de vencimiento (opcional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground",
                    errors.dueDate && "border-red-500 focus:border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, 'PPP', { locale: es })
                  ) : (
                    <span>Selecciona una fecha (opcional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => handleInputChange('dueDate', date)}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && (
              <p className="text-sm text-red-500">{errors.dueDate}</p>
            )}
          </div>

          {/* Asignar a */}
          <div className="space-y-2">
            <Label>Asignar a</Label>
            <Select
              onValueChange={(userId) => {
                if (!formData.assignedTo.includes(userId)) {
                  handleInputChange('assignedTo', [...formData.assignedTo, userId]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona usuarios para asignar" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.assignedTo.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assignedTo.map((userId) => {
                  const user = users.find(u => u.id === userId);
                  return (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                      {user?.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleInputChange('assignedTo', formData.assignedTo.filter(id => id !== userId))}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tarea padre (opcional) */}
          <div className="space-y-2">
            <Label>Tarea padre (opcional)</Label>
            <Select
              value={formData.parentTaskId || ''}
              onValueChange={(value) => handleInputChange('parentTaskId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una tarea padre (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin tarea padre</SelectItem>
                {/* Aquí se podrían cargar las tareas existentes */}
                <SelectItem value="task-1">Revisar propuesta de cliente</SelectItem>
                <SelectItem value="task-2">Preparar presentación mensual</SelectItem>
                <SelectItem value="task-3">Reunión con equipo de desarrollo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona una tarea padre si esta es una subtarea
            </p>
          </div>

          {/* Tags personalizables */}
          <div className="space-y-2">
            <Label>Tags personalizables</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ej: #urgente, #revisión"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Sugerencias: #urgente, #revisión, #desarrollo, #diseño, #cliente, #interno
            </p>
          </div>

          {/* Documentos vinculados (opcional) */}
          <div className="space-y-2">
            <Label>Documentos vinculados (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL del documento (Google Drive, Dropbox, etc.)"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Agrega enlaces a documentos relacionados con esta tarea
            </p>
          </div>

          {/* Eventos vinculados (opcional) */}
          <div className="space-y-2">
            <Label>Eventos vinculados (opcional)</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento relacionado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin evento vinculado</SelectItem>
                <SelectItem value="event-1">Reunión de equipo - 15/12/2024</SelectItem>
                <SelectItem value="event-2">Presentación cliente - 20/12/2024</SelectItem>
                <SelectItem value="event-3">Sprint planning - 25/12/2024</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincula esta tarea con eventos del calendario
            </p>
          </div>

          {/* Notas adicionales (opcional) */}
          <div className="space-y-2">
            <Label>Notas adicionales (opcional)</Label>
            <Textarea
              placeholder="Agrega notas adicionales, contexto o instrucciones especiales..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Información adicional que pueda ser útil para completar la tarea
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid || loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
