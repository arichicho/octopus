'use client';

import { Sidebar } from '@/components/common/Sidebar';
import { SidebarProvider, useSidebar } from '@/lib/context/SidebarContext';
import { ModalProvider, useModal } from '@/lib/context/ModalContext';
import { DragDropProvider } from '@/lib/context/DragDropContext';
import { CompanyModal } from '@/components/companies/CompanyModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const { isCompanyModalOpen, closeCompanyModal } = useModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getSidebarTransform = () => {
    if (mobileMenuOpen) return 'translateX(0)';
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return 'translateX(0)';
    return 'translateX(-100%)';
  };

  const getMainContentMargin = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return collapsed ? '4rem' : '16rem';
    }
    return '0';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className="fixed left-0 top-0 z-50 h-screen transition-transform duration-300 ease-in-out"
        style={{
          transform: getSidebarTransform()
        }}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div 
        className="min-h-screen flex flex-col transition-all duration-300 ease-in-out"
        style={{
          marginLeft: getMainContentMargin()
        }}
      >
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 lg:hidden">
              <Button variant="outline" size="sm">
                <span className="sr-only">Notificaciones</span>
                <span className="h-4 w-4">🔔</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={closeCompanyModal}
        mode="create"
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider>
        <ModalProvider>
          <DragDropProvider>
            <DashboardContent>{children}</DashboardContent>
          </DragDropProvider>
        </ModalProvider>
      </SidebarProvider>
    </AuthGuard>
  );
}
