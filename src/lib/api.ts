import React from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { searchCache } from "@/lib/cache";
import { errorHandler } from "@/lib/error-handler";
import { requestDeduplication } from "@/lib/request-deduplication";
export { ErrorBoundary } from "@/lib/error-boundary";
import { LMS_API_BASE_URL } from "../config/routes";

// API Base URL
const API_BASE = process.env.NODE_ENV === 'production' 
  ? "https://lms.noveloffice.org" 
  : LMS_API_BASE_URL;

// Types
export interface User {
  name: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  department?: string;
  departments?: string[];
  enabled: boolean;
  roles?: string[];
  creation?: string;
  modified?: string;
}

export interface Module {
  name: string;
  name1: string;
  title?: string;
  description?: string;
  duration?: number;
  status: string;
  is_published: boolean;
  assignment_based: string;
  department?: string;
  image?: string;
  has_scoring: boolean;
  has_progress: boolean;
  created_by?: string;
  published_by?: string;
  total_score?: number;
  order?: number;
  short_text?: string;
}

export interface ProgressTracker {
  name: string;
  status: string;
  module_duration?: number;
  started_on?: string;
  completed_on?: string;
  progress?: number;
  score?: number;
}

export interface LearnerDashboardData {
  module: Module;
  progress: ProgressTracker | null;
}

export interface QuizProgress {
  name: string;
  user: string;
  quiz_id: string;
  score: number;
  max_score: number;
  time_spent?: number;
  started_on?: string;
  ended_on?: string;
  module?: string;
}

export interface QAProgress {
  name: string;
  user: string;
  question_answer: string;
  start_time?: string;
  end_time?: string;
  module?: string;
  max_score: number;
  score: number;
  score_added?: boolean;
}

// Phase 2: Enhanced Progress Tracking Interfaces
export interface ProgressDetails {
  completed_lessons: string[];
  completed_chapters: string[];
  current_position: {
    type: string;
    reference_id: string;
    start_time: string;
  } | null;
  progress_percentages: {
    lesson: number;
    chapter: number;
  };
  total_lessons: number;
  total_chapters: number;
  overall_progress: number;
  status: string;
  error?: string;
}

export interface CurrentPosition {
  current_position: {
    type: string;
    reference_id: string;
    start_time: string;
    module: string;
  } | null;
  resume_available: boolean;
  module: string;
  user: string;
  error?: string;
}

export interface PositionUpdate {
  success: boolean;
  current_position: {
    lesson: string;
    chapter: string;
    status: string;
  };
  error?: string;
}

export interface CompletionData {
  completed_lessons: string[];
  completed_chapters: string[];
  in_progress_chapters: string[];
  current_position: {
    type: string;
    reference_id: string;
    start_time: string;
  } | null;
  total_lessons: number;
  total_chapters: number;
  overall_progress: number;
  error?: string;
}

export interface AnalyticsData {
  stat_cards: Array<{
    title: string;
    value: number | string;
  }>;
  modules: Array<{
    id: string;
    name: string;
  }>;
  learners: Array<{
    id: string;
    full_name: string;
    department?: string;
    tl?: string;
  }>;
  departments: Array<{
    id: string;
    name: string;
  }>;
  users_stats: {
    percentage_change: number;
    previous_count: number;
    recent_count: number;
  };
  modules_stats: {
    percentage_change: number;
    previous_count: number;
    recent_count: number;
  };
  users: Array<{
    name: string;
    full_name: string;
    email: string;
    creation: string;
  }>;
}

export interface TLDashboardData {
  total_learners: number;
  active_learners: number;
  completed_modules: number;
  total_modules: number;
  average_progress: number;
  recent_activities: Array<{
    user: string;
    action: string;
    module: string;
    timestamp: string;
  }>;
  top_performers: Array<{
    user: string;
    full_name: string;
    progress: number;
    completed_modules: number;
  }>;
  department_stats: Array<{
    department: string;
    learner_count: number;
    average_progress: number;
  }>;
}

// API Service Class
export class APIService {
  private static instance: APIService;
  private baseURL: string;

