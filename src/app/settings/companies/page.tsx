'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Building, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  AlertTriangle,
  CheckCircle,
  Eye,
  RotateCcw,
  Filter,
  Grid,
  List,
  Download,
  Upload,
  Database
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CompanyEnhanced, industryOptions } from '@/types/company-enhanced';
import { CompanyIcon, CompanyAvatar } from '@/components/companies/CompanyIcon';
import { CompanyModal } from '@/components/companies/CompanyModal';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { CompanyMigrationPanel } from './migrate';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyEnhanced | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [companyToDelete, setCompanyToDelete] = useState<CompanyEnhanced | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMigrationPanel, setShowMigrationPanel] = useState(false);
  const [version] = useState(() => Date.now()); // Force re-render to fix UI cache issues

  const {
    companies,
    loading,
    error,
    filteredCompanies,
    fetchCompanies,
    deleteCompanyAction,
    restoreCompanyAction,
    filterCompanies,
    clearError,
  } = useCompanyEnhancedStore();

  // Load companies on mount
  useEffect(() => {
    fetchCompanies(); // In real app, pass userId from auth context
  }, [fetchCompanies]);

  // Filter companies based on search and status
  useEffect(() => {
    let filtered = companies;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(query) ||
        company.description?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query)
      );
    }

    // Update filtered companies
    filterCompanies(searchQuery);
  }, [searchQuery, statusFilter, companies, filterCompanies]);

  // Handle create company
  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Handle edit company
  const handleEditCompany = (company: CompanyEnhanced) => {
    setSelectedCompany(company);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Handle delete company
  const handleDeleteCompany = (company: CompanyEnhanced) => {
    setCompanyToDelete(company);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      await deleteCompanyAction(companyToDelete.id);
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  // Handle restore company
  const handleRestoreCompany = async (company: CompanyEnhanced) => {
    try {
      await restoreCompanyAction(company.id);
    } catch (error) {
      console.error('Error restoring company:', error);
    }
  };

  // Get status badge variant and label
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, label: 'Activa', color: 'bg-green-100 text-green-800' };
      case 'inactive':
        return { variant: 'secondary' as const, label: 'Inactiva', color: 'bg-yellow-100 text-yellow-800' };
      case 'archived':
        return { variant: 'outline' as const, label: 'Archivada', color: 'bg-gray-100 text-gray-800' };
      default:
        return { variant: 'secondary' as const, label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Get industry label
  const getIndustryLabel = (industryValue?: string) => {
    const industry = industryOptions.find(opt => opt.value === industryValue);
    return industry?.label || industryValue || 'Sin especificar';
  };

  const displayedCompanies = searchQuery || statusFilter !== 'all' ? filteredCompanies : companies;

  return (
    <div className="space-y-6" key={version}>
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6 page-header">
          <div className="flex-1 w-full text-container" style={{ minWidth: 0, wordBreak: 'normal', overflowWrap: 'break-word' }}>
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 w-full whitespace-normal"
              style={{ 
                wordBreak: 'normal', 
                overflowWrap: 'break-word', 
                hyphens: 'auto',
                maxWidth: '100%',
                display: 'block'
              }}
            >
              🏢 Gestión de Empresas - Sistema Octopus
            </h1>
            <p 
              className="text-sm sm:text-base text-gray-600 dark:text-gray-400 w-full whitespace-normal mt-2"
              style={{ 
                wordBreak: 'normal', 
                overflowWrap: 'break-word',
                maxWidth: '100%',
                display: 'block'
              }}
            >
              Administra las empresas y organizaciones del sistema de gestión
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowMigrationPanel(!showMigrationPanel)}>
              <Database className="mr-2 h-4 w-4" />
              {showMigrationPanel ? 'Ocultar' : 'Migración'}
            </Button>
            <Button onClick={handleCreateCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Empresa
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearError}
            className="ml-auto"
          >
            Cerrar
          </Button>
        </Alert>
      )}

      {/* Migration Panel */}
      {showMigrationPanel && (
        <Card>
          <CardHeader>
            <CardTitle>Panel de Migración y Datos</CardTitle>
            <CardDescription>
              Herramientas para migrar datos existentes y crear datos de muestra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyMigrationPanel />
          </CardContent>
        </Card>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === 'all' ? 'Todos los estados' : 
                   statusFilter === 'active' ? 'Activas' :
                   statusFilter === 'inactive' ? 'Inactivas' : 'Archivadas'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos los estados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  Activas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                  Inactivas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
                  Archivadas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {companies.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-green-600">Activas</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {companies.filter(c => c.status === 'inactive').length}
              </div>
              <div className="text-sm text-yellow-600">Inactivas</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {companies.filter(c => c.status === 'archived').length}
              </div>
              <div className="text-sm text-gray-600">Archivadas</div>
            </div>
          </div>

          {/* Companies List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando empresas...</p>
              </div>
            </div>
          ) : displayedCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No se encontraron empresas' : 'No hay empresas'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Intenta con diferentes términos de búsqueda o filtros.'
                  : 'Comienza creando tu primera empresa.'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={handleCreateCompany}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Empresa
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {displayedCompanies.map((company) => {
                const statusInfo = getStatusInfo(company.status);
                
                if (viewMode === 'list') {
                  return (
                    <Card key={company.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <CompanyIcon
                              logoUrl={company.logoUrl}
                              defaultIcon={company.defaultIcon}
                              name={company.name}
                              color={company.color}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {company.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {company.description || 'Sin descripción'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                                {company.industry && (
                                  <span className="text-xs text-gray-500">
                                    {getIndustryLabel(company.industry)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {company.status === 'archived' ? (
                                <DropdownMenuItem onClick={() => handleRestoreCompany(company)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restaurar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCompany(company)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Grid view
                return (
                  <Card key={company.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CompanyIcon
                          logoUrl={company.logoUrl}
                          defaultIcon={company.defaultIcon}
                          name={company.name}
                          color={company.color}
                          size="lg"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {company.status === 'archived' ? (
                              <DropdownMenuItem onClick={() => handleRestoreCompany(company)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restaurar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCompany(company)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{company.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {company.description || 'Sin descripción'}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          {company.industry && (
                            <span className="text-xs text-gray-500">
                              {getIndustryLabel(company.industry)}
                            </span>
                          )}
                        </div>
                        {company.website && (
                          <p className="text-xs text-blue-600 hover:underline cursor-pointer truncate">
                            {company.website}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          Creada: {company.createdAt instanceof Date 
                            ? company.createdAt.toLocaleDateString('es-ES')
                            : company.createdAt.toDate().toLocaleDateString('es-ES')
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Modal */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={selectedCompany}
        mode={modalMode}
        onSuccess={(company) => {
          // Success handled by the store
          console.log('Company saved:', company);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la empresa &quot;{companyToDelete?.name}&quot;? 
              Esta acción marcará la empresa como archivada y no afectará los datos existentes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}