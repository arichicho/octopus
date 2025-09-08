"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/lib/hooks/useAuth";
import { Bell, Settings, LogOut } from "lucide-react";

interface GoogleHeaderProps {
  onQuickAdd?: () => void;
}

export default function GoogleHeader({ onQuickAdd }: GoogleHeaderProps) {
  const today = useMemo(() => new Date(), []);
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60 border-b border-gray-200/60 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        {/* App mark */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">🐙</div>

        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              placeholder="Buscar tareas, empresas…"
              className="w-full h-9 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-800 px-8 sm:px-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
            <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔎</span>
          </div>
        </div>

        {/* Date pill - hidden on very small screens */}
        <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
          {format(today, "EEE d MMM", { locale: es })}
        </div>

        {/* Quick actions - responsive button */}
        <button
          onClick={onQuickAdd}
          className="hidden sm:inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
        >
          <span className="hidden sm:inline">＋ Nueva tarea</span>
          <span className="sm:hidden">＋</span>
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation">
          <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-manipulation"
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || user.email || 'Usuario'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.displayName || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <button className="w-full px-3 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 touch-manipulation">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span>Configuración</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full px-3 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 touch-manipulation"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

