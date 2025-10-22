import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Mail, Users, TrendingUp, Award } from "lucide-react";
import { LMS_API_BASE_URL } from "@/config/routes";

export function UserDetailsDrawer({ learner, open, onClose }: { learner: any, open: boolean, onClose: () => void }) {
  // Fetch learner sidebar details using the same API as analytics dashboard
  const [learnerData, setLearnerData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (learner?.email && open) {
      setLoading(true);
      fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.get_learner_sidebar_details?learner_name=${learner.email}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      })
      .then(response => response.json())
      .then(data => {
        setLearnerData(data.message.message);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching learner data:', error);
        setLoading(false);
      });
    }
  }, [learner?.email, open]);
  
  const modules = learnerData?.learner_modules || [];
  
  // Debug: Log module data to understand structure
  React.useEffect(() => {
    if (modules.length > 0) {
       console.log('=== MODULE DATA DEBUG ===');
      // console.log('Total modules:', modules.length);
      modules.forEach((mod: any, index: number) => {
        // console.log(`Module ${index}:`, {
        //   // Direct fields
        //   name: mod.name,
        //   name1: mod.name1,
        //   module_name: mod.module_name,
        //   module_id: mod.module_id,
        //   progress: mod.progress,
        //   // Nested module fields
        //   module_name1: mod.module?.name1,
        //   module_name_direct: mod.module?.name,
        //   // All keys
        //   all_keys: Object.keys(mod),
        //   module_keys: mod.module ? Object.keys(mod.module) : 'No module object'
        // });
      });
    }
  }, [modules]);
  // Fetch departments for mapping - using direct fetch since useFrappeGetDocList is not available
  const [departments, setDepartments] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    if (learner) {
      fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.departments.get_departments`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => setDepartments(data.message || []))
      .catch(err => console.error('Error fetching departments:', err));
    }
  }, [learner]);
  const departmentIdToName = React.useMemo(() => Object.fromEntries((departments || []).map(d => [d.name, d.department])), [departments]);
  // Calculate completion rate from API data
  const totalModules = learnerData?.learner_info?.total_modules || 0;
  const completedModules = learnerData?.learner_info?.completed_modules || 0;
  const completionRate = learnerData?.learner_info?.completion_rate || 0;
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
                  <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Module Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loading ? (
                      <div className="text-muted-foreground text-sm">Loading modules...</div>
                    ) : modules.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No modules found.</div>
                    ) : (
                      modules.map((mod: any, index: number) => {
                        const moduleName = mod.module_name || `Module ${index + 1}`;
                        const progressValue = mod.progress || 0;
                        const status = mod.status || "Not Started";
                        
                        return (
                          <div key={mod.module_id || index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-700">
                                {moduleName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Status: {status}
                              </div>
                            </div>
                            <Progress value={progressValue} className="w-32 h-2" />
                            <span className="text-xs font-semibold text-primary">{progressValue}%</span>
                          </div>
                        );
                      })
                    )}
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