import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if it's the removeChild error from PostHog/external scripts
    if (error.message && error.message.includes('removeChild')) {
      // Don't update state for this specific error - just ignore it
      console.warn('Ignored DOM manipulation error (likely from analytics):', error.message);
      return null;
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error but don't crash for removeChild errors
    if (error.message && error.message.includes('removeChild')) {
      return;
    }
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
