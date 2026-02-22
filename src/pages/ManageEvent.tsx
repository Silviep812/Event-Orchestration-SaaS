import ManageEventComponent from "@/components/ManageEvent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function ManageEventPage() {
  return (
    <ErrorBoundary fallbackTitle="Manage Event encountered an error">
      <ManageEventComponent />
    </ErrorBoundary>
  );
}