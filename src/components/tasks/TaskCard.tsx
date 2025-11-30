'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar, User, Building2 } from 'lucide-react';
import { formatTaskDate, getPriorityColor, getPriorityText, getStatusColor, getStatusText } from '@/lib/utils/taskUtils';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
    assignee?: string;
    dueDate?: Date;
    tags: string[];
    company?: {
      name: string;
      color: string;
    };
  };
  onEdit?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onComplete }: TaskCardProps) {

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="mt-2">
              {task.description}
            </CardDescription>
          </div>
          <Badge className={`${getPriorityColor(task.priority)} border`}>
            {getPriorityText(task.priority)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Información de la empresa */}
          {task.company && (
            <div className="flex items-center space-x-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: task.company.color }}
              />
              <span className="text-muted-foreground">{task.company.name}</span>
            </div>
          )}

          {/* Asignado a */}
          {task.assignee && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Asignado a:</span>
              <span className="font-medium">{task.assignee}</span>
            </div>
          )}

          {/* Fecha de vencimiento */}
          {task.dueDate && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Vence:</span>
              <span className="font-medium">
                {formatTaskDate(task.dueDate)}
              </span>
            </div>
          )}

          {/* Estado */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estado:</span>
            <Badge className={`${getStatusColor(task.status)} border`}>
              {getStatusText(task.status)}
            </Badge>
          </div>

          {/* Tags personalizables */}
          {task.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center space-x-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(task.id)}
            >
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onComplete?.(task.id)}
            >
              {task.status === 'completed' ? 'Desmarcar' : 'Completar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
