"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FolderOpen, Calendar, Users, Target } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  teamMembers: string[];
  companyId: string;
  createdAt: any;
  updatedAt: any;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as const,
    priority: 'medium' as const,
    startDate: '',
    endDate: '',
    teamMembers: '',
    companyId: ''
  });

  useEffect(() => {
    if (!user) return;

    // Load projects
    const projectsRef = collection(db, 'projects');
    const projectsQuery = query(
      projectsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    });

    // Load companies
    const companiesRef = collection(db, 'companies');
    const companiesQuery = query(companiesRef, orderBy('name'));

    const unsubscribeCompanies = onSnapshot(companiesQuery, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);
      setLoading(false);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeCompanies();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const projectData = {
        ...formData,
        teamMembers: formData.teamMembers.split(',').map(email => email.trim()).filter(Boolean),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), {
          ...formData,
          teamMembers: formData.teamMembers.split(',').map(email => email.trim()).filter(Boolean),
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'projects'), projectData);
      }

      setFormData({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        startDate: '',
        endDate: '',
        teamMembers: '',
        companyId: ''
      });
      setShowForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      teamMembers: project.teamMembers.join(', '),
      companyId: project.companyId
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        await deleteDoc(doc(db, 'projects', projectId));
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Proyectos</h1>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Proyecto</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del proyecto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del proyecto"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planificación</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="on-hold">En Pausa</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridad</label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Inicio</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Fin</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Empresa</label>
                <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Miembros del Equipo (emails separados por comas)</label>
                <Input
                  value={formData.teamMembers}
                  onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                  placeholder="email1@ejemplo.com, email2@ejemplo.com"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingProject ? 'Actualizar' : 'Crear'} Proyecto
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingProject(null);
                  setFormData({
                    name: '',
                    description: '',
                    status: 'planning',
                    priority: 'medium',
                    startDate: '',
                    endDate: '',
                    teamMembers: '',
                    companyId: ''
                  });
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 overflow-auto">
        <div className="grid gap-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay proyectos registrados</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  Crear tu primer proyecto
                </Button>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => {
              const company = companies.find(c => c.id === project.companyId);
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status === 'planning' ? 'Planificación' : 
                             project.status === 'active' ? 'Activo' : 
                             project.status === 'on-hold' ? 'En Pausa' : 'Completado'}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {company && (
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {company.name}
                            </span>
                          )}
                          {project.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Inicio: {new Date(project.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {project.endDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Fin: {new Date(project.endDate).toLocaleDateString()}
                            </span>
                          )}
                          {project.teamMembers.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.teamMembers.length} miembros
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
