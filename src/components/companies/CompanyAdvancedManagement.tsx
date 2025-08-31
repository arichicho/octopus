'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { CompanyEnhanced, CompanyStatus, industryOptions } from '@/types/company-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  Settings, 
  Users, 
  Archive, 
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  Database,
  RefreshCw,
  Copy,
  Share2
} from 'lucide-react';

interface CompanyAdvancedManagementProps {
  companies: CompanyEnhanced[];
  onBulkUpdate: (companyIds: string[], updates: Partial<CompanyEnhanced>) => Promise<void>;
  onBulkDelete: (companyIds: string[]) => Promise<void>;
  onBulkRestore: (companyIds: string[]) => Promise<void>;
  onBulkArchive: (companyIds: string[]) => Promise<void>;
}

export function CompanyAdvancedManagement({
  companies,
  onBulkUpdate,
  onBulkDelete,
  onBulkRestore,
  onBulkArchive
}: CompanyAdvancedManagementProps) {
  const { user } = useAuth();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);

  const activeCompanies = companies.filter(c => c.status === 'active' && !c.isDeleted);
  const inactiveCompanies = companies.filter(c => c.status === 'inactive' && !c.isDeleted);
  const archivedCompanies = companies.filter(c => c.status === 'archived' && !c.isDeleted);
  const deletedCompanies = companies.filter(c => c.isDeleted);

  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
    }
  };

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleBulkAction = async () => {
    if (selectedCompanies.length === 0 || !bulkAction) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const totalSteps = selectedCompanies.length;
      let currentStep = 0;

      switch (bulkAction) {
        case 'activate':
          for (const companyId of selectedCompanies) {
            await onBulkUpdate([companyId], { status: 'active' });
            currentStep++;
            setProgress((currentStep / totalSteps) * 100);
          }
          break;

        case 'deactivate':
          for (const companyId of selectedCompanies) {
            await onBulkUpdate([companyId], { status: 'inactive' });
            currentStep++;
            setProgress((currentStep / totalSteps) * 100);
          }
          break;

        case 'archive':
          await onBulkArchive(selectedCompanies);
          setProgress(100);
          break;

        case 'delete':
          await onBulkDelete(selectedCompanies);
          setProgress(100);
          break;

        case 'restore':
          await onBulkRestore(selectedCompanies);
          setProgress(100);
          break;
      }

      setSelectedCompanies([]);
      setBulkAction('');
    } catch (error) {
      console.error('Error in bulk action:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const exportCompanies = () => {
    const dataToExport = companies.map(company => ({
      id: company.id,
      name: company.name,
      description: company.description,
      status: company.status,
      industry: company.industry,
      website: company.website,
      email: company.email,
      phone: company.phone,
      address: company.address,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empresas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importCompanies = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Datos importados:', data);
        // Aquí implementarías la lógica de importación
        // Por ahora solo mostramos los datos en consola
      } catch (error) {
        console.error('Error parsing import file:', error);
      }
    };
    reader.readAsText(file);
  };

  const getStatusStats = () => {
    return {
      active: activeCompanies.length,
      inactive: inactiveCompanies.length,
      archived: archivedCompanies.length,
      deleted: deletedCompanies.length,
      total: companies.length
    };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Estadísticas Avanzadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactivas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.inactive}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Archivadas</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.archived}
                </p>
              </div>
              <Archive className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Avanzadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Gestión Avanzada</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selección Masiva */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedCompanies.length === companies.length && companies.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCompanies.length} de {companies.length} empresas seleccionadas
              </span>
            </div>

            {selectedCompanies.length > 0 && (
              <div className="flex items-center space-x-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Acción masiva" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Activar</SelectItem>
                    <SelectItem value="deactivate">Desactivar</SelectItem>
                    <SelectItem value="archive">Archivar</SelectItem>
                    <SelectItem value="delete">Eliminar</SelectItem>
                    <SelectItem value="restore">Restaurar</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={!bulkAction || isProcessing}
                      variant="destructive"
                      size="sm"
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar acción masiva</DialogTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ¿Estás seguro de que quieres {bulkAction === 'activate' ? 'activar' :
                         bulkAction === 'deactivate' ? 'desactivar' :
                         bulkAction === 'archive' ? 'archivar' :
                         bulkAction === 'delete' ? 'eliminar' :
                         bulkAction === 'restore' ? 'restaurar' : 'aplicar'} 
                        {selectedCompanies.length} empresa{selectedCompanies.length > 1 ? 's' : ''}?
                      </p>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline">Cancelar</Button>
                      <Button onClick={handleBulkAction}>
                        Confirmar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Progreso de Acción Masiva */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Procesando...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Herramientas de Importación/Exportación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Exportar Datos
              </h4>
              <div className="flex space-x-2">
                <Button onClick={exportCompanies} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Importar Datos
              </h4>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={importCompanies}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Acciones Rápidas
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Datos
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Duplicar Seleccionadas
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas con Selección */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  selectedCompanies.includes(company.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCompanies.includes(company.id)}
                  onChange={() => handleSelectCompany(company.id)}
                  className="rounded border-gray-300"
                />
                
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: company.color }}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {company.name}
                  </h4>
                  {company.industry && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {industryOptions.find(i => i.value === company.industry)?.label}
                    </p>
                  )}
                </div>
                
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    company.status === 'active' ? 'bg-green-100 text-green-800' :
                    company.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {company.status === 'active' ? 'Activa' :
                   company.status === 'inactive' ? 'Inactiva' : 'Archivada'}
                </Badge>
                
                {company.isDeleted && (
                  <Badge variant="destructive" className="text-xs">
                    Eliminada
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
