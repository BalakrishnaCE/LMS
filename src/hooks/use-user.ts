import { useFrappeAuth } from "frappe-react-sdk";
import { useEffect, useState } from "react";
import { useLMSUserPermissions } from "./use-lms-user-permissions";

interface UserRole {
  role: string;
}

interface UserData {
  name: string;
  full_name: string;
  email: string;
  image: string;
  user_image: string;
  roles: UserRole[];
}

interface UseUserReturn {
  user: UserData | null;
  isLoading: boolean;
  error: unknown;
  isLMSAdmin: boolean;
  isLMSStudent: boolean;
  isLMSContentEditor: boolean;
}

export function useUser(): UseUserReturn {
  const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<unknown>(null);

  // Get LMS permissions - only call once when user changes
  const { 
    isLMSAdmin, 
    isLMSStudent, 
    isLMSContentEditor, 
    isLoading: permissionsLoading 
  } = useLMSUserPermissions();


  useEffect(() => {
    console.log("useUser hook:", { currentUser, isAuthLoading, permissionsLoading });
    
    // If auth is still loading, keep loading state
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If no current user, clear user data
    if (!currentUser) {
      console.log("No current user, clearing user data");
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Create a basic user object from currentUser
    // This avoids the CORS issue with useFrappeGetDoc
    const basicUser: UserData = {
      name: currentUser,
      full_name: currentUser.includes('@') ? currentUser.split('@')[0] : currentUser, // Handle both email and username
      email: currentUser,
      image: "",
      user_image: "",
      roles: [] // We'll get roles from useLMSUserPermissions instead
    };

    console.log("Setting user data:", basicUser);
    console.log("User email for API calls:", basicUser.email);
    setUser(basicUser);
    setIsLoading(false);
  }, [currentUser, isAuthLoading]);

  return {
    user,
    isLoading: isLoading || isAuthLoading || permissionsLoading,
    error,
    isLMSAdmin,
    isLMSStudent,
    isLMSContentEditor,
  };
} 