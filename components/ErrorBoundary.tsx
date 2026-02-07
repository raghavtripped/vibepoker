import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200"
          data-testid="error-boundary-fallback"
          role="alert"
        >
          <AlertTriangle size={20} className="shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold text-sm">Something went wrong</p>
            <p className="text-xs opacity-90 mt-0.5">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
