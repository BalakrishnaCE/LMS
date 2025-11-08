import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  User,
  BookOpen,
  Activity,
  Award,
  Download,
  RefreshCw,
  AlertTriangle,
  X,
  CheckCircle,
  Clock,
  Target,
  FileText,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';


// Import the new analytics hook
import { useLMSAnalytics } from "@/lib/api";
import { useFrappeGetCall } from "frappe-react-sdk";
import { LMS_API_BASE_URL } from "@/config/routes";

interface FilterState {
  dateRange: string;
  dateFrom: string;
  dateTo: string;
  department: string;
  module: string;
  learner: string;
  quiz: string;
}

// Custom hook for pagination
const usePagination = (data: any[], itemsPerPage: number = 10): {
  currentData: any[];
  currentPage: number;
  maxPage: number;
  next: () => void;
  prev: () => void;
  jump: (page: number) => void;
  reset: () => void;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const next = () => setCurrentPage((current) => Math.min(current + 1, maxPage));
  const prev = () => setCurrentPage((current) => Math.max(current - 1, 1));
  const jump = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, maxPage));
    setCurrentPage(pageNumber);
  };
  const reset = () => setCurrentPage(1);

  return {
    currentData,
    currentPage,
    maxPage,
    next,
    prev,
    jump,
    reset,
    hasNext: currentPage < maxPage,
    hasPrev: currentPage > 1
  };
};

// Utility functions



