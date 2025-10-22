/**
 * Progress Tracker Hooks - Custom hooks for easy progress management
 * Provides convenient hooks for different progress tracking scenarios
 */

import { useCallback, useEffect, useState } from 'react';
import { useProgressTracker } from '../contexts/ProgressTrackerContext.tsx';
import type { ProgressData } from '../lib/websocket-progress-service';

/**
 * Hook for managing progress of a specific module
 */
export function useModuleProgress(moduleId: string) {
  const {
    progress,
    updateProgress,
    refreshProgress,
    subscribeToModule,
    unsubscribeFromModule,
    isUpdating,
    lastError,
    connectionStatus,
    getProgress,
    isModuleCompleted,
    getProgressPercentage
  } = useProgressTracker();

  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to module on mount
  useEffect(() => {
    if (moduleId) {
      subscribeToModule(moduleId);
    }

    return () => {
      if (moduleId) {
        unsubscribeFromModule(moduleId);
      }
    };
  }, [moduleId, subscribeToModule, unsubscribeFromModule]);

  // Get current progress data
  const moduleProgress = getProgress(moduleId);

  // Update progress for this module
  const updateModuleProgress = useCallback(async (progressData: Partial<ProgressData>) => {
    if (!moduleId) return;
    await updateProgress(moduleId, progressData);
  }, [moduleId, updateProgress]);

  // Refresh progress for this module
  const refreshModuleProgress = useCallback(async () => {
    if (!moduleId) return;
    setIsLoading(true);
    try {
      await refreshProgress(moduleId);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, refreshProgress]);

  // Mark lesson as completed
  const completeLesson = useCallback(async (lessonId: string) => {
    await updateModuleProgress({
      currentLesson: lessonId,
      status: 'In Progress',
      completedLessons: (moduleProgress?.completedLessons || 0) + 1
    });
  }, [updateModuleProgress, moduleProgress?.completedLessons]);

  // Mark chapter as completed
  const completeChapter = useCallback(async (chapterId: string) => {
    await updateModuleProgress({
      currentChapter: chapterId,
      status: 'In Progress'
    });
  }, [updateModuleProgress]);

  // Mark content as completed
  const completeContent = useCallback(async (contentId: string, contentType: string) => {
    await updateModuleProgress({
      content: contentId,
      contentType: contentType,
      status: 'In Progress'
    });
  }, [updateModuleProgress]);

  // Mark module as completed
  const completeModule = useCallback(async () => {
    await updateModuleProgress({
      status: 'Completed',
      progress: 100
    });
  }, [updateModuleProgress]);

  return {
    // Data
    progress: moduleProgress,
    isLoading,
    isUpdating,
    lastError,
    connectionStatus,
    
    // Computed values
    isCompleted: isModuleCompleted(moduleId),
    progressPercentage: getProgressPercentage(moduleId),
    
    // Actions
    updateProgress: updateModuleProgress,
    refreshProgress: refreshModuleProgress,
    completeLesson,
    completeChapter,
    completeContent,
    completeModule
  };
}

/**
 * Hook for managing progress of multiple modules
 */
export function useMultiModuleProgress(moduleIds: string[]) {
  const {
    progress,
    updateProgress,
    refreshProgress,
    subscribeToModule,
    unsubscribeFromModule,
    isUpdating,
    lastError,
    connectionStatus,
    getProgress,
    isModuleCompleted,
    getProgressPercentage
  } = useProgressTracker();

  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to all modules on mount
  useEffect(() => {
    moduleIds.forEach(moduleId => {
      if (moduleId) {
        subscribeToModule(moduleId);
      }
    });

    return () => {
      moduleIds.forEach(moduleId => {
        if (moduleId) {
          unsubscribeFromModule(moduleId);
        }
      });
    };
  }, [moduleIds, subscribeToModule, unsubscribeFromModule]);

  // Get progress for all modules
  const modulesProgress = moduleIds.map(moduleId => ({
    moduleId,
    progress: getProgress(moduleId),
    isCompleted: isModuleCompleted(moduleId),
    progressPercentage: getProgressPercentage(moduleId)
  }));

  // Refresh all modules
  const refreshAllProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all(moduleIds.map(moduleId => refreshProgress(moduleId)));
    } finally {
      setIsLoading(false);
    }
  }, [moduleIds, refreshProgress]);

  // Get overall progress statistics
  const overallStats = {
    totalModules: moduleIds.length,
    completedModules: modulesProgress.filter(m => m.isCompleted).length,
    inProgressModules: modulesProgress.filter(m => m.progress && m.progress.status === 'In Progress').length,
    notStartedModules: modulesProgress.filter(m => !m.progress || m.progress.status === 'Not Started').length,
    averageProgress: modulesProgress.reduce((sum, m) => sum + m.progressPercentage, 0) / moduleIds.length
  };

  return {
    // Data
    modulesProgress,
    overallStats,
    isLoading,
    isUpdating,
    lastError,
    connectionStatus,
    
    // Actions
    refreshAllProgress
  };
}

