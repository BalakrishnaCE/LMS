import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useFrappeGetCall } from 'frappe-react-sdk';

interface AdminModulesFilters {
  user?: string;
  module?: string;
  department?: string;
}

interface AdminModulesContextType {
  data: any;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
  refetch: (filters?: AdminModulesFilters) => void;
}

const AdminModulesContext = createContext<AdminModulesContextType | undefined>(undefined);

export const useAdminModulesContext = () => {
  const context = useContext(AdminModulesContext);
  if (context === undefined) {
    throw new Error('useAdminModulesContext must be used within an AdminModulesProvider');
  }
  return context;
};

interface AdminModulesProviderProps {
  children: ReactNode;
}

export const AdminModulesProvider: React.FC<AdminModulesProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<AdminModulesFilters>({});
  
  const { data, error, isLoading, isValidating, mutate } = useFrappeGetCall(
    "novel_lms.novel_lms.api.module_management.get_admin_modules",
    filters
  );

  const refetch = useCallback((newFilters?: AdminModulesFilters) => {
    if (newFilters) {
      setFilters(newFilters);
    } else {
      mutate();
    }
  }, [mutate]);

  const value: AdminModulesContextType = {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refetch
  };

  return (
    <AdminModulesContext.Provider value={value}>
      {children}
    </AdminModulesContext.Provider>
  );
};

