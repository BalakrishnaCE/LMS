import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Mail, Users, TrendingUp, BookOpen, Award } from "lucide-react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function UserDetailsDrawer({ learner, open, onClose }: { learner: any, open: boolean, onClose: () => void }) {
  // Fetch module progress/activity for this learner
  const { data: progressData, isLoading } = useFrappeGetCall<any>("LearnerModuleData", {
    user: learner?.email
  }, { enabled: !!learner });
  const modules = progressData?.data?.modules || [];
  // Calculate completion rate
  const totalModules = modules.length;
  const completedModules = modules.filter((m: any) => m.progress?.status === "Completed").length;
  const completionRate = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;
  // Recent activity: last 5 modules
  const recent = modules.slice(0, 5);

  const { updateDoc } = useFrappeUpdateDoc();
  const [editMode, setEditMode] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (learner) {
      setFullName(learner.full_name || "");
      setPassword("");
      setEditMode(false);
    }
  }, [learner]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      // Update full name
      console.log("full name is=",fullName);
      console.log("name is =",learner.name);

      const parts = fullName.trim().split(" ");
      let firstName = "";
      let middleName = "";
      let lastName = "";

      if (parts.length === 1) {
        firstName = parts[0];
      } else if (parts.length === 2) {
        [firstName, lastName] = parts;
      } else if (parts.length >= 3) {
        firstName = parts[0];
        lastName = parts[parts.length - 1];
        middleName = parts.slice(1, parts.length - 1).join(" ");
      }
      
      console.log("first_name=",firstName);
      console.log("middleName=",middleName);
      console.log("lastName=",lastName);

      await updateDoc("User", learner.name, { first_name: firstName });
      await updateDoc("User", learner.name, { middle_name: middleName });
      await updateDoc("User", learner.name, { last_name: lastName });


      // Update password if provided
      if (password.trim()) {
        await updateDoc("User", learner.name, { new_password: password });
      }
      toast.success("Learner updated successfully");
      setEditMode(false);
      setPassword("");
      // Optionally, trigger a refresh in parent
    } catch (err: any) {
      toast.error(err.message || "Failed to update learner");
    } finally {
      setSaving(false);
    }
  };

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
                  {editMode ? (
                    <Input
                      className="text-xl font-bold mb-1"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      disabled={saving}
                      placeholder="Full Name"
                    />
                  ) : (
                    <div className="text-xl font-bold">{learner.full_name}</div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Mail className="w-4 h-4" /> {learner.email}
                    <Badge variant={learner.enabled === 1 ? "secondary" : "destructive"} className="ml-2">
                      {learner.enabled === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!editMode && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose} aria-label="Close"><X className="w-6 h-6" /></Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {editMode && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Edit Learner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">Full Name</label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} disabled={saving} />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Password</label>
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={saving} placeholder="Leave blank to keep unchanged" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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