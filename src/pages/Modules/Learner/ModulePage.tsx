import { LearnerModules } from "./Modules"
import LearnerModuleDetail from "./ModuleDetail"
import { Route, Switch } from "wouter"

export function LearnerModulePage() {
    return (
        <div className="p-4">
            <Switch>
                <Route path="/modules/learner/:moduleName">
                    <LearnerModuleDetail />
                </Route>
                <Route>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Available Modules</h1>
                        <p className="text-muted-foreground mt-2">
                            Browse and enroll in modules to start your learning journey.
                        </p>
                    </div>
                    <LearnerModules itemsPerPage={20} />
                </Route>
            </Switch>
        </div>
    )
} 