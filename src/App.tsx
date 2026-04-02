import Layout from "@/app/layout"
import Admindashboard from "@/pages/Dashboard/Admindashboard"
import LearnerDashboard from "@/pages/Dashboard/LearnerDashboard"
import Module from "@/pages/Modules/Module";
import ModuleDetail from "@/pages/Modules/ModuleDetail";
import { LoginForm } from "@/components/LoginPage"
import { NovelLMSFrappeProvider } from "@/lib/frappe-provider";
import { Switch, Route, Router } from "wouter"
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
import AdminModuleDetail from "@/pages/Modules/Admin/ModuleDetail";
import ModuleEdit from "@/pages/ModuleEditor/edit/ModuleEdit";
import ModuleCreationForm from "@/pages/ModuleEditor/edit/ModuleCreationForm";
import AnalyticsDashboard from "@/pages/Analytics/AnalyticsDashboard";
import DepartmentPage from "@/pages/Department/Department";
import { ErrorBoundary } from "@/lib/error-boundary";
import FloatingChatButton from "@/components/FloatingChatButton";
import AiChatPage from "@/pages/AiChat/AiChatPage";
import FAQPage from "./pages/FAQ/FAQPage";
// import AnalyticsDashboardNew from "@/pages/Analytics/AnalyticsDashboard";
// import H5PReactDemo from '@/pages/Test/H5PReactDemo';
// import TESTH5P from '@/pages/Test/TESTH5P';

import { PermissionProvider } from "@/contexts/PermissionContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { MediaManagerProvider } from "@/contexts/MediaManagerContext";
import { useUser } from "@/hooks/use-user";
import { AI_ALLOWED_USERS } from "@/config/ai-users";

function AppContent() {
  const { user } = useUser();
  const isAiAllowed = user?.email && AI_ALLOWED_USERS.includes(user.email.toLowerCase());

  return (
    <Router base={BASE_PATH}>
      <Switch>
        <Route path="/login">
          <div className="flex flex-col items-center justify-center min-h-svh w-full">
            <LoginForm />
          </div>
        </Route>

        {isAiAllowed && (
          <ProtectedRoute path="/ai" component={() => (
            <Layout>
              <AiChatPage />
            </Layout>
          )} allowedRoles={["LMS Admin", "LMS Student", "LMS Content Editor"]} />
        )}
        {isAiAllowed && (
          <ProtectedRoute path="/ai/:chatId" component={() => (
            <Layout>
              <AiChatPage />
            </Layout>
          )} allowedRoles={["LMS Admin", "LMS Student", "LMS Content Editor"]} />
        )}
        <ProtectedRoute path="/" component={() => (
          <Layout>
            <Admindashboard />
          </Layout>
        )} allowedRoles={["LMS Admin"]} />
        <ProtectedRoute path="/learner-dashboard" component={() => (
          <Layout>
            <LearnerDashboard />
          </Layout>
        )} allowedRoles={["LMS Student"]} />

        <ProtectedRoute path="/modules/learner" component={() => (
          <Layout>
            <LearnerModulePage />
          </Layout>
        )} allowedRoles={["LMS Student"]} />
        <ProtectedRoute path="/modules/learner/:moduleName" component={LearnerModuleDetail} allowedRoles={["LMS Student", "LMS Admin", "LMS Content Editor"]} />


        <ProtectedRoute path="/modules" component={() => (
          <Layout>
            <Module />
          </Layout>
        )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
        <ProtectedRoute path="/modules/:moduleName" component={AdminModuleDetail} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
        <ProtectedRoute path="/module/:moduleName" component={() => (
          <ModuleDetail />
        )} allowedRoles={["LMS Admin", "LMS Content Editor", "LMS Student"]} />

        <ProtectedRoute path="/learners" component={() => (
          <Layout>
            <Learners />
          </Layout>
        )} allowedRoles={["LMS Admin"]} />
        <ProtectedRoute path="/profile" component={() => (
          <Layout>
            <Profile />
          </Layout>
        )} allowedRoles={["LMS Admin", "LMS Student", "LMS Content Editor"]} />
        <ProtectedRoute path="/edit" component={() => (
          <Layout>
            <ModuleCreationForm />
          </Layout>
        )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
        <ProtectedRoute path="/edit/:moduleId" component={() => (
          <>
            <ModuleEdit />
          </>
        )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
        <ProtectedRoute path="/analytics" component={() => (
          <Layout>
            <AnalyticsDashboard />
          </Layout>
        )} allowedRoles={["LMS Admin"]} />
        <ProtectedRoute path="/department" component={() => (
          <Layout>
            <DepartmentPage />
          </Layout>
        )} allowedRoles={["LMS Admin"]} />

        <ProtectedRoute path="/faq" component={() => (
          <Layout>
            <FAQPage />
          </Layout>
        )} allowedRoles={["LMS Student", "LMS Admin", "LMS Content Editor"]} />

        <Route path="/:path*" component={NotFound} />

      </Switch>
      {isAiAllowed && <FloatingChatButton />}
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider storageKey="novel-lms-theme" defaultTheme="light">
        <div className="flex flex-col items-center justify-start min-h-svh font-sans">
          <NovelLMSFrappeProvider>
            <PermissionProvider>
              <NavigationProvider>
                <MediaManagerProvider>
                  <AppContent />
                </MediaManagerProvider>
              </NavigationProvider>
            </PermissionProvider>
          </NovelLMSFrappeProvider>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
export default App

