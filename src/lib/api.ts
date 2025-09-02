import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { searchCache } from "./cache";
import { errorHandler } from "./error-handler";
export { ErrorBoundary } from "./error-boundary";

// API Base URL
const API_BASE = process.env.NODE_ENV === 'production' 
  ? "https://lms.noveloffice.in" 
  : "http://10.80.4.85";

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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.learner_management.add_learner`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.learner_management.update_learner`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.progress_tracking.add_learner_progress`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.progress_tracking.update_learner_progress`, {
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
    const params = new URLSearchParams(data);
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.progress_tracking.get_learner_progress?${params}`, {
      credentials: 'include'
    });
    return response.json();
  }

  async getLearnerDashboard(data: { user: string }): Promise<{ message: LearnerDashboardData[] }> {
    const params = new URLSearchParams(data);
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard?${params}`, {
      credentials: 'include'
    });
    return response.json();
  }

  // Quiz & QA Progress APIs
  async addQuizProgress(data: { user: string; quiz_id: string; module?: string }) {
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.quiz_qa_progress.add_quiz_progress`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.quiz_qa_progress.update_quiz_progress`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.quiz_qa_progress.add_qa_progress`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.quiz_qa_progress.update_qa_progress`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.quiz_qa_progress.get_qa_quiz_analytics?${params}`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.module_management.get_admin_modules?${params}`, {
      credentials: 'include'
    });
    const result = await response.json();
    
    // Cache the result for 5 minutes
    searchCache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async getLearnerModuleData(data: { user: string; department?: string; limit?: number; offset?: number }) {
    try {
      // Check cache first
      const cacheKey = searchCache.generateKey('learner_module_data', data);
      const cachedData = searchCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const params = new URLSearchParams();
      params.append('user', data.user);
      if (data.department) params.append('department', data.department);
      if (data.limit) params.append('limit', data.limit.toString());
      if (data.offset) params.append('offset', data.offset.toString());
      
      const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.module_management.get_learner_module_data?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw { response: { status: response.status, data: await response.json() } };
      }
      
      const result = await response.json();
      
      // Cache the result for 5 minutes
      searchCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    } catch (error) {
      errorHandler.handleAPIError(error, 'getLearnerModuleData');
      throw error;
    }
  }

  async getModuleDetails() {
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.module_management.get_module_details`, {
      credentials: 'include'
    });
    return response.json();
  }

  async getModuleWithDetails(data: { module_id: string }) {
    const params = new URLSearchParams(data);
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.module_management.get_module_with_details?${params}`, {
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
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.analytics.get_lms_analytics?${params}`, {
      credentials: 'include'
    });
    const result = await response.json();
    
    // Cache the result for 2 minutes (analytics data changes more frequently)
    searchCache.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  }

  // TL Dashboard APIs
  async getTLDashboardData(data: { tl_user: string }): Promise<TLDashboardData> {
    const params = new URLSearchParams(data);
    const response = await fetch(`${this.baseURL}/api/method/novel_lms.novel_lms.api.tl_dashboard.get_tl_dashboard_data?${params}`, {
      credentials: 'include'
    });
    return response.json();
  }
}

// React Hooks for API calls
export const useAPI = () => {
  return APIService.getInstance();
};

// Specific hooks for common operations
export const useLearnerDashboard = (user: string) => {
  return useFrappeGetCall<{ message: LearnerDashboardData[] }>(
    "novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard",
    { user }
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
  return useFrappeGetCall<{ message: AnalyticsData }>(
    "novel_lms.novel_lms.api.analytics.get_lms_analytics",
    filters || {}
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
}) => {
  return useFrappeGetCall(
    "novel_lms.novel_lms.api.module_management.get_learner_module_data",
    { user, ...filters }
  );
};

export const useAdminModules = (filters?: {
  user?: string;
  module?: string;
  department?: string;
}) => {
  console.log("useAdminModules called with filters:", filters);
  
  const result = useFrappeGetCall(
    "novel_lms.novel_lms.api.module_management.get_admin_modules",
    filters || {}
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

// Export the singleton instance
export const apiService = APIService.getInstance();
