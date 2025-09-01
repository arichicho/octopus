import { useState, useEffect } from 'react';

interface HashNavigationState {
  companyId: string | null;
  view: string | null;
  isLoading: boolean;
}

export const useHashNavigation = () => {
  const [state, setState] = useState<HashNavigationState>({
    companyId: null,
    view: null,
    isLoading: true
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash.replace('#', '');
      console.log('🔍 useHashNavigation - Hash changed:', hash);
      console.log('🔍 useHashNavigation - Current URL:', window.location.href);

      let companyId: string | null = null;
      let view: string | null = null;

      if (hash.startsWith('company=')) {
        companyId = hash.split('=')[1];
        console.log('🏢 useHashNavigation - Company ID:', companyId);
      } else if (hash === 'history') {
        view = 'history';
      } else if (hash === 'companies-config') {
        view = 'companies-config';
      }

      console.log('🔍 useHashNavigation - Setting state:', { companyId, view, isLoading: false });
      setState({
        companyId,
        view,
        isLoading: false
      });
    };

    // Check initial hash immediately
    console.log('🔍 useHashNavigation - Initial setup');
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Also listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateToCompany = (companyId: string) => {
    console.log('🔗 useHashNavigation - Navigating to company:', companyId);
    console.log('🔗 useHashNavigation - Current hash before:', window.location.hash);
    window.location.hash = `company=${companyId}`;
    console.log('🔗 useHashNavigation - New hash after:', window.location.hash);
  };

  const navigateToView = (view: string) => {
    console.log('🔗 useHashNavigation - Navigating to view:', view);
    window.location.hash = view;
  };

  const clearHash = () => {
    console.log('🔗 useHashNavigation - Clearing hash');
    console.log('🔗 useHashNavigation - Current hash before:', window.location.hash);
    window.location.hash = '';
    console.log('🔗 useHashNavigation - New hash after:', window.location.hash);
  };

  console.log('🔍 useHashNavigation - Current state:', state);

  return {
    ...state,
    navigateToCompany,
    navigateToView,
    clearHash
  };
};
