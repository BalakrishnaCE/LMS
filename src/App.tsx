import Layout from "@/app/layout"
import Admindashboard from "@/pages/Dashboard/Admindashboard"
import Module from "@/pages/Modules/Module";
import ModuleDetail from "@/pages/Modules/ModuleDetail";
import {LoginForm} from "@/components/LoginPage"
import { NovelLMSFrappeProvider } from "@/lib/frappe-provider";
import {Switch, Route} from "wouter"
import { Toaster } from "@/components/ui/sonner"
import Learners from "@/pages/Learners/Learners";
import ModuleEdit from "@/pages/ModuleEditor/ModuleEdit";

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
            <Admindashboard />
          </Layout>
        </Route>
        <Route path={"/modules"}>
          <Layout>
            <Module />
          </Layout>
        </Route>
        <Route path="/module/:moduleName">
          {/* <Layout> */}
            <ModuleDetail />
          {/* </Layout> */}
        </Route>
        <Route path="/module/:moduleName/edit">
          {/* <Layout> */}
            <ModuleEdit />
          {/* </Layout> */}
        </Route>
        
        <Route path="/learners">
          <Layout>
            <Learners />
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
