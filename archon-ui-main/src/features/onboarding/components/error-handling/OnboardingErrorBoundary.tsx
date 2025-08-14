import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class OnboardingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `onboarding-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with full context for debugging
    const errorDetails = {
      errorId: this.state.errorId,
      context: 'Onboarding Feature',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('ONBOARDING_ERROR_BOUNDARY_CAUGHT:', errorDetails);

    // Update state with error info
    this.setState({
      errorInfo,
      errorId: this.state.errorId
    });

    // In a production app, you might want to send this to an error reporting service
    // reportErrorToService(errorDetails);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 dark:text-zinc-400 mb-6">
              We encountered an unexpected error during the onboarding process. 
              This has been logged and our team will investigate.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                onClick={this.handleRetry}
                icon={<RefreshCw className="w-4 h-4" />}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                icon={<Home className="w-4 h-4" />}
                className="w-full"
              >
                Go to Home
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Error ID: {this.state.errorId}
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
