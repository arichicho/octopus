"use client";

import { useEffect, useMemo, useState } from "react";
import GoogleHeader from "@/components/dashboard/GoogleHeader";
import { CompanyTasksView } from "@/components/dashboard/CompanyTasksView";
import { SimpleGeneralView } from "@/components/dashboard/SimpleGeneralView";
import { useHashNavigation } from "@/lib/hooks/useHashNavigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useCompanyEnhancedStore } from "@/lib/store/useCompanyEnhancedStore";
import { getCompany } from "@/lib/firebase/companies";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { Button } from "@/components/ui/button";

export default function GoogleStyleDashboardPage() {
  const { user } = useAuth();
  const { tasks, loadTasks, updateTask } = useTaskStore();
  const { companies, fetchCompanies, setSelectedCompany, selectedCompany } = useCompanyEnhancedStore();
  const { companyId, navigateToCompany } = useHashNavigation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    // load core data
    loadTasks(user.uid);
    fetchCompanies(user.uid);
  }, [user?.uid, loadTasks, fetchCompanies]);

  // Active tasks
  const activeTasks = useMemo(() => {
    const filtered = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    console.log('🔍 Debug activeTasks:', {
      totalTasks: tasks.length,
      activeTasks: filtered.length,
      tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, companyId: t.companyId }))
    });
    return filtered;
  }, [tasks]);

  // Filter companies to only show user's companies
  const userCompanies = useMemo(() => {
    if (!user?.uid) return [];
    
    // First, try to get companies by UID
    let filtered = companies.filter((c: any) => c.createdBy === user.uid);
    
    // If no companies found by UID, try by email
    if (filtered.length === 0) {
      filtered = companies.filter((c: any) => c.createdBy === user.email);
    }
    
    // If still no companies, try current-user (but exclude specific users)
    if (filtered.length === 0) {
      filtered = companies.filter((c: any) => {
        if (c.createdBy !== 'current-user') return false;
        
        // Exclude companies that belong to other users
        if (user.email === 'arichicho1@gmail.com') {
          // arichicho1 should only see companies that don't belong to ariel.chicho
          return c.name !== 'prueba AC' && !c.name.includes('Obel') && !c.name.includes('Dale Play');
        } else if (user.email === 'ariel.chicho@daleplayrecords.com') {
          // ariel.chicho should see current-user companies but not arichicho1's
          return c.name !== 'prueba AC';
        }
        
        return true;
      });
    }
    
    // Final fallback: if still no companies, get companies that have tasks for this user
    if (filtered.length === 0 && activeTasks.length > 0) {
      const companyIdsWithTasks = Array.from(new Set(activeTasks.map((t: any) => t.companyId).filter(Boolean)));
      filtered = companies.filter((c: any) => companyIdsWithTasks.includes(c.id));
    }
    
    console.log('🔍 Debug userCompanies:', {
      userUid: user.uid,
      userEmail: user.email,
      totalCompanies: companies.length,
      filteredCompanies: filtered.length,
      activeTasksCount: activeTasks.length,
      filterMethod: filtered.length > 0 ? 'found' : 'none',
      companies: companies.map(c => ({ id: c.id, name: c.name, createdBy: c.createdBy }))
    });
    
    return filtered;
  }, [companies, user]);

  // Ensure companies referenced by tasks exist (by id)
  useEffect(() => {
    const ensureCompanies = async () => {
      const ids = Array.from(new Set(activeTasks.map((t: any) => t.companyId).filter(Boolean)));
      const existing = new Set((userCompanies as any[]).map((c: any) => c.id));
      const missing = ids.filter((id) => !existing.has(id));
      if (missing.length === 0) return;
      const fetched = await Promise.all(missing.map((id) => getCompany(id)));
      const valid = (fetched.filter(Boolean) as any[]);
      if (valid.length > 0) {
        // Select first if none selected
        setSelectedCompany?.(valid[0] as any);
      }
    };
    if (activeTasks.length > 0) ensureCompanies();
  }, [activeTasks, userCompanies, setSelectedCompany]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <GoogleHeader onQuickAdd={() => setQuickAddOpen(true)} />
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <main className="py-4 sm:py-6">
            {/* Summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500">Tareas activas</div>
                <div className="text-2xl sm:text-3xl font-semibold mt-1">{activeTasks.length}</div>
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500">Empresas</div>
                <div className="text-2xl sm:text-3xl font-semibold mt-1">{userCompanies.length}</div>
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                <div className="text-xs sm:text-sm text-gray-500">Usuario</div>
                <div className="text-sm mt-1 truncate">{user?.email}</div>
              </div>
            </div>

            {/* General Overview - Default View */}
            <SimpleGeneralView
              companies={userCompanies}
              tasks={activeTasks}
              onTaskClick={(task) => {
                // Navigate to company view with task selected
                const taskCompany = userCompanies.find(c => c.id === task.companyId);
                if (taskCompany) {
                  setSelectedCompany?.(taskCompany);
                  navigateToCompany(taskCompany.id);
                }
              }}
              onCompleteTask={async (e, task) => {
                e.stopPropagation();
                try {
                  await updateTask(task.id!, {
                    status: 'completed',
                    completedAt: new Date(),
                    updatedAt: new Date(),
                  });
                  if (user?.uid) loadTasks(user.uid);
                } catch (error) {
                  console.error('Error completing task:', error);
                }
              }}
              onCompanyClick={(company) => {
                setSelectedCompany?.(company);
                navigateToCompany(company.id);
              }}
            />

            {/* Company Detail View - Only show when company is selected */}
            {selectedCompany && (
              <div className="mt-8">
                <CompanyTasksView />
              </div>
            )}

            {/* Quick Add Modal */}
            <CreateTaskModal
              isOpen={quickAddOpen}
              onClose={() => setQuickAddOpen(false)}
              initialCompanyId={selectedCompany?.id || userCompanies[0]?.id}
              onTaskCreated={() => {
                if (user?.uid) loadTasks(user.uid);
                setQuickAddOpen(false);
              }}
            />
        </main>
      </div>
    </div>
  );
}