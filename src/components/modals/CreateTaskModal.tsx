'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { 
  Save, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useTaskForm } from '@/hooks/useTaskForm';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { TaskFormSubmissionResult } from '@/types/forms';
import {
  TextField,
  TextareaField,
  CompanySelectField,
  PrioritySelectField,
  StatusSelectField,
  DatePickerField,
  TagsField,
  EmailMultiSelectField,
  UrlListField,
} from '@/components/forms/TaskFormFields';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompanyId?: string;
  onTaskCreated?: (result: TaskFormSubmissionResult) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  initialCompanyId,
  onTaskCreated,
}) => {
  const { companies, fetchCompanies } = useCompanyEnhancedStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get the selected company name for display
  const selectedCompany = companies.find(company => company.id === initialCompanyId);

  // Form hook with all functionality
  const {
    form,
    handleSubmit,
    reset,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    isDraft,
    lastSaved,
    saveDraft,
    submitAsDraft,
    getDrafts,
    loadDraft,
    deleteDraft,
    getCompanyOptions,
    addTag,
    removeTag,
    addAssignedUser,
    removeAssignedUser,
    addLinkedDocument,
    removeLinkedDocument,
    watchedValues,
    setValue,
  } = useTaskForm({
    initialCompanyId,
    onSuccess: (result) => {
      setNotification({
        type: 'success',
        message: `Tarea "${result.data?.title}" creada exitosamente`,
      });
      onTaskCreated?.(result);
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: `Error al crear la tarea: ${error}`,
      });
    },
  });

  // Load companies on mount
  useEffect(() => {
    if (isOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen, companies.length, fetchCompanies]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (isDirty && !isDraft) {
      // Auto-save draft before closing if there are unsaved changes
      saveDraft();
    }
    setNotification(null);
    onClose();
  }, [isDirty, isDraft, saveDraft, onClose]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Manual save draft
  const handleSaveDraft = async () => {
    await saveDraft();
    setNotification({
      type: 'info',
      message: 'Borrador guardado automáticamente',
    });
  };

  // Load existing drafts
  const drafts = getDrafts();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] modal-container">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nueva Tarea
            {selectedCompany && (
              <Badge variant="secondary" className="ml-2">
                para {selectedCompany.name}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Complete los detalles de la nueva tarea. Los campos marcados con * son obligatorios.
            {isDraft && lastSaved && (
              <Badge variant="secondary" className="ml-2">
                <Save className="h-3 w-3 mr-1" />
                Guardado {new Date(lastSaved).toLocaleTimeString()}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Notification Alert */}
        {notification && (
          <Alert className={`
            ${notification.type === 'success' ? 'border-green-500 bg-green-50' : ''}
            ${notification.type === 'error' ? 'border-red-500 bg-red-50' : ''}
            ${notification.type === 'info' ? 'border-blue-500 bg-blue-50' : ''}
          `}>
            {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {notification.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {notification.type === 'info' && <Clock className="h-4 w-4" />}
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Draft Selector */}
        {drafts.length > 0 && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Tienes {drafts.length} borrador(es) guardado(s)</span>
              <div className="flex gap-2">
                {drafts.slice(0, 2).map((draft: any) => (
                  <Button
                    key={draft.id}
                    variant="outline"
                    size="sm"
                    onClick={() => loadDraft(draft.id)}
                    className="text-xs"
                  >
                    Cargar: {draft.data.title || 'Sin título'}
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                  <TabsTrigger value="advanced">Opciones Avanzadas</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                  {/* Title - Required */}
                  <TextField
                    control={form.control}
                    name="title"
                    label="Título"
                    placeholder="Ingrese el título de la tarea"
                    maxLength={200}
                    required
                    disabled={isSubmitting}
                  />

                  {/* Description */}
                  <TextareaField
                    control={form.control}
                    name="description"
                    label="Descripción"
                    placeholder="Descripción detallada de la tarea..."
                    rows={3}
                    maxLength={1000}
                    disabled={isSubmitting}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company - Only show if not preseleccionada */}
                    {!initialCompanyId && (
                      <CompanySelectField
                        control={form.control}
                        name="companyId"
                        label="Empresa"
                        companies={companies}
                        required
                        disabled={isSubmitting}
                      />
                    )}

                    {/* Priority - Required */}
                    <PrioritySelectField
                      control={form.control}
                      name="priority"
                      label="Prioridad"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status - Required */}
                    <StatusSelectField
                      control={form.control}
                      name="status"
                      label="Estado"
                      required
                      disabled={isSubmitting}
                    />

                    {/* Due Date */}
                    <DatePickerField
                      control={form.control}
                      name="dueDate"
                      label="Fecha de Vencimiento"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Tags */}
                  <TagsField
                    control={form.control}
                    name="tags"
                    label="Etiquetas"
                    placeholder="Agregar etiqueta..."
                    maxTags={20}
                    onAddTag={addTag}
                    onRemoveTag={removeTag}
                    disabled={isSubmitting}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-6">
                  {/* Assigned Users */}
                  <EmailMultiSelectField
                    control={form.control}
                    name="assignedTo"
                    label="Asignado a"
                    placeholder="usuario@empresa.com"
                    maxUsers={10}
                    onAddUser={addAssignedUser}
                    onRemoveUser={removeAssignedUser}
                    disabled={isSubmitting}
                  />

                  {/* Parent Task - TODO: Implement when we have task relationships */}
                  {/*
                  <SelectField
                    control={form.control}
                    name="parentTaskId"
                    label="Tarea Padre"
                    options={getParentTaskOptions()}
                    disabled={isSubmitting}
                  />
                  */}

                  {/* Linked Documents */}
                  <UrlListField
                    control={form.control}
                    name="linkedDocuments"
                    label="Documentos Vinculados"
                    placeholder="https://ejemplo.com/documento"
                    maxUrls={5}
                    onAddUrl={addLinkedDocument}
                    onRemoveUrl={removeLinkedDocument}
                    disabled={isSubmitting}
                  />

                  {/* Additional Notes */}
                  <TextareaField
                    control={form.control}
                    name="notes"
                    label="Notas Adicionales"
                    placeholder="Notas, comentarios o información adicional..."
                    rows={4}
                    maxLength={2000}
                    disabled={isSubmitting}
                  />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Draft info */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="h-8"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Guardar Borrador
                </Button>
              )}
              {lastSaved && (
                <span className="text-xs">
                  Guardado: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              {isDirty && !isValid && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={submitAsDraft}
                  disabled={isSubmitting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Guardar Borrador
                </Button>
              )}
              
              <Button 
                type="submit" 
                disabled={!isValid || isSubmitting}
                onClick={handleSubmit}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Tarea
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};