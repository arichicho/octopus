'use client';

import React, { useState, useEffect } from 'react';
import { CompanyDragDrop } from '@/components/companies/CompanyDragDrop';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { CompanyModal } from '@/components/companies/CompanyModal';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';

export default function CompaniesPage() {
  const { 
    companies, 
    fetchCompanies, 
    reorderCompanies,
    setSelectedCompany,
    selectedCompany 
  } = useCompanyEnhancedStore();
  
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedCompanyForTask, setSelectedCompanyForTask] = useState<CompanyEnhanced | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleReorder = (reorderedCompanies: CompanyEnhanced[]) => {
    reorderCompanies(reorderedCompanies);
    // Aquí podrías guardar el nuevo orden en la base de datos
    console.log('Nuevo orden de empresas:', reorderedCompanies.map(c => c.name));
  };

  const handleSelectCompany = (company: CompanyEnhanced) => {
    setSelectedCompany(company);
  };

  const handleCreateTask = (company: CompanyEnhanced) => {
    setSelectedCompanyForTask(company);
    setIsCreateTaskModalOpen(true);
  };

  const handleEditCompany = (company: CompanyEnhanced) => {
    setSelectedCompany(company);
    setIsCreateCompanyModalOpen(true);
  };

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setIsCreateCompanyModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Mis Empresas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Arrastra y suelta para reordenar tus empresas
            </p>
          </div>
          <Button onClick={handleCreateCompany}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No tienes empresas aún
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Crea tu primera empresa para comenzar a organizar tus tareas
          </p>
          <Button onClick={handleCreateCompany}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Empresa
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <CompanyDragDrop
            companies={companies}
            onReorder={handleReorder}
            onSelectCompany={handleSelectCompany}
            onCreateTask={handleCreateTask}
            onEditCompany={handleEditCompany}
            selectedCompanyId={selectedCompany?.id}
          />
        </div>
      )}

      {/* Modal para crear/editar empresa */}
      <CompanyModal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
        company={selectedCompany}
        mode={selectedCompany ? 'edit' : 'create'}
        onSuccess={(company) => {
          setIsCreateCompanyModalOpen(false);
          console.log('Empresa guardada:', company);
        }}
      />

      {/* Modal para crear tarea */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        initialCompanyId={selectedCompanyForTask?.id}
        onTaskCreated={(result) => {
          setIsCreateTaskModalOpen(false);
          console.log('Tarea creada:', result);
        }}
      />
    </div>
  );
}
