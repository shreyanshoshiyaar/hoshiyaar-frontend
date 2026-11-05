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

    // If a chunk failed to fetch because of a new deployment hash, seamlessly reload
    const msg = String(error?.message || '');
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const reloaded = sessionStorage.getItem('chunk_reloaded_' + window.location.pathname);
      if (!reloaded) {
        sessionStorage.setItem('chunk_reloaded_' + window.location.pathname, 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const msg = String(this.state.error?.message || '');
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        this.state.error?.name === 'ChunkLoadError';

      if (isChunkError) {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-black text-slate-800">Updating HoshiYaar...</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              A newer version was just published. Refreshing to get the latest screens!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Refresh Now
            </button>
          </div>
        );
      }

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
