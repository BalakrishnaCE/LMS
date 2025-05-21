import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart2, LineChart, Users, BookOpen, Award, Activity } from "lucide-react";

// Example static data
const summary = [
  { label: "Total Learners", value: 1240, icon: Users },
  { label: "Active Modules", value: 32, icon: BookOpen },
  { label: "Completions", value: 870, icon: Award },
  { label: "Avg. Progress", value: "68%", icon: Progress },
];

const progressData = [
  { month: "Jan", value: 40 },
  { month: "Feb", value: 55 },
  { month: "Mar", value: 70 },
  { month: "Apr", value: 90 },
  { month: "May", value: 120 },
  { month: "Jun", value: 150 },
  { month: "Jul", value: 180 },
  { month: "Aug", value: 200 },
  { month: "Sep", value: 210 },
  { month: "Oct", value: 220 },
  { month: "Nov", value: 230 },
  { month: "Dec", value: 240 },
];

const moduleCompletions = [
  { module: "React Basics", completions: 120 },
  { module: "Advanced Python", completions: 98 },
  { module: "UI/UX Design", completions: 87 },
  { module: "Data Science", completions: 75 },
  { module: "Project Management", completions: 60 },
];

const topLearners = [
  { name: "Anirudh", email: "anirudh.k@noveloffice.in", completed: 12, progress: 98 },
  { name: "Balakrishna", email: "bala@noveloffice.com", completed: 11, progress: 95 },
  { name: "Prema", email: "prema@noveloffice.com", completed: 10, progress: 92 },
  { name: "Sahil.k", email: "sahil.k@noveloffice.in", completed: 9, progress: 90 },
  { name: "Sruthi", email: "sruthi@noveloffice.com", completed: 8, progress: 88 },
];

const recentActivities = [
  { icon: BookOpen, title: "New module 'Data Science' added", timestamp: "2 hours ago" },
  { icon: Users, title: "5 new learners enrolled", timestamp: "3 hours ago" },
  { icon: Award, title: "Module 'React Basics' completed by 10 learners", timestamp: "5 hours ago" },
  { icon: Activity, title: "System maintenance completed", timestamp: "1 day ago" }
];

export default function AnalyticsDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {summary.map((item, idx) => (
          <Card key={item.label} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{item.label}</CardTitle>
              {typeof item.icon === "function" ? (
                <item.icon className="w-7 h-7 text-primary" />
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart (Progress Over Time) */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary" /> Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 flex items-end gap-2">
              {progressData.map((d, i) => (
                <div key={d.month} className="flex flex-col items-center flex-1">
                  <div
                    className="rounded-t bg-primary/70"
                    style={{ height: `${d.value / 2}px`, width: '24px' }}
                  ></div>
                  <span className="text-xs mt-1 text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Bar Chart (Module Completions) */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" /> Module Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 flex flex-col justify-end gap-2">
              {moduleCompletions.map((d, i) => (
                <div key={d.module} className="flex items-center gap-2">
                  <div className="w-32 truncate text-sm text-muted-foreground">{d.module}</div>
                  <div className="flex-1 bg-muted rounded h-4">
                    <div
                      className="bg-primary h-4 rounded"
                      style={{ width: `${d.completions * 1.5}px` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-semibold text-primary">{d.completions}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Learners Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Top Learners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLearners.map((l) => (
                <TableRow key={l.email}>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.completed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={l.progress} className="w-32 h-2" />
                      <span className="text-xs font-semibold text-primary">{l.progress}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activities Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <activity.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 