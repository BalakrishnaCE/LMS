import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Activity,
  CheckCircle,
  Timer,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  PieChart,
  BarChart2,
  User,
  BookOpen,
  FileText,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// Placeholder avatars for demo
const avatars = [
  { name: "Alice", src: "https://randomuser.me/api/portraits/women/1.jpg" },
  { name: "Bob", src: "https://randomuser.me/api/portraits/men/2.jpg" },
  { name: "Carol", src: "https://randomuser.me/api/portraits/women/3.jpg" },
];

export default function AnalyticsDashboardNew() {
  const [, navigate] = useLocation();
  // Fetch analytics data
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  const message = apiData?.message || {};
  const learners = message.learners || [];
  const modules = message.modules || [];
  const quizzes = message.quizzes || [];
  const qas = message.qa_progress || [];
  const quizProgress = message.quiz_progress || [];
  const progress = message.progress || [];
  const publishedModules = useMemo(() => modules.filter((m: any) => m.published), [modules]);
  const draftModules = useMemo(() => modules.filter((m: any) => !m.published), [modules]);

  const statCards = [
    {
      title: "Active Learners",
      value: learners.length,
      icon: <Users className="h-6 w-6 text-primary" />,
      route: "/analytics/learners",
      description: "All learners who have logged in or made progress."
    },
    {
      title: "Total Modules",
      value: modules.length,
      icon: <Layers className="h-6 w-6 text-primary" />,
      route: "/analytics/modules",
      description: "All modules in the system."
    },
    {
      title: "Published Modules",
      value: publishedModules.length,
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      route: "/analytics/modules?status=published",
      description: "Modules available to learners."
    },
    {
      title: "Draft Modules",
      value: draftModules.length,
      icon: <FileText className="h-6 w-6 text-primary" />,
      route: "/analytics/modules?status=draft",
      description: "Modules in draft state."
    },
    {
      title: "Total Quizzes",
      value: quizzes.length,
      icon: <Award className="h-6 w-6 text-primary" />,
      route: "/analytics/quizzes",
      description: "All quizzes created."
    },
    {
      title: "Total QAs",
      value: qas.length,
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      route: "/analytics/qas",
      description: "All Q&A sessions created."
    },
  ];

  // Comparative Analytics Data
  // Quiz Assigned vs Attended
  const quizAssignedVsAttended = useMemo(() => {
    const assigned: Record<string, number> = {};
    const attended: Record<string, number> = {};
    quizzes.forEach((q: any) => {
      assigned[q.title] = quizProgress.filter((qp: any) => qp.quiz === q.name).length;
      attended[q.title] = quizProgress.filter((qp: any) => qp.quiz === q.name && qp.ended_on).length;
    });
    return quizzes.map((q: any) => ({
      quiz: q.title,
      assigned: assigned[q.title] || 0,
      attended: attended[q.title] || 0,
    }));
  }, [quizzes, quizProgress]);

  // QA Assigned vs Attended
  const qaAssignedVsAttended = useMemo(() => {
    // Assuming each QA is assigned to all learners
    const assigned = qas.length;
    const attended = qas.filter((qa: any) => qa.score !== undefined && qa.score !== null).length;
    return [{ qa: "All QAs", assigned, attended }];
  }, [qas]);

  // Module Assigned vs Attended
  const moduleAssignedVsAttended = useMemo(() => {
    return modules.map((m: any) => {
      const assigned = progress.filter((p: any) => p.lms_module === m.name).length;
      const attended = progress.filter((p: any) => p.lms_module === m.name && p.status !== "Not Started").length;
      return { module: m.name, assigned, attended };
    });
  }, [modules, progress]);

  // Modules Created vs Used
  const modulesCreatedVsUsed = useMemo(() => {
    const usedModules = new Set(progress.map((p: any) => p.lms_module));
    return [
      { label: "Created", value: modules.length },
      { label: "Used", value: usedModules.size },
    ];
  }, [modules, progress]);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Your learning analytics at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Full Statistics</Button>
          <Button variant="ghost">Results Summary</Button>
        </div>
      </div>


      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-center text-destructive">Error loading analytics data.</div>
        ) : (
          statCards.map((card) => (
            <Card
              key={card.title}
              className="shadow-sm cursor-pointer transition hover:shadow-lg focus:ring-2 focus:ring-primary"
              tabIndex={0}
              onClick={() => navigate(card.route)}
              onKeyDown={e => { if (e.key === 'Enter') navigate(card.route); }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  {card.icon}
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.description}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comparative Analytics Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quiz Assigned vs Attended */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Assigned vs Attended</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quizAssignedVsAttended}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quiz" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill="var(--primary)" />
                <Bar dataKey="attended" name="Attended" fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* QA Assigned vs Attended */}
        <Card>
          <CardHeader>
            <CardTitle>QA Assigned vs Attended</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qaAssignedVsAttended}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="qa" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill="var(--primary)" />
                <Bar dataKey="attended" name="Attended" fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Module Assigned vs Attended */}
        <Card>
          <CardHeader>
            <CardTitle>Module Assigned vs Attended</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleAssignedVsAttended}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill="var(--primary)" />
                <Bar dataKey="attended" name="Attended" fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Modules Created vs Used */}
        <Card>
          <CardHeader>
            <CardTitle>Modules Created vs Used</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="80%" height="80%">
              <BarChart data={modulesCreatedVsUsed} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="label" type="category" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" name="Count" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Warnings & Alerts Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learners with Missed Due Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Learners with Missed Due Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-left">Due Date</th>
                  <th className="p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {progress.filter((p: any) => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'Completed').map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{p.learner}</td>
                    <td className="p-2">{p.lms_module}</td>
                    <td className="p-2">{p.due_date}</td>
                    <td className="p-2">
                      <Button size="sm" variant="outline" onClick={() => alert(`Notify sent to ${p.learner}`)}>Notify</Button>
                    </td>
                  </tr>
                ))}
                {progress.filter((p: any) => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'Completed').length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted-foreground">No missed due dates.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Learners with Quiz Score < 50% */}
        <Card>
          <CardHeader>
            <CardTitle>Learners with Quiz Score &lt; 50%</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">Quiz</th>
                  <th className="p-2 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {quizProgress.filter((q: any) => q.score !== undefined && q.score < 50).map((q: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{q.user}</td>
                    <td className="p-2">{q.quiz}</td>
                    <td className="p-2">{q.score}</td>
                  </tr>
                ))}
                {quizProgress.filter((q: any) => q.score !== undefined && q.score < 50).length === 0 && (
                  <tr><td colSpan={3} className="text-center text-muted-foreground">No learners with low quiz scores.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Learners with QA Score < 50% */}
        <Card>
          <CardHeader>
            <CardTitle>Learners with QA Score &lt; 50%</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">QA</th>
                  <th className="p-2 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {qas.filter((qa: any) => qa.score !== undefined && qa.score < 50).map((qa: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{qa.user}</td>
                    <td className="p-2">{qa.question_answer}</td>
                    <td className="p-2">{qa.score}</td>
                  </tr>
                ))}
                {qas.filter((qa: any) => qa.score !== undefined && qa.score < 50).length === 0 && (
                  <tr><td colSpan={3} className="text-center text-muted-foreground">No learners with low QA scores.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* QA attended but score not added for >3 days */}
        <Card>
          <CardHeader>
            <CardTitle>QA Attended, Score Not Added &gt; 3 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">QA</th>
                  <th className="p-2 text-left">Attended On</th>
                </tr>
              </thead>
              <tbody>
                {qas.filter((qa: any) => qa.score === undefined && qa.attended_on && (new Date().getTime() - new Date(qa.attended_on).getTime()) > 3 * 24 * 60 * 60 * 1000).map((qa: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{qa.user}</td>
                    <td className="p-2">{qa.question_answer}</td>
                    <td className="p-2">{qa.attended_on}</td>
                  </tr>
                ))}
                {qas.filter((qa: any) => qa.score === undefined && qa.attended_on && (new Date().getTime() - new Date(qa.attended_on).getTime()) > 3 * 24 * 60 * 60 * 1000).length === 0 && (
                  <tr><td colSpan={3} className="text-center text-muted-foreground">No pending QA scores.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdowns & Insights Section */}
      <div className="mb-8 grid grid-cols-1 gap-6">
        {/* Learner-wise Module Details */}
        <Card>
          <CardHeader>
            <CardTitle>Learner-wise Module Details</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Score</th>
                  <th className="p-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {progress.slice(0, 50).map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{p.learner}</td>
                    <td className="p-2">{p.lms_module}</td>
                    <td className="p-2">{p.status}</td>
                    <td className="p-2">{p.score ?? '-'}</td>
                    <td className="p-2">{p.module_duration ?? '-'}</td>
                  </tr>
                ))}
                {progress.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground">No data.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Modules Never Attended */}
        <Card>
          <CardHeader>
            <CardTitle>Modules Never Attended</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-left">Assignment Type</th>
                </tr>
              </thead>
              <tbody>
                {modules.filter((m: any) => !progress.some((p: any) => p.lms_module === m.name)).map((m: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{m.name}</td>
                    <td className="p-2">{m.assignment_type ?? '-'}</td>
                  </tr>
                ))}
                {modules.filter((m: any) => !progress.some((p: any) => p.lms_module === m.name)).length === 0 && (
                  <tr><td colSpan={2} className="text-center text-muted-foreground">All modules have been attended.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Modules Last Modified >5 Months Ago */}
        <Card>
          <CardHeader>
            <CardTitle>Modules Last Modified &gt; 5 Months Ago</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-left">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {modules.filter((m: any) => m.modified && (new Date().getTime() - new Date(m.modified).getTime()) > 5 * 30 * 24 * 60 * 60 * 1000).map((m: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{m.name}</td>
                    <td className="p-2">{m.modified}</td>
                  </tr>
                ))}
                {modules.filter((m: any) => m.modified && (new Date().getTime() - new Date(m.modified).getTime()) > 5 * 30 * 24 * 60 * 60 * 1000).length === 0 && (
                  <tr><td colSpan={2} className="text-center text-muted-foreground">No modules found.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* % of Learners with <90% Score (Quizzes) */}
        <Card>
          <CardHeader>
            <CardTitle>Quizzes: % of Learners with &lt;90% Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-2">
              {quizProgress.length > 0 ? `${Math.round(100 * quizProgress.filter((q: any) => q.score < 90).length / quizProgress.length)}%` : '-'}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">Quiz</th>
                  <th className="p-2 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {quizProgress.filter((q: any) => q.score < 90).slice(0, 20).map((q: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{q.user}</td>
                    <td className="p-2">{q.quiz}</td>
                    <td className="p-2">{q.score}</td>
                  </tr>
                ))}
                {quizProgress.filter((q: any) => q.score < 90).length === 0 && (
                  <tr><td colSpan={3} className="text-center text-muted-foreground">All learners have ≥90% score.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* % of Learners with <90% Score (QAs) */}
        <Card>
          <CardHeader>
            <CardTitle>QAs: % of Learners with &lt;90% Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-2">
              {qas.length > 0 ? `${Math.round(100 * qas.filter((qa: any) => qa.score < 90).length / qas.length)}%` : '-'}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Learner</th>
                  <th className="p-2 text-left">QA</th>
                  <th className="p-2 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {qas.filter((qa: any) => qa.score < 90).slice(0, 20).map((qa: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2">{qa.user}</td>
                    <td className="p-2">{qa.question_answer}</td>
                    <td className="p-2">{qa.score}</td>
                  </tr>
                ))}
                {qas.filter((qa: any) => qa.score < 90).length === 0 && (
                  <tr><td colSpan={3} className="text-center text-muted-foreground">All learners have ≥90% score.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 