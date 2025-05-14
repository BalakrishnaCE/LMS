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
  const { currentUser } = useFrappeAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const { data, error: docError, isValidating } = useFrappeGetDoc(
    "User",
    currentUser ?? undefined,
    {
      fields: ["name", "full_name", "email", "image", "roles"],
    }
  );

  useEffect(() => {
    if (isValidating) {
      setIsLoading(true);
    }
    if (data) {
      setUser(data);
      setIsLoading(false);
    }
    if (docError) {
      setError(docError);
      setIsLoading(false);
    }
  }, [data, isValidating, docError]);

  const isLMSAdmin = user?.roles?.some((role) => role.role === "LMS Admin") ?? false;
  const isLMSStudent = user?.roles?.some((role) => role.role === "LMS Student") ?? false;
  const isLMSContentEditor = user?.roles?.some((role) => role.role === "LMS Content Editor") ?? false;

  return {
    user,
    isLoading,
    error,
    isLMSAdmin,
    isLMSStudent,
    isLMSContentEditor,
  };
} 