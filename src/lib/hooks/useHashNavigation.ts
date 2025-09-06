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
    // Only run on client side
    if (typeof window === 'undefined') {
      setState({ companyId: null, view: null, isLoading: false });
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      let companyId: string | null = null;
      let view: string | null = null;

      if (hash.startsWith('company=')) {
        companyId = hash.split('=')[1];
      } else if (hash === 'history') {
        view = 'history';
      } else if (hash === 'companies-config') {
        view = 'companies-config';
      }

      setState(prevState => {
        // Only update if state actually changed
        if (prevState.companyId === companyId && prevState.view === view && !prevState.isLoading) {
          return prevState;
        }
        return {
          companyId,
          view,
          isLoading: false
        };
      });
    };

    // Check initial hash immediately
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateToCompany = (companyId: string) => {
    if (typeof window === 'undefined') return;
    console.log('🔗 useHashNavigation - Navigating to company:', companyId);
    console.log('🔗 useHashNavigation - Current hash before:', window.location.hash);
    window.location.hash = `company=${companyId}`;
    console.log('🔗 useHashNavigation - New hash after:', window.location.hash);
  };

  const navigateToView = (view: string) => {
    if (typeof window === 'undefined') return;
    console.log('🔗 useHashNavigation - Navigating to view:', view);
    window.location.hash = view;
  };

  const clearHash = () => {
    if (typeof window === 'undefined') return;
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
