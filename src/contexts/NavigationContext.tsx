import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Screen } from '../types/navigation';

interface NavigationContextValue {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
  initialScreen?: Screen;
}

export function NavigationProvider({ children, initialScreen = 'browse' }: NavigationProviderProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);

  const navigateTo = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentScreen, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