export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("modules");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "last_30_days",
    dateFrom: "",
    dateTo: "",
    department: "",
    module: "",
    learner: "",
    quiz: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<{
    type: 'module' | 'learner';
    data: any;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('total');
  const [learnerDetails, setLearnerDetails] = useState<any[]>([]);
  const [allLearnerDetails, setAllLearnerDetails] = useState<any[]>([]);
  const [quizAnalyticsView, setQuizAnalyticsView] = useState<'overview' | 'quiz' | 'qa'>('overview');
  const [qaScoreFilter, setQaScoreFilter] = useState<'scored' | 'pending'>('scored');
  const [quizAnalyticsData, setQuizAnalyticsData] = useState<any[]>([]);
  const [qaAnalyticsData, setQaAnalyticsData] = useState<any[]>([]);
  const [qaScoredData, setQaScoredData] = useState<any[]>([]);
  const [qaPendingData, setQaPendingData] = useState<any[]>([]);
  const [loadingQuizAnalytics, setLoadingQuizAnalytics] = useState(false);
  const [loadingQaAnalytics, setLoadingQaAnalytics] = useState(false);
  const [quizCurrentPage, setQuizCurrentPage] = useState(1);
  const [quizTotalPages, setQuizTotalPages] = useState(1);
  const [qaCurrentPage, setQaCurrentPage] = useState(1);
  const [qaTotalPages, setQaTotalPages] = useState(1);
  const [showQuizDetailsModal, setShowQuizDetailsModal] = useState(false);
  const [quizDetailsData, setQuizDetailsData] = useState<any>(null);
  const [loadingQuizDetails, setLoadingQuizDetails] = useState(false);
  const [showQaDetailsModal, setShowQaDetailsModal] = useState(false);
  const [qaDetailsData, setQaDetailsData] = useState<any>(null);
  const [loadingQaDetails, setLoadingQaDetails] = useState(false);
  const [qaAllotedMarks, setQaAllotedMarks] = useState<number[]>([]);
  const [showAddScoreModal, setShowAddScoreModal] = useState(false);
  const [scoreValue, setScoreValue] = useState('');
  const [loadingAddScore, setLoadingAddScore] = useState(false);
  const [scoreUpdateSuccess, setScoreUpdateSuccess] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [learnerSidebarData, setLearnerSidebarData] = useState<any>(null);
  const [loadingLearnerSidebar, setLoadingLearnerSidebar] = useState(false);
  const [learnerModuleFilter, setLearnerModuleFilter] = useState<string>('all');
  const [learnerCurrentPage, setLearnerCurrentPage] = useState(1);
  const [learnerTotalPages, setLearnerTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  
  // Debug: Log learnerDetails changes
  React.useEffect(() => {
  }, [learnerDetails]);
  const [loadingLearners, setLoadingLearners] = useState(false);
  
  // Data persistence state to prevent data loss during tab switches
  const [persistedData, setPersistedData] = useState<any>(null);
  const [dataInitialized, setDataInitialized] = useState(false);

  // Load persisted data from localStorage on component mount
  React.useEffect(() => {
    try {
      const storedData = localStorage.getItem('analytics_persisted_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // console.log('Loading persisted data from localStorage:', parsedData);
        if (validateAnalyticsData(parsedData)) {
          setPersistedData(parsedData);
          setDataInitialized(true);
        }
      }
    } catch (error) {
      console.error('Error loading persisted data from localStorage:', error);
    }
  }, []);

  // Data validation function
  const validateAnalyticsData = (data: any) => {
    if (!data || typeof data !== 'object') return false;
    
    // Check if we have meaningful data
    const hasOverview = data.overview && (
      data.overview.total_learners > 0 || 
      data.overview.total_modules > 0 || 
      data.overview.total_learners > 0
    );
    
    const hasModuleAnalytics = data.module_analytics && data.module_analytics.length > 0;
    
    return hasOverview || hasModuleAnalytics;
  };

  // API call with filters
  const { data: analyticsData, isLoading: dataLoading, error, mutate } = useLMSAnalytics(filters);
  
  // Separate API call for learners data
  const { data: learnersData, isLoading: learnersLoading, error: learnersError } = useFrappeGetCall<any>("novel_lms.novel_lms.api.analytics.get_learners_analytics_data");
  
  
  // Safely extract data with fallbacks - handle double-nested message structure
  const rawData = (analyticsData as any)?.message?.message || (analyticsData as any)?.message || analyticsData || {};
  
  // Use persisted data if available, otherwise use fresh data
  const safeData = persistedData || rawData;
  
  // Create fallback data structure to prevent zero values
  const createFallbackData = () => ({
    overview: {
      total_learners: 0,
      total_modules: 0,
      completion_rate: 0,
      avg_progress: 0,
      total_quizzes: 0,
      total_qa: 0,
      total_assessments: 0,
      total_achievements: 0,
      avg_quiz_score: 0,
      quiz_attempts: 0,
      qa_attempts: 0,
      total_attempts: 0
    },
    module_analytics: [],
    department_analytics: [],
    recent_activity: []
  });
  
  // Ensure we always have a valid data structure
  const finalData = safeData && Object.keys(safeData).length > 0 ? safeData : createFallbackData();
  
  // Add fallback to prevent zero values during refresh
  const preventZeroValues = (data: any) => {
    if (!data || !data.overview) return data;
    
    // If we have persisted data and the new data has zero values, use persisted data
    if (persistedData && persistedData.overview && 
        (data.overview.total_learners === 0)) {
      
      return persistedData;
    }
    
    return data;
  };
  
  const finalDataWithFallback = preventZeroValues(finalData);
  
  

  React.useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false);
    }
  }, [dataLoading]);

  // Persist data when successfully loaded
  React.useEffect(() => {
    if (!dataLoading && rawData && validateAnalyticsData(rawData)) {
     
      setPersistedData(rawData);
      setDataInitialized(true);
      
      // Also save to localStorage for persistence across page reloads
      try {
        localStorage.setItem('analytics_persisted_data', JSON.stringify(rawData));
       
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [dataLoading, rawData]);

  // Force refresh analytics data when tab changes or data is empty
  React.useEffect(() => {
    if (activeTab === 'modules' && !dataLoading && !validateAnalyticsData(finalDataWithFallback)) {
      
      mutate();
    }
  }, [activeTab, dataLoading, finalDataWithFallback, mutate]);

  // Handle tab switching with data preservation
  React.useEffect(() => {
    
    
    // Only refresh if we're switching to modules and we don't have valid persisted data
    if (activeTab === 'modules' && !dataLoading && !dataInitialized && !validateAnalyticsData(finalDataWithFallback)) {
      
      mutate();
    }
  }, [activeTab, dataLoading, dataInitialized, finalData, mutate]);

  // Hide main page scrollbar when sidebar is open
  React.useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to restore scrollbar when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSidebar]);

  // Fetch learner details when sidebar opens for a module
  React.useEffect(() => {
    if (showSidebar && sidebarContent?.type === 'module') {
      fetchLearnerDetails('total');
    }
  }, [showSidebar, sidebarContent]);

  // Fetch quiz analytics when quiz view is selected
  React.useEffect(() => {
    if (quizAnalyticsView === 'quiz') {
      fetchQuizAnalytics();
    } else if (quizAnalyticsView === 'qa') {
      fetchQaAnalytics();
    }
  }, [quizAnalyticsView]);

  // Ensure modules tab has quiz and Q&A counts available by fetching once when modules is active
  React.useEffect(() => {
    if (activeTab === 'modules') {
      if (!quizAnalyticsData || quizAnalyticsData.length === 0) {
        fetchQuizAnalytics();
      }
      if (!qaAnalyticsData || qaAnalyticsData.length === 0) {
        fetchQaAnalytics();
      }
    }
  }, [activeTab]);

  // Add error boundary for analytics data
  React.useEffect(() => {
    if (error) {
      console.error('Analytics data error:', error);
      // Try to refetch data on error
      setTimeout(() => {
        mutate();
      }, 2000);
    }
  }, [error, mutate]);

  // Update pagination when Q&A score filter changes
  React.useEffect(() => {
    if (qaAnalyticsData.length > 0) {
      const currentData = qaScoreFilter === 'scored' ? qaScoredData : qaPendingData;
      setQaTotalPages(Math.ceil(currentData.length / itemsPerPage));
      setQaCurrentPage(1); // Reset to first page when filter changes
    }
  }, [qaScoreFilter, qaScoredData, qaPendingData]);

  // Update pagination when learners data changes
  React.useEffect(() => {
    if (learnersData?.message?.message?.learner_analytics?.length > 0) {
      setLearnerTotalPages(Math.ceil(learnersData.message.message.learner_analytics.length / itemsPerPage));
      setLearnerCurrentPage(1); // Reset to first page when data changes
    }
  }, [learnersData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset pagination when filters change
    modulePagination.reset();
    quizPagination.reset();
    setLearnerCurrentPage(1);
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '_')] || row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(","))
    ].join("\n");
    return csvContent;
  };

  // Helper function to download CSV
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
     
      
      // Get current date for filename
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Export Overview Data
      if (finalDataWithFallback?.overview) {
        const overviewData = [{
          'Total Learners': finalDataWithFallback.overview.total_learners || 0,
          'Total Modules': finalDataWithFallback.overview.total_modules || 0,
          'Completed Modules': finalDataWithFallback.overview.completed_modules || 0,
          'In Progress Modules': finalDataWithFallback.overview.in_progress_modules || 0,
          'Not Started Modules': finalDataWithFallback.overview.not_started_modules || 0,
          'Average Progress': finalDataWithFallback.overview.average_progress || 0,
          'Total Quiz Attempts': finalDataWithFallback.overview.total_quiz_attempts || 0,
          'Total Q&A Attempts': finalDataWithFallback.overview.total_qa_attempts || 0
        }];
        
        const overviewHeaders = ['Total Learners', 'Total Modules', 'Completed Modules', 'In Progress Modules', 'Not Started Modules', 'Average Progress', 'Total Quiz Attempts', 'Total Q&A Attempts'];
        const overviewCSV = convertToCSV(overviewData, overviewHeaders);
        downloadCSV(overviewCSV, `analytics_overview_${currentDate}.csv`);
      }
      
      // Export Module Analytics with Complete Details
      if (finalDataWithFallback?.module_analytics && finalDataWithFallback.module_analytics.length > 0) {
        const moduleData = finalDataWithFallback.module_analytics.map((module: any) => ({
          'Module ID': module.module_id || module.name || 'N/A',
          'Module Name': module.module_name?.replace(/<[^>]*>/g, '') || module.name?.replace(/<[^>]*>/g, '') || 'N/A',
          'Description': module.description?.replace(/<[^>]*>/g, '') || 'N/A',
          'Short Text': module.short_text?.replace(/<[^>]*>/g, '') || 'N/A',
          'Duration': module.duration || 'N/A',
          'Department': module.department || 'N/A',
          'Assignment Type': module.assignment_type || module.assignment_based || 'N/A',
          'Status': module.status || 'N/A',
          'Is Published': module.is_published ? 'Yes' : 'No',
          'Has Scoring': module.has_scoring ? 'Yes' : 'No',
          'Has Progress': module.has_progress ? 'Yes' : 'No',
          'Total Score': module.total_score || 0,
          'Order': module.order || 0,
          'Created By': module.created_by || 'N/A',
          'Published By': module.published_by || 'N/A',
          'Image': module.image || 'N/A',
          'Assigned Count': module.enrolled_count || 0,
          'Completed Count': module.completed_count || 0,
          'Completion Rate': module.completion_rate || 0,
          'Average Score': module.avg_score || 0,
          'In Progress Count': module.in_progress_count || 0,
          'Not Started Count': module.not_started_count || 0
        }));
        
        const moduleHeaders = [
          'Module ID', 'Module Name', 'Description', 'Short Text', 'Duration', 'Department', 
          'Assignment Type', 'Status', 'Is Published', 'Has Scoring', 'Has Progress', 
          'Total Score', 'Order', 'Created By', 'Published By', 'Image', 
          'Assigned Count', 'Completed Count', 'Completion Rate', 'Average Score', 
          'In Progress Count', 'Not Started Count'
        ];
        const moduleCSV = convertToCSV(moduleData, moduleHeaders);
        downloadCSV(moduleCSV, `analytics_modules_detailed_${currentDate}.csv`);
      }
      
      // Export Quiz Analytics with Complete Details
      if (finalDataWithFallback?.quiz_analytics && finalDataWithFallback.quiz_analytics.length > 0) {
        const quizData = finalDataWithFallback.quiz_analytics.map((quiz: any) => ({
          'Quiz ID': quiz.quiz_id || quiz.name || 'N/A',
          'Quiz Name': quiz.name || 'N/A',
          'User': quiz.user || 'N/A',
          'Module ID': quiz.module?.id || quiz.module?.name || 'N/A',
          'Module Name': quiz.module?.name1 || quiz.module?.name || 'N/A',
          'Score': quiz.score || 0,
          'Max Score': quiz.max_score || 0,
          'Percentage Score': quiz.percentage_score || 0,
          'Total Attempts': quiz.total_attempts || 0,
          'Time Spent': quiz.time_spent || 'N/A',
          'Time Limit': quiz.time_limit || 'N/A',
          'Date Started': quiz.started_on || 'N/A',
          'Date Completed': quiz.ended_on || quiz.date_attended || 'N/A',
          'Status': quiz.status || 'N/A',
          'Quiz Progress ID': quiz.quiz_progress_id || 'N/A'
        }));
        
        const quizHeaders = [
          'Quiz ID', 'Quiz Name', 'User', 'Module ID', 'Module Name', 'Score', 'Max Score', 
          'Percentage Score', 'Total Attempts', 'Time Spent', 'Time Limit', 'Date Started', 
          'Date Completed', 'Status', 'Quiz Progress ID'
        ];
        const quizCSV = convertToCSV(quizData, quizHeaders);
        downloadCSV(quizCSV, `analytics_quizzes_detailed_${currentDate}.csv`);
      }
      
      // Export Q&A Analytics with Complete Details
      if (finalDataWithFallback?.qa_analytics && finalDataWithFallback.qa_analytics.length > 0) {
        const qaData = finalDataWithFallback.qa_analytics.map((qa: any) => ({
          'Q&A ID': qa.qa_id || qa.name || 'N/A',
          'Q&A Name': qa.name || 'N/A',
          'User': qa.user || 'N/A',
          'Module ID': qa.module?.id || qa.module?.name || 'N/A',
          'Module Name': qa.module?.name1 || qa.module?.name || 'N/A',
          'Score': qa.score || 0,
          'Max Score': qa.max_score || 0,
          'Percentage Score': qa.percentage_score || 0,
          'Total Attempts': qa.total_attempts || 0,
          'Time Spent': qa.time_spent || 'N/A',
          'Time Limit': qa.time_limit || 'N/A',
          'Date Started': qa.started_on || 'N/A',
          'Date Completed': qa.ended_on || qa.date_attended || 'N/A',
          'Status': qa.status || 'N/A',
          'Q&A Progress ID': qa.qa_progress_id || 'N/A'
        }));
        
        const qaHeaders = [
          'Q&A ID', 'Q&A Name', 'User', 'Module ID', 'Module Name', 'Score', 'Max Score', 
          'Percentage Score', 'Total Attempts', 'Time Spent', 'Time Limit', 'Date Started', 
          'Date Completed', 'Status', 'Q&A Progress ID'
        ];
        const qaCSV = convertToCSV(qaData, qaHeaders);
        downloadCSV(qaCSV, `analytics_qa_detailed_${currentDate}.csv`);
      }
      
      // Export Learner Analytics (if available)
      if (finalDataWithFallback?.learner_analytics && finalDataWithFallback.learner_analytics.length > 0) {
        const learnerData = finalDataWithFallback.learner_analytics.map((learner: any) => ({
          'Learner Name': learner.learner_name || learner.full_name || 'N/A',
          'Email': learner.email || 'N/A',
          'Department': learner.department || 'N/A',
          'Status': learner.status || 'N/A',
          'Modules Enrolled': learner.modules_enrolled || 0,
          'Modules Completed': learner.modules_completed || 0,
          'Completion Rate': learner.completion_rate || 0,
          'Average Progress': learner.avg_progress || 0,
          'Average Score': learner.avg_score || 0,
          'Total Time Spent': learner.total_time_spent || 0,
          'Achievements Count': learner.achievements_count || 0,
          'Last Activity': learner.last_activity || 'N/A',
          'Mobile No': learner.mobile_no || 'N/A',
          'Creation Date': learner.creation || 'N/A',
          'Last Login': learner.last_login || 'N/A',
          'User Image': learner.user_image || 'N/A',
          'Roles': learner.roles?.join(', ') || 'N/A'
        }));
        
        const learnerHeaders = [
          'Learner Name', 'Email', 'Department', 'Status', 'Modules Enrolled', 'Modules Completed', 
          'Completion Rate', 'Average Progress', 'Average Score', 'Total Time Spent', 'Achievements Count', 
          'Last Activity', 'Mobile No', 'Creation Date', 'Last Login', 'User Image', 'Roles'
        ];
        const learnerCSV = convertToCSV(learnerData, learnerHeaders);
        downloadCSV(learnerCSV, `analytics_learners_detailed_${currentDate}.csv`);
      }
      
      toast.success("Analytics data exported successfully! Check your downloads folder.");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
   
    setIsLoading(true);
    
    // Don't clear persisted data immediately - let the API call complete first
    
    // Force refresh the analytics data
    mutate();
    
    // Also refresh quiz and Q&A data if they're loaded
    if (quizAnalyticsData.length > 0) {
      fetchQuizAnalytics();
    }
    if (qaAnalyticsData.length > 0) {
      fetchQaAnalytics();
    }
    
    // Set a timeout to clear persisted data only if the new data is valid
    setTimeout(() => {
      
      if (validateAnalyticsData(rawData)) {
       
        setPersistedData(null);
        setDataInitialized(false);
        try {
          localStorage.removeItem('analytics_persisted_data');
          
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }
      } else {
      
      }
      setIsLoading(false);
    }, 2000);
  };

  const handleModuleClick = (module: any) => {
    
    setSidebarContent({
      type: 'module',
      data: module
    });
    setShowSidebar(true);
  };

  const handleLearnerClick = async (learner: any) => {
    
    setSidebarContent({
      type: 'learner',
      data: learner
    });
    setShowSidebar(true);
    setLoadingLearnerSidebar(true);
    setLearnerModuleFilter('all'); // Reset filter when new learner is clicked
    
    try {
      // Fetch detailed learner data
      const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.get_learner_sidebar_details?learner_name=${learner.name}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLearnerSidebarData(data.message.message);
        
      } else {
        console.error('Failed to fetch learner sidebar details');
        setLearnerSidebarData(null);
      }
    } catch (error) {
      console.error('Error fetching learner sidebar details:', error);
      setLearnerSidebarData(null);
    } finally {
      setLoadingLearnerSidebar(false);
    }
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSidebarContent(null);
  };

  const fetchQuizAnalytics = async () => {
    setLoadingQuizAnalytics(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.get_quiz_analytics`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quiz analytics');
      }
      
      const data = await response.json();
      
      
      if (data.message && data.message.success) {
        const allData = data.message.data.quiz_progress || [];
        setQuizAnalyticsData(allData);
        setQuizTotalPages(Math.ceil(allData.length / itemsPerPage));
        setQuizCurrentPage(1); // Reset to first page when new data is loaded
      } else {
        console.error('Quiz Analytics API Error:', data.message?.error);
        setQuizAnalyticsData([]);
        setQuizTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      setQuizAnalyticsData([]);
    } finally {
      setLoadingQuizAnalytics(false);
    }
  };

  const fetchQaAnalytics = async () => {
    setLoadingQaAnalytics(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.get_qa_analytics`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Q&A analytics');
      }
      
      const data = await response.json();
      
      
      if (data.message && data.message.success) {
        const allData = data.message.data.qa_progress || [];
        const scoredData = data.message.data.scored_data || [];
        const pendingData = data.message.data.pending_data || [];
        
        setQaAnalyticsData(allData);
        setQaScoredData(scoredData);
        setQaPendingData(pendingData);
        // Set total pages based on the current filter (scored or pending)
        const currentData = qaScoreFilter === 'scored' ? scoredData : pendingData;
        setQaTotalPages(Math.ceil(currentData.length / itemsPerPage));
        setQaCurrentPage(1); // Reset to first page when new data is loaded
      } else {
        console.error('Q&A Analytics API Error:', data.message?.error);
        setQaAnalyticsData([]);
        setQaScoredData([]);
        setQaPendingData([]);
        setQaTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching Q&A analytics:', error);
      setQaAnalyticsData([]);
      setQaScoredData([]);
      setQaPendingData([]);
    } finally {
      setLoadingQaAnalytics(false);
    }
  };

  // Get current page data for quiz analytics
  const getCurrentPageData = () => {
    const startIndex = (quizCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return quizAnalyticsData.slice(startIndex, endIndex);
  };

  // Get current page data for Q&A analytics
  const getCurrentQaPageData = () => {
    const startIndex = (qaCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = qaScoreFilter === 'scored' ? qaScoredData : qaPendingData;
    return currentData.slice(startIndex, endIndex);
  };

  // Pagination handlers for quiz analytics
  const handleQuizPageChange = (page: number) => {
    setQuizCurrentPage(page);
  };

  const handleQuizPrevPage = () => {
    if (quizCurrentPage > 1) {
      setQuizCurrentPage(quizCurrentPage - 1);
    }
  };

  const handleQuizNextPage = () => {
    if (quizCurrentPage < quizTotalPages) {
      setQuizCurrentPage(quizCurrentPage + 1);
    }
  };

  // Pagination handlers for Q&A analytics
  const handleQaPageChange = (page: number) => {
    setQaCurrentPage(page);
  };

  const handleQaPrevPage = () => {
    if (qaCurrentPage > 1) {
      setQaCurrentPage(qaCurrentPage - 1);
    }
  };

  const handleQaNextPage = () => {
    if (qaCurrentPage < qaTotalPages) {
      setQaCurrentPage(qaCurrentPage + 1);
    }
  };

  // Get current page data for learners
  const getCurrentLearnerPageData = () => {
    const startIndex = (learnerCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return learnersData?.message?.message?.learner_analytics?.slice(startIndex, endIndex) || [];
  };

  // Pagination handlers for learners
  const handleLearnerPageChange = (page: number) => {
    setLearnerCurrentPage(page);
  };

  const handleLearnerPrevPage = () => {
    if (learnerCurrentPage > 1) {
      setLearnerCurrentPage(learnerCurrentPage - 1);
    }
  };

  const handleLearnerNextPage = () => {
    if (learnerCurrentPage < learnerTotalPages) {
      setLearnerCurrentPage(learnerCurrentPage + 1);
    }
  };

  const fetchQuizDetails = async (quizProgressId: string) => {
    setLoadingQuizDetails(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.get_quiz_details?quiz_progress_id=${encodeURIComponent(quizProgressId)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quiz details');
      }
      
      const data = await response.json();
      
      
      if (data.message && data.message.success) {
        setQuizDetailsData(data.message.data);
        setShowQuizDetailsModal(true);
      } else {
        console.error('Quiz Details API Error:', data.message?.error);
        toast.error('Failed to load quiz details');
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      toast.error('Failed to load quiz details');
    } finally {
      setLoadingQuizDetails(false);
    }
  };

  const closeQuizDetailsModal = () => {
    setShowQuizDetailsModal(false);
    setQuizDetailsData(null);
  };

  const exportToPDF = async () => {
    if (!quizDetailsData) return;
    
    try {
      // Create filename: email_module_name.pdf
      const email = quizDetailsData.user || 'unknown';
      const moduleName = quizDetailsData.module?.name1 || quizDetailsData.module?.name || 'module';
      const filename = `${email}_${moduleName}.pdf`;
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("Quiz Report", 14, 22);
      
      // Subtitle
      doc.setFontSize(12);
      doc.text(`Module: ${quizDetailsData.module?.name1 || quizDetailsData.module?.name || 'N/A'}`, 14, 32);
      doc.text(`User: ${quizDetailsData.user || 'N/A'}`, 14, 40);
      
      // Summary information
      let yPosition = 55;
      doc.setFontSize(10);
      doc.text(`Date: ${quizDetailsData.date_attended || 'N/A'}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Time Spent: ${quizDetailsData.time_spent || 'N/A'}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Score: ${quizDetailsData.score || 0} / ${quizDetailsData.max_score || 0} (${quizDetailsData.percentage_score || 0}%)`, 14, yPosition);
      yPosition += 8;
      doc.text(`Time Limit: ${quizDetailsData.time_limit || 'N/A'}`, 14, yPosition);
      yPosition += 15;
      
      // Question Analysis section
      doc.setFontSize(14);
      doc.text("Question Analysis", 14, yPosition);
      yPosition += 10;
      
      // Prepare table data
      const tableData = quizDetailsData.question_analysis?.map((qa: any) => [
        (qa.question || 'N/A').replace(/<[^>]*>/g, ''), // Strip HTML tags
        (qa.user_answer || 'N/A').replace(/<[^>]*>/g, ''), // Strip HTML tags
        (qa.correct_answer || 'N/A').replace(/<[^>]*>/g, ''), // Strip HTML tags
        qa.is_correct ? 'Correct' : 'Incorrect' // Use simple text without special characters
      ]) || [];
      
      // Add table using autoTable
      autoTable(doc, {
        head: [['Question', 'Your Answer', 'Correct Answer', 'Result']],
        body: tableData,
        startY: yPosition,
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 60, halign: 'left' }, // Question column
          1: { cellWidth: 50, halign: 'left' }, // Your Answer column
          2: { cellWidth: 50, halign: 'left' }, // Correct Answer column
          3: { cellWidth: 20, halign: 'center' }  // Result column
        },
        didDrawPage: (data: any) => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(8);
          doc.text(`Page ${currentPage} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        }
      });
      
      // Save the PDF
      doc.save(filename);
      
      // console.log(`PDF generated: ${filename}`);
      toast.success('Quiz report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download quiz report');
    }
  };

  // Q&A Details Functions
  const fetchQaDetails = async (qaProgressId: string) => {
    setLoadingQaDetails(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.get_qa_details?qa_progress_id=${encodeURIComponent(qaProgressId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Q&A details');
      }

      const data = await response.json();
      

      if (data.message?.success) {
        // Add the record ID to the data for score updates
        const detailsWithId = { ...data.message.data, name: qaProgressId };
        setQaDetailsData(detailsWithId);
        setShowQaDetailsModal(true);
       
      } else {
        console.error('Q&A Details API Error:', data.message?.error);
        toast.error('Failed to fetch Q&A details');
      }
    } catch (error) {
      console.error('Error fetching Q&A details:', error);
      toast.error('Failed to fetch Q&A details');
    } finally {
      setLoadingQaDetails(false);
    }
  };

  const closeQaDetailsModal = () => {
    setShowQaDetailsModal(false);
    setQaDetailsData(null);
  };

  const handleAddScore = () => {
    setShowAddScoreModal(true);
    setScoreValue('');
    setScoreUpdateSuccess(false);
    setScoreError('');
  };

  const handleScoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScoreValue(value);
    
    // Clear previous error
    setScoreError('');
    
    // Validate score if value is not empty
    if (value) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        if (numericValue < 0) {
          setScoreError('Score cannot be negative');
        } else if (qaDetailsData?.max_score && numericValue > qaDetailsData.max_score) {
          setScoreError(`Score cannot exceed maximum score of ${qaDetailsData.max_score}`);
        }
      }
    }
  };

  const handleSaveScore = async () => {
    if (!qaDetailsData || !scoreValue) return;
    
    const numericValue = parseFloat(scoreValue);
    
    // Check if score is negative
    if (numericValue < 0) {
      setScoreError('Score cannot be negative');
      return;
    }
    
    // Check if score exceeds max score
    if (qaDetailsData?.max_score && numericValue > qaDetailsData.max_score) {
      setScoreError(`Score cannot exceed maximum score of ${qaDetailsData.max_score}`);
      return;
    }
    
    setLoadingAddScore(true);
    try {
      const params = new URLSearchParams({
        name: qaDetailsData.name,
        user: qaDetailsData.user,
        qa_id: qaDetailsData.name,
        score: scoreValue
      });

      const response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.updateQAScore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: params
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      const data = await response.json();
      // console.log('Update Score API Response:', data);

      // Check for success in nested structure: data.message.message.success
      const isSuccess = data.message?.message?.success || data.message?.success || data.success;
      
      if (isSuccess) {
        setScoreUpdateSuccess(true);
        // Show success message in popup instead of toast
        setTimeout(() => {
          setShowAddScoreModal(false);
          setScoreValue('');
          setScoreUpdateSuccess(false);
          // Refresh the Q&A details
          if (qaDetailsData.name) {
            fetchQaDetails(qaDetailsData.name);
          }
          // Refresh the QA analytics data to move user from pending to scored
          fetchQaAnalytics();
        }, 2000); // Close after 2 seconds
      } else {
        console.error('Update Score API Error:', data.message?.message?.error || data.message?.error);
        toast.error('Failed to update score');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    } finally {
      setLoadingAddScore(false);
    }
  };

  // Initialize per-question allotted marks when QA details load
  React.useEffect(() => {
    if (qaDetailsData?.question_answer_responses) {
      const marks = qaDetailsData.question_answer_responses.map((r: any) => Number(r.alloted_marks ?? r.marks ?? 0));
      setQaAllotedMarks(marks);
    } else {
      setQaAllotedMarks([]);
    }
  }, [qaDetailsData]);

  const handleAllotedChange = (index: number, value: string, maxScore: number = 0) => {
    const num = value === '' ? 0 : Number(value);
    // Constrain the value between 0 and maxScore (question_score)
    if (!isNaN(num)) {
      const constrainedValue = Math.max(0, Math.min(num, maxScore));
      setQaAllotedMarks(prev => prev.map((v: number, i: number) => (i === index ? constrainedValue : v)));
    }
  };
  
  const handleSaveAllotedScores = async () => {
    if (!qaDetailsData) return;
    
    // Validate: Check each allotted mark doesn't exceed its question_score
    if (qaDetailsData.question_answer_responses) {
      for (let i = 0; i < qaDetailsData.question_answer_responses.length; i++) {
        const allotted = qaAllotedMarks[i] ?? 0;
        const questionScore = qaDetailsData.question_answer_responses[i]?.question_score ?? 0;
        if (allotted > questionScore) {
          toast.error(`Allotted score (${allotted}) cannot exceed Q. Score (${questionScore}) for question ${i + 1}`);
          return;
        }
      }
    }
    
    // Validate: Check total doesn't exceed max_score
    const total = qaAllotedMarks.reduce((s: number, v: number) => s + (Number(v) || 0), 0);
    const maxScore = qaDetailsData.max_score ?? 0;
    if (total > maxScore) {
      toast.error(`Total score (${total}) cannot exceed maximum score (${maxScore})`);
      return;
    }
    
    try {
      const params = new URLSearchParams({
        name: qaDetailsData.name,
        user: qaDetailsData.user,
        qa_id: qaDetailsData.name,
        score: String(total),
        response_marks: JSON.stringify(qaAllotedMarks)
      });
      const response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.updateQAScore?${params.toString()}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      const isSuccess = data.message?.message?.success || data.message?.success || data.success;
      if (isSuccess) {
        fetchQaDetails(qaDetailsData.name);
        fetchQaAnalytics();
        toast.success('Scores saved successfully');
      } else {
        const errorMsg = data.message?.error || data.message?.message || 'Failed to save scores';
        toast.error(errorMsg);
      }
    } catch (e) {
      console.error('Save scores error', e);
      toast.error('Failed to save scores');
    }
  };

  const exportQaToPDF = async () => {
    if (!qaDetailsData) return;
    
    try {
      // Create filename: email_module_name_qa.pdf
      const email = qaDetailsData.user || 'unknown';
      const moduleName = qaDetailsData.module?.name1 || qaDetailsData.module?.name || 'module';
      const filename = `${email}_${moduleName}_qa.pdf`;
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("Q&A Report", 14, 22);
      
      // Subtitle
      doc.setFontSize(12);
      doc.text(`Module: ${qaDetailsData.module?.name1 || qaDetailsData.module?.name || 'N/A'}`, 14, 32);
      doc.text(`User: ${qaDetailsData.user || 'N/A'}`, 14, 40);
      
      // Summary information
      let yPosition = 55;
      doc.setFontSize(10);
      doc.text(`Date: ${qaDetailsData.date_attended || 'N/A'}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Time Spent: ${qaDetailsData.time_spent || 'N/A'}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Score: ${qaDetailsData.score || 'N/A'} / ${qaDetailsData.max_score || 'N/A'} (${qaDetailsData.percentage_score || 0}%)`, 14, yPosition);
      yPosition += 15;
      
      // Answer Analysis section
      doc.setFontSize(14);
      doc.text("Answer Analysis", 14, yPosition);
      yPosition += 10;
      
      // Prepare table data
      const tableData = qaDetailsData.question_answer_responses?.map((qa: any) => [
        (qa.question || 'N/A').replace(/<[^>]*>/g, ''), // Strip HTML tags
        (qa.answer || 'N/A').replace(/<[^>]*>/g, ''), // Strip HTML tags
        (qa.alloted_marks ?? qa.marks ?? 0).toString(), // Allotted Marks
        (qa.question_score ?? 0).toString() // Question Score
      ]) || [];
      
      // Add table using autoTable
      autoTable(doc, {
        head: [['Question', 'Answer', 'Allotted Marks', 'Question Score']],
        body: tableData,
        startY: yPosition,
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'left' }, // Question column
          1: { cellWidth: 50, halign: 'left' }, // Answer column
          2: { cellWidth: 35, halign: 'center' }, // Allotted Marks column
          3: { cellWidth: 35, halign: 'center' }  // Question Score column
        },
        didDrawPage: (data: any) => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(8);
          doc.text(`Page ${currentPage} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        }
      });
      
      // Save the PDF
      doc.save(filename);
  
      toast.success('Q&A report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download Q&A report');
    }
  };

  const fetchLearnerDetails = async (status: string) => {
     if (!sidebarContent?.data) return;
     
     setLoadingLearners(true);
     setSelectedStatus(status);
     
     try {
       
       
       // Get module ID from sidebar content
       const moduleId = sidebarContent.data.module_id || sidebarContent.data.name;
       const moduleName = sidebarContent.data.module_name || sidebarContent.data.name1;
       
      
       
       // Check if module ID or name is valid
       if (!moduleId && !moduleName) {
         console.error('No module ID or name provided');
         setAllLearnerDetails([]);
         setLearnerDetails([]);
         return;
       }
       
      
       
       // Use the original API directly
       let response = await fetch(`${LMS_API_BASE_URL}api/method/novel_lms.novel_lms.api.analytics.get_module_learners?module_id=${encodeURIComponent(moduleId)}&module_name=${encodeURIComponent(moduleName)}`, { credentials: 'include' });
       
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Response status:', response.status);
        console.error('Response URL:', response.url);
        
        // If API fails, show empty array (no static data)
      
        setAllLearnerDetails([]);
        setLearnerDetails([]);
        return;
      }
      
      const data = await response.json();
      
       
      // Handle double-nested message structure
      let learners = null;
      let success = false;
      let moduleInfo = null;
      
      // Check for double-nested structure first
      if (data.message && data.message.message && data.message.message.learners) {
        learners = data.message.message.learners;
        success = data.message.message.success;
        moduleInfo = data.message.message.module_info;
        
      }
      // Check for single-nested structure
      else if (data.message && data.message.learners) {
        learners = data.message.learners;
        success = data.message.success;
        moduleInfo = data.message.module_info;
       
      }
      
      if (success && learners && Array.isArray(learners)) {
        
        
        
        learners.forEach((_learner: any, _index: number) => {
          
        });
        
        // Transform the API response to match frontend expectations
        const transformedLearners = learners.map((learner: any) => {
          // Normalize status to match frontend expectations
          let normalizedStatus = 'not_started';
          if (learner.status) {
            const statusLower = learner.status.toLowerCase().replace(/\s+/g, '_');
            
            if (statusLower.includes('completed')) {
              normalizedStatus = 'completed';
            } else if (statusLower.includes('progress')) {
              normalizedStatus = 'in_progress';
            } else if (statusLower.includes('started')) {
              normalizedStatus = 'not_started';
            }
            
          }
          
          return {
            learner_name: learner.learner_name || learner.learner, // Use actual name or fallback to email
            email: learner.learner,
            department: moduleInfo?.department || sidebarContent?.data?.department || 'General', // Use module's department
            status: normalizedStatus,
            progress: learner.progress || 0,
            score: learner.score || 0,
            // Map to the fields the frontend expects
            avg_progress: learner.progress || 0,
            avg_score: learner.score || 0,
            started_on: learner.started_on,
            completed_on: learner.completed_on,
            modules_enrolled: 1, // Placeholder
            completion_rate: learner.progress || 0,
            // Additional user details
            user_image: learner.user_image,
            mobile_no: learner.mobile_no,
            last_login: learner.last_login
          };
        });
        
       
        
        // Debug: Log each learner individually
        transformedLearners.forEach((_learner: any, _index: number) => {
          
        });
         
         // Filter learners based on status if not 'total'
         let filteredLearners = transformedLearners;
         if (status !== 'total') {
           filteredLearners = transformedLearners.filter((learner: any) => {
             const learnerStatus = learner.status?.toLowerCase();
             // console.log(`Filtering learner ${learner.learner_name} with status ${learnerStatus} for filter ${status}`);
             switch (status) {
               case 'completed':
                 return learnerStatus === 'completed';
               case 'in_progress':
                 return learnerStatus === 'in_progress';
               case 'not_started':
                 return learnerStatus === 'not_started';
               default:
                 return true;
             }
           });
         }
         
        
         
         // Store the original unfiltered data for count calculations
         setAllLearnerDetails(transformedLearners);
         setLearnerDetails(filteredLearners);
      } else {
        
        // Show error message to user
        if (data.message?.error) {
          toast.error('API Error: ' + data.message.error);
        } else {
          toast.error('No learners found for this module');
        }
        
        setAllLearnerDetails([]);
        setLearnerDetails([]);
      }
    } catch (error) {
      console.error('Error fetching learner details:', error);
       setAllLearnerDetails([]);
       setLearnerDetails([]);
    } finally {
      setLoadingLearners(false);
    }
  };


  // Pagination hooks
  const modulePagination = usePagination(finalDataWithFallback?.module_analytics || []);
  const quizPagination = usePagination(finalData?.quiz_analytics || []);
  
 
  if ((isLoading || dataLoading) && !persistedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="text-muted-foreground mt-4">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    // Handle error object properly - ensure we only render strings
    let errorMessage = 'An unknown error occurred';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Handle nested error objects
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if ('details' in error && typeof error.details === 'string') {
        errorMessage = error.details;
      } else {
        // If it's a complex object, stringify it safely
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = 'An error occurred while loading analytics data';
        }
      }
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into learning performance and engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={dataLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Analytics Filters</SheetTitle>
            <SheetDescription>
              Customize your analytics view with advanced filters
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="dateFrom">From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateTo">To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {/* Add department options dynamically */}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="module">Module</Label>
              <Select
                value={filters.module}
                onValueChange={(value) => handleFilterChange('module', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All modules</SelectItem>
                  {/* Add module options dynamically */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="modules"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Modules
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Test
          </TabsTrigger>
          <TabsTrigger 
            value="learners"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Learners
          </TabsTrigger>
        </TabsList>


        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
              <Card>
            <CardHeader>
              <CardTitle>Module Performance</CardTitle>
              <CardDescription>
                Detailed analysis of module completion and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                        Module Name
                      </th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                        Assigned
                      </th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                        Completed
                      </th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
        <tbody>
                    {modulePagination.currentData.map((module: any, index: number) => (
                      <tr 
                        key={index} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleModuleClick(module)}
                  >
                        <td className="p-3">
                          <div className="font-medium">{module.module_name?.replace(/<[^>]*>/g, '') || 'N/A'}</div>
                </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{module.enrolled_count}</span>
                          </div>
                 </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{module.completed_count}</span>
                          </div>
                 </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{module.completion_rate.toFixed(1)}%</span>
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(module.completion_rate || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                </td>
              </tr>
                    ))}
        </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {(finalDataWithFallback?.module_analytics?.length || 0) > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((modulePagination.currentPage - 1) * 10) + 1} to {Math.min(modulePagination.currentPage * 10, finalDataWithFallback?.module_analytics?.length || 0)} of {finalDataWithFallback?.module_analytics?.length || 0} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={modulePagination.prev}
                      disabled={!modulePagination.hasPrev}
                    >
                      <span className="mr-1">&lt;</span> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = modulePagination.maxPage;
                        const currentPage = modulePagination.currentPage;
                        const pages = [];
                        
                        // Show first page
                        if (currentPage > 3) {
                          pages.push(
                            <Button
                              key={1}
                              variant="outline"
                              size="sm"
                              onClick={() => modulePagination.jump(1)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                          );
                          if (currentPage > 4) {
                            pages.push(<span key="ellipsis1" className="px-2">...</span>);
                          }
                        }
                        
                        // Show pages around current page
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => modulePagination.jump(i)}
                              className="w-8 h-8 p-0"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        // Show last page
                        if (currentPage < totalPages - 2) {
                          if (currentPage < totalPages - 3) {
                            pages.push(<span key="ellipsis2" className="px-2">...</span>);
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant="outline"
                              size="sm"
                              onClick={() => modulePagination.jump(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={modulePagination.next}
                      disabled={!modulePagination.hasNext}
                    >
                      Next <span className="ml-1">&gt;</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          {/* Analytics Buttons */}
          <div className="flex gap-4">
            <Button 
              variant={quizAnalyticsView === 'quiz' ? 'default' : 'outline'}
              className="flex-1 h-12 text-base font-medium"
              onClick={() => setQuizAnalyticsView('quiz')}
            >
              <Award className="h-5 w-5 mr-2" />
              Quiz Analytics
            </Button>
            <Button 
              variant={quizAnalyticsView === 'qa' ? 'default' : 'outline'}
              className="flex-1 h-12 text-base font-medium"
              onClick={() => setQuizAnalyticsView('qa')}
            >
              <Activity className="h-5 w-5 mr-2" />
              QA Analytics
            </Button>
          </div>

          {/* Quiz Analytics Detailed View */}
          {quizAnalyticsView === 'quiz' && (
            <Card>
              <CardHeader>
                <CardTitle>Quiz Analytics</CardTitle>
                <CardDescription>
                  Detailed quiz performance analytics with user scores and timing data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">User</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Module</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Score (%)</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Date Attended</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Time Spent</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Time Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingQuizAnalytics ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                              <div>Loading quiz analytics...</div>
                            </div>
                          </td>
                        </tr>
                      ) : quizAnalyticsData.length > 0 ? (
                        getCurrentPageData().map((quiz: any, index: number) => (
                          <tr 
                            key={index} 
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => fetchQuizDetails(quiz.name)}
                          >
                            <td className="p-3 text-sm">{quiz.user}</td>
                            <td className="p-3 text-sm">{quiz.module?.name1 || 'N/A'}</td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  ({quiz.percentage_score}%)
                                </span>
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${Math.min(quiz.percentage_score || 0, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">{quiz.started_on}</td>
                            <td className="p-3 text-sm">{quiz.time_spent}</td>
                            <td className="p-3 text-sm">{quiz.time_limit}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No quiz analytics data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {quizAnalyticsData.length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((quizCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(quizCurrentPage * itemsPerPage, quizAnalyticsData.length)} of {quizAnalyticsData.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleQuizPrevPage}
                        disabled={quizCurrentPage === 1}
                      >
                        <span className="mr-1">&lt;</span> Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const totalPages = quizTotalPages;
                          const currentPage = quizCurrentPage;
                          const pages = [];
                          
                          // Show first page
                          if (currentPage > 3) {
                            pages.push(
                              <Button
                                key={1}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuizPageChange(1)}
                                className="w-8 h-8 p-0"
                              >
                                1
                              </Button>
                            );
                            if (currentPage > 4) {
                              pages.push(<span key="ellipsis1" className="px-2">...</span>);
                            }
                          }
                          
                          // Show pages around current page
                          const startPage = Math.max(1, currentPage - 2);
                          const endPage = Math.min(totalPages, currentPage + 2);
                          
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleQuizPageChange(i)}
                                className="w-8 h-8 p-0"
                              >
                                {i}
                              </Button>
                            );
                          }
                          
                          // Show last page
                          if (currentPage < totalPages - 2) {
                            if (currentPage < totalPages - 3) {
                              pages.push(<span key="ellipsis2" className="px-2">...</span>);
                            }
                            pages.push(
                              <Button
                                key={totalPages}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuizPageChange(totalPages)}
                                className="w-8 h-8 p-0"
                              >
                                {totalPages}
                              </Button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleQuizNextPage}
                        disabled={quizCurrentPage === quizTotalPages}
                      >
                        Next <span className="ml-1">&gt;</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Q&A Analytics Detailed View */}
          {quizAnalyticsView === 'qa' && (
            <Card>
              <CardHeader>
                <CardTitle>Q&A Analytics</CardTitle>
                <CardDescription>
                  Detailed Q&A performance analytics with user scores and timing data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Score Status Filters */}
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={qaScoreFilter === 'scored' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQaScoreFilter('scored')}
                    className="h-8"
                  >
                    Scored ({qaScoredData.length})
                  </Button>
                  <Button
                    variant={qaScoreFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQaScoreFilter('pending')}
                    className="h-8"
                  >
                    Pending Score ({qaPendingData.length})
                  </Button>
          </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">User</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Module</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Score (%)</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Time Spent</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Time Limit</th>
                        <th className="text-left p-3 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingQaAnalytics ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                              <div>Loading Q&A analytics...</div>
                            </div>
                          </td>
                        </tr>
                      ) : getCurrentQaPageData().length > 0 ? (
                        getCurrentQaPageData().map((qa: any, index: number) => (
                          <tr 
                            key={index} 
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => fetchQaDetails(qa.name)}
                          >
                            <td className="p-3 text-sm">{qa.user}</td>
                            <td className="p-3 text-sm">{qa.module?.name1 || 'N/A'}</td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {qa.score}/{qa.max_score} ({qa.percentage_score}%)
                                </span>
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${Math.min(qa.percentage_score || 0, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">{qa.date_attended}</td>
                            <td className="p-3 text-sm">{qa.time_spent}</td>
                            <td className="p-3 text-sm text-muted-foreground">N/A</td>
                              <td className="p-3 text-sm">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchQaDetails(qa.name);
                                  }}
                                  disabled={loadingQaDetails}
                                >
                                  {loadingQaDetails ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'View'
                                  )}
                                </Button>
                              </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            <div className="text-center py-8">
                              {qaScoreFilter === 'scored' 
                                ? 'No scored Q&A data available' 
                                : 'No pending score data available'
                              }
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination for Q&A Analytics */}
                {(() => {
                  const currentData = qaScoreFilter === 'scored' ? qaScoredData : qaPendingData;
                  const totalPages = Math.ceil(currentData.length / itemsPerPage);
                  return currentData.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((qaCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(qaCurrentPage * itemsPerPage, currentData.length)} of {currentData.length} entries
                      </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleQaPrevPage}
                        disabled={qaCurrentPage === 1}
                      >
                        <span className="mr-1">&lt;</span> Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const totalPages = Math.ceil(currentData.length / itemsPerPage);
                          const currentPage = qaCurrentPage;
                          const pages = [];
                          
                          // Show first page
                          if (currentPage > 3) {
                            pages.push(
                              <Button
                                key={1}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQaPageChange(1)}
                                className="w-8 h-8 p-0"
                              >
                                1
                              </Button>
                            );
                            if (currentPage > 4) {
                              pages.push(<span key="ellipsis1" className="px-2">...</span>);
                            }
                          }
                          
                          // Show pages around current page
                          const startPage = Math.max(1, currentPage - 2);
                          const endPage = Math.min(totalPages, currentPage + 2);
                          
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleQaPageChange(i)}
                                className="w-8 h-8 p-0"
                              >
                                {i}
                              </Button>
                            );
                          }
                          
                          // Show last page
                          if (currentPage < totalPages - 2) {
                            if (currentPage < totalPages - 3) {
                              pages.push(<span key="ellipsis2" className="px-2">...</span>);
                            }
                            pages.push(
                              <Button
                                key={totalPages}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQaPageChange(totalPages)}
                                className="w-8 h-8 p-0"
                              >
                                {totalPages}
                              </Button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleQaNextPage}
                        disabled={qaCurrentPage === totalPages}
                      >
                        Next <span className="ml-1">&gt;</span>
                      </Button>
                    </div>
                  </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Default Overview */}
          {quizAnalyticsView === 'overview' && (
            <div className="space-y-4">
              {quizPagination.currentData.map((quiz: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{quiz.quiz_name?.replace(/<[^>]*>/g, '') || 'N/A'}</h4>
                      <Badge variant={quiz.type === "Quiz" ? "default" : "secondary"} className="text-xs">
                        {quiz.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quiz.module_name?.replace(/<[^>]*>/g, '') || 'N/A'} • {quiz.total_attempts} attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{quiz.avg_score.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">
                      Pass Rate: {quiz.pass_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Learners Tab */}
        <TabsContent value="learners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Learner Performance</CardTitle>
              <CardDescription>
                Comprehensive view of learner progress and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Learner</th>
                      <th className="text-left p-4 font-medium">Assigned</th>
                      <th className="text-left p-4 font-medium">Completed</th>
                      <th className="text-left p-4 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learnersData?.message?.message?.learner_analytics?.length > 0 ? (
                      getCurrentLearnerPageData().map((learner: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleLearnerClick(learner)}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{learner.full_name || learner.name}</div>
                                <div className="text-sm text-muted-foreground">{learner.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">{learner.total_modules || 0}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">{learner.completed_modules || 0}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-foreground">{Math.round(learner.completion_rate || 0)}%</span>
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${learner.completion_rate || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <div>No learner data available</div>
                            {learnersLoading && <div className="text-sm">Loading learners...</div>}
                            {learnersError && <div className="text-sm text-red-500">Error loading learners</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Learners Pagination */}
              {(learnersData?.message?.message?.learner_analytics?.length || 0) > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((learnerCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(learnerCurrentPage * itemsPerPage, learnersData.message.message.learner_analytics.length)} of {learnersData.message.message.learner_analytics.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLearnerPrevPage}
                      disabled={learnerCurrentPage === 1}
                    >
                      <span className="mr-1">&lt;</span> Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = learnerTotalPages;
                        const currentPage = learnerCurrentPage;
                        const pages = [];
                        
                        // Show first page
                        if (currentPage > 3) {
                          pages.push(
                            <Button
                              key={1}
                              variant="outline"
                              size="sm"
                              onClick={() => handleLearnerPageChange(1)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                          );
                          if (currentPage > 4) {
                            pages.push(<span key="ellipsis1" className="px-2">...</span>);
                          }
                        }
                        
                        // Show pages around current page
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleLearnerPageChange(i)}
                              className="w-8 h-8 p-0"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        // Show last page
                        if (currentPage < totalPages - 2) {
                          if (currentPage < totalPages - 3) {
                            pages.push(<span key="ellipsis2" className="px-2">...</span>);
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant="outline"
                              size="sm"
                              onClick={() => handleLearnerPageChange(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLearnerNextPage}
                      disabled={learnerCurrentPage === learnerTotalPages}
                    >
                      Next <span className="ml-1">&gt;</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Right Sidebar */}
      {showSidebar && sidebarContent && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <div className="relative ml-auto h-full w-full max-w-2xl bg-background border-l shadow-lg">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
              <div>
                  <h3 className="text-lg font-semibold">
                    {sidebarContent.type === 'module' ? (sidebarContent.data.module_name?.replace(/<[^>]*>/g, '') || 'N/A') : (sidebarContent.data.full_name || sidebarContent.data.name || 'N/A')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sidebarContent.type === 'module' ? 'Detailed Analytics' : 'Learner Information'}
                  </p>
              </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSidebar}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {sidebarContent.type === 'learner' ? (
                  <div className="space-y-6">
                    {/* Learner Information */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Learner Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <span className="text-sm font-medium ml-2">{sidebarContent.data.full_name || sidebarContent.data.name}</span>
                        </div>
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="text-sm font-medium ml-2">{sidebarContent.data.email}</span>
                        </div>
                      </div>
                    </div>



                    {/* Modules Information */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Modules Information
                      </h4>
                      
                      {/* Debug Info */}
                      
                      {loadingLearnerSidebar ? (
                        <div className="text-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                          <p className="text-gray-600">Loading module details...</p>
                        </div>
                      ) : (
                        <>
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-4">
                        <button 
                          onClick={() => setLearnerModuleFilter('all')}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            learnerModuleFilter === 'all' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          Total: {learnerSidebarData?.learner_info?.total_modules || 0}
                        </button>
                        <button 
                          onClick={() => setLearnerModuleFilter('completed')}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            learnerModuleFilter === 'completed' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          Completed: {learnerSidebarData?.learner_info?.completed_modules || 0}
                        </button>
                        <button 
                          onClick={() => setLearnerModuleFilter('in_progress')}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            learnerModuleFilter === 'in_progress' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          In Progress: {learnerSidebarData?.learner_info?.in_progress_modules || 0}
                        </button>
                        <button 
                          onClick={() => setLearnerModuleFilter('not_started')}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            learnerModuleFilter === 'not_started' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          Not Started: {learnerSidebarData?.learner_info?.not_started_modules || 0}
                        </button>
                      </div>

                      {/* Module Progress Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium text-sm">Module</th>
                              <th className="text-left p-3 font-medium text-sm">Status</th>
                              <th className="text-left p-3 font-medium text-sm">Progress</th>
                              <th className="text-left p-3 font-medium text-sm">Score</th>
                              <th className="text-left p-3 font-medium text-sm">Start Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingLearnerSidebar ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center">
                                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                  <p className="text-gray-600">Loading module details...</p>
                                </td>
                              </tr>
                            ) : learnerSidebarData?.learner_modules?.length > 0 ? (
                              (() => {
                                const filteredModules = learnerSidebarData.learner_modules.filter((module: any) => {
                                  if (learnerModuleFilter === 'all') return true;
                                  if (learnerModuleFilter === 'completed') return module.status === 'Completed';
                                  if (learnerModuleFilter === 'in_progress') return module.status === 'In Progress';
                                  if (learnerModuleFilter === 'not_started') return module.status === 'Not Started';
                                  return true;
                                });
                                
                                if (filteredModules.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p>No modules found for this filter</p>
                                      </td>
                                    </tr>
                                  );
                                }
                                
                                return filteredModules.map((module: any, index: number) => (
                                <tr key={index} className="border-b">
                                  <td className="p-3">
                                    <div className="font-medium">{module.module_name}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      module.status === 'Completed' 
                                        ? 'bg-primary/10 text-primary'
                                        : module.status === 'In Progress'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {module.status}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{Math.round(module.progress)}%</span>
                                      <div className="w-16 bg-muted rounded-full h-1">
                                        <div 
                                          className={`h-1 rounded-full ${
                                            module.status === 'Completed' 
                                              ? 'bg-primary'
                                              : module.status === 'In Progress'
                                              ? 'bg-primary'
                                              : 'bg-muted'
                                          }`}
                                          style={{width: `${Math.round(module.progress)}%`}}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="text-sm">{module.score}</span>
                                  </td>
                                  <td className="p-3">
                                    <span className="text-sm text-muted-foreground">{module.start_date}</span>
                                  </td>
                                </tr>
                                ));
                              })()
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-600">
                                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                  <p>No modules assigned to this learner</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                        </>
                      )}
                    </div>

                    {/* Quiz Performance */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Quiz Performance
                      </h4>
                      <div className="space-y-3">
                        {learnerSidebarData?.quiz_data?.quiz_performance && learnerSidebarData.quiz_data.quiz_performance.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Module Name</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Status</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Max Score</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Scored</th>
                                </tr>
                              </thead>
                              <tbody>
                                {learnerSidebarData.quiz_data.quiz_performance.map((quiz: any, index: number) => (
                                  <tr key={index} className="border-b">
                                    <td className="p-2 text-xs font-medium">{quiz.module_name}</td>
                                    <td className="p-2 text-xs">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        quiz.status === 'Attempted' 
                                          ? 'bg-primary/10 text-primary' 
                                          : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {quiz.status}
                                      </span>
                                    </td>
                                    <td className="p-2 text-xs font-medium">{quiz.max_score}</td>
                                    <td className="p-2 text-xs font-medium">{quiz.scored}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No quiz performance data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QA Performance */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Q&A Performance
                      </h4>
                      <div className="space-y-3">
                        {learnerSidebarData?.qa_data?.qa_performance && learnerSidebarData.qa_data.qa_performance.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Module Name</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Status</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Max Score</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Scored</th>
                                </tr>
                              </thead>
                              <tbody>
                                {learnerSidebarData.qa_data.qa_performance.map((qa: any, index: number) => (
                                  <tr key={index} className="border-b">
                                    <td className="p-2 text-xs font-medium">{qa.module_name}</td>
                                    <td className="p-2 text-xs">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        qa.status === 'Scored' 
                                          ? 'bg-primary/10 text-primary' 
                                          : qa.status === 'Pending Score'
                                          ? 'bg-primary/10 text-primary'
                                          : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {qa.status}
                                      </span>
                                    </td>
                                    <td className="p-2 text-xs font-medium">{qa.max_score}</td>
                                    <td className="p-2 text-xs font-medium">{qa.scored}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No Q&A performance data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : sidebarContent.type === 'module' ? (
            <div className="space-y-6">
              {/* Module Information */}
                  <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Module Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Title:</span>
                          <span className="text-sm font-medium ml-2">{sidebarContent.data.module_name?.replace(/<[^>]*>/g, '') || 'N/A'}</span>
                  </div>
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Department:</span>
                          <span className="text-sm font-medium ml-2">{sidebarContent.data.department || 'General'}</span>
                  </div>
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Assigned Type:</span>
                          <span className="text-sm font-medium ml-2">{sidebarContent.data.assignment_type || 'Everyone'}</span>
                  </div>
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Duration:</span>
                          <span className="text-sm font-medium ml-2">
                            {sidebarContent.data.duration_days && sidebarContent.data.duration_days > 0 
                              ? `${sidebarContent.data.duration_days} days` 
                              : 'Not specified'
                            }
                          </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Statistics
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Assigned</span>
                      </div>
                          <div className="text-2xl font-bold">{sidebarContent.data.enrolled_count}</div>
                      </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Completed</span>
                      </div>
                          <div className="text-2xl font-bold">{sidebarContent.data.completed_count}</div>
                      </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Progress</span>
                          </div>
                          <div className="text-2xl font-bold">{sidebarContent.data.completion_rate.toFixed(1)}%</div>
                        </div>
                </div>
              </div>

                    {/* Progress Bar */}
                    <div>
                      <h4 className="font-medium mb-3">Progress Overview</h4>
                <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate</span>
                          <span>{sidebarContent.data.completion_rate.toFixed(1)}%</span>
                  </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(sidebarContent.data.completion_rate, 100)}%` }}
                          />
                  </div>
                </div>
              </div>

                    {/* Learner Table */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Learners Information
                      </h4>
                      
                     {/* Status Buttons */}
                     <div className="flex flex-wrap gap-2 mb-4">
                       <button 
                         onClick={() => fetchLearnerDetails('total')}
                         className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                           selectedStatus === 'total' 
                             ? 'bg-primary text-primary-foreground' 
                             : 'bg-primary/10 text-primary hover:bg-primary/20'
                         }`}
                       >
                         Total: {allLearnerDetails.length}
                       </button>
                         <button 
                           onClick={() => fetchLearnerDetails('completed')}
                           className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                             selectedStatus === 'completed' 
                               ? 'bg-primary text-primary-foreground' 
                               : 'bg-primary/10 text-primary hover:bg-primary/20'
                           }`}
                         >
                           Completed: {allLearnerDetails.filter(l => l.status === 'completed').length}
                         </button>
                         <button 
                           onClick={() => fetchLearnerDetails('in_progress')}
                           className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                             selectedStatus === 'in_progress' 
                               ? 'bg-primary text-primary-foreground' 
                               : 'bg-primary/10 text-primary hover:bg-primary/20'
                           }`}
                         >
                           In Progress: {allLearnerDetails.filter(l => l.status === 'in_progress').length}
                         </button>
                         <button 
                           onClick={() => fetchLearnerDetails('not_started')}
                           className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                             selectedStatus === 'not_started' 
                               ? 'bg-primary text-primary-foreground' 
                               : 'bg-primary/10 text-primary hover:bg-primary/20'
                           }`}
                         >
                           Not Started: {allLearnerDetails.filter(l => l.status === 'not_started').length}
                         </button>
                </div>

                      <div className="bg-white rounded-lg border">
                        <div>
                    <table className="w-full">
                             <thead className="bg-muted/50">
                               <tr>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Department</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Progress</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Score</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Started On</th>
                                 <th className="text-left p-3 text-sm font-medium text-muted-foreground">Completed On</th>
                        </tr>
                      </thead>
                            <tbody>
                            {loadingLearners ? (
                              <tr>
                                   <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                  <div className="flex flex-col items-center justify-center gap-2">
                                    <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                                       <div>Loading learners...</div>
                                  </div>
                                </td>
                              </tr>
                               ) : learnerDetails.length > 0 ? (
                                 (() => {
                                   // console.log('=== RENDERING LEARNERS ===');
                                   // console.log('learnerDetails length:', learnerDetails.length);
                                   // console.log('learnerDetails:', learnerDetails);
                                   return learnerDetails.map((learner: any, index: number) => {
                                     // Debug: Log each learner being rendered
                                     // console.log(`Rendering learner ${index}:`, learner);
                                     // console.log(`Learner name: ${learner.learner_name || learner.full_name || 'N/A'}`);
                                     // console.log(`Learner email: ${learner.email || 'N/A'}`);
                                     // console.log(`Learner department: ${learner.department || 'N/A'}`);
                                     // console.log(`Learner status: ${learner.status || 'N/A'}`);
                                     // console.log(`Learner completion_rate: ${learner.completion_rate || 'N/A'}`);
                                     // console.log(`Learner avg_progress: ${learner.avg_progress || 'N/A'}`);
                                     // console.log(`Learner avg_score: ${learner.avg_score || 'N/A'}`);
                                     // console.log(`Learner started_on: ${learner.started_on || 'N/A'}`);
                                     // console.log(`Learner completed_on: ${learner.completed_on || 'N/A'}`);
                                   
                                   return (
                                     <tr key={index} className="border-b hover:bg-muted/50">
                                       <td className="p-3 text-sm font-medium bg-muted/50">{learner.learner_name || learner.full_name || 'N/A'}</td>
                                       <td className="p-3 text-sm bg-muted/50">{learner.email || 'N/A'}</td>
                                       <td className="p-3 text-sm bg-muted/50">{learner.department || 'N/A'}</td>
                                       <td className="p-3 text-sm bg-muted/50">
                                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                           learner.status === 'completed' ? 'bg-primary/10 text-primary' :
                                           learner.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                                           learner.status === 'not_started' ? 'bg-muted text-muted-foreground' :
                                           'bg-muted text-muted-foreground'
                                         }`}>
                                      {learner.status === 'completed' ? 'Completed' : 
                                            learner.status === 'in_progress' ? 'In Progress' :
                                            learner.status === 'not_started' ? 'Not Started' : 'N/A'}
                                         </span>
                                  </td>
                                       <td className="p-3 text-sm bg-muted/50">{learner.avg_progress ? `${Math.round(learner.avg_progress)}%` : '0%'}</td>
                                       <td className="p-3 text-sm bg-muted/50">{learner.avg_score || 'N/A'}</td>
                                       <td className="p-3 text-sm bg-muted/50">
                                         {learner.started_on ? 
                                           new Date(learner.started_on).toLocaleString('en-GB', {
                                             day: '2-digit',
                                             month: '2-digit',
                                             year: 'numeric',
                                             hour: '2-digit',
                                             minute: '2-digit',
                                             second: '2-digit',
                                             hour12: false
                                           }) : 'Not started'
                                         }
                                       </td>
                                       <td className="p-3 text-sm bg-muted/50">
                                         {learner.completed_on ? 
                                           new Date(learner.completed_on).toLocaleString('en-GB', {
                                             day: '2-digit',
                                             month: '2-digit',
                                             year: 'numeric',
                                             hour: '2-digit',
                                             minute: '2-digit',
                                             second: '2-digit',
                                             hour12: false
                                           }) : 'Not completed'
                                         }
                                       </td>
                                </tr>
                                   );
                                 });
                               })()
                            ) : (
                              <tr>
                                   <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                  No learners found for this filter.
                                </td>
                              </tr>
                            )}
                          </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
                ) : (
                  <div className="space-y-6">
                    {/* Learner Information */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Learner Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <span className="text-sm font-medium">{sidebarContent.data.learner_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="text-sm font-medium">{sidebarContent.data.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Department:</span>
                          <span className="text-sm font-medium">{sidebarContent.data.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Statistics
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Modules Enrolled</span>
                          </div>
                          <div className="text-2xl font-bold">{sidebarContent.data.modules_enrolled}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Modules Completed</span>
                          </div>
                          <div className="text-2xl font-bold">{sidebarContent.data.modules_completed}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Avg Progress</span>
                          </div>
                          <div className="text-2xl font-bold">{Math.round(sidebarContent.data.avg_progress)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <h4 className="font-medium mb-3">Progress Overview</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate</span>
                          <span>{Math.round(sidebarContent.data.completion_rate)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(sidebarContent.data.completion_rate, 100)}%` }}
                          />
                  </div>
                </div>
              </div>
            </div>
          )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Details Modal - Half Screen from Bottom */}
      {showQuizDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={closeQuizDetailsModal}
          />
          
          {/* Modal - Large Screen */}
          <div className="relative bg-background w-full h-3/4 overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4 flex-shrink-0 bg-background">
                <div>
                  <h3 className="text-xl font-bold">
                    {quizDetailsData?.module?.name1 || quizDetailsData?.module?.name || 'Module Details'}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - {quizDetailsData?.date_attended || 'N/A'}
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed quiz results for {quizDetailsData?.user || 'Unknown User'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    className="h-8 px-3"
                  >
                    Export to PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeQuizDetailsModal}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingQuizDetails ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                    <div className="mt-2">Loading quiz details...</div>
                  </div>
                ) : quizDetailsData ? (
                  <>
                    {/* Question Analysis */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3">
                        Question Analysis - Score: <span className="text-base font-normal text-muted-foreground">{quizDetailsData?.score || 0}/{quizDetailsData?.max_score || 0} ({quizDetailsData?.percentage_score || 0}%)</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Time Limit: {quizDetailsData.time_limit}</span>
                          <span>Time Spent: {quizDetailsData.time_spent}</span>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-3 font-medium text-sm">Question</th>
                                <th className="text-left p-3 font-medium text-sm">Your Answer</th>
                                <th className="text-left p-3 font-medium text-sm">Correct Answer</th>
                                <th className="text-left p-3 font-medium text-sm">Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quizDetailsData.question_analysis?.map((qa: any, index: number) => (
                                <tr key={index} className="border-b hover:bg-muted/30">
                                  <td className="p-3 text-sm">
                                    <div className="max-w-md" title={qa.question?.replace(/<[^>]*>/g, '') || 'N/A'}>
                                      {qa.question?.replace(/<[^>]*>/g, '') || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    <div className="max-w-xs" title={qa.user_answer?.replace(/<[^>]*>/g, '') || 'N/A'}>
                                      {qa.user_answer?.replace(/<[^>]*>/g, '') || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    <div className="max-w-xs" title={qa.correct_answer?.replace(/<[^>]*>/g, '') || 'N/A'}>
                                      {qa.correct_answer?.replace(/<[^>]*>/g, '') || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    <div className={`flex items-center gap-1 ${
                                      qa.is_correct ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {qa.is_correct ? (
                                        <>
                                          <CheckCircle className="h-4 w-4" />
                                          <span>Correct</span>
                                        </>
                                      ) : (
                                        <>
                                          <X className="h-4 w-4" />
                                          <span>Incorrect</span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No quiz details available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Q&A Details Modal */}
        {showQaDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={closeQaDetailsModal}
            />
            
            {/* Modal - Large Screen */}
            <div className="relative bg-background w-full h-3/4 overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4 flex-shrink-0 bg-background">
                  <div>
                    <h3 className="text-xl font-bold">
                      Q&A Details
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        - {qaDetailsData?.date_attended || 'N/A'}
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detailed Q&A results for {qaDetailsData?.user || 'Unknown User'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {qaScoreFilter === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleAddScore}
                        className="h-8"
                      >
                        Add Score
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportQaToPDF}
                      className="h-8 px-3"
                    >
                      Export to PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeQaDetailsModal}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingQaDetails ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                      <div className="mt-2">Loading Q&A details...</div>
                    </div>
                  ) : qaDetailsData ? (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-muted/50 border border-muted rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground">User</div>
                          <div className="text-lg font-bold">{qaDetailsData.user || 'N/A'}</div>
                        </div>
                        <div className="bg-muted/50 border border-muted rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground">Score (%)</div>
                          <div className="text-lg font-bold">
                            Max Score: {qaDetailsData.max_score || 'N/A'}<br/>
                            Score: {qaDetailsData.score || 'N/A'} ({qaDetailsData.percentage_score || 0}%)
                          </div>
                        </div>
                        <div className="bg-muted/50 border border-muted rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground">Date</div>
                          <div className="text-lg font-bold">{qaDetailsData.date_attended || 'N/A'}</div>
                        </div>
                        <div className="bg-muted/50 border border-muted rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground">Module</div>
                          <div className="text-lg font-bold">{qaDetailsData.module?.name1 || qaDetailsData.module?.name || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Answer Analysis */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Answer Analysis</h4>
                        <div className="space-y-3">
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Time Limit: N/A</span>
                            <span>Time Spent: {qaDetailsData.time_spent || 'N/A'}</span>
                          </div>
                          
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">Question</th>
                                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">Answer</th>
                                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">Suggested Answer</th>
                                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">Alloted</th>
                                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">Q. Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {qaDetailsData.question_answer_responses?.map((response: any, index: number) => (
                                  <tr key={index} className="border-b hover:bg-muted/30">
                                    <td className="p-3 text-sm">
                                      <div 
                                        className="max-w-md" 
                                        title={response.question || 'N/A'}
                                      >
                                        {response.question?.replace(/<[^>]*>/g, '') || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                      <div 
                                        className="max-w-xs" 
                                        title={response.answer || 'N/A'}
                                      >
                                        {response.answer?.replace(/<[^>]*>/g, '') || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                      <div 
                                        className="max-w-xs" 
                                        title={response.suggested_answer || 'N/A'}
                                      >
                                        {response.suggested_answer?.replace(/<[^>]*>/g, '') || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm w-28">
                                      <Input
                                        type="number"
                                        value={qaAllotedMarks[index] ?? 0}
                                        onChange={(e) => handleAllotedChange(index, e.target.value, response.question_score ?? 0)}
                                        className="h-8"
                                        min={0}
                                        max={response.question_score ?? 0}
                                      />
                                    </td>
                                    <td className="p-3 text-sm">{response.question_score ?? 0}</td>
                                  </tr>
                                )) || (
                                  <tr className="border-b hover:bg-muted/30">
                                    <td className="p-3 text-sm">
                                      <div 
                                        className="max-w-md" 
                                        title={qaDetailsData.question_answer?.question || 'N/A'}
                                      >
                                        {qaDetailsData.question_answer?.question?.replace(/<[^>]*>/g, '') || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                      <div 
                                        className="max-w-xs" 
                                        title={qaDetailsData.question_answer?.answer || 'N/A'}
                                      >
                                        {qaDetailsData.question_answer?.answer?.replace(/<[^>]*>/g, '') || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                      <div 
                                        className="max-w-xs" 
                                        title={qaDetailsData.question_answer?.suggested_answer || 'N/A'}
                                      >
                                        {qaDetailsData.question_answer?.suggested_answer?.replace(/<[^>]*>/g, '') || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm w-28">
                                      <Input 
                                        type="number" 
                                        value={qaAllotedMarks[0] ?? 0} 
                                        onChange={(e)=>handleAllotedChange(0, e.target.value, qaDetailsData.question_answer?.question_score ?? 0)} 
                                        className="h-8" 
                                        min={0}
                                        max={qaDetailsData.question_answer?.question_score ?? 0}
                                      />
                                    </td>
                                    <td className="p-3 text-sm">{qaDetailsData.question_answer?.question_score ?? 0}</td>
                                  </tr>
                                )}
                                <tr className="border-t-2 font-semibold bg-muted/30">
                                  <td className="p-3 text-sm font-medium" colSpan={3}>Total</td>
                                  <td className="p-3 text-sm font-medium">{qaAllotedMarks.reduce((s: number, v: number) => s + (Number(v) || 0), 0)}</td>
                                  <td className="p-3 text-sm text-right pr-4">Max: {qaDetailsData.max_score ?? 0}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="flex justify-end mt-3">
                            <Button onClick={handleSaveAllotedScores}>Save Scores</Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No Q&A details available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Score Modal */}
        {showAddScoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setShowAddScoreModal(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 animate-in fade-in duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add Score</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddScoreModal(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {scoreUpdateSuccess ? (
                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-primary mb-2">Score Added Successfully!</h4>
                    <p className="text-sm text-muted-foreground">
                      The score has been updated for this user.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Enter Score</label>
                      <Input
                        type="number"
                        placeholder="Enter score"
                        value={scoreValue}
                        onChange={handleScoreInputChange}
                        min="0"
                        max={qaDetailsData?.max_score || 100}
                        className={`mt-1 ${scoreError ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Max score: {qaDetailsData?.max_score || 'N/A'}
                      </p>
                      {scoreError && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {scoreError}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddScoreModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleSaveScore}
                        disabled={loadingAddScore || !scoreValue || !!scoreError}
                      >
                        {loadingAddScore ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Score'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
