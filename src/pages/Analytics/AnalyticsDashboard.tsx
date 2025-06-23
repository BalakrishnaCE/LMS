import React, { useMemo, useState } from "react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";
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
  CheckCircle,
  Layers,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BookOpen,
  Download,
  Calendar,
  Clock,
  GraduationCap,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizDetailsDrawer } from "./QuizDetailsDrawer";
import { QADetailsDrawer } from "./QADetailsDrawer";
import { ModuleDetailsDrawer } from "./ModuleDetailsDrawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Interfaces from backend
interface QuizProgress {
  user: string;
  quiz_id: string;
  module: { id: string | null; name: string | null; name1: string | null; };
  score: number;
  max_score: number;
  ended_on?: string;
  started_on?: string;
  time_spent?: number;
  data: { question: string; marked_ans: string | null; correct_ans: string | null; }[];
  time_limit_mins?: number;
}

interface QuestionAnswerProgress {
  user: string;
  qa_id: string;
  module: { id: string | null; name: string | null; name1: string | null; };
  score?: number;
  max_score?: number;
  end_time?: string;
  start_time?: string;
  duration?: number;
  status?: 'Pending' | 'Scored';
  responses: { question: string; answer: string; suggested_answer: string; }[];
  time_limit_mins?: number;
  name: string;
}

interface AnalyticsResponse {
  quiz_progress: QuizProgress[];
  qa_progress: QuestionAnswerProgress[];
}

// New interfaces for Module Analytics
interface ModuleAnalytics {
  module_id: string;
  module_name: string;
  department: string;
  assignment_type: string;
  assigned: number;
  attended: number;
  completed: number;
  completion_rate: number;
  attendance_rate: number;
  duration: number;
  has_scoring: boolean;
  total_score: number;
}

