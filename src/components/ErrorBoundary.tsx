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
      const dev = import.meta.env.DEV;
      return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4">
            A screen didn’t load correctly. That can be a one-off glitch—try continuing or reloading. If it keeps
            happening, contact support and describe what you clicked just before this screen.
          </p>
          {dev ? (
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap border">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="text-sm font-medium rounded-md border border-input bg-background px-4 py-2 hover:bg-accent"
              onClick={() => this.setState({ error: null })}
            >
              Continue
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
