import React, { useState, useEffect } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  CheckCircle,
  Clock,
  Target,
  GraduationCap,
  Calendar,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface ModuleDetailsDrawerProps {
  item: ModuleAnalytics | null;
  isOpen: boolean;
  onClose: () => void;
}

const StatCard = ({ title, value, icon, description }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string;
}) => (
  <div className="bg-muted/50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
    </div>
    <div className="text-2xl font-bold">{value}</div>
    {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
  </div>
);

const LearnerStatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'not started':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant(status)}>
      {status}
    </Badge>
  );
};

export function ModuleDetailsDrawer({ item, isOpen, onClose }: ModuleDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'learners'>('overview');

  const {
    data: moduleDetails,
    error,
    isLoading,
    mutate
  } = useFrappeGetCall(
    'getModuleAnalytics',
    isOpen && item?.module_id ? { module_id: item.module_id } : undefined,
    'getModuleAnalytics'
  );

  const details = moduleDetails?.message as ModuleDetailsResponse;
  const moduleInfo = details?.module_details;
  const statistics = details?.statistics;
  const learners = details?.learners || [];

  const learnerColumns = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department' },
    { key: 'status', header: 'Status', render: (learner: ModuleLearner) => (
      <LearnerStatusBadge status={learner.status} />
    )},
    { key: 'progress', header: 'Progress', render: (learner: ModuleLearner) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{learner.progress}%</span>
        <Progress value={learner.progress} className="w-20 h-2" />
      </div>
    )},
    { key: 'score', header: 'Score', render: (learner: ModuleLearner) => {
      if (!learner.score && moduleInfo?.has_scoring) return 'Not scored';
      if (!moduleInfo?.has_scoring) return 'N/A';
      return `${learner.score}/${moduleInfo.total_score}`;
    }},
    { key: 'started_on', header: 'Started', render: (learner: ModuleLearner) => (
      learner.started_on ? new Date(learner.started_on).toLocaleDateString() : 'Not started'
    )},
    { key: 'completed_on', header: 'Completed', render: (learner: ModuleLearner) => (
      learner.completed_on ? new Date(learner.completed_on).toLocaleDateString() : 'Not completed'
    )},
  ];

  // Filter learners by status
  const completedLearners = learners.filter(l => l.status.toLowerCase() === 'completed');
  const inProgressLearners = learners.filter(l => l.status.toLowerCase() === 'in progress');
  const notStartedLearners = learners.filter(l => l.status.toLowerCase() === 'not started');

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-xl sm:max-w-[50vw] overflow-y-auto p-4" side="right" >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">
                {item?.module_name || 'Module Details'}
              </SheetTitle>
              <SheetDescription>
                Detailed analytics and learner information
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load module details. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'learners')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="learners">Learners ({learners.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Module Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Module Information</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Title:</span>
                      <span className="font-medium">{moduleInfo?.title || item?.module_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Department:</span>
                      <Badge variant="outline">{moduleInfo?.department?.name || item?.department}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Assignment Type:</span>
                      <Badge variant={item?.assignment_type === 'Department' ? 'default' : 'secondary'}>
                        {item?.assignment_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Duration:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{item?.duration || moduleInfo?.duration} days</span>
                      </div>
                    </div>
                  </div>
                  {/* <div className="space-y-2">
                    {moduleInfo?.description && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Description:</span>
                        <p className="text-sm mt-1 text-muted-foreground">{moduleInfo.description}</p>
                      </div>
                    )}
                    {moduleInfo?.department?.tl && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Team Lead:</span>
                        <span className="font-medium">{moduleInfo.department.tl}</span>
                      </div>
                    )}
                  </div> */}
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Statistics</h3>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <StatCard
                    title="Assigned"
                    value={statistics?.assigned_learners || item?.assigned || 0}
                    icon={<Users className="h-4 w-4 text-primary" />}
                  />
                  <StatCard
                    title="Attended"
                    value={statistics?.attended_learners || item?.attended || 0}
                    icon={<GraduationCap className="h-4 w-4 text-primary" />}
                  />
                  <StatCard
                    title="Completed"
                    value={statistics?.completed_learners || item?.completed || 0}
                    icon={<CheckCircle className="h-4 w-4 text-primary" />}
                  />
                  <StatCard
                    title="Completion Rate"
                    value={`${statistics?.completion_rate?.toFixed(1) || item?.completion_rate?.toFixed(1) || 0}%`}
                    icon={<Target className="h-4 w-4 text-primary" />}
                  />
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Progress Overview</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion Rate</span>
                      <span>{statistics?.completion_rate?.toFixed(1) || item?.completion_rate?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={statistics?.completion_rate || item?.completion_rate || 0} className="h-2" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="learners" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Learner Details</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">Total: {learners.length}</Badge>
                  <Badge variant="default">Completed: {completedLearners.length}</Badge>
                  <Badge variant="secondary">In Progress: {inProgressLearners.length}</Badge>
                  <Badge variant="outline">Not Started: {notStartedLearners.length}</Badge>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {learnerColumns.map(col => (
                        <TableHead key={col.key}>{col.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learners.length > 0 ? (
                      learners.map((learner, index) => (
                        <TableRow key={learner.user_id || index}>
                          {learnerColumns.map(col => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(learner) : learner[col.key as keyof ModuleLearner]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={learnerColumns.length} className="h-24 text-center">
                          No learners found for this module.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
} 