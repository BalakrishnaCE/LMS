/**
 * WebSocket Progress Service - Clean WebSocket communication for progress tracking
 * Handles WebSocket connections, events, and progress updates
 */

// WebSocket connection will be provided by the context

export interface ProgressData {
    moduleId: string;
    userId: string;
    progress: number;
    status: 'Not Started' | 'In Progress' | 'Completed';
    currentLesson?: string;
    currentChapter?: string;
    content?: string;
    contentType?: string;
    totalLessons: number;
    completedLessons: number;
    timestamp: string;
    error?: string;
  }
  
  export interface ProgressUpdateData {
    moduleId: string;
    userId: string;
    lesson?: string;
    chapter?: string;
    content?: string;
    contentType?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed';
    progress?: number;
    timestamp?: number;
  }
  
  export interface ProgressUpdateResponse {
    success: boolean;
    progress?: ProgressData;
    message?: string;
    error?: string;
  }
  
  class WebSocketProgressService {
    private static instance: WebSocketProgressService;
    private socket: any = null;
    private listeners: Map<string, Set<Function>> = new Map();
    private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private subscribedModules: Set<string> = new Set();
    private updateQueue: ProgressUpdateData[] = [];
    private isProcessingQueue = false;
  
    private constructor() {
      this.initializeConnection();
    }
  
    public static getInstance(): WebSocketProgressService {
      if (!WebSocketProgressService.instance) {
        WebSocketProgressService.instance = new WebSocketProgressService();
      }
      return WebSocketProgressService.instance;
    }
  
    private initializeConnection(): void {
      try {
        // Get WebSocket connection from Frappe
        // Note: This will be set by the hook when the component mounts
        this.connectionStatus = 'connecting';
        
        
      } catch (error) {
        this.connectionStatus = 'disconnected';
        this.scheduleReconnect();
      }
    }
  
    public setSocket(socket: any): void {
      this.socket = socket;
      if (socket) {
        this.connectionStatus = 'connected';
        this.setupEventListeners();
        this.reconnectAttempts = 0;
        
        // Process any queued updates
        this.processUpdateQueue();
      } else {
        this.connectionStatus = 'disconnected';
      }
    }
  
    private setupEventListeners(): void {
      if (!this.socket) return;
  
      // Connection events
      this.socket.on('connect', () => {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        
        // Resubscribe to modules
        this.subscribedModules.forEach(moduleId => {
          this.subscribeToModule(moduleId);
        });
        
        // Process queued updates
        this.processUpdateQueue();
      });
  
      this.socket.on('disconnect', () => {
        this.connectionStatus = 'disconnected';
        this.scheduleReconnect();
      });
  
      this.socket.on('connect_error', () => {
        this.connectionStatus = 'disconnected';
        this.scheduleReconnect();
      });
  
      // Progress events
      this.socket.on('progress_updated', (data: ProgressData) => {
        this.emit('progress_updated', data);
      });
  
      this.socket.on('progress_update_response', (data: ProgressUpdateResponse) => {
        this.emit('progress_update_response', data);
      });
  
      this.socket.on('progress_update_error', (error: { moduleId: string; error: string }) => {
        this.emit('progress_update_error', error);
      });
    }
  
    private scheduleReconnect(): void {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        return;
      }
  
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        this.initializeConnection();
      }, delay);
    }
  
    public addListener(event: string, callback: Function): void {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(callback);
    }
  
    public removeListener(event: string, callback: Function): void {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    }
  
    private emit(event: string, data: any): void {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
    }
  
    public subscribeToModule(moduleId: string): void {
      if (!this.socket || this.connectionStatus !== 'connected') {
        this.subscribedModules.add(moduleId);
        return;
      }
  
      try {
        this.socket.emit('progress_subscribe', moduleId);
        this.subscribedModules.add(moduleId);
      } catch (error) {
        // Subscription failed silently
      }
    }
  
    public unsubscribeFromModule(moduleId: string): void {
      if (!this.socket || this.connectionStatus !== 'connected') {
        this.subscribedModules.delete(moduleId);
        return;
      }
  
      try {
        this.socket.emit('progress_unsubscribe', moduleId);
        this.subscribedModules.delete(moduleId);
      } catch (error) {
        // Unsubscription failed silently
      }
    }
  
    public async updateProgress(data: ProgressUpdateData): Promise<ProgressUpdateResponse> {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.socket || this.connectionStatus !== 'connected') {
            // Queue the update for when connection is restored
            this.updateQueue.push(data);
            reject(new Error('WebSocket not connected, update queued'));
            return;
          }
  
          // Emit WebSocket event for real-time progress update
          this.socket.emit('progress_update', {
            moduleId: data.moduleId,
            userId: data.userId,
            lesson: data.lesson,
            chapter: data.chapter,
            content: data.content,
            contentType: data.contentType,
            status: data.status || 'In Progress',
            progress: data.progress,
            timestamp: data.timestamp || Date.now()
          });
  
          // Set up response listener
          const responseHandler = (response: any) => {
            if (response.moduleId === data.moduleId) {
              clearTimeout(timeout);
              this.socket.off('progress_update_response', responseHandler);
              this.socket.off('progress_update_error', errorHandler);
              if (response.success) {
                resolve({
                  success: true,
                  progress: response.progress,
                  message: response.message || 'Progress updated successfully'
                });
              } else {
                reject(new Error(response.error || 'Progress update failed'));
              }
            }
          };
  
          const errorHandler = (error: any) => {
            if (error.moduleId === data.moduleId) {
              clearTimeout(timeout);
              this.socket.off('progress_update_response', responseHandler);
              this.socket.off('progress_update_error', errorHandler);
              reject(new Error(error.error || 'Progress update failed'));
            }
          };
  
          // Set up timeout - increased to 30 seconds for database operations
          const timeout = setTimeout(() => {
            this.socket.off('progress_update_response', responseHandler);
            this.socket.off('progress_update_error', errorHandler);
            reject(new Error('Progress update timeout'));
          }, 30000); // 30 second timeout
  
          this.socket.on('progress_update_response', responseHandler);
          this.socket.on('progress_update_error', errorHandler);
  
        } catch (error) {
          reject(error);
        }
      });
    }
  
    private async processUpdateQueue(): Promise<void> {
      if (this.isProcessingQueue || this.updateQueue.length === 0) {
        return;
      }
  
      this.isProcessingQueue = true;
  
      while (this.updateQueue.length > 0 && this.connectionStatus === 'connected') {
        const update = this.updateQueue.shift();
        if (update) {
          try {
            await this.updateProgress(update);
          } catch (error) {
            // Only re-queue if it's not a connection error (to avoid infinite loops)
            if (!(error instanceof Error && error.message.includes('WebSocket not connected'))) {
              this.updateQueue.unshift(update);
              break;
            }
          }
        }
      }
  
      this.isProcessingQueue = false;
    }
  
    public getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
      return this.connectionStatus;
    }
  
    public isConnected(): boolean {
      return this.connectionStatus === 'connected';
    }
  
    public getSubscribedModules(): string[] {
      return Array.from(this.subscribedModules);
    }
  
    public disconnect(): void {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.connectionStatus = 'disconnected';
      this.subscribedModules.clear();
      this.updateQueue = [];
    }
  }
  
  // Export singleton instance
  export const websocketProgressService = WebSocketProgressService.getInstance();
  