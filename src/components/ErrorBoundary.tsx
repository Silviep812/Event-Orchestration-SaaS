import React, { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Surfaces render errors instead of a blank screen (common when a child throws during mount).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4">
            The app hit an error while rendering. This screen only appears when a view throws; it is not part of normal
            planning workflows. Check the browser console (F12) for details. After a deployment, a hard refresh
            (Ctrl+Shift+R) clears stale cached JavaScript.
          </p>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap border">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="text-sm font-medium rounded-md border border-input bg-background px-4 py-2 hover:bg-accent"
              onClick={() => this.setState({ error: null })}
            >
              Try again (recover this view)
            </button>
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
