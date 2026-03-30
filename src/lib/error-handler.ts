// Error handling utilities for Novel LMS
import { useCallback } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/config/routes";

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: APIError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle API errors
  handleAPIError(error: any, context?: string): APIError {
    const apiError: APIError = {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      status: 500,
      details: error
    };

    // Parse different error formats
    if (error?.response?.data) {
      const responseData = error.response.data;
      apiError.message = responseData.message || responseData.error || apiError.message;
      apiError.code = responseData.code || responseData.error_type || apiError.code;
      apiError.status = error.response.status;
      apiError.details = responseData;
    } else if (error?.message) {
      apiError.message = error.message;
      apiError.code = error.code || apiError.code;
      apiError.status = error.status || apiError.status;
    }

    // Log error
    this.logError(apiError, context);

    // Show user-friendly message
    this.showUserMessage(apiError, context);

    return apiError;
  }

  // Handle network errors
  handleNetworkError(error: any, context?: string): APIError {
    const networkError: APIError = {
      message: "Network connection error. Please check your internet connection.",
      code: "NETWORK_ERROR",
      status: 0,
      details: error
    };

    if (error?.code === "ECONNABORTED") {
      networkError.message = "Request timeout. Please try again.";
      networkError.code = "TIMEOUT_ERROR";
    } else if (error?.code === "ERR_NETWORK") {
      networkError.message = "Unable to connect to server. Please try again later.";
      networkError.code = "CONNECTION_ERROR";
    }

    this.logError(networkError, context);
    this.showUserMessage(networkError, context);

    return networkError;
  }

  // Handle validation errors
  handleValidationError(errors: any, context?: string): APIError {
    const validationError: APIError = {
      message: "Please check your input and try again.",
      code: "VALIDATION_ERROR",
      status: 400,
      details: errors
    };

    if (Array.isArray(errors)) {
      validationError.message = errors.map((e: any) => e.message || e).join(", ");
    } else if (typeof errors === "object") {
      validationError.message = Object.values(errors).join(", ");
    }

    this.logError(validationError, context);
    this.showUserMessage(validationError, context);

    return validationError;
  }

  // Handle authentication errors
  handleAuthError(error: any, context?: string): APIError {
    const authError: APIError = {
      message: "Authentication failed. Please log in again.",
      code: "AUTH_ERROR",
      status: 401,
      details: error
    };

    if (error?.status === 403) {
      authError.message = "You don't have permission to perform this action.";
      authError.code = "PERMISSION_ERROR";
      authError.status = 403;
    }

    this.logError(authError, context);
    this.showUserMessage(authError, context);

    return authError;
  }

  // Show user-friendly error messages
  private showUserMessage(error: APIError, context?: string) {
    const contextPrefix = context ? `[${context}] ` : "";
    
    switch (error.code) {
      case "NETWORK_ERROR":
      case "CONNECTION_ERROR":
      case "TIMEOUT_ERROR":
        toast.error(`${contextPrefix}${error.message}`, {
          duration: 5000,
          action: {
            label: "Retry",
            onClick: () => window.location.reload()
          }
        });
        break;

      case "AUTH_ERROR":
      case "PERMISSION_ERROR":
        toast.error(`${contextPrefix}${error.message}`, {
          duration: 4000,
          action: {
            label: "Login",
            onClick: () => window.location.href = ROUTES.LOGIN
          }
        });
        break;

      case "VALIDATION_ERROR":
        toast.error(`${contextPrefix}${error.message}`, {
          duration: 4000
        });
        break;

      case "DUPLICATE_EMAIL":
        toast.error(`${contextPrefix}A user with this email already exists.`, {
          duration: 4000
        });
        break;

      case "DUPLICATE_MOBILE":
        toast.error(`${contextPrefix}A user with this mobile number already exists.`, {
          duration: 4000
        });
        break;

      case "USER_NOT_FOUND":
        toast.error(`${contextPrefix}User not found.`, {
          duration: 3000
        });
        break;

      default:
        toast.error(`${contextPrefix}${error.message}`, {
          duration: 4000
        });
        break;
    }
  }

  // Log error for debugging
  private logError(error: APIError, context?: string) {
    const logEntry = {
      ...error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLog.push(logEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", logEntry);
    }
  }

  // Get error log
  getErrorLog(): APIError[] {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byCode: {} as Record<string, number>,
      byStatus: {} as Record<number, number>,
      recent: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(error => {
      stats.byCode[error.code || "UNKNOWN"] = (stats.byCode[error.code || "UNKNOWN"] || 0) + 1;
      stats.byStatus[error.status || 0] = (stats.byStatus[error.status || 0] || 0) + 1;
    });

    return stats;
  }
}

// React hook for error handling
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = useCallback((error: any, context?: string) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return errorHandler.handleAuthError(error, context);
    } else if (error?.code === "NETWORK_ERROR" || error?.code === "ECONNABORTED") {
      return errorHandler.handleNetworkError(error, context);
    } else if (error?.response?.status === 400) {
      return errorHandler.handleValidationError(error.response.data, context);
    } else {
      return errorHandler.handleAPIError(error, context);
    }
  }, [errorHandler]);

  return {
    handleError,
    getErrorLog: errorHandler.getErrorLog.bind(errorHandler),
    getErrorStats: errorHandler.getErrorStats.bind(errorHandler),
    clearErrorLog: errorHandler.clearErrorLog.bind(errorHandler)
  };
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
