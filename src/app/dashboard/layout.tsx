"use client";

import { Sidebar } from '@/components/common/Sidebar';
import { SidebarProvider, useSidebar } from '@/lib/context/SidebarContext';
import { ModalProvider } from '@/lib/context/ModalContext';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

// Mobile Header Component
function MobileHeader() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  
  return (
    <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm sm:text-base">🐙</span>
        </div>
        <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">Octopus</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="h-9 w-9 p-0 touch-manipulation"
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Necesitas iniciar sesión</h2>
          <p className="text-sm text-gray-600">
            Tu sesión no está activa. Ingresa para ver tu dashboard.
          </p>
          <Link href="/login">
            <Button>Ir a login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <ModalProvider>
        <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:ml-0">
            {/* Mobile Header */}
            <MobileHeader />
            
            {/* Main Content Area */}
            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
              <div className="h-full mx-auto w-full max-w-6xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ModalProvider>
    </SidebarProvider>
  );
}
