// Debug utilities for comprehensive error tracking and logging

export interface DebugContext {
  component: string;
  method?: string;
  data?: any;
  timestamp?: string;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private isDebugMode: boolean = true;
  private errorLog: Array<{ context: DebugContext; error: Error; timestamp: string }> = [];
  private infoLog: Array<{ context: DebugContext; message: string; timestamp: string }> = [];

  private constructor() {
    // Enable debug mode in development
    this.isDebugMode = import.meta.env.DEV || localStorage.getItem('ailumni-debug') === 'true';
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    localStorage.setItem('ailumni-debug', enabled.toString());
  }

  info(context: DebugContext, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = { context: { ...context, timestamp }, message, timestamp };
    
    this.infoLog.push(logEntry);
    
    if (this.isDebugMode) {
      console.log(`[AiLumni-Hub] ${context.component}${context.method ? `.${context.method}` : ''}:`, message, data || '');
    }
  }

  error(context: DebugContext, error: Error, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = { context: { ...context, timestamp }, error, timestamp };
    
    this.errorLog.push(logEntry);
    
    console.error(`[AiLumni-Hub] ERROR in ${context.component}${context.method ? `.${context.method}` : ''}:`, error.message, data || '');
    console.error('Stack trace:', error.stack);
  }

  warn(context: DebugContext, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    
    if (this.isDebugMode) {
      console.warn(`[AiLumni-Hub] WARNING in ${context.component}${context.method ? `.${context.method}` : ''}:`, message, data || '');
    }
  }

  getErrorLog(): Array<{ context: DebugContext; error: Error; timestamp: string }> {
    return [...this.errorLog];
  }

  getInfoLog(): Array<{ context: DebugContext; message: string; timestamp: string }> {
    return [...this.infoLog];
  }

  clearLogs(): void {
    this.errorLog = [];
    this.infoLog = [];
  }

  exportLogs(): string {
    return JSON.stringify({
      errors: this.errorLog.map(entry => ({
        ...entry,
        error: {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name
        }
      })),
      info: this.infoLog,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Convenience function for components
export const debug = DebugLogger.getInstance();

// Helper function to create context
export function createDebugContext(component: string, method?: string, data?: any): DebugContext {
  return {
    component,
    method,
    data,
    timestamp: new Date().toISOString()
  };
}

// Error boundary helper for Vue components
export function handleComponentError(context: DebugContext, error: unknown): void {
  const debugError = error instanceof Error ? error : new Error(String(error));
  debug.error(context, debugError);
}
