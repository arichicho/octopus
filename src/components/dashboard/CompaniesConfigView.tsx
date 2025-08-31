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
  Database,
  ArrowLeft
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
import { CompanyMigrationPanel } from '@/app/settings/companies/migrate';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';

export function CompaniesConfigView() {
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
  const handleDeleteCompany = async () => {
    if (companyToDelete) {
      try {
        await deleteCompanyAction(companyToDelete.id);
        setShowDeleteDialog(false);
        setCompanyToDelete(null);
      } catch (error) {
        console.error('Error deleting company:', error);
      }
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

  const handleBackToBoard = () => {
    window.location.hash = '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Activa</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Inactiva</Badge>;
      case 'archived':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Archivada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBackToBoard} 
              variant="ghost" 
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Tablero</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Configurador de Empresas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona y configura tus empresas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowMigrationPanel(!showMigrationPanel)}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Migración</span>
            </Button>
            <Button onClick={handleCreateCompany} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nueva Empresa</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Migration Panel */}
        {showMigrationPanel && (
          <div className="mb-6">
            <CompanyMigrationPanel />
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
              <option value="archived">Archivadas</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Companies Grid/List */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primera empresa para comenzar'
              }
            </p>
            <Button onClick={handleCreateCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Empresa
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <CompanyAvatar companyId={company.id} size="lg" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-1">{company.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {company.description || 'Sin descripción'}
                        </CardDescription>
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
                        <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {company.status === 'archived' && (
                          <DropdownMenuItem onClick={() => handleRestoreCompany(company)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar
                          </DropdownMenuItem>
                        )}
                        {company.status !== 'archived' && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setCompanyToDelete(company);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(company.status)}
                    {company.industry && (
                      <Badge variant="outline" className="text-xs">
                        {company.industry}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {company.website && (
                      <div className="flex items-center space-x-2">
                        <span>🌐</span>
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center space-x-2">
                        <span>📞</span>
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center space-x-2">
                        <span>✉️</span>
                        <span>{company.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={selectedCompany}
        mode={modalMode}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la empresa "{companyToDelete?.name}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
