'use client';

import { useState, KeyboardEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/lib/hooks/useAuth';
import { CalendarIcon, Plus, X, CheckCircle, Save } from 'lucide-react';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Timestamp } from 'firebase/firestore';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: CompanyEnhanced;
  task?: Task;
  mode?: 'create' | 'edit';
}

export const TaskModal = ({ isOpen, onClose, company, task, mode = 'create' }: TaskModalProps) => {
  const { createTask, updateTask } = useTaskStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    dueDate: undefined as Date | undefined,
    assigneeId: '',
    tags: [] as string[],
  });

  // Load task data when editing
  useEffect(() => {
    if (mode === 'edit' && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        dueDate: task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate()) : undefined,
        assigneeId: task.assigneeId || '',
        tags: task.tags || [],
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        dueDate: undefined,
        assigneeId: '',
        tags: [],
      });
      setTagInput('');
    }
  }, [task, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      if (mode === 'create' && company?.id) {
        await createTask({
          ...formData,
          companyId: company.id,
          dueDate: formData.dueDate ? Timestamp.fromDate(formData.dueDate) : Timestamp.fromDate(new Date()),
          createdBy: user?.uid || 'current-user',
        });
      } else if (mode === 'edit' && task?.id) {
        await updateTask(task.id, {
          ...formData,
          dueDate: formData.dueDate ? Timestamp.fromDate(formData.dueDate) : task.dueDate,
          updatedAt: Timestamp.now(),
        });
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        dueDate: undefined,
        assigneeId: '',
        tags: [],
      });
      setTagInput('');
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!task?.id) return;
    
    setLoading(true);
    try {
      await updateTask(task.id, {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      onClose();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData({ ...formData, tags: [...formData.tags, tag] });
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddTagButton = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Agregar Nuevo Pendiente' : 'Editar Pendiente'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? (company ? `Crear una nueva tarea para ${company.name}` : 'Crear una nueva tarea')
              : 'Modificar los detalles de la tarea'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ingrese el título de la tarea"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ingrese una descripción detallada"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                disabled={loading}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate && !isNaN(formData.dueDate.getTime()) ? (
                    format(formData.dueDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => date && setFormData({ ...formData, dueDate: date })}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <div className="space-y-2">
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2 py-1 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Agregar etiqueta y presionar Enter o coma"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTagButton}
                  disabled={loading || !tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              {mode === 'edit' && task?.status !== 'completed' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleComplete} 
                  disabled={loading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !formData.title}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {mode === 'create' ? 'Creando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    {mode === 'create' ? (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Tarea
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};