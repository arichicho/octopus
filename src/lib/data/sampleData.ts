import { Company } from '@/types/company';
import { Task } from '@/types/task';

export const sampleCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'TechCorp Solutions',
    color: '#3B82F6',
    settings: {
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF'
      },
      notifications: {
        email: true,
        push: true,
        dailyDigest: true
      },
      permissions: {
        allowPublicTasks: true,
        requireApproval: false,
        autoAssign: true
      },
      integrations: {
        googleCalendar: true,
        googleDrive: true,
        gmail: false,
        slack: true
      }
    },
    createdAt: new Date('2024-01-15'),
    ownerId: 'user-1'
  },
  {
    id: 'company-2',
    name: 'GreenEnergy Co',
    color: '#10B981',
    settings: {
      branding: {
        primaryColor: '#10B981',
        secondaryColor: '#059669'
      },
      notifications: {
        email: true,
        push: false,
        dailyDigest: true
      },
      permissions: {
        allowPublicTasks: false,
        requireApproval: true,
        autoAssign: false
      },
      integrations: {
        googleCalendar: true,
        googleDrive: true,
        gmail: true,
        slack: false
      }
    },
    createdAt: new Date('2024-02-20'),
    ownerId: 'user-1'
  },
  {
    id: 'company-3',
    name: 'Creative Studio',
    color: '#F59E0B',
    settings: {
      branding: {
        primaryColor: '#F59E0B',
        secondaryColor: '#D97706'
      },
      notifications: {
        email: true,
        push: true,
        dailyDigest: false
      },
      permissions: {
        allowPublicTasks: true,
        requireApproval: false,
        autoAssign: true
      },
      integrations: {
        googleCalendar: false,
        googleDrive: true,
        gmail: false,
        slack: true
      }
    },
    createdAt: new Date('2024-03-10'),
    ownerId: 'user-1'
  }
];

export const sampleTasks: Task[] = [
  // TechCorp Solutions
  {
    id: 'task-1',
    title: 'Implementar autenticación OAuth',
    description: 'Configurar autenticación OAuth 2.0 para la nueva aplicación móvil',
    companyId: 'company-1',
    status: 'in_progress',
    priority: 'high',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-20'),
    progress: 65,
    tags: ['backend', 'security', 'mobile'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-15')
  },
  {
    id: 'task-2',
    title: 'Revisar pull requests pendientes',
    description: 'Revisar y aprobar los 15 pull requests en el repositorio principal',
    companyId: 'company-1',
    status: 'pending',
    priority: 'urgent',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-18'),
    progress: 0,
    tags: ['code-review', 'git'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-10')
  },
  {
    id: 'task-3',
    title: 'Actualizar documentación API',
    description: 'Actualizar la documentación de la API REST con los nuevos endpoints',
    companyId: 'company-1',
    status: 'pending',
    priority: 'medium',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-25'),
    progress: 0,
    tags: ['documentation', 'api'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-12'),
    updatedAt: new Date('2024-12-12')
  },
  {
    id: 'task-4',
    title: 'Optimizar consultas de base de datos',
    description: 'Identificar y optimizar las consultas más lentas en la aplicación',
    companyId: 'company-1',
    status: 'completed',
    priority: 'high',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-10'),
    progress: 100,
    tags: ['database', 'performance'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-11-25'),
    updatedAt: new Date('2024-12-10')
  },

  // GreenEnergy Co
  {
    id: 'task-5',
    title: 'Preparar presentación para inversores',
    description: 'Crear presentación ejecutiva para la reunión con inversores del próximo mes',
    companyId: 'company-2',
    status: 'pending',
    priority: 'urgent',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-22'),
    progress: 0,
    tags: ['presentation', 'investors'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2024-12-05')
  },
  {
    id: 'task-6',
    title: 'Analizar datos de eficiencia energética',
    description: 'Analizar los datos del último trimestre para identificar oportunidades de mejora',
    companyId: 'company-2',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-30'),
    progress: 40,
    tags: ['analytics', 'energy'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-14')
  },
  {
    id: 'task-7',
    title: 'Revisar contratos de proveedores',
    description: 'Revisar y renovar los contratos con los principales proveedores de energía',
    companyId: 'company-2',
    status: 'pending',
    priority: 'high',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-28'),
    progress: 0,
    tags: ['contracts', 'suppliers'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08')
  },

  // Creative Studio
  {
    id: 'task-8',
    title: 'Diseñar nueva identidad de marca',
    description: 'Crear nueva identidad visual para el cliente principal',
    companyId: 'company-3',
    status: 'in_progress',
    priority: 'high',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-24'),
    progress: 75,
    tags: ['design', 'branding'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-03'),
    updatedAt: new Date('2024-12-16')
  },
  {
    id: 'task-9',
    title: 'Editar video promocional',
    description: 'Finalizar la edición del video promocional para el lanzamiento',
    companyId: 'company-3',
    status: 'pending',
    priority: 'medium',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-26'),
    progress: 0,
    tags: ['video', 'editing'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-10')
  },
  {
    id: 'task-10',
    title: 'Actualizar portfolio web',
    description: 'Actualizar el portfolio con los últimos proyectos completados',
    companyId: 'company-3',
    status: 'completed',
    priority: 'low',
    assignedTo: ['user-1'],
    dueDate: new Date('2024-12-15'),
    progress: 100,
    tags: ['web', 'portfolio'],
    linkedDocs: [],
    linkedEvents: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-15')
  }
];
