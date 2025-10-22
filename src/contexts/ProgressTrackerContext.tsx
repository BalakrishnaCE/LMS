/**
 * Progress Tracker Context - Clean React context for progress state management
 * Provides optimistic updates, real-time synchronization, and error handling
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../hooks/use-user';
import { FrappeContext } from 'frappe-react-sdk';
import { websocketProgressService, ProgressData, ProgressUpdateData } from '../lib/websocket-progress-service';

interface ProgressTrackerContextType {
  // Progress data
  progress: Record<string, ProgressData>;
  
  // Actions
  updateProgress: (moduleId: string, progressData: Partial<ProgressData>) => Promise<void>;
  refreshProgress: (moduleId: string) => Promise<void>;
  subscribeToModule: (moduleId: string) => void;
  unsubscribeFromModule: (moduleId: string) => void;
  
  // State
  isUpdating: boolean;
  lastError: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Utilities
  getProgress: (moduleId: string) => ProgressData | null;
  isModuleCompleted: (moduleId: string) => boolean;
  getProgressPercentage: (moduleId: string) => number;
}

const ProgressTrackerContext = createContext<ProgressTrackerContextType | undefined>(undefined);

interface ProgressTrackerProviderProps {
  children: React.ReactNode;
}

export function ProgressTrackerProvider({ children }: ProgressTrackerProviderProps) {
  const { user } = useUser();
  const frappeContext = useContext(FrappeContext);
  const socket = frappeContext?.socket;
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const subscribedModules = useRef<Set<string>>(new Set());
  const optimisticUpdates = useRef<Map<string, ProgressData>>(new Map());

  // Initialize WebSocket connection and listeners
  useEffect(() => {
    if (!user?.email) return;

    // Set up socket in the service
    websocketProgressService.setSocket(socket);

    // Set up WebSocket event listeners
    const handleProgressUpdated = (data: ProgressData) => {
      console.log('Progress updated received in context:', data);
      setProgress(prev => ({
        ...prev,
        [data.moduleId]: {
          ...prev[data.moduleId],
          ...data,
          timestamp: data.timestamp || new Date().toISOString()
        }
      }));
      setLastError(null);
    };

    const handleProgressUpdateResponse = (response: any) => {
      console.log('Progress update response received:', response);
      if (response.success) {
        // Clear optimistic update
        optimisticUpdates.current.delete(response.moduleId);
        setLastError(null);
      }
    };

    const handleProgressUpdateError = (error: { moduleId: string; error: string }) => {
      console.error('Progress update error received:', error);
      setLastError(error.error);
      
      // Revert optimistic update
      const optimisticUpdate = optimisticUpdates.current.get(error.moduleId);
      if (optimisticUpdate) {
        setProgress(prev => ({
          ...prev,
          [error.moduleId]: optimisticUpdate
        }));
        optimisticUpdates.current.delete(error.moduleId);
      }
    };

    // Add listeners
    websocketProgressService.addListener('progress_updated', handleProgressUpdated);
    websocketProgressService.addListener('progress_update_response', handleProgressUpdateResponse);
    websocketProgressService.addListener('progress_update_error', handleProgressUpdateError);

    // Monitor connection status
    const checkConnectionStatus = () => {
      setConnectionStatus(websocketProgressService.getConnectionStatus());
    };

    const statusInterval = setInterval(checkConnectionStatus, 1000);

    return () => {
      websocketProgressService.removeListener('progress_updated', handleProgressUpdated);
      websocketProgressService.removeListener('progress_update_response', handleProgressUpdateResponse);
      websocketProgressService.removeListener('progress_update_error', handleProgressUpdateError);
      clearInterval(statusInterval);
    };
  }, [user?.email]);

  // Fetch initial progress data for a module
  const fetchInitialProgress = useCallback(async (moduleId: string) => {
    if (!user?.email) return;

    try {
      // Use the dashboard API which we know works
      const response = await fetch(`/api/method/novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard?user=${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message.modules) {
          // Find the specific module in the dashboard data
          const moduleData = data.message.modules.find((m: any) => m.id === moduleId);
          if (moduleData) {
            const progressData: ProgressData = {
              moduleId: moduleId,
              userId: user.email,
              progress: moduleData.progress || 0,
              status: moduleData.status || 'Not Started',
              currentLesson: moduleData.current_lesson,
              currentChapter: moduleData.current_chapter,
              totalLessons: moduleData.total_lessons || 0,
              completedLessons: moduleData.completed_lessons || 0,
              timestamp: new Date().toISOString()
            };
            
            setProgress(prev => ({
              ...prev,
              [moduleId]: progressData
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial progress:', error);
    }
  }, [user?.email]);

  // Update progress with optimistic updates
  const updateProgress = useCallback(async (moduleId: string, progressData: Partial<ProgressData>) => {
    if (!user?.email) {
      console.error('User not authenticated');
      return;
    }

    setIsUpdating(true);
    setLastError(null);

    // Create optimistic update
    const currentProgress = progress[moduleId] || {
      moduleId,
      userId: user.email,
      progress: 0,
      status: 'Not Started' as const,
      totalLessons: 0,
      completedLessons: 0,
      timestamp: new Date().toISOString()
    };

    const optimisticUpdate: ProgressData = {
      ...currentProgress,
      ...progressData,
      timestamp: new Date().toISOString()
    };

    // Store optimistic update for potential rollback
    optimisticUpdates.current.set(moduleId, currentProgress);

    // Apply optimistic update immediately
    setProgress(prev => ({
      ...prev,
      [moduleId]: optimisticUpdate
    }));

    try {
      // Convert to WebSocket service format
      const updateData: ProgressUpdateData = {
        moduleId,
        userId: user.email,
        lesson: progressData.currentLesson,
        chapter: progressData.currentChapter,
        content: progressData.content,
        contentType: progressData.contentType,
        status: progressData.status || 'In Progress',
        progress: progressData.progress,
        timestamp: Date.now()
      };

      await websocketProgressService.updateProgress(updateData);
      console.log('Progress update sent successfully:', updateData);

    } catch (error) {
      console.error('Failed to update progress:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      
      // Revert optimistic update
      const originalProgress = optimisticUpdates.current.get(moduleId);
      if (originalProgress) {
        setProgress(prev => ({
          ...prev,
          [moduleId]: originalProgress
        }));
        optimisticUpdates.current.delete(moduleId);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [user?.email, progress]);

  // Refresh progress data
  const refreshProgress = useCallback(async (moduleId: string) => {
    if (!user?.email) return;

    try {
      // Use the dashboard API which we know works
      const response = await fetch(`/api/method/novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard?user=${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message.modules) {
          // Find the specific module in the dashboard data
          const moduleData = data.message.modules.find((m: any) => m.id === moduleId);
          if (moduleData) {
            const progressData: ProgressData = {
              moduleId: moduleId,
              userId: user.email,
              progress: moduleData.progress || 0,
              status: moduleData.status || 'Not Started',
              currentLesson: moduleData.current_lesson,
              currentChapter: moduleData.current_chapter,
              totalLessons: moduleData.total_lessons || 0,
              completedLessons: moduleData.completed_lessons || 0,
              timestamp: new Date().toISOString()
            };
            
            setProgress(prev => ({
              ...prev,
              [moduleId]: progressData
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    }
  }, [user?.email]);

  // Subscribe to module progress updates
  const subscribeToModule = useCallback((moduleId: string) => {
    if (subscribedModules.current.has(moduleId)) return;

    websocketProgressService.subscribeToModule(moduleId);
    subscribedModules.current.add(moduleId);
    
    // Fetch initial progress data
    fetchInitialProgress(moduleId);
  }, [fetchInitialProgress]);

  // Unsubscribe from module progress updates
  const unsubscribeFromModule = useCallback((moduleId: string) => {
    websocketProgressService.unsubscribeFromModule(moduleId);
    subscribedModules.current.delete(moduleId);
  }, []);

  // Get progress for a specific module
  const getProgress = useCallback((moduleId: string): ProgressData | null => {
    return progress[moduleId] || null;
  }, [progress]);

  // Check if module is completed
  const isModuleCompleted = useCallback((moduleId: string): boolean => {
    const moduleProgress = progress[moduleId];
    return moduleProgress?.status === 'Completed' || moduleProgress?.progress >= 100;
  }, [progress]);

  // Get progress percentage
  const getProgressPercentage = useCallback((moduleId: string): number => {
    const moduleProgress = progress[moduleId];
    return moduleProgress?.progress || 0;
  }, [progress]);

  const value: ProgressTrackerContextType = {
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
  };

  return (
    <ProgressTrackerContext.Provider value={value}>
      {children}
    </ProgressTrackerContext.Provider>
  );
}

export function useProgressTracker(): ProgressTrackerContextType {
  const context = useContext(ProgressTrackerContext);
  if (context === undefined) {
    throw new Error('useProgressTracker must be used within a ProgressTrackerProvider');
  }
  return context;
}
