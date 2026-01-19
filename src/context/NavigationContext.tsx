'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

export type NavigationSection = 'all' | 'atenciones' | 'users' | 'messages' | 'tickets' | 'analytics';

interface NavigationContextType {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  sectionTitle: string;
  sectionDescription: string;
}

const sectionInfo: Record<NavigationSection, { title: string; description: string }> = {
  all: {
    title: 'Dashboard de Estadísticas',
    description: 'Métricas de atenciones, usuarios, mensajes y tickets de tu plataforma NumiAgent.',
  },
  atenciones: {
    title: 'Atenciones',
    description: 'Métricas de atenciones: totales, resueltas en N0 y escaladas a N1.',
  },
  users: {
    title: 'Usuarios',
    description: 'Métricas de usuarios registrados y nuevos usuarios de tu plataforma.',
  },
  messages: {
    title: 'Mensajes y Conversaciones',
    description: 'Estadísticas de mensajes enviados y conversaciones activas.',
  },
  tickets: {
    title: 'Tickets y Encuestas',
    description: 'Métricas de tickets de soporte y encuestas de satisfacción.',
  },
  analytics: {
    title: 'Analytics',
    description: 'Visualizaciones y tendencias de tu plataforma.',
  },
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activeSection, setActiveSectionState] = useState<NavigationSection>('all');

  const setActiveSection = useCallback((section: NavigationSection) => {
    setActiveSectionState(section);
  }, []);

  const contextValue = useMemo(
    () => ({
      activeSection,
      setActiveSection,
      sectionTitle: sectionInfo[activeSection].title,
      sectionDescription: sectionInfo[activeSection].description,
    }),
    [activeSection, setActiveSection]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export default NavigationContext;
