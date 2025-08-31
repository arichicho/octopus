'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { CompanyEnhanced, CompanyStatus, industryOptions, companyColorPalette } from '@/types/company-enhanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Archive, 
  RotateCcw,
  Eye,
  Building2,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { CompanyModal } from '@/components/companies/CompanyModal';
import { CompanyAdvancedManagement } from '@/components/companies/CompanyAdvancedManagement';
import { CompanySettingsPanel } from '@/components/companies/CompanySettingsPanel';
import { CompanyAnalytics } from '@/components/companies/CompanyAnalytics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';

export default function CompaniesSettingsPage() {
  const { user } = useAuth();
  const { 
    companies, 
    filteredCompanies,
    loading, 
    error, 
    searchQuery,
    fetchCompanies, 
    searchCompaniesAction, 
    filterCompanies,
    createNewCompany,
    updateExistingCompany,
    deleteCompanyAction,
    restoreCompanyAction,
    bulkUpdateCompanies,
    bulkDeleteCompanies,
    bulkRestoreCompanies,
    bulkArchiveCompanies,
    clearError 
  } = useCompanyEnhancedStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyEnhanced | null>(null);
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedView, setShowAdvancedView] = useState(false);
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [showAnalyticsView, setShowAnalyticsView] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchCompanies(user.uid);
    }
  }, [user?.uid, fetchCompanies]);

  // Aplicar filtros y ordenamiento
  const getFilteredAndSortedCompanies = () => {
    let filtered = [...companies];

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter);
    }

    // Filtrar por industria
    if (industryFilter !== 'all') {
      filtered = filtered.filter(company => company.industry === industryFilter);
    }

    // Filtrar eliminadas
    if (!showDeleted) {
      filtered = filtered.filter(company => !company.isDeleted);
    } else {
      filtered = filtered.filter(company => company.isDeleted);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = firestoreDateToDate(a.createdAt);
          bValue = firestoreDateToDate(b.createdAt);
          break;
        case 'updatedAt':
          aValue = firestoreDateToDate(a.updatedAt);
          bValue = firestoreDateToDate(b.updatedAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchCompaniesAction(query, user?.uid);
    } else {
      filterCompanies('');
    }
  };

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setIsCreateModalOpen(true);
  };

  const handleEditCompany = (company: CompanyEnhanced) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleDeleteCompany = async (company: CompanyEnhanced) => {
    try {
      await deleteCompanyAction(company.id);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleRestoreCompany = async (company: CompanyEnhanced) => {
    try {
      await restoreCompanyAction(company.id);
    } catch (error) {
      console.error('Error restoring company:', error);
    }
  };

  const getStatusIcon = (status: CompanyStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: CompanyStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'Sin fecha';
    try {
      const dateObj = firestoreDateToDate(date);
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const sortedAndFilteredCompanies = getFilteredAndSortedCompanies();
  const activeCompanies = companies.filter(c => c.status === 'active' && !c.isDeleted);
  const inactiveCompanies = companies.filter(c => c.status === 'inactive' && !c.isDeleted);
  const archivedCompanies = companies.filter(c => c.status === 'archived' && !c.isDeleted);
  const deletedCompanies = companies.filter(c => c.isDeleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Administración de Empresas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona todas tus empresas y su configuración
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAnalyticsView(!showAnalyticsView)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Análisis</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedView(!showAdvancedView)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Gestión Avanzada</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSettingsView(!showSettingsView)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </Button>
          <Button onClick={handleCreateCompany} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Empresa</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activeCompanies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactivas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {inactiveCompanies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                <Archive className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Archivadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {archivedCompanies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eliminadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {deletedCompanies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros y Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <Select value={statusFilter} onValueChange={(value: CompanyStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
                <SelectItem value="archived">Archivadas</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por industria */}
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las industrias</SelectItem>
                {industryOptions.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenamiento */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as 'name' | 'createdAt' | 'updatedAt');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="createdAt-desc">Más recientes</SelectItem>
                <SelectItem value="createdAt-asc">Más antiguas</SelectItem>
                <SelectItem value="updatedAt-desc">Última actualización</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mostrar eliminadas */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showDeleted"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showDeleted" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar empresas eliminadas
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({sortedAndFilteredCompanies.length})</TabsTrigger>
          <TabsTrigger value="active">Activas ({activeCompanies.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas ({inactiveCompanies.length})</TabsTrigger>
          <TabsTrigger value="archived">Archivadas ({archivedCompanies.length})</TabsTrigger>
          {deletedCompanies.length > 0 && (
            <TabsTrigger value="deleted">Eliminadas ({deletedCompanies.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CompaniesList 
            companies={sortedAndFilteredCompanies}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            onRestore={handleRestoreCompany}
            showDeleted={showDeleted}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <CompaniesList 
            companies={activeCompanies}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            onRestore={handleRestoreCompany}
            showDeleted={false}
          />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <CompaniesList 
            companies={inactiveCompanies}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            onRestore={handleRestoreCompany}
            showDeleted={false}
          />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <CompaniesList 
            companies={archivedCompanies}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            onRestore={handleRestoreCompany}
            showDeleted={false}
          />
        </TabsContent>

        {deletedCompanies.length > 0 && (
          <TabsContent value="deleted" className="space-y-4">
            <CompaniesList 
              companies={deletedCompanies}
              onEdit={handleEditCompany}
              onDelete={handleDeleteCompany}
              onRestore={handleRestoreCompany}
              showDeleted={true}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Vista de Análisis */}
      {showAnalyticsView && (
        <CompanyAnalytics companies={companies} />
      )}

      {/* Vista de Gestión Avanzada */}
      {showAdvancedView && (
        <CompanyAdvancedManagement
          companies={companies}
          onBulkUpdate={bulkUpdateCompanies}
          onBulkDelete={bulkDeleteCompanies}
          onBulkRestore={bulkRestoreCompanies}
          onBulkArchive={bulkArchiveCompanies}
        />
      )}

      {/* Vista de Configuración */}
      {showSettingsView && (
        <CompanySettingsPanel
          company={selectedCompany}
          onSave={async (settings) => {
            console.log('Configuración guardada:', settings);
            // Aquí implementarías la lógica para guardar la configuración
          }}
          onReset={() => {
            console.log('Configuración restablecida');
            // Aquí implementarías la lógica para restablecer la configuración
          }}
        />
      )}

      {/* Modales */}
      <CompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        company={null}
        mode="create"
        onSuccess={(company) => {
          setIsCreateModalOpen(false);
          console.log('Empresa creada:', company);
        }}
      />

      <CompanyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        company={selectedCompany}
        mode="edit"
        onSuccess={(company) => {
          setIsEditModalOpen(false);
          console.log('Empresa actualizada:', company);
        }}
      />
    </div>
  );
}

// Componente para mostrar la lista de empresas
interface CompaniesListProps {
  companies: CompanyEnhanced[];
  onEdit: (company: CompanyEnhanced) => void;
  onDelete: (company: CompanyEnhanced) => void;
  onRestore: (company: CompanyEnhanced) => void;
  showDeleted: boolean;
}

function CompaniesList({ companies, onEdit, onDelete, onRestore, showDeleted }: CompaniesListProps) {
  const { getStatusIcon, getStatusColor, formatDate } = {
    getStatusIcon: (status: CompanyStatus) => {
      switch (status) {
        case 'active':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'inactive':
          return <Clock className="h-4 w-4 text-yellow-600" />;
        case 'archived':
          return <Archive className="h-4 w-4 text-gray-600" />;
        default:
          return <AlertTriangle className="h-4 w-4 text-red-600" />;
      }
    },
    getStatusColor: (status: CompanyStatus) => {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'inactive':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'archived':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        default:
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      }
    },
    formatDate: (date: Date | any) => {
      if (!date) return 'Sin fecha';
      try {
        const dateObj = firestoreDateToDate(date);
        return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
      } catch {
        return 'Fecha inválida';
      }
    }
  };

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No hay empresas
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showDeleted 
              ? 'No hay empresas eliminadas'
              : 'No se encontraron empresas con los filtros aplicados'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <Card key={company.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: company.color }}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {company.name}
                  </h3>
                  {company.industry && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {industryOptions.find(i => i.value === company.industry)?.label}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Badge className={`text-xs ${getStatusColor(company.status)}`}>
                  {getStatusIcon(company.status)}
                  <span className="ml-1">
                    {company.status === 'active' ? 'Activa' : 
                     company.status === 'inactive' ? 'Inactiva' : 'Archivada'}
                  </span>
                </Badge>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Acciones de {company.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => onEdit(company)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      
                      {showDeleted ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-green-600 hover:text-green-700"
                          onClick={() => onRestore(company)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restaurar
                        </Button>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>¿Eliminar empresa?</DialogTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ¿Estás seguro de que quieres eliminar "{company.name}"? 
                                Esta acción no se puede deshacer.
                              </p>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2 mt-4">
                              <Button variant="outline">Cancelar</Button>
                              <Button
                                onClick={() => onDelete(company)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {company.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {company.description}
              </p>
            )}

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {company.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="truncate">{company.website}</span>
                </div>
              )}
              
              {company.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{company.email}</span>
                </div>
              )}
              
              {company.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{company.phone}</span>
                </div>
              )}
              
              {company.address?.city && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">
                    {company.address.city}
                    {company.address.country && `, ${company.address.country}`}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Creada: {formatDate(company.createdAt)}</span>
                <span>Actualizada: {formatDate(company.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}