  private constructor() {
    this.baseURL = API_BASE;
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  // Helper method to construct URLs without double slashes
  private buildUrl(path: string): string {
    const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  // Deduplicated GET request method
  async getDeduplicated(method: string, params: any = {}, ttl: number = 30000): Promise<any> {
    return requestDeduplication.deduplicate(
      method,
      params,
      async () => {
        const queryString = new URLSearchParams(params).toString();
        const url = this.buildUrl(`/api/method/${method}${queryString ? `?${queryString}` : ''}`);
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      },
      ttl
    );
  }

  // Learner Management APIs
  async addLearner(data: {
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    mobile_no?: string;
    department?: string;
    departments?: string[];
    password?: string;
    send_welcome_email?: boolean;
  }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.learner_management.add_learner'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async updateLearner(data: {
    user_id: string;
    email?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    mobile_no?: string;
    department?: string;
    departments?: string[];
    password?: string;
    enabled?: boolean;
  }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.learner_management.update_learner'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  // Progress Tracking APIs
  async addLearnerProgress(data: { user: string; module: string }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.progress_tracking.add_learner_progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async updateLearnerProgress(data: {
    user: string;
    module: string;
    lesson?: string;
    chapter?: string;
    status?: string;
  }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.progress_tracking.update_learner_progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async getLearnerProgress(data: { user: string; module: string }) {
    try {
      // Use deduplication with short TTL for progress data (15 seconds)
      // Progress data needs to be relatively fresh but can be deduplicated briefly
      const result = await this.getDeduplicated(
        'novel_lms.novel_lms.api.progress_tracking.get_learner_progress',
        data,
        15000 // 15 seconds TTL
      );
      return result;
    } catch (error) {
      errorHandler.handleAPIError(error, 'getLearnerProgress');
      throw error;
    }
  }

  async getLearnerDashboard(data: { user: string }): Promise<{ message: LearnerDashboardData[] }> {
    const params = new URLSearchParams(data);
    const response = await fetch(this.buildUrl(`/api/method/novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard?${params}`), {
      credentials: 'include'
    });
    return response.json();
  }

  // Quiz & QA Progress APIs
  async addQuizProgress(data: { user: string; quiz_id: string; module?: string }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.quiz_qa_progress.add_quiz_progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async updateQuizProgress(data: { quiz_id: string; answers: Record<string, any> }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.quiz_qa_progress.update_quiz_progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async addQAProgress(data: { qa_id: string }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.quiz_qa_progress.add_qa_progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async updateQAProgress(data: { qa_id: string; answers: Array<{ question: string; answer: string; suggested_answer?: string }> }) {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.quiz_qa_progress.update_qa_progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async getQAQuizAnalytics(data?: { user?: string }): Promise<{ data: { quiz_progress: QuizProgress[]; qa_progress: QAProgress[] } }> {
    const params = data ? new URLSearchParams(data) : '';
    const response = await fetch(this.buildUrl(`/api/method/novel_lms.novel_lms.api.quiz_qa_progress.get_qa_quiz_analytics?${params}`), {
      credentials: 'include'
    });
    return response.json();
  }

  // Module Management APIs
  async getAdminModules(data?: { user?: string; module?: string; department?: string }) {
    // Check cache first
    const cacheKey = searchCache.generateKey('admin_modules', data || {});
    const cachedData = searchCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const params = data ? new URLSearchParams(data) : '';
    const response = await fetch(this.buildUrl(`/api/method/novel_lms.novel_lms.api.module_management.get_admin_modules?${params}`), {
      credentials: 'include'
    });
    const result = await response.json();
    
    // Cache the result for 5 minutes
    searchCache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async getLearnerModuleData(data: { user: string; department?: string; limit?: number; offset?: number }) {
    try {
      // Use deduplication with shorter TTL for module data (30 seconds)
      // This prevents duplicate calls while ensuring relatively fresh data
        const result = await this.getDeduplicated(
          'novel_lms.novel_lms.api.module_management.get_learner_module_data',
          data,
          30000 // 30 seconds TTL
        );
        
        // Unwrap the message field if it exists (Frappe API format)
        const unwrappedResult = result.message || result;
        
        return unwrappedResult;
    } catch (error) {
      errorHandler.handleAPIError(error, 'getLearnerModuleData');
      throw error;
    }
  }

  async getModuleDetails() {
    const response = await fetch(this.buildUrl('/api/method/novel_lms.novel_lms.api.module_management.get_module_details'), {
      credentials: 'include'
    });
    return response.json();
  }

  async getModuleWithDetails(data: { module_id: string }) {
    const params = new URLSearchParams(data);
    const url = this.buildUrl(`/api/method/novel_lms.novel_lms.api.module_management.get_learner_module_by_id?${params}`);
    const response = await fetch(url, {
      credentials: 'include'
    });
    return response.json();
  }

  // Analytics APIs
  async getLMSAnalytics(data?: {
    date_range?: string;
    date_from?: string;
    date_to?: string;
    department?: string;
    module?: string;
    quiz?: string;
    learner?: string;
  }): Promise<{ message: AnalyticsData }> {
    // Check cache first
    const cacheKey = searchCache.generateKey('lms_analytics', data || {});
    const cachedData = searchCache.get<{ message: AnalyticsData }>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const params = data ? new URLSearchParams(data) : '';
    const response = await fetch(this.buildUrl(`/api/method/novel_lms.novel_lms.api.analytics.get_lms_analytics?${params}`), {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Cache the result for 2 minutes (analytics data changes more frequently)
    searchCache.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  }

  async getDepartments(): Promise<{ message: any[] }> {
    const url = this.buildUrl('/api/method/novel_lms.novel_lms.api.departments.get_departments');
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    return response.json();
  }

  async getLearnersData(): Promise<{ message: any }> {
    const url = this.buildUrl('/api/method/novel_lms.novel_lms.api.departments.get_learners_data');
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    return response.json();
  }

  async getUserDepartmentMapping(): Promise<{ message: Record<string, any> }> {
    const url = this.buildUrl('/api/method/novel_lms.novel_lms.api.departments.get_user_departments_mapping');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - department mapping API took too long to respond');
      }
      throw error;
    }
  }

  // TL Dashboard APIs
  async getTLDashboardData(data: { tl_user: string }): Promise<TLDashboardData> {
    const params = new URLSearchParams(data);
    const response = await fetch(this.buildUrl(`/api/method/novel_lms.novel_lms.api.tl_dashboard.get_tl_dashboard_data?${params}`), {
      credentials: 'include'
    });
    return response.json();
  }

  // Batch API methods
  async getModuleBatchData(data: { 
    user: string; 
    module_id?: string; 
    include_progress?: boolean; 
    include_permissions?: boolean; 
    include_content_access?: boolean; 
  }) {
    try {
      const result = await this.getDeduplicated(
        'novel_lms.novel_lms.api.batch_api.get_module_batch_data',
        data,
        30000 // 30 seconds TTL
      );
      return result.message || result;
    } catch (error) {
      errorHandler.handleAPIError(error, 'getModuleBatchData');
      throw error;
    }
  }

  async getDashboardBatchData(data: { user: string }) {
    try {
      const result = await this.getDeduplicated(
        'novel_lms.novel_lms.api.batch_api.get_dashboard_batch_data',
        data,
        60000 // 1 minute TTL for dashboard data
      );
      return result.message || result;
    } catch (error) {
      errorHandler.handleAPIError(error, 'getDashboardBatchData');
      throw error;
    }
  }
}

// React Hooks for API calls
export const useAPI = () => {
  return APIService.getInstance();
};

// Specific hooks for common operations
export const useLearnerDashboard = (user: string, options?: { enabled?: boolean }) => {
  return useFrappeGetCall<{ message: LearnerDashboardData[] }>(
    "novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard",
    { user },
    options
  );
};

export const useLMSAnalytics = (filters?: {
  date_range?: string;
  date_from?: string;
  date_to?: string;
  department?: string;
  module?: string;
  quiz?: string;
  learner?: string;
}) => {
  return useFrappeGetCall<{ message: any }>(
    "novel_lms.novel_lms.api.analytics.get_lms_analytics",
    filters || {},
    {
      // Disable caching to ensure fresh data on each call
      cache: false,
      // Add retry logic for failed requests
      retry: 2,
      // Set a reasonable timeout
      timeout: 10000
    }
  );
};

export const useLearnersData = () => {
  return useFrappeGetCall<{ message: any }>(
    "novel_lms.novel_lms.api.departments.get_learners_data"
  );
};

export const useTLDashboard = (tl_user: string, options?: { enabled?: boolean }) => {
  console.log("useTLDashboard called with:", { tl_user, options });
  
  const result = useFrappeGetCall<TLDashboardData>(
    "novel_lms.novel_lms.api.tl_dashboard.get_tl_dashboard_data",
    { tl_user },
    options
  );
  
  console.log("useTLDashboard result:", result);
  
  return result;
};

export const useLearnerModuleData = (user: string, filters?: {
  department?: string;
  limit?: number;
  offset?: number;
}, options?: { enabled?: boolean }) => {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // More robust enabled condition - only call if user is provided and not empty
  const isEnabled = options?.enabled !== false && user && user.trim() !== "";
  
  const params = { user, ...filters };
  
  console.log('🔍 useLearnerModuleData called with:', {
    user,
    filters,
    options,
    isEnabled,
    userProvided: !!user,
    userLength: user?.length || 0
  });
  
  React.useEffect(() => {
    if (!isEnabled) {
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiService = APIService.getInstance();
        const result = await apiService.getLearnerModuleData(params);
        setData(result);
      } catch (err) {
        console.error('useLearnerModuleData: API call failed:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isEnabled, user, JSON.stringify(filters)]);
  
  return { data, error, isLoading };
};

export const useAdminModules = (filters?: {
  user?: string;
  module?: string;
  department?: string;
}, options?: { enabled?: boolean }) => {
  console.log("useAdminModules called with filters:", filters);
  
  // Memoize the filters to prevent unnecessary re-calls
  const memoizedFilters = React.useMemo(() => {
    if (!filters) return {};
    return {
      user: filters.user,
      module: filters.module,
      department: filters.department
    };
  }, [filters?.user, filters?.module, filters?.department]);
  
  const result = useFrappeGetCall(
    "novel_lms.novel_lms.api.module_management.get_admin_modules",
    memoizedFilters,
    options
  );
  
  console.log("useAdminModules result:", result);
  
  return result;
};

// Post call hooks
export const useAddLearner = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.learner_management.add_learner");
};

export const useUpdateLearner = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.learner_management.update_learner");
};

export const useAddLearnerProgress = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.progress_tracking.add_learner_progress");
};

export const useUpdateLearnerProgress = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.progress_tracking.update_learner_progress");
};

export const useGetLearnerProgress = (user: string, module: string, options?: { enabled?: boolean }) => {
  return useFrappeGetCall<{ data: { module: any } }>(
    "novel_lms.novel_lms.api.progress_tracking.get_learner_progress",
    { user, module },
    options
  );
};

export const useAddQuizProgress = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.quiz_qa_progress.add_quiz_progress");
};

export const useUpdateQuizProgress = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.quiz_qa_progress.update_quiz_progress");
};

export const useAddQAProgress = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.quiz_qa_progress.add_qa_progress");
};

export const useUpdateQAProgress = () => {
  return useFrappePostCall("novel_lms.novel_lms.api.quiz_qa_progress.update_qa_progress");
};

// Batch API hooks
export const useModuleBatchData = (user: string, moduleId?: string, options?: { enabled?: boolean }) => {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isEnabled = options?.enabled !== false && !!user;
  
  React.useEffect(() => {
    if (!isEnabled) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiService = APIService.getInstance();
        const result = await apiService.getModuleBatchData({
          user,
          module_id: moduleId,
          include_progress: true,
          include_permissions: true,
          include_content_access: true
        });
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isEnabled, user, moduleId]);
  
  return { data, error, isLoading };
};

export const useDashboardBatchData = (user: string, options?: { enabled?: boolean }) => {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isEnabled = options?.enabled !== false && !!user;
  
  React.useEffect(() => {
    if (!isEnabled) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiService = APIService.getInstance();
        const result = await apiService.getDashboardBatchData({ user });
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isEnabled, user]);
  
  return { data, error, isLoading };
};

// Phase 2: Enhanced Progress Tracking API Hooks
export const useLearnerProgressDetails = (user: string, module: string, options?: { enabled?: boolean }) => {
  return useFrappeGetCall<{ message: ProgressDetails }>(
    "novel_lms.novel_lms.api.progress_tracking.get_learner_progress_details",
    { user, module },
    options
  );
};

export const useCurrentPosition = (user: string, module: string, options?: { enabled?: boolean }) => {
  return useFrappeGetCall<{ message: CurrentPosition }>(
    "novel_lms.novel_lms.api.progress_tracking.get_current_position",
    { user, module },
    options
  );
};

export const useUpdateCurrentPosition = () => {
  return useFrappePostCall<{ message: PositionUpdate }>("novel_lms.novel_lms.api.progress_tracking.update_current_position");
};

export const useLearnerCompletionData = (user: string, module: string, options?: { enabled?: boolean }) => {
  return useFrappeGetCall<{ message: CompletionData }>(
    "novel_lms.novel_lms.api.progress_tracking.get_learner_completion_data",
    { user, module },
    options
  );
};

// Export the singleton instance
export const apiService = APIService.getInstance();