interface ModuleAnalyticsResponse {
  modules: ModuleAnalytics[];
  summary: {
    total_modules: number;
    total_assigned: number;
    total_attended: number;
    total_completed: number;
    average_completion_rate: number;
    average_attendance_rate: number;
  };
  pagination: {
    total_count: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface ModuleLearner {
  user_id: string;
  full_name: string;
  email: string;
  department: string;
  status: string;
  progress: number;
  score?: number;
  started_on?: string;
  completed_on?: string;
  attended: boolean;
}

interface ModuleDetails {
  name: string;
  title: string;
  description: string;
  duration: number;
  assignment_based: string;
  department: {
    name: string;
    tl: string;
  };
  total_score: number;
  has_scoring: boolean;
}

interface ModuleDetailsResponse {
  module_details: ModuleDetails;
  statistics: {
    assigned_learners: number;
    attended_learners: number;
    completed_learners: number;
    completion_rate: number;
    attendance_rate: number;
  };
  learners: ModuleLearner[];
}

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

const PaginatedTable = ({ 
  columns, 
    data, 
    onRowClick,
    emptyMessage = "No data available." 
}: { 
    columns: { key: string; header: string; render?: (item: any) => React.ReactNode }[];
  data: any[]; 
    onRowClick: (item: any) => void;
  emptyMessage?: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const currentData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

  return (
        <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
                            {columns.map(col => <TableHead key={col.key}>{col.header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item, index) => (
                                <TableRow key={item.user + item.quiz_id || index} onClick={() => onRowClick(item)} className="cursor-pointer">
                                    {columns.map(col => (
                                        <TableCell key={col.key}>
                                            {col.render ? col.render(item) : item[col.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
            </PaginationItem>
                        <PaginationItem>
                            <PaginationLink>{currentPage}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
        </>
  );
};

export default function AnalyticsDashboard() {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizProgress | null>(null);
  const [selectedQA, setSelectedQA] = useState<QuestionAnswerProgress | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'quiz' | 'qa' | 'modules'>('quiz');
  const [activeQATab, setActiveQATab] = useState<'scored' | 'pending'>('scored');
  const { data, error, isLoading, mutate: mutateAnalytics } = useFrappeGetCall('QA&QuizAnalytics', {}, 'QA&QuizAnalytics');
  
  // Module Analytics data
  const { 
    data: moduleData, 
    error: moduleError, 
    isLoading: moduleLoading, 
    mutate: mutateModuleAnalytics 
  } = useFrappeGetCall('getModuleAnalytics', { limit: 20, offset: 0 }, 'getModuleAnalytics');

  const [selectedQuizItem, setSelectedQuizItem] = useState<QuizProgress | null>(null);
  const [selectedQAItem, setSelectedQAItem] = useState<QuestionAnswerProgress | null>(null);
  const [selectedModuleItem, setSelectedModuleItem] = useState<ModuleAnalytics | null>(null);
  const [isQuizDrawerOpen, setIsQuizDrawerOpen] = useState(false);
  const [isQADrawerOpen, setIsQADrawerOpen] = useState(false);
  const [isModuleDrawerOpen, setIsModuleDrawerOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState<Record<string, number | string>>({});

  const { updateDoc, loading: isUpdating } = useFrappeUpdateDoc();

  const handleScoreInputChange = (name: string, value: number | string) => {
    setScoreInput(prev => ({ ...prev, [name]: value }));
  };

  const handleAddScore = (item: QuestionAnswerProgress) => {
    const score = scoreInput[item.name];
    if (typeof score !== 'number' || isNaN(score) || !item.max_score) {
      toast.error("Invalid score input. Please enter a valid number.");
      return;
    };

    if (score > item.max_score) {
      toast.error(`Score cannot be greater than max score (${item.max_score})`);
      return;
    }
    
    updateDoc('Question Answer Progress', item.name, { score })
      .then(() => {
        toast.success('Score added successfully');
        mutateAnalytics();
        setScoreInput(prev => {
          const newState = { ...prev };
          delete newState[item.name];
          return newState;
        });
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to add score');
      });
  }

  const message = data?.message || {};
  const modules = message.modules || [];
  const quizProgress = message.quiz_progress || [];
  const progress = message.progress || [];
  const qas = message.qa_progress || [];

  // Module Analytics data
  const moduleAnalytics = moduleData?.message || {};
  const moduleList = moduleAnalytics.modules || [];
  const moduleSummary = moduleAnalytics.summary || {};

  const publishedModules = useMemo(() => modules.filter((m: any) => m.published), [modules]);

  const activeLearners = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Set(
      progress
        .filter((p: any) => p.modified && new Date(p.modified) > thirtyDaysAgo)
        .map((p: any) => p.learner)
    ).size;
  }, [progress]);

  const completionRate = useMemo(() => {
    if (progress.length === 0) return 0;
    const completed = progress.filter((p: any) => p.status === 'Completed').length;
    return Math.round((completed / progress.length) * 100);
  }, [progress]);

  const avgQuizScore = useMemo(() => {
    if (quizProgress.length === 0) return 0;
    const scores = quizProgress.filter((q: any) => q.score !== undefined && q.score !== null);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum: number, q: any) => sum + q.score, 0) / scores.length);
  }, [quizProgress]);

  const avgQAScore = useMemo(() => {
    if (qas.length === 0) return 0;
    const scores = qas.filter((qa: any) => qa.score !== undefined && qa.score !== null);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum: number, qa: any) => sum + qa.score, 0) / scores.length);
  }, [qas]);

  const statCards = [
    { title: "Active Learners", value: activeLearners, icon: <Users className="h-6 w-6 text-primary" />, description: "Learners active in last 30 days" },
    { title: "Total Modules", value: modules.length, icon: <Layers className="h-6 w-6 text-primary" />, description: "All modules in the system" },
    { title: "Published Modules", value: publishedModules.length, icon: <CheckCircle className="h-6 w-6 text-primary" />, description: "Modules available to learners" },
    { title: "Completion Rate", value: `${completionRate}%`, icon: <Target className="h-6 w-6 text-primary" />, description: "Overall module completion rate" },
    { title: "Avg Quiz Score", value: `${avgQuizScore}%`, icon: <Award className="h-6 w-6 text-primary" />, description: "Average quiz performance" },
    { title: "Avg QA Score", value: `${avgQAScore}%`, icon: <BookOpen className="h-6 w-6 text-primary" />, description: "Average Q&A performance" },
  ];

  const quizColumns = [
    { key: 'user', header: 'User' },
    { key: 'module', header: 'Module', render: (item: QuizProgress) => item.module?.name1 || 'N/A' },
    { key: 'score', header: 'Score (%)', render: (item: QuizProgress) => {
      const percentage = Math.round((item.score / item.max_score) * 100);
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{percentage}%</span>
          <Progress value={percentage} className="w-20 h-2" />
        </div>
      );
    }},
    { key: 'date_attended', header: 'Date Attended', render: (item: QuizProgress) => {
      return item.ended_on ? new Date(item.ended_on).toLocaleDateString() : 'N/A';
    }},
    { key: 'time_spent', header: 'Time Spent', render: (item: QuizProgress) => {
      if (!item.started_on || !item.ended_on) return 'N/A';
      const duration = new Date(item.ended_on).getTime() - new Date(item.started_on).getTime();
      const seconds = Math.floor((duration / 1000) % 60);
      const minutes = Math.floor((duration / (1000 * 60)) % 60);
      const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

      let timeString = '';
      if (hours > 0) timeString += `${hours}h `;
      if (minutes > 0) timeString += `${minutes}m `;
      if (seconds > 0 || (hours === 0 && minutes === 0)) timeString += `${seconds}s`;
      
      return timeString.trim();
    }},
    { key: 'time_limit_mins', header: 'Time Limit', render: (item: QuizProgress) => {
      return item.time_limit_mins ? item.time_limit_mins + ' mins' : 'N/A';
    }},

  ];
  
  const qaColumns = [
    { key: 'user', header: 'User' },
    { key: 'module', header: 'Module', render: (item: QuestionAnswerProgress) => item.module?.name1 || 'N/A' },
    { key: 'score', header: 'Score (%)', render: (item: QuestionAnswerProgress) => {
      if (!item.score || !item.max_score) return 'N/A';
      const percentage = Math.round((item.score / item.max_score) * 100);
      return `${item.score}/${item.max_score} (${percentage}%)`;
    }},
    { key: 'date', header: 'Date', render: (item: QuestionAnswerProgress) => {
      return item.end_time ? new Date(item.end_time).toLocaleDateString() : 'N/A';
    }},
    { key: 'time_spent', header: 'Time Spent', render: (item: QuestionAnswerProgress) => {
      if (!item.start_time || !item.end_time) return 'N/A';
      const duration = new Date(item.end_time).getTime() - new Date(item.start_time).getTime();
      const seconds = Math.floor((duration / 1000) % 60);
      const minutes = Math.floor((duration / (1000 * 60)) % 60);
      const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

      let timeString = '';
      if (hours > 0) timeString += `${hours}h `;
      if (minutes > 0) timeString += `${minutes}m `;
      if (seconds > 0 || (hours === 0 && minutes === 0)) timeString += `${seconds}s`;
      
      return timeString.trim();
    }},
    {key: 'time_limit_mins', header: 'Time Limit', render: (item: QuestionAnswerProgress) => {
        return item.time_limit_mins ? item.time_limit_mins + ' mins' : 'N/A';
      }},
    {
      key: 'actions',
      header: 'Actions',
      render: (item: QuestionAnswerProgress) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => { setSelectedQAItem(item); setIsQADrawerOpen(true); }}>View</Button>
          {item.status === 'Pending' && (
            <Popover onOpenChange={(isOpen) => {
              if(!isOpen) {
                setScoreInput(prev => {
                  const newState = { ...prev };
                  delete newState[item.name];
                  return newState;
                });
              }
            }}>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm">Add Score</Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="flex flex-col space-y-2">
                  <Input 
                    type="number" 
                    placeholder={`Max: ${item.max_score}`} 
                    value={scoreInput[item.name] || ''}
                    onChange={(e) => handleScoreInputChange(item.name, e.target.valueAsNumber)}
                    max={item.max_score}
                    min={0}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleAddScore(item)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )
    },
  ];

  // Separate QA data into scored and pending
  const qaData = data?.data.qa_progress || [];
  const scoredQAData = qaData.filter((item: QuestionAnswerProgress) => item.status === 'Scored' || (item.score && item.max_score));
  const pendingQAData = qaData.filter((item: QuestionAnswerProgress) => item.status === 'Pending' || (!item.score || !item.max_score));

  // Module Analytics columns
  const moduleColumns = [
    { key: 'module_name', header: 'Module Name' },
    { key: 'department', header: 'Department' },
    { key: 'assignment_type', header: 'Assignment Type', render: (item: ModuleAnalytics) => (
      <Badge variant={item.assignment_type === 'Department' ? 'default' : item.assignment_type === 'Manual' ? 'secondary' : 'outline'}>
        {item.assignment_type}
      </Badge>
    )},
    { key: 'assigned', header: 'Assigned', render: (item: ModuleAnalytics) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{item.assigned}</span>
      </div>
    )},
    { key: 'attended', header: 'Attended', render: (item: ModuleAnalytics) => (
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{item.attended}</span>
      </div>
    )},
    { key: 'completion_rate', header: 'Completion Rate', render: (item: ModuleAnalytics) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{item.completion_rate.toFixed(1)}%</span>
        <Progress value={item.completion_rate} className="w-20 h-2" />
      </div>
    )},
    { key: 'duration', header: 'Duration', render: (item: ModuleAnalytics) => (
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>{item.duration} days</span>
      </div>
    )},
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive learning analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { mutateAnalytics(); mutateModuleAnalytics(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => mutateAnalytics()} />}
      {moduleError && <ErrorAlert error={moduleError} onRetry={() => mutateModuleAnalytics()} />}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statCards.map((card) => (
            <Card key={card.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  {card.icon} {card.title}
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

      <Card>
        <Tabs defaultValue="module_analytics" className="w-full">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="module_analytics">Module Analytics</TabsTrigger>
              <TabsTrigger value="quiz_analytics">Quiz Analytics</TabsTrigger>
              <TabsTrigger value="qa_analytics">Q&A Analytics</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="module_analytics">
              {moduleLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-4">
                  {/* Module Summary Cards */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Total Modules</span>
                        </div>
                        <div className="text-2xl font-bold mt-2">{moduleSummary.total_modules || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Total Assigned</span>
                        </div>
                        <div className="text-2xl font-bold mt-2">{moduleSummary.total_assigned || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Total Attended</span>
                        </div>
                        <div className="text-2xl font-bold mt-2">{moduleSummary.total_attended || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Avg Completion</span>
                        </div>
                        <div className="text-2xl font-bold mt-2">{moduleSummary.average_completion_rate?.toFixed(1) || 0}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Module Table */}
                  <PaginatedTable
                    columns={moduleColumns}
                    data={moduleList}
                    onRowClick={setSelectedModuleItem}
                    emptyMessage="No module analytics data found."
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="quiz_analytics">
                {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
            <PaginatedTable
                        columns={quizColumns}
                        data={data?.data.quiz_progress || []}
                        onRowClick={setSelectedQuizItem}
                        emptyMessage="No quiz submissions found."
                    />
                )}
            </TabsContent>
            <TabsContent value="qa_analytics">
                {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
                    <Tabs defaultValue="scored" className="w-full">
                        <TabsList>
                            <TabsTrigger value="scored">Scored ({scoredQAData.length})</TabsTrigger>
                            <TabsTrigger value="pending">Pending Score ({pendingQAData.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="scored">
                            <PaginatedTable
                                columns={qaColumns}
                                data={scoredQAData}
                                onRowClick={setSelectedQAItem}
                                emptyMessage="No scored Q&A submissions found."
                            />
                        </TabsContent>
                        <TabsContent value="pending">
            <PaginatedTable
                                columns={qaColumns}
                                data={pendingQAData}
                                onRowClick={setSelectedQAItem}
                                emptyMessage="No pending Q&A submissions found."
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </TabsContent>
          </CardContent>
        </Tabs>
        </Card>

      <QuizDetailsDrawer
          item={selectedQuizItem}
          isOpen={!!selectedQuizItem}
          onClose={() => setSelectedQuizItem(null)}
      />

      <QADetailsDrawer
          item={selectedQAItem}
          isOpen={!!selectedQAItem}
          onClose={() => setSelectedQAItem(null)}
      />

      <ModuleDetailsDrawer
          key={selectedModuleItem?.module_id}
          item={selectedModuleItem}
          isOpen={!!selectedModuleItem}
          onClose={() => setSelectedModuleItem(null)}
      />
    </div>
  );
} 