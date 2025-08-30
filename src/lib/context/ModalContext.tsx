'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isCompanyModalOpen: boolean;
  openCompanyModal: () => void;
  closeCompanyModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const openCompanyModal = () => setIsCompanyModalOpen(true);
  const closeCompanyModal = () => setIsCompanyModalOpen(false);

  return (
    <ModalContext.Provider value={{
      isCompanyModalOpen,
      openCompanyModal,
      closeCompanyModal,
    }}>
      {children}
    </ModalContext.Provider>
  );
};