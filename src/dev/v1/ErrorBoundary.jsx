import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, _errorInfo) {
    // Redacted: never log full error objects with potential PII/paths.
    try {
      console.warn('Canvas ErrorBoundary caught:', error?.message || 'render error');
    } catch { /* noop */ }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative">
          {this.props.fallback || (
            <div className="p-4 text-xs font-mono text-gray-400">
              Visual rendering fallback active.
            </div>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-mono text-gray-300 hover:bg-white/20"
          >
            Retry visuals
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
