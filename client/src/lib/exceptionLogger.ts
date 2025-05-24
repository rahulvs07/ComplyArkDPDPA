/**
 * Exception Logger Utility
 * 
 * A centralized utility for logging application exceptions to the server
 * for better error tracking and debugging.
 */

interface LogExceptionParams {
  pageName: string;
  functionName: string;
  errorMessage: string;
  stackTrace?: string;
  additionalInfo?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log an exception to the server
 */
export const logException = async (params: LogExceptionParams): Promise<boolean> => {
  try {
    // Add browser information
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`
    };

    // Get current URL
    const url = window.location.href;

    // Send exception data to server
    const response = await fetch('/api/exceptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        browserInfo: JSON.stringify(browserInfo),
        url
      }),
    });

    if (!response.ok) {
      console.error('Failed to log exception to server:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    // Fallback error logging to console if server logging fails
    console.error('Error while logging exception:', error);
    console.error('Original exception:', params);
    return false;
  }
};

/**
 * Global error boundary for React components
 * Use this as a wrapper for components to catch and log errors
 */
export const withErrorLogging = <P extends object>(
  Component: React.ComponentType<P>,
  pageName: string,
): React.FC<P> => {
  return (props: P) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      
      logException({
        pageName,
        functionName: Component.displayName || Component.name || 'UnknownComponent',
        errorMessage,
        stackTrace,
        severity: 'high'
      });
      
      return (
        <div className="error-boundary-fallback">
          <h3>Something went wrong</h3>
          <p>The error has been logged. Please try again or contact support if the issue persists.</p>
        </div>
      );
    }
  };
};

/**
 * HOC to catch and log errors in async functions
 */
export const withAsyncErrorLogging = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  pageName: string,
  functionName: string,
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      
      logException({
        pageName,
        functionName,
        errorMessage,
        stackTrace,
        severity: 'medium'
      });
      
      throw error; // Re-throw to allow component-level error handling
    }
  };
};

/**
 * Global event error handler
 * Call this function once in your app's entry point
 */
export const registerGlobalErrorHandler = (): void => {
  window.addEventListener('error', (event) => {
    logException({
      pageName: window.location.pathname,
      functionName: 'window.onerror',
      errorMessage: event.message,
      stackTrace: event.error?.stack,
      additionalInfo: `File: ${event.filename}, Line: ${event.lineno}, Column: ${event.colno}`,
      severity: 'high'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    logException({
      pageName: window.location.pathname,
      functionName: 'unhandledRejection',
      errorMessage: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      severity: 'high'
    });
  });
};