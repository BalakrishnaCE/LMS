import { useUser } from "@/hooks/use-user";
import { Redirect, Route } from "wouter";
import { useFrappeAuth } from "frappe-react-sdk";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const { user, isLoading, isLMSAdmin, isLMSStudent, isLMSContentEditor } = useUser();
  const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();

  // Show loading state while either auth or user data is loading
  if (isLoading || isAuthLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-bg-soft">
          <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        </div>
      </Route>
    );
  }

  // Only redirect to login if we're sure there's no authenticated user
  if (!currentUser || !user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => {
      switch (role) {
        case "LMS Admin":
          return isLMSAdmin;
        case "LMS Student":
          return isLMSStudent;
        case "LMS Content Editor":
          return isLMSContentEditor;
        default:
          return false;
      }
    });

    if (!hasAccess) {
      // Redirect based on role
      const redirectPath = isLMSAdmin 
        ? "/" 
        : isLMSContentEditor 
          ? "/modules" 
          : isLMSStudent 
            ? "/learner-dashboard" 
            : "/login";
      
      return (
        <Route path={path}>
          <Redirect to={redirectPath} />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
