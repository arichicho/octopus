"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2, Users, Calendar } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  website: string;
  employees: number;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    employees: 0,
    status: 'active' as const
  });

  useEffect(() => {
    if (!user) return;

    const companiesRef = collection(db, 'companies');
    const q = query(
      companiesRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      setCompanies(companiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const companyData = {
        ...formData,
        employees: parseInt(formData.employees.toString()),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingCompany) {
        await updateDoc(doc(db, 'companies', editingCompany.id), {
          ...formData,
          employees: parseInt(formData.employees.toString()),
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'companies'), companyData);
      }

      setFormData({
        name: '',
        description: '',
        industry: '',
        website: '',
        employees: 0,
        status: 'active'
      });
      setShowForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description,
      industry: company.industry,
      website: company.website,
      employees: company.employees,
      status: company.status
    });
    setShowForm(true);
  };

  const handleDelete = async (companyId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      try {
        await deleteDoc(doc(db, 'companies', companyId));
      } catch (error) {
        console.error('Error deleting company:', error);
      }
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Empresas</h1>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre de la empresa"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industria</label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Industria"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la empresa"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sitio Web</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://ejemplo.com"
                    type="url"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número de Empleados</label>
                  <Input
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    type="number"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCompany ? 'Actualizar' : 'Crear'} Empresa
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingCompany(null);
                  setFormData({
                    name: '',
                    description: '',
                    industry: '',
                    website: '',
                    employees: 0,
                    status: 'active'
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
          {companies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay empresas registradas</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  Crear tu primera empresa
                </Button>
              </CardContent>
            </Card>
          ) : (
            companies.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        <Badge className={company.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}>
                          {company.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      {company.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{company.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {company.industry && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {company.industry}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.employees} empleados
                        </span>
                        {company.website && (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            Sitio Web
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(company.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