/**
 * Hook for progress tracking with automatic updates
 */
export function useAutoProgressTracker(moduleId: string, options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onProgressChange?: (progress: ProgressData | null) => void;
  onError?: (error: string) => void;
} = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    onProgressChange,
    onError
  } = options;

  const {
    progress,
    updateProgress,
    refreshProgress,
    subscribeToModule,
    unsubscribeFromModule,
    isUpdating,
    lastError,
    connectionStatus,
    getProgress
  } = useProgressTracker();

  // Subscribe to module on mount
  useEffect(() => {
    if (moduleId) {
      subscribeToModule(moduleId);
    }

    return () => {
      if (moduleId) {
        unsubscribeFromModule(moduleId);
      }
    };
  }, [moduleId, subscribeToModule, unsubscribeFromModule]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !moduleId) return;

    const interval = setInterval(() => {
      refreshProgress(moduleId);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, moduleId, refreshProgress]);

  // Get current progress
  const moduleProgress = getProgress(moduleId);

  // Notify on progress change
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(moduleProgress);
    }
  }, [moduleProgress, onProgressChange]);

  // Notify on error
  useEffect(() => {
    if (lastError && onError) {
      onError(lastError);
    }
  }, [lastError, onError]);

  return {
    progress: moduleProgress,
    isUpdating,
    lastError,
    connectionStatus,
    updateProgress: (progressData: Partial<ProgressData>) => updateProgress(moduleId, progressData),
    refreshProgress: () => refreshProgress(moduleId)
  };
}

/**
 * Hook for progress analytics and reporting
 */
export function useProgressAnalytics(moduleIds: string[]) {
  const { progress, getProgress, isModuleCompleted, getProgressPercentage } = useProgressTracker();

  // Get analytics data
  const analytics = useCallback(() => {
    const modulesData = moduleIds.map(moduleId => {
      const moduleProgress = getProgress(moduleId);
      return {
        moduleId,
        progress: moduleProgress,
        isCompleted: isModuleCompleted(moduleId),
        progressPercentage: getProgressPercentage(moduleId),
        lastUpdated: moduleProgress?.timestamp
      };
    });

    const completed = modulesData.filter(m => m.isCompleted);
    const inProgress = modulesData.filter(m => m.progress?.status === 'In Progress');
    const notStarted = modulesData.filter(m => !m.progress || m.progress.status === 'Not Started');

    const totalProgress = modulesData.reduce((sum, m) => sum + m.progressPercentage, 0);
    const averageProgress = totalProgress / moduleIds.length;

    return {
      modules: modulesData,
      summary: {
        total: moduleIds.length,
        completed: completed.length,
        inProgress: inProgress.length,
        notStarted: notStarted.length,
        averageProgress: Math.round(averageProgress * 100) / 100
      },
      completionRate: (completed.length / moduleIds.length) * 100,
      progressDistribution: {
        '0-25%': modulesData.filter(m => m.progressPercentage >= 0 && m.progressPercentage < 25).length,
        '25-50%': modulesData.filter(m => m.progressPercentage >= 25 && m.progressPercentage < 50).length,
        '50-75%': modulesData.filter(m => m.progressPercentage >= 50 && m.progressPercentage < 75).length,
        '75-100%': modulesData.filter(m => m.progressPercentage >= 75 && m.progressPercentage < 100).length,
        '100%': modulesData.filter(m => m.progressPercentage === 100).length
      }
    };
  }, [moduleIds, progress, getProgress, isModuleCompleted, getProgressPercentage]);

  return {
    analytics,
    getAnalytics: analytics
  };
}
