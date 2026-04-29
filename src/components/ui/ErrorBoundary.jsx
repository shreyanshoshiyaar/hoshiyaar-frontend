import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 border-4 border-red-500 rounded-3xl m-4">
          <h1 className="text-3xl font-black text-red-600 mb-4">Oops! Something went wrong.</h1>
          <div className="bg-white p-4 rounded-xl border-2 border-red-200 overflow-auto max-h-[60vh]">
            <p className="text-red-700 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="text-xs text-red-500 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3 bg-red-600 text-white font-black rounded-xl shadow-[0_6px_0_0_#991b1b] hover:bg-red-700 active:translate-y-1 transition-all"
          >
            RELOAD PAGE
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
