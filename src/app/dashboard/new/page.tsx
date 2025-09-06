"use client";

import { useEffect, useMemo, useState } from "react";
import GoogleHeader from "@/components/dashboard/GoogleHeader";
import GoogleSidebar from "@/components/dashboard/GoogleSidebar";
import TaskListCard from "@/components/dashboard/TaskListCard";
import SchedulePreview from "@/components/dashboard/SchedulePreview";
import { CompanyTasksView } from "@/components/dashboard/CompanyTasksView";
import { useHashNavigation } from "@/lib/hooks/useHashNavigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useCompanyEnhancedStore } from "@/lib/store/useCompanyEnhancedStore";
import { getCompany } from "@/lib/firebase/companies";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

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
    return tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  }, [tasks]);

  // Today / Upcoming buckets
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const { overdue, todayTasks, upcoming } = useMemo(() => {
    const o: typeof activeTasks = [];
    const t: typeof activeTasks = [];
    const u: typeof activeTasks = [];
    activeTasks.forEach((task) => {
      const raw = (task as any).dueDate;
      const due = raw?.toDate ? raw.toDate() : raw;
      if (due instanceof Date) {
        if (due < startOfToday) o.push(task);
        else if (due >= startOfToday && due <= endOfToday) t.push(task);
        else u.push(task);
      } else {
        // no due date -> send to upcoming by default
        u.push(task);
      }
    });
    return { overdue: o, todayTasks: t, upcoming: u };
  }, [activeTasks, startOfToday, endOfToday]);

  // Ensure companies referenced by tasks exist (by id)
  useEffect(() => {
    const ensureCompanies = async () => {
      const ids = Array.from(new Set(activeTasks.map((t: any) => t.companyId).filter(Boolean)));
      const existing = new Set((companies as any[]).map((c: any) => c.id));
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
  }, [activeTasks, companies, setSelectedCompany]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <GoogleHeader onQuickAdd={() => setQuickAddOpen(true)} />
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex">
          <GoogleSidebar />
          <main className="flex-1 py-6 lg:pl-6">
            {/* Summary strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs text-gray-500">Tareas activas</div>
                <div className="text-3xl font-semibold mt-1">{activeTasks.length}</div>
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs text-gray-500">Empresas</div>
                <div className="text-3xl font-semibold mt-1">{companies.length}</div>
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs text-gray-500">Usuario</div>
                <div className="text-sm mt-1 truncate">{user?.email}</div>
              </div>
            </div>

            {/* Company rail */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Empresas
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {companies.length} empresa{companies.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {companies.map((c: any) => {
                  const count = activeTasks.filter((t: any) => t.companyId === c.id).length;
                  const active = companyId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCompany?.(c);
                        navigateToCompany(c.id);
                      }}
                      className={`shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded-full border text-sm transition-all duration-200 ${
                        active
                          ? 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#3b82f6' }} />
                      <span className="truncate max-w-[160px] font-medium">{c.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        active 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core layout: list + schedule preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <TaskListCard 
                  title="Atrasadas" 
                  tasks={overdue} 
                  onTaskClick={(task) => {
                    // Navigate to company view with task selected
                    const taskCompany = companies.find(c => c.id === task.companyId);
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
                />
                <TaskListCard 
                  title="Para hoy" 
                  tasks={todayTasks}
                  onTaskClick={(task) => {
                    const taskCompany = companies.find(c => c.id === task.companyId);
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
                />
                <TaskListCard 
                  title="Próximas" 
                  tasks={upcoming}
                  onTaskClick={(task) => {
                    const taskCompany = companies.find(c => c.id === task.companyId);
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
                />
              </div>
              <div className="space-y-4">
                <SchedulePreview tasks={activeTasks} />
              </div>
            </div>

            {/* Full company views (Kanban / Vencimientos / Lista / etc.) */}
            {selectedCompany && (
              <div className="mt-8">
                <CompanyTasksView />
              </div>
            )}

            {/* Quick Add Modal */}
            <CreateTaskModal
              isOpen={quickAddOpen}
              onClose={() => setQuickAddOpen(false)}
              initialCompanyId={selectedCompany?.id || companies[0]?.id}
              onTaskCreated={() => {
                if (user?.uid) loadTasks(user.uid);
                setQuickAddOpen(false);
              }}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
