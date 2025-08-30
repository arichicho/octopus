'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MyDayView } from '@/components/dashboard/MyDayView';
import { ExecutiveSummaryView } from '@/components/dashboard/ExecutiveSummaryView';
import { WorkflowView } from '@/components/dashboard/WorkflowView';
import { CompanyTasksBoard } from '@/components/dashboard/CompanyTasksBoard';
import { TaskHistoryView } from '@/components/dashboard/TaskHistoryView';
import { CompanyTasksView } from '@/components/dashboard/CompanyTasksView';
import { CompaniesConfigView } from '@/components/dashboard/CompaniesConfigView';

export default function DashboardPage() {
  const { user } = useAuth();
  const { companies, loading: companiesLoading, fetchCompanies } = useCompanyEnhancedStore();
  const { tasks, loading: tasksLoading, loadTasks } = useTaskStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  // Load companies and tasks on mount
  useEffect(() => {
    if (user) {
      console.log('🔄 Loading data for user:', user.email, user.uid);
      fetchCompanies(user.uid); // Pass userId to load only user's companies
      loadTasks(user.uid); // Load tasks for the authenticated user
      
      // Debug: check all tasks in database
      import('@/lib/firebase/firestore').then(({ getAllTasksDebug }) => {
        getAllTasksDebug();
      });
    }
  }, [fetchCompanies, loadTasks, user]);

  // Handle hydration and hash navigation
  useEffect(() => {
    setMounted(true);
    
    // Check for hash in URL to set active tab
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'history') {
        setActiveTab('history');
      } else if (hash.startsWith('company=')) {
        setActiveTab('company');
      } else if (hash === 'companies-config') {
        setActiveTab('companies-config');
      }
    }
  }, []);

  // Check if we should show company view or companies config view
  const shouldShowCompanyView = mounted && activeTab === 'company';
  const shouldShowCompaniesConfigView = mounted && activeTab === 'companies-config';

  return (
    <div className="space-y-6">
      {!shouldShowCompanyView && !shouldShowCompaniesConfigView && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bienvenido de vuelta, {user?.displayName || 'Usuario'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {companies.length} empresas
            </Badge>
            <Badge variant="outline">
              {tasks.length} tareas totales
            </Badge>
          </div>
        </div>
      )}

      {mounted && !shouldShowCompanyView && !shouldShowCompaniesConfigView && (
        <Tabs key="dashboard-tabs" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="board">Tablero</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="myday">Mi Día</TabsTrigger>
            <TabsTrigger value="workflow">Flujo</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="board" className="mt-6">
            <CompanyTasksBoard />
          </TabsContent>
          
          <TabsContent value="summary" className="mt-6">
            <ExecutiveSummaryView />
          </TabsContent>
          
          <TabsContent value="myday" className="mt-6">
            <MyDayView />
          </TabsContent>
          
          <TabsContent value="workflow" className="mt-6">
            <WorkflowView />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <TaskHistoryView />
          </TabsContent>
        </Tabs>
      )}

      {shouldShowCompanyView && (
        <CompanyTasksView />
      )}

      {shouldShowCompaniesConfigView && (
        <CompaniesConfigView />
      )}
    </div>
  );
}
