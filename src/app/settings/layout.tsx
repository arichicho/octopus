'use client';

import { Sidebar } from '@/components/common/Sidebar';
import { SidebarProvider } from '@/lib/context/SidebarContext';
import { ModalProvider, useModal } from '@/lib/context/ModalContext';
import { CompanyModal } from '@/components/companies/CompanyModal';
import { useState, useLayoutEffect } from 'react';

function SettingsContent({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { isCompanyModalOpen, closeCompanyModal } = useModal();

  useLayoutEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setIsClient(true);
    };

    // Set initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSidebarTransform = () => {
    if (!isClient) return 'translateX(-100%)';
    if (mobileMenuOpen) return 'translateX(0)';
    return isDesktop ? 'translateX(0)' : 'translateX(-100%)';
  };

  const getMainContentMargin = () => {
    if (!isClient) return '0px';
    return isDesktop ? '256px' : '0px';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
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
        suppressHydrationWarning
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: getMainContentMargin() }}
        suppressHydrationWarning
      >
        {/* Mobile header */}
        <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 w-full max-w-none overflow-x-hidden min-w-0">
          <div className="w-full max-w-none">
            {children}
          </div>
        </div>
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

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ModalProvider>
        <SettingsContent>{children}</SettingsContent>
      </ModalProvider>
    </SidebarProvider>
  );
}
