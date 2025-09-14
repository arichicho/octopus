import { z } from 'zod';

// Task Form Data Interface
export interface TaskFormData {
  title: string;
  description?: string;
  companyId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  dueDate?: Date;
  assignedTo: string[];
  tags: string[];
  parentTaskId?: string;
  linkedDocuments?: string[];
  linkedEvents?: string[];
  notes?: string;
}

// Validation Schema with Zod
export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  
  companyId: z
    .string()
    .min(1, 'Debe seleccionar una empresa'),
  
  priority: z.enum(['urgent', 'high', 'medium', 'low'], {
    errorMap: () => ({ message: 'Debe seleccionar una prioridad válida' }),
  }),
  
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Debe seleccionar un estado válido' }),
  }),
  
  dueDate: z
    .date()
    .optional()
    .refine((date) => !date || date > new Date(), {
      message: 'La fecha de vencimiento debe ser futura',
    }),
  
  assignedTo: z
    .array(z.string().email('Email inválido'))
    .default([])
    .refine((emails) => emails.length <= 10, {
      message: 'No puede asignar más de 10 usuarios',
    }),
  
  tags: z
    .array(z.string().min(1).max(50))
    .default([])
    .refine((tags) => tags.length <= 20, {
      message: 'No puede agregar más de 20 etiquetas',
    }),
  
  parentTaskId: z
    .string()
    .optional(),
  
  linkedDocuments: z
    .array(z.string().url('URL inválida'))
    .default([])
    .refine((docs) => docs.length <= 5, {
      message: 'No puede vincular más de 5 documentos',
    }),
  
  linkedEvents: z
    .array(z.string())
    .default([]),
  
  notes: z
    .string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .optional(),
});

// Priority options for UI
export const priorityOptions = [
  { value: 'urgent', label: 'Urgente', color: 'red' },
  { value: 'high', label: 'Alta', color: 'orange' },
  { value: 'medium', label: 'Media', color: 'yellow' },
  { value: 'low', label: 'Baja', color: 'green' },
] as const;

// Status options for UI
export const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'yellow' },
  { value: 'in_progress', label: 'En Progreso', color: 'blue' },
  { value: 'completed', label: 'Completada', color: 'green' },
  { value: 'cancelled', label: 'Cancelada', color: 'red' },
] as const;

// Form field configuration
export interface FormFieldConfig {
  name: keyof TaskFormData;
  label: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'tags' | 'url';
  placeholder?: string;
  description?: string;
  options?: readonly { value: string; label: string; color?: string }[];
}

export const taskFormFields: FormFieldConfig[] = [
  {
    name: 'title',
    label: 'Título',
    required: true,
    type: 'text',
    placeholder: 'Ingrese el título de la tarea',
    description: 'Describe brevemente qué se debe hacer',
  },
  {
    name: 'description',
    label: 'Descripción',
    required: false,
    type: 'textarea',
    placeholder: 'Descripción detallada de la tarea...',
    description: 'Proporcione más detalles sobre la tarea',
  },
  {
    name: 'companyId',
    label: 'Empresa',
    required: true,
    type: 'select',
    description: 'Seleccione la empresa para esta tarea',
  },
  {
    name: 'priority',
    label: 'Prioridad',
    required: true,
    type: 'select',
    options: priorityOptions,
    description: 'Qué tan importante es esta tarea',
  },
  {
    name: 'status',
    label: 'Estado',
    required: true,
    type: 'select',
    options: statusOptions,
    description: 'Estado actual de la tarea',
  },
  {
    name: 'dueDate',
    label: 'Fecha de Vencimiento',
    required: false,
    type: 'date',
    description: 'Cuándo debe completarse la tarea',
  },
  {
    name: 'assignedTo',
    label: 'Asignado a',
    required: false,
    type: 'multiselect',
    placeholder: 'usuario@empresa.com',
    description: 'Usuarios responsables de completar la tarea',
  },
  {
    name: 'tags',
    label: 'Etiquetas',
    required: false,
    type: 'tags',
    placeholder: 'Agregar etiqueta...',
    description: 'Categorías para organizar la tarea',
  },
  {
    name: 'parentTaskId',
    label: 'Tarea Padre',
    required: false,
    type: 'select',
    description: 'Tarea de la cual depende esta subtarea',
  },
  {
    name: 'linkedDocuments',
    label: 'Documentos Vinculados',
    required: false,
    type: 'url',
    placeholder: 'https://ejemplo.com/documento',
    description: 'URLs de documentos relacionados',
  },
  {
    name: 'linkedEvents',
    label: 'Eventos Vinculados',
    required: false,
    type: 'multiselect',
    description: 'Eventos de calendario relacionados',
  },
  {
    name: 'notes',
    label: 'Notas Adicionales',
    required: false,
    type: 'textarea',
    placeholder: 'Notas, comentarios o información adicional...',
    description: 'Información adicional sobre la tarea',
  },
];

// Default form values
export const getDefaultTaskFormValues = (companyId?: string): Partial<TaskFormData> => ({
  title: '',
  description: '',
  companyId: companyId || '',
  priority: 'medium',
  status: 'pending',
  dueDate: undefined,
  assignedTo: [],
  tags: [],
  parentTaskId: undefined,
  linkedDocuments: [],
  linkedEvents: [],
  notes: '',
});

// Form submission result
export interface TaskFormSubmissionResult {
  success: boolean;
  data?: TaskFormData;
  error?: string;
  taskId?: string;
}