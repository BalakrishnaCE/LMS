import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationHistoryItem {
  path: string;
  moduleName?: string;
  timestamp: number;
  context?: 'admin' | 'learner';
  searchState?: {
    query: string;
    department: string;
    status: string;
  };
}

interface NavigationContextType {
  navigationHistory: NavigationHistoryItem[];
  addToHistory: (path: string, moduleName?: string, searchState?: { query: string; department: string; status: string }) => void;
  getPreviousModulePath: (currentContext?: 'admin' | 'learner') => string | null;
  getPreviousSearchState: (currentContext?: 'admin' | 'learner') => { query: string; department: string; status: string } | null;
  clearHistory: () => void;
  lastModulePath: string | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);
  const [lastModulePath, setLastModulePath] = useState<string | null>(null);

  const addToHistory = useCallback((path: string, moduleName?: string, searchState?: { query: string; department: string; status: string }) => {
   
    setNavigationHistory(prev => {
      // Avoid adding duplicate consecutive entries
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && lastEntry.path === path && lastEntry.moduleName === moduleName) {
        
        return prev;
      }

      // Determine context based on path
      const context = path.includes('/modules/learner') ? 'learner' : 
                     (path.includes('/module/') || path.includes('/edit/') || path === '/modules') ? 'admin' : undefined;

      // Add new entry with timestamp
      const newEntry: NavigationHistoryItem = {
        path,
        moduleName,
        timestamp: Date.now(),
        context,
        searchState
      };

      // Keep only last 10 entries to prevent memory issues
      const updatedHistory = [...prev, newEntry].slice(-10);
      
      // Update last module path if this is a module page or modules list
      if (moduleName && (path.includes('/module/') || path.includes('/modules/learner/') || path.includes('/edit/'))) {
        // Store the full path for navigation
       
        setLastModulePath(path);
      }
      
      return updatedHistory;
    });
  }, []);

  const getPreviousModulePath = useCallback((currentContext?: 'admin' | 'learner'): string | null => {
    
    
    // If no context specified, return the last module path as before
    if (!currentContext) {
      return lastModulePath;
    }
    
    // Find the most recent module path that matches the current context
    const relevantPaths = navigationHistory
      .filter(item => item.context === currentContext && item.moduleName)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    
    
    // Get the second most recent path (skip the current one)
    const previousPath = relevantPaths[1]?.path;
    
    
    return previousPath || null;
  }, [lastModulePath, navigationHistory]);

  const getPreviousSearchState = useCallback((currentContext?: 'admin' | 'learner'): { query: string; department: string; status: string } | null => {
   
    
    // Find the most recent entry that matches the current context and has search state
    const relevantEntries = navigationHistory
      .filter(item => item.context === currentContext && item.searchState)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    
    
    // Get the most recent entry that has search state (not necessarily the second most recent)
    // This will be the modules list with search state
    const previousEntry = relevantEntries[0];
    
    
    return previousEntry?.searchState || null;
  }, [navigationHistory]);

  const clearHistory = useCallback(() => {
    setNavigationHistory([]);
    setLastModulePath(null);
  }, []);

  const value: NavigationContextType = {
    navigationHistory,
    addToHistory,
    getPreviousModulePath,
    getPreviousSearchState,
    clearHistory,
    lastModulePath
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
