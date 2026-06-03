import React from "react";

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900">
          <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <h1 className="text-lg font-bold text-red-700">App failed to load</h1>
            <p className="mt-2 text-sm text-gray-600">
              Refresh the page. If this continues, check the browser console for the full error.
            </p>
            <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-red-50 p-3 text-xs text-red-800">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
