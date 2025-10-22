/**
 * Progress calculation utilities
 * Ensures consistent progress calculation across dashboard and module detail views
 */

export interface ProgressData {
    status?: 'Not Started' | 'In Progress' | 'Completed';
    progress?: number;
    overall_progress?: number;
  }
  
  /**
   * Normalizes progress value to percentage (0-100)
   * Handles both decimal (0.01-1.0) and percentage (0-100) formats
   */
  export function normalizeProgress(progress: number | undefined | null): number {
    if (!progress || progress === 0) return 0;
    
    // If progress is stored as decimal (0.01-1.0), convert to percentage
    if (progress <= 1.0 && progress > 0) {
      return Math.round(progress * 100 * 100) / 100; // Round to 2 decimal places
    }
    
    // Already a percentage, just round to 2 decimal places
    return Math.round(progress * 100) / 100;
  }
  
  /**
   * Calculates progress from module data
   * Uses the same logic for both dashboard and module detail
   */
  export function calculateModuleProgress(moduleData: ProgressData): number {
    const { status, progress, overall_progress } = moduleData;
    
    // Use overall_progress if available, otherwise use progress
    const rawProgress = overall_progress ?? progress ?? 0;
    
    // Normalize to percentage
    const normalizedProgress = normalizeProgress(rawProgress);
    
    // If completed, return 100% only if the actual progress is 100% or higher
    // Otherwise, return the actual progress even if status is "Completed"
    if (status === 'Completed') {
      return normalizedProgress >= 100 ? 100 : normalizedProgress;
    }
    
    return normalizedProgress;
  }
  
  /**
   * Calculates average progress from an array of modules
   * Used for dashboard overall progress calculation
   */
  export function calculateAverageProgress(modules: Array<{ progress?: ProgressData }>): number {
    if (!modules || modules.length === 0) return 0;
    
    const progressValues = modules.map(module => {
      if (!module.progress) return 0;
      return calculateModuleProgress(module.progress);
    });
    
    const sum = progressValues.reduce((total, progress) => total + progress, 0);
    return Math.round((sum / progressValues.length) * 100) / 100;
  }
  
  /**
   * Calculates progress statistics from modules
   * Returns counts and percentages for different statuses
   */
  export function calculateProgressStats(modules: Array<{ progress?: ProgressData }>) {
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.progress?.status === 'Completed').length;
    const inProgressModules = modules.filter(m => m.progress?.status === 'In Progress').length;
    const notStartedModules = modules.filter(m => !m.progress || m.progress.status === 'Not Started').length;
    
    const averageProgress = calculateAverageProgress(modules);
    
    return {
      totalModules,
      completedModules,
      inProgressModules,
      notStartedModules,
      averageProgress,
      // Legacy property names for backward compatibility
      completedCount: completedModules,
      inProgressCount: inProgressModules,
      notStartedCount: notStartedModules
    };
  }
  
  /**
   * Formats progress for display
   * Ensures consistent formatting across the application
   */
  export function formatProgress(progress: number): string {
    return `${Math.round(progress)}%`;
  }
  