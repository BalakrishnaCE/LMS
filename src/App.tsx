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
import ModuleEdit from "@/pages/ModuleEditor/ModuleEdit";
import { ProtectedRoute } from "@/lib/protected-route";
import { BASE_PATH } from "@/config/routes";
import { ThemeProvider } from "@/components/theme-provider";
import { LearnerModulePage } from "@/pages/Modules/Learner/ModulePage";
import Profile from "@/pages/Profile/Profile";
import NotFound from "@/pages/NotFound";
import LearnerModuleDetail from "@/pages/Modules/Learner/ModuleDetail";
import TestModuleEdit from "@/pages/test/edit/testModuleEdit";
import ModuleCreationForm from "@/pages/test/edit/ModuleCreationForm";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="novel-lms-theme">
      <div className="flex flex-col items-center justify-center min-h-svh">
        <NovelLMSFrappeProvider>
          <Router base={BASE_PATH}>
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
              <ProtectedRoute path="/modules" component={() => (
                <Layout>
                  <Module />
                </Layout>
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/module/:moduleName" component={() => (
                <ModuleDetail />
              )} allowedRoles={["LMS Admin", "LMS Content Editor", "LMS Student"]} />
              <ProtectedRoute path="/module/new" component={() => (
                <ModuleEdit />
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/module/:moduleName/edit" component={() => (
                <ModuleEdit />
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/modules/learner" component={() => (
                <Layout>
                  <LearnerModulePage />
                </Layout>
              )} allowedRoles={["LMS Student"]} />
              {/* Detailed module view with progress tracking */}
              <ProtectedRoute path="/modules/learner/:moduleName" component={LearnerModuleDetail} allowedRoles={["LMS Student"]} />
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
              <ProtectedRoute path="/test/edit" component={() => (
                <Layout>
                  <ModuleCreationForm />
                </Layout>
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              <ProtectedRoute path="/test/edit/:moduleId" component={() => (
                <TestModuleEdit />
              )} allowedRoles={["LMS Admin", "LMS Content Editor"]} />
              {/* Show 404 for all unrecognized routes */}
              <Route path="/:path*" component={NotFound} />
            </Switch>
            <Toaster />
          </Router>
        </NovelLMSFrappeProvider> 
      </div>
    </ThemeProvider>
  )
}
export default App
