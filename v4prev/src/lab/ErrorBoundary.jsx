import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
    try {
      console.warn('Canvas ErrorBoundary caught:', error?.message || 'render error');
    } catch {
      /* noop */
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback ?? null : this.props.children;
  }
}
