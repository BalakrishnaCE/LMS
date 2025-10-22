import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";

interface PermissionData {
  user: string;
  userType: 'admin' | 'student' | 'content_editor' | 'tl';
  timestamp: number;
}

interface PermissionContextType {
  isLoading: boolean;
  error: unknown;
  isLMSAdmin: boolean;
  isLMSContentEditor: boolean;
  isLMSStudent: boolean;
  isLMSTL: boolean;
  userType: 'admin' | 'student' | 'content_editor' | 'tl' | null;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

// Global cache for permissions to persist across component unmounts
const globalPermissionCache = new Map<string, PermissionData>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [userType, setUserType] = useState<'admin' | 'student' | 'content_editor' | 'tl' | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Check if we have valid cached data
  const getCachedPermissions = (user: string): PermissionData | null => {
    const cached = globalPermissionCache.get(user);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached;
    }
    // Remove expired cache
    if (cached) {
      globalPermissionCache.delete(user);
    }
    return null;
  };

  // Only make API call if we don't have valid cached data
  const shouldFetchPermissions = !!currentUser && !getCachedPermissions(currentUser);

  const { data, error: docError, isValidating } = useFrappeGetCall(
    "novel_lms.novel_lms.api.user_permissions.get_user_lms_permissions",
    {
      user: currentUser
    },
    {
      enabled: shouldFetchPermissions,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute deduplication
    }
  );

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!currentUser) {
      setUserType(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedPermissions(currentUser);
    if (cached) {
      console.log('🔍 Using cached permissions for user:', currentUser);
      setUserType(cached.userType);
      setIsLoading(false);
      return;
    }

    // If we're not fetching and don't have cache, we're in a loading state
    if (!shouldFetchPermissions && !isValidating) {
      setIsLoading(true);
      return;
    }

    if (isValidating) {
      setIsLoading(true);
    }

    if (data) {
      const permissionsData = data as any;
      const userData = permissionsData.message || permissionsData;
      
      if (userData.user_type) {
        const permissionData: PermissionData = {
          user: currentUser,
          userType: userData.user_type,
          timestamp: Date.now()
        };
        
        // Cache the permissions globally
        globalPermissionCache.set(currentUser, permissionData);
        setUserType(userData.user_type);
        setIsLoading(false);
        console.log('🔍 Cached permissions for user:', currentUser, 'type:', userData.user_type);
      }
    }

    if (docError) {
      setError(docError);
      setIsLoading(false);
    }
  }, [currentUser, data, isValidating, docError, isAuthLoading, shouldFetchPermissions, forceRefresh]);

  const refreshPermissions = () => {
    if (currentUser) {
      globalPermissionCache.delete(currentUser);
      setForceRefresh(prev => prev + 1);
    }
  };

  const isLMSAdmin = userType === 'admin';
  const isLMSContentEditor = userType === 'content_editor';
  const isLMSStudent = userType === 'student';
  const isLMSTL = userType === 'tl';

  const contextValue: PermissionContextType = {
    isLoading: isLoading || isAuthLoading,
    error,
    isLMSAdmin,
    isLMSContentEditor,
    isLMSStudent,
    isLMSTL,
    userType,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// Backward compatibility hook
export function useLMSUserPermissions(): PermissionContextType {
  return usePermissions();
}
