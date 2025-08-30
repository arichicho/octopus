'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreateTaskForm } from './CreateTaskForm';
import { TaskFormData } from '@/types/task';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Array<{ id: string; name: string; color: string }>;
  users: Array<{ id: string; name: string; email: string }>;
  onSubmit: (data: TaskFormData) => void;
  loading?: boolean;
}

export function CreateTaskModal({ 
  open, 
  onOpenChange, 
  companies, 
  users, 
  onSubmit, 
  loading = false 
}: CreateTaskModalProps) {
  const handleSubmit = (data: TaskFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-lg font-bold mb-4">Modal de Creación de Tarea</p>
          <p>Empresas disponibles: {companies.length}</p>
          <p>Usuarios disponibles: {users.length}</p>
          <div className="mt-4 space-y-2">
            <Button onClick={handleCancel} variant="outline" className="w-full">
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('Creando tarea de prueba...');
              handleSubmit({
                title: 'Tarea de prueba',
                description: 'Esta es una tarea de prueba',
                companyId: companies[0]?.id || '',
                priority: 'medium',
                assignedTo: [],
                tags: ['#prueba']
              });
            }} className="w-full">
              Crear Tarea de Prueba
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
