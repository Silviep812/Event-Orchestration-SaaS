import { CheckCircle2, ClipboardList, CalendarCheck, Rocket, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventLifecycleStepperProps {
  currentStep?: string;
}

const steps = [
  { id: "planning", label: "Planning", icon: ClipboardList },
  { id: "resource_booking", label: "Resource Booking", icon: CalendarCheck },
  { id: "execution", label: "Execution", icon: Rocket },
  { id: "completed", label: "Completed", icon: PartyPopper },
];

function getStepIndex(status?: string): number {
  if (!status) return 0;
  const map: Record<string, number> = {
    planning: 0, pending: 0, draft: 0,
    resource_booking: 1, in_progress: 1, active: 1,
    execution: 2, ongoing: 2,
    completed: 3, done: 3,
  };
  return map[status.toLowerCase()] ?? 0;
}

export function EventLifecycleStepper({ currentStep }: EventLifecycleStepperProps) {
  const activeIdx = getStepIndex(currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-10" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary mx-10 transition-all duration-500"
          style={{ width: `${(activeIdx / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 5rem)' }}
        />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === activeIdx;
          const isComplete = idx < activeIdx;
          const isFuture = idx > activeIdx;

          return (
            <div key={step.id} className="flex flex-col items-center z-10 relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isComplete && "bg-primary border-primary text-primary-foreground shadow-md",
                  isActive && "bg-primary/10 border-primary text-primary ring-4 ring-primary/20",
                  isFuture && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium mt-1.5 text-center whitespace-nowrap",
                  isActive && "text-primary font-semibold",
                  isComplete && "text-primary",
                  isFuture && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
