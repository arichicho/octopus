'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckSquare, 
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  CalendarIcon
} from 'lucide-react';
import { TaskFormData } from '@/types/task';
import { useCompanyStore } from '@/lib/store/useCompanyStore';

export default function TasksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testModal, setTestModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { companies, currentCompany } = useCompanyStore();

  // Actualizar la hora solo en el cliente
  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // No auto-load sample data - companies will be loaded from Firebase

  // Datos de ejemplo para usuarios
  const users = [
    { id: '1', name: 'Juan Pérez', email: 'juan@example.com' },
    { id: '2', name: 'María García', email: 'maria@example.com' },
    { id: '3', name: 'Carlos López', email: 'carlos@example.com' },
    { id: '4', name: 'Ana Rodríguez', email: 'ana@example.com' },
    { id: '5', name: 'Luis Martínez', email: 'luis@example.com' },
    { id: '6', name: 'Sofía Torres', email: 'sofia@example.com' },
  ];

  const handleCreateTask = async (data: TaskFormData) => {
    setLoading(true);
    try {
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cerrar modal y mostrar mensaje de éxito
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error al crear tarea:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Gestión de Tareas
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Administra y organiza todas tus tareas en un solo lugar
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestModal(true)}
              >
                Probar Modal
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  alert('¡Cambios aplicados correctamente!');
                  setShowCreateModal(true);
                }}
              >
                🚀 Modal Nuevo
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar tareas..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Fecha
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Asignado
              </Button>
            </div>
          </div>

          {/* Tasks Grid - Empty State */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center max-w-md">
              <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No hay tareas aún
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Comienza creando tu primera tarea para gestionar tu trabajo de manera eficiente.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear Primera Tarea
              </Button>
            </div>
          </div>
        </main>

        {/* Modal de creación de tarea */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-red-600">🎉 MODAL ACTUALIZADO 🎉</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Crear nueva tarea
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Versión actualizada - {currentTime || 'Cargando...'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    ✕
                  </Button>
                </div>

                <form className="space-y-4">
                  {/* Título */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Título *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ingresa el título de la tarea"
                      className="mt-1"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe la tarea..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  {/* Prioridad */}
                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium">
                      Prioridad
                    </Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="mt-1">
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

                  {/* Estado */}
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">
                      Estado
                    </Label>
                    <Select defaultValue="pending">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha de vencimiento */}
                  <div>
                    <Label htmlFor="dueDate" className="text-sm font-medium">
                      Fecha de Vencimiento
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="dueDate"
                        placeholder="Seleccionar fecha"
                        className="pl-10"
                      />
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Etiquetas */}
                  <div>
                    <Label htmlFor="tags" className="text-sm font-medium">
                      Etiquetas
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="tags"
                        placeholder="Agregar etiqueta y presionar Enter o coma"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      onClick={() => {
                        handleCreateTask({
                          title: 'Tarea de prueba',
                          description: 'Esta es una tarea de prueba',
                          companyId: companies[0]?.id || '',
                          priority: 'medium',
                          assignedTo: [],
                          tags: ['#prueba']
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Tarea
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de prueba simple */}
        {testModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Modal de Prueba</h3>
              <p className="text-gray-600 mb-4">Este es un modal simple para probar que funciona.</p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setTestModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
