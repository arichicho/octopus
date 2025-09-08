'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  Plus,
  Target,
  TrendingUp,
  FileText,
  Building2,
  Zap,
  Globe,
  Shield,
  CreditCard,
  Database,
  X,
  LogOut,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/context/SidebarContext';
import { useModal } from '@/lib/context/ModalContext';
import { useAuth } from '@/lib/hooks/useAuth';

export const Sidebar = () => {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { openCompanyModal } = useModal();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('🔍 Sidebar - Pathname actual:', pathname);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (href: string) => {
    if (!mounted) return;
    // Evitar navegación redundante que puede disparar efectos
    const current = pathname + (typeof window !== 'undefined' ? window.location.hash : '');
    if (current === href) return;
    console.log('🔗 Sidebar - Navegando a:', href);
    router.push(href);
    // Close mobile menu on navigation
    setMobileOpen(false);
  };

  const navigation = [
    {
      title: 'Dashboard',
      items: [
        {
          title: 'Vista General',
          href: '/dashboard',
          icon: Home,
          badge: null
        },
        {
          title: 'Mi Día',
          href: '/dashboard/my-day',
          icon: Target,
          badge: '5'
        },
        {
          title: 'Historial',
          href: '/dashboard/history',
          icon: History,
          badge: null
        },
        {
          title: 'Calendario',
          href: '/dashboard/calendar',
          icon: Calendar,
          badge: null
        }
      ]
    },
    {
      title: 'Análisis',
      items: [
        {
          title: 'Reportes',
          href: '/dashboard/reports',
          icon: BarChart3,
          badge: null
        },
        {
          title: 'Métricas',
          href: '/dashboard/metrics',
          icon: TrendingUp,
          badge: 'Nuevo'
        },
        {
          title: 'KPIs',
          href: '/dashboard/kpis',
          icon: Target,
          badge: null
        }
      ]
    },
    {
      title: 'Equipo',
      items: [
        {
          title: 'Miembros',
          href: '/dashboard/team',
          icon: Users,
          badge: null
        },
        {
          title: 'Proyectos',
          href: '/dashboard/projects',
          icon: Building2,
          badge: '8'
        },
        {
          title: 'Documentos',
          href: '/dashboard/documents',
          icon: FileText,
          badge: null
        }
      ]
    },
    {
      title: 'Configuración',
      items: [
        {
          title: 'General',
          href: '/dashboard/settings',
          icon: Settings,
          badge: null
        },
        {
          title: 'Empresas',
          href: '/dashboard/companies',
          icon: Building2,
          badge: null
        },
        {
          title: 'Perfil',
          href: '/dashboard/settings/profile',
          icon: Users,
          badge: null
        },
        {
          title: 'Notificaciones',
          href: '/dashboard/settings/notifications',
          icon: Bell,
          badge: '3'
        },
        {
          title: 'Seguridad',
          href: '/dashboard/settings/security',
          icon: Shield,
          badge: null
        },
        {
          title: 'Integraciones',
          href: '/dashboard/settings/integrations',
          icon: Zap,
          badge: null
        },
        {
          title: 'Facturación',
          href: '/dashboard/settings/billing',
          icon: CreditCard,
          badge: null
        },
        {
          title: 'API',
          href: '/dashboard/settings/api',
          icon: Database,
          badge: null
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (!mounted) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/dashboard/history') {
      return pathname === '/dashboard/history';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "h-full flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto",
          // Desktop behavior
          "lg:relative lg:translate-x-0",
          mounted ? (collapsed ? "lg:w-16" : "lg:w-64") : "lg:w-64",
          // Mobile behavior
          "fixed inset-y-0 left-0 z-50 w-64 transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐙</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Octopus</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 hidden lg:flex"
            aria-label={collapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 p-0 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Buscar en la aplicación"
            />
          </div>
        </div>
      )}

      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
        <nav className="space-y-6 py-4" role="navigation" aria-label="Navegación principal">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1" role="list">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <li key={item.href} role="listitem">
                      <button
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "w-full flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset hover:bg-gray-100 dark:hover:bg-gray-800",
                          active
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                        )} aria-hidden="true" />
                        {!collapsed && (
                          <>
                            <span className="ml-3 flex-1 truncate text-left">{item.title}</span>
                            {item.badge && (
                              <Badge 
                                variant={item.badge === 'Nuevo' ? 'default' : 'secondary'}
                                className="ml-auto text-xs flex-shrink-0"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={openCompanyModal} className="w-full mb-3">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
          </Button>
        </div>
      )}

      {/* User Profile */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage 
              src={user?.photoURL || "/placeholder-avatar.jpg"} 
              alt={`Foto de perfil de ${user?.displayName || 'Usuario'}`} 
            />
            <AvatarFallback>
              {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.displayName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      </div>
    </>
  );
};
