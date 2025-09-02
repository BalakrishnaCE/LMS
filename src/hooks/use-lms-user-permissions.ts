import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";
import { useEffect, useState } from "react";

interface LMSUser {
  user: string;
}

interface LMSUsersData {
  lms_admin?: LMSUser[];
  lms_content_editor?: LMSUser[];
  lms_student?: LMSUser[];
  lms_tl?: LMSUser[];
}

interface UseLMSUserPermissionsReturn {
  isLoading: boolean;
  error: unknown;
  isLMSAdmin: boolean;
  isLMSContentEditor: boolean;
  isLMSStudent: boolean;
  isLMSTL: boolean;
  userType: 'admin' | 'student' | 'content_editor' | 'tl' | null;
}

export function useLMSUserPermissions(): UseLMSUserPermissionsReturn {
  const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [userType, setUserType] = useState<'admin' | 'student' | 'content_editor' | 'tl' | null>(null);

  const { data, error: docError, isValidating } = useFrappeGetCall(
    "novel_lms.novel_lms.api.user_permissions.get_user_lms_permissions",
    {
      user: currentUser
    },
    {
      enabled: !!currentUser,
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

    if (isValidating) {
      setIsLoading(true);
    }

    if (data) {
      const permissionsData = data as any;
      
      // The API response is wrapped in a 'message' property
      const userData = permissionsData.message || permissionsData;
      
      console.log("Permissions data received:", {
        rawData: data,
        userData: userData,
        userType: userData.user_type
      });
      
      // Set user type directly from API response
      setUserType(userData.user_type);
      setIsLoading(false);
    }

    if (docError) {
      setError(docError);
      setIsLoading(false);
    }
  }, [currentUser, data, isValidating, docError, isAuthLoading]);

  const isLMSAdmin = userType === 'admin';
  const isLMSContentEditor = userType === 'content_editor';
  const isLMSStudent = userType === 'student';
  const isLMSTL = userType === 'tl';

  return {
    isLoading: isLoading || isAuthLoading,
    error,
    isLMSAdmin,
    isLMSContentEditor,
    isLMSStudent,
    isLMSTL,
    userType,
  };
}
