import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Mail, Users, TrendingUp, BookOpen, Award } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useFrappeGetDocList } from "frappe-react-sdk";

export function UserDetailsDrawer({ learner, open, onClose }: { learner: any, open: boolean, onClose: () => void }) {
  // Fetch module progress/activity for this learner
  const { data: progressData, isLoading } = useFrappeGetCall<any>("LearnerModuleData", {
    user: learner?.email
  }, { enabled: !!learner });
  const modules = progressData?.data?.modules || [];
  // Fetch departments for mapping
  const { data: departments } = useFrappeGetDocList("Department", { fields: ["name", "department"], limit: 150 });
  const departmentIdToName = React.useMemo(() => Object.fromEntries((departments || []).map(d => [d.name, d.department])), [departments]);
  // Calculate completion rate
  const totalModules = modules.length;
  const completedModules = modules.filter((m: any) => m.progress?.status === "Completed").length;
  const completionRate = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;
  // Recent activity: last 5 modules
  const recent = modules.slice(0, 5);
  // Get learner departments as array
  const learnerDepartments = (learner?.departments && learner.departments.length > 0) ? learner.departments : (learner?.department ? [learner.department] : []);

  return (
    <AnimatePresence>
      {open && learner && (
        <>
          {/* Overlay */}
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-background shadow-2xl z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()} // Prevent overlay click from closing when clicking inside drawer
          >
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-xl font-bold">{learner.full_name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Mail className="w-4 h-4" /> {learner.email}
                    <Badge variant={learner.enabled === 1 ? "secondary" : "destructive"} className="ml-2">
                      {learner.enabled === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {/* Departments as badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {learnerDepartments.map((depId: string) => (
                      <Badge key={depId} variant="outline">
                        {departmentIdToName[depId] || depId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} aria-label="Close"><X className="w-6 h-6" /></Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Progress value={completionRate} className="w-40 h-3" />
                    <span className="text-lg font-bold">{completionRate}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{completedModules} of {totalModules} modules completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recent.length === 0 && <div className="text-muted-foreground text-sm">No recent activity.</div>}
                    {recent.map((mod: any) => (
                      <div key={mod.name} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{mod.name1}</div>
                          <div className="text-xs text-muted-foreground">{mod.progress?.status || "Not Started"}</div>
                        </div>
                        <Badge variant={mod.progress?.status === "Completed" ? "default" : mod.progress?.status === "In Progress" ? "secondary" : "destructive"}>
                          {mod.progress?.status || "Not Started"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Module Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {modules.length === 0 && <div className="text-muted-foreground text-sm">No modules found.</div>}
                    {modules.map((mod: any) => (
                      <div key={mod.name} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{mod.name1}</div>
                          <div className="text-xs text-muted-foreground">{mod.description?.replace(/<[^>]+>/g, '')}</div>
                        </div>
                        <Progress value={mod.progress?.progress || 0} className="w-32 h-2" />
                        <span className="text-xs font-semibold text-primary">{mod.progress?.progress || 0}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 