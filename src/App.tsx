import Layout from "@/app/layout"
import Admindashboard from "@/pages/Dashboard/Admindashboard"
import LearnerDashboard from "@/pages/Dashboard/LearnerDashboard"
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
import AdminModuleDetail from "@/pages/Modules/Admin/ModuleDetail";
import ModuleEdit from "@/pages/ModuleEditor/edit/ModuleEdit";
import ModuleCreationForm from "@/pages/ModuleEditor/edit/ModuleCreationForm";
import AnalyticsDashboard from "@/pages/Analytics/AnalyticsDashboard";
import DepartmentPage from "@/pages/Department/Department";
import { ErrorBoundary } from "@/lib/error-boundary";
// import AnalyticsDashboardNew from "@/pages/Analytics/AnalyticsDashboard";
// import H5PReactDemo from '@/pages/Test/H5PReactDemo';
// import TESTH5P from '@/pages/Test/TESTH5P';

import { PermissionProvider } from "@/contexts/PermissionContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { MediaManagerProvider } from "@/contexts/MediaManagerContext";
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider storageKey="novel-lms-theme" defaultTheme="light">
        <div className="flex flex-col items-center justify-center min-h-svh">
          <NovelLMSFrappeProvider>
            <PermissionProvider>
              <NavigationProvider>
                <MediaManagerProvider>
                  <Router base={BASE_PATH}>
            {/* <div className="w-full flex justify-center py-2 bg-muted/30">
              <a href="/test/h5p-react-demo" className="text-primary underline font-medium mx-2">Test H5P React Demo</a>
            </div> */}
            <Switch>
              <Route path="/login">
                <LoginForm />
              </Route>
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
              
              {/* Detailed module view with progress tracking */}
              
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
              )} allowedRoles={["LMS Admin"]} />
              <ProtectedRoute path="/department" component={() => (
                <Layout>
                  <DepartmentPage />
                </Layout>
              )} allowedRoles={["LMS Admin"]} />
              {/* <ProtectedRoute path="/analytics-new" component={() => (
                <Layout>
                  <AnalyticsDashboardNew />
                </Layout>
              )} allowedRoles={["LMS Admin"]} /> */}
              {/* Quiz route */}
              {/* <ProtectedRoute path="/quiz" component={QuizPage} allowedRoles={["LMS Student", "LMS Admin", "LMS Content Editor", "LMS TL"]} /> */}
              {/* Test H5P React Demo route */}
              {/* <Route path="/test/h5p-react-demo" component={H5PReactDemo} /> */}
              {/* Show 404 for all unrecognized routes */}
              <Route path="/:path*" component={NotFound} />
            </Switch>
            <Toaster />
          </Router>
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
