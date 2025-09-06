"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';

function DashboardClient() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, loadTasks } = useTaskStore();
  const { companies, loading: companiesLoading, fetchCompanies } = useCompanyEnhancedStore();
  const [mounted, setMounted] = useState(false);

  // Mount
  useEffect(() => setMounted(true), []);

  // Load data (single source: stores)
  useEffect(() => {
    if (!user?.uid) return;
    fetchCompanies(user.uid);
    loadTasks(user.uid);
  }, [user?.uid, fetchCompanies, loadTasks]);

  // Derive: active tasks and grouping (deterministic, no setState imperativo)
  const activeTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [] as typeof tasks;
    return tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  }, [tasks]);

  const tasksByCompany = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const t of activeTasks) {
      const key = (t as any).companyId || 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    }
    return grouped;
  }, [activeTasks]);

  if (!mounted) return <div className="p-6">Cargando...</div>;

  const totalActive = activeTasks.length;
  const totalCompanies = companies.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bienvenido de vuelta, {user?.displayName || 'Usuario'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Tareas Activas</div>
          <div className="text-3xl font-semibold mt-2">{totalActive}</div>
        </div>
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Empresas</div>
          <div className="text-3xl font-semibold mt-2">{totalCompanies}</div>
        </div>
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Estado</div>
          <div className="mt-2 text-sm">
            {tasksLoading || companiesLoading ? 'Cargando datos…' : 'Actualizado'}
          </div>
        </div>
      </div>

      {/* Companies + tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {companies.map((c) => {
          const list = tasksByCompany[c.id] || [];
          return (
            <div key={c.id} className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-gray-500">{list.length} tareas</div>
              </div>
              {list.length === 0 ? (
                <div className="text-sm text-gray-500">Sin tareas activas</div>
              ) : (
                <ul className="space-y-2">
                  {list.slice(0, 5).map((t) => (
                    <li key={t.id} className="text-sm flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                  {list.length > 5 && (
                    <div className="text-xs text-gray-500 mt-2">+{list.length - 5} más…</div>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardClient;
