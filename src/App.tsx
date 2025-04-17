import Layout from "@/app/layout"
import Dashboard from "@/pages/Dashboard"
import {LoginForm} from "@/components/LoginPage"
import { NovelLMSFrappeProvider } from "./lib/frappe-provider";
import {Switch, Link, Route} from "wouter"




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
      </Switch>
     </NovelLMSFrappeProvider>
    </div>
  )}
export default App
