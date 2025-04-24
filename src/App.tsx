import Layout from "@/app/layout"
import Dashboard from "@/pages/Dashboard"
import Modules from "./components/Modules";
import ModuleDetail from "@/pages/ModuleDetail";
import {LoginForm} from "@/components/LoginPage"
import { NovelLMSFrappeProvider } from "./lib/frappe-provider";
import {Switch, Link, Route} from "wouter"
import { Toaster } from "@/components/ui/sonner"




function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <NovelLMSFrappeProvider>
      <Switch>
        <Route path="/login">
          <LoginForm />
        </Route>
        <Route path="/">
          <Layout>
            <Dashboard />
          </Layout>
        </Route>
        <Route path={"/modules"}>
          <Layout>
            <Modules />
          </Layout>
        </Route>
        <Route path="/module/:moduleName">
          <Layout>
            <ModuleDetail />
          </Layout>
        </Route>
        <Route path="/:rest*" >
          <h1>404, Not Found!</h1>
        </Route>
        
      </Switch>
      <Toaster />
     </NovelLMSFrappeProvider>
    </div>
  )}
export default App
