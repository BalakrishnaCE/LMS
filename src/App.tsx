import Layout from "@/app/layout"
import Admindashboard from "@/pages/Dashboard/Admindashboard"
import LearnerDashboard from "@/pages/Dashboard/LearnerDashboard"
import TLDashboard from "@/pages/Dashboard/TLDashboard"
import Module from "@/pages/Modules/Module";
import ModuleDetail from "@/pages/Modules/ModuleDetail";
import {LoginForm} from "@/components/LoginPage"
import { NovelLMSFrappeProvider } from "@/lib/frappe-provider";
import {Switch, Route, Router} from "wouter"
import { Toaster } from "@/components/ui/sonner"
import Learners from "@/pages/Learners/Learners";
// import ModuleEdit from "@/pages/ModuleEditor/ModuleEdit";
import { ProtectedRoute } from "@/lib/protected-route";
import { BASE_PATH } from "@/config/routes";
import { ThemeProvider } from "@/components/theme-provider";
import { LearnerModulePage } from "@/pages/Modules/Learner/ModulePage";
import Profile from "@/pages/Profile/Profile";
import NotFound from "@/pages/NotFound";
import LearnerModuleDetail from "@/pages/Modules/Learner/ModuleDetail";
import ModuleEdit from "@/pages/ModuleEditor/edit/ModuleEdit";
import ModuleCreationForm from "@/pages/ModuleEditor/edit/ModuleCreationForm";
import AnalyticsDashboard from "@/pages/Analytics/AnalyticsDashboard";
import { ErrorBoundary } from "@/lib/error-boundary";
// import AnalyticsDashboardNew from "@/pages/Analytics/AnalyticsDashboard";
// import H5PReactDemo from '@/pages/Test/H5PReactDemo';
// import TESTH5P from '@/pages/Test/TESTH5P';
import { useLMSUserPermissions } from "@/hooks/use-lms-user-permissions";
import { useFrappeAuth } from "frappe-react-sdk";
import { Redirect } from "wouter";
import Lottie from "lottie-react";
import loadingAnimation from "@/assets/Loading.json";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider storageKey="novel-lms-theme" defaultTheme="light">
        <div className="flex flex-col items-center justify-center min-h-svh">
          <NovelLMSFrappeProvider>
            <Router base={BASE_PATH}>
            {/* <div className="w-full flex justify-center py-2 bg-muted/30">
              <a href="/test/h5p-react-demo" className="text-primary underline font-medium mx-2">Test H5P React Demo</a>
            </div> */}
            <Switch>
              <Route path="/login">
                <LoginForm />
              </Route>
              <ProtectedRoute path="/admin-dashboard" component={() => (
                <Layout>
                  <Admindashboard />
                </Layout>
              )} allowedRoles={["LMS Admin"]} />
              <ProtectedRoute path="/learner-dashboard" component={() => (
                <Layout>
                  <LearnerDashboard />
                </Layout>
              )} allowedRoles={["LMS Student"]} />
              <ProtectedRoute path="/tl-dashboard" component={() => (
                <Layout>
                  <TLDashboard />
                </Layout>
              )} allowedRoles={["LMS TL"]} />
              <ProtectedRoute path="/modules" component={() => (
                <Layout>
                  <Module />
                </Layout>
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/module/:moduleName" component={() => (
                <ModuleDetail />
              )} allowedRoles={["LMS Admin", "LMS Content Editor", "LMS Student"]} />
              <ProtectedRoute path="/modules/learner" component={() => (
                <Layout>
                  <LearnerModulePage />
                </Layout>
              )} allowedRoles={["LMS Student", "LMS TL"]} />
              {/* Detailed module view with progress tracking */}
              <ProtectedRoute path="/modules/learner/:moduleName" component={LearnerModuleDetail} allowedRoles={["LMS Student", "LMS Admin", "LMS Content Editor", "LMS TL"]} />
              <ProtectedRoute path="/learners" component={() => (
                <Layout>
                  <Learners />
                </Layout>
              )} allowedRoles={["LMS Admin"]} />
              <ProtectedRoute path="/profile" component={() => (
                <Layout>
                  <Profile />
                </Layout>
              )} allowedRoles={["LMS Admin", "LMS Student", "LMS Content Editor", "LMS TL"]} />
              {/* Test module routes */}
              <ProtectedRoute path="/edit" component={() => (
                <Layout>
                  <ModuleCreationForm />
                </Layout>
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/edit/:moduleId" component={() => (
                <>
                  {/* <SiteHeader/> */}
                  <ModuleEdit />
                  </>
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/analytics" component={() => (
                <Layout>
                  <AnalyticsDashboard />
                </Layout>
              )} allowedRoles={["LMS Admin", "LMS TL"]} />
              {/* <ProtectedRoute path="/analytics-new" component={() => (
                <Layout>
                  <AnalyticsDashboardNew />
                </Layout>
              )} allowedRoles={["LMS Admin"]} /> */}
              {/* Test H5P React Demo route */}
              {/* <Route path="/test/h5p-react-demo" component={H5PReactDemo} /> */}
              {/* Default route - redirect based on user role */}
              <Route path="/">
                <DefaultRedirect />
              </Route>
              {/* Show 404 for all unrecognized routes */}
              <Route path="/:path*" component={NotFound} />
            </Switch>
            <Toaster />
          </Router>
        </NovelLMSFrappeProvider> 
      </div>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

// Simple component to handle default route redirects
function DefaultRedirect() {
  const { 
    isLoading: permissionsLoading, 
    isLMSAdmin, 
    isLMSStudent, 
    isLMSContentEditor, 
    isLMSTL,
    userType 
  } = useLMSUserPermissions();
  const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();

  // Show loading state
  if (permissionsLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-soft">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Redirect to="/login" />;
  }

  // If no user type found, redirect to login
  if (!userType) {
    return <Redirect to="/login" />;
  }

  // Redirect based on user type
  if (isLMSAdmin) {
    return <Redirect to="/admin-dashboard" />;
  } else if (isLMSContentEditor) {
    return <Redirect to="/modules" />;
  } else if (isLMSTL) {
    return <Redirect to="/tl-dashboard" />;
  } else if (isLMSStudent) {
    return <Redirect to="/learner-dashboard" />;
  }

  // Fallback to login
  return <Redirect to="/login" />;
}

export default App
