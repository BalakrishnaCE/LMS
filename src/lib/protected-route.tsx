import { useLMSUserPermissions } from "@/hooks/use-lms-user-permissions";
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
  const { 
    isLoading: permissionsLoading, 
    isLMSAdmin, 
    isLMSStudent, 
    isLMSContentEditor, 
    isLMSTL,
    userType 
  } = useLMSUserPermissions();
  const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();

  // Show loading state while either auth or permissions data is loading
  if (permissionsLoading || isAuthLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-bg-soft">
          <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        </div>
      </Route>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // If no user type found, redirect to login
  if (!userType) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // Check role-based access using LMS Users permissions
  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => {
      switch (role) {
        case "LMS Admin":
          return isLMSAdmin;
        case "LMS Student":
          return isLMSStudent;
        case "LMS Content Editor":
          return isLMSContentEditor;
        case "LMS TL":
          return isLMSTL;
        default:
          return false;
      }
    });

    if (!hasAccess) {
      // Redirect based on user type from LMS Users
      let redirectPath = "/login";
      
      if (isLMSAdmin) {
        redirectPath = "/admin-dashboard";
      } else if (isLMSContentEditor) {
        redirectPath = "/modules";
      } else if (isLMSTL) {
        redirectPath = "/tl-dashboard";
      } else if (isLMSStudent) {
        redirectPath = "/learner-dashboard";
      }
      
      return (
        <Route path={path}>
          <Redirect to={redirectPath} />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
