import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  AlertCircle,
  RefreshCw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Placeholder avatars for demo
const avatars = [
  { name: "Alice", src: "https://randomuser.me/api/portraits/women/1.jpg" },
  { name: "Bob", src: "https://randomuser.me/api/portraits/men/2.jpg" },
  { name: "Carol", src: "https://randomuser.me/api/portraits/women/3.jpg" },
];

// Loading skeleton component
const StatCardSkeleton = () => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </CardContent>
  </Card>
);

// Error component
const ErrorAlert = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex items-center justify-between">
      <span>{error?.message || "Failed to load analytics data"}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

// Table component with pagination
const PaginatedTable = ({ 
  data, 
  columns, 
  itemsPerPage = 10,
  emptyMessage = "No data available"
}: { 
  data: any[]; 
  columns: { key: string; header: string }[];
  itemsPerPage?: number;
  emptyMessage?: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            currentData.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.key === 'action' ? (
                      <Button size="sm" variant="outline" onClick={() => alert(`Notify sent to ${row.learner}`)}>
                        Notify
                      </Button>
                    ) : (
                      row[column.key]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default function AnalyticsDashboardNew() {
  const [, navigate] = useLocation();
  // Fetch analytics data with retry capability
  const { data: apiData, isLoading, error, mutate } = useFrappeGetCall<{ message: any }>(
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

  // Add state for chart filters
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  // Filter and transform quiz data
  const filteredQuizData = useMemo(() => {
    if (selectedQuiz === "all") {
      return quizzes.map((q: any) => ({
        name: q.title,
        assigned: quizProgress.filter((qp: any) => qp.quiz === q.name).length,
        attended: quizProgress.filter((qp: any) => qp.quiz === q.name && qp.ended_on).length,
      })).slice(0, 10); // Show only top 10 quizzes by default
    }
    const quiz = quizzes.find((q: any) => q.name === selectedQuiz);
    return quiz ? [{
      name: quiz.title,
      assigned: quizProgress.filter((qp: any) => qp.quiz === quiz.name).length,
      attended: quizProgress.filter((qp: any) => qp.quiz === quiz.name && qp.ended_on).length,
    }] : [];
  }, [quizzes, quizProgress, selectedQuiz]);

  // Filter and transform module data
  const filteredModuleData = useMemo(() => {
    if (selectedModule === "all") {
      return modules.map((m: any) => ({
        name: m.name,
        assigned: progress.filter((p: any) => p.lms_module === m.name).length,
        attended: progress.filter((p: any) => p.lms_module === m.name && p.status !== "Not Started").length,
      })).slice(0, 10); // Show only top 10 modules by default
    }
    const module = modules.find((m: any) => m.name === selectedModule);
    return module ? [{
      name: module.name,
      assigned: progress.filter((p: any) => p.lms_module === module.name).length,
      attended: progress.filter((p: any) => p.lms_module === module.name && p.status !== "Not Started").length,
    }] : [];
  }, [modules, progress, selectedModule]);

  // Add state for module search
  const [moduleSearch, setModuleSearch] = useState("");

  // Filter modules that were never attended and match search
  const neverAttendedModules = useMemo(() => {
    const filtered = modules.filter((m: any) => 
      !progress.some((p: any) => p.lms_module === m.name) &&
      m.name.toLowerCase().includes(moduleSearch.toLowerCase())
    );
    return filtered.map((m: any) => ({
      name: m.name,
      assignment_type: m.assignment_type ?? '-'
    }));
  }, [modules, progress, moduleSearch]);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Your learning analytics at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="ghost">Results Summary</Button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => mutate()} />}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
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
        {/* Quiz Assigned vs Attended - TEMPORARY PLACEHOLDER */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Assigned vs Attended</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-muted-foreground text-center mb-4">
              Too many quizzes to display a meaningful chart.<br />
              Please use the details page for in-depth analytics.
            </div>
            <Button variant="outline" onClick={() => navigate("/analytics/quizzes")}>Go to Quizzes Details</Button>
            {/* TODO: Implement scalable chart with search/filter/pagination for large datasets */}
          </CardContent>
        </Card>
        {/* Module Assigned vs Attended - TEMPORARY PLACEHOLDER */}
        <Card>
          <CardHeader>
            <CardTitle>Module Assigned vs Attended</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-muted-foreground text-center mb-4">
              Too many modules to display a meaningful chart.<br />
              Please use the details page for in-depth analytics.
            </div>
            <Button variant="outline" onClick={() => navigate("/analytics/modules")}>Go to Modules Details</Button>
            {/* TODO: Implement scalable chart with search/filter/pagination for large datasets */}
          </CardContent>
        </Card>

        {/* QA Assigned vs Attended */}
        <Card>
          <CardHeader>
            <CardTitle>QA Assigned vs Attended</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{
                name: "All QAs",
                assigned: qas.length,
                attended: qas.filter((qa: any) => qa.score !== undefined && qa.score !== null).length
              }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
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
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Created", value: modules.length },
                { name: "Used", value: new Set(progress.map((p: any) => p.lms_module)).size }
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
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
            <PaginatedTable
              data={progress.filter((p: any) => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'Completed')}
              columns={[
                { key: 'learner', header: 'Learner' },
                { key: 'lms_module', header: 'Module' },
                { key: 'due_date', header: 'Due Date' },
                { key: 'action', header: 'Action' }
              ]}
              emptyMessage="No missed due dates."
            />
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
            <div className="mb-4">
              <Input
                placeholder="Search modules..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <PaginatedTable
              data={neverAttendedModules}
              columns={[
                { key: 'name', header: 'Module' },
                { key: 'assignment_type', header: 'Assignment Type' }
              ]}
              itemsPerPage={10}
              emptyMessage={
                moduleSearch 
                  ? "No matching modules found." 
                  : "All modules have been attended."
              }
            />
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