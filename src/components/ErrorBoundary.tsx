import React, { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null; copied: boolean };

/**
 * Surfaces render errors instead of a blank screen (common when a child throws during mount).
 *
 * Acceptance testing 08/08/2026 reported "Something went wrong ... also no exit from page": this
 * screen previously offered only Continue and Reload, both of which land back on the broken view,
 * so a crash trapped the tester. It now provides real navigation out, and shows the error message
 * (not the stack) in every environment with a copy button, so a tester can report what actually
 * failed instead of just the generic heading.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, copied: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, copied: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null, copied: false });

  private goTo = (path: string) => {
    // Full navigation, not history.push: the router tree is the thing that just threw.
    window.location.assign(path);
  };

  private copyDetails = async () => {
    const { error } = this.state;
    if (!error) return;
    const details = [
      `Message: ${error.message}`,
      `Page: ${window.location.pathname}${window.location.search}`,
      `Time: ${new Date().toISOString()}`,
      "",
      error.stack ?? "",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
    } catch {
      this.setState({ copied: false });
    }
  };

  render() {
    const { error, copied } = this.state;
    if (!error) return this.props.children;

    const buttonClass =
      "text-sm font-medium rounded-md border border-input bg-background px-4 py-2 hover:bg-accent";

    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">
          A screen didn’t load correctly. Your saved work is not affected. Use one of the links below to carry on — if
          this keeps happening, copy the details and include them in your report.
        </p>

        <div className="rounded-md border bg-muted p-4 mb-4">
          <p className="text-xs font-medium mb-1">Error details</p>
          <p className="text-xs font-mono break-words">{error.message || "Unknown error"}</p>
          {import.meta.env.DEV && error.stack ? (
            <pre className="mt-3 text-[11px] overflow-auto whitespace-pre-wrap">{error.stack}</pre>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className={buttonClass} onClick={this.reset}>
            Try again
          </button>
          <button type="button" className={buttonClass} onClick={() => this.goTo("/dashboard")}>
            Back to dashboard
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => this.goTo("/dashboard/project-management")}
          >
            Project Management
          </button>
          <button type="button" className={buttonClass} onClick={() => window.location.reload()}>
            Reload page
          </button>
          <button type="button" className={buttonClass} onClick={this.copyDetails}>
            {copied ? "Copied" : "Copy details"}
          </button>
        </div>
      </div>
    );
  }
}
