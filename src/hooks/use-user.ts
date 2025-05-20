import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk";
import { useEffect, useState } from "react";

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
  const [error, setError] = useState<unknown>(null);

  const { data, error: docError, isValidating } = useFrappeGetDoc(
    "User",
    currentUser ?? undefined,
    {
      fields: ["name", "full_name", "email", "image", "user_image", "roles"],
      enabled: !!currentUser, // Only fetch if we have a currentUser
    }
  );

  useEffect(() => {
    // If auth is still loading, keep loading state
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If no current user, clear user data
    if (!currentUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // If fetching user data
    if (isValidating) {
      setIsLoading(true);
    }

    // If we have user data
    if (data) {
      setUser(data);
      setIsLoading(false);
    }

    // If there's an error
    if (docError) {
      setError(docError);
      setIsLoading(false);
    }
  }, [currentUser, data, isValidating, docError, isAuthLoading]);

  const isLMSAdmin = user?.roles?.some((role) => role.role === "LMS Admin") ?? false;
  const isLMSStudent = user?.roles?.some((role) => role.role === "LMS Student") ?? false;
  const isLMSContentEditor = user?.roles?.some((role) => role.role === "LMS Content Editor") ?? false;

  return {
    user,
    isLoading: isLoading || isAuthLoading,
    error,
    isLMSAdmin,
    isLMSStudent,
    isLMSContentEditor,
  };
} 