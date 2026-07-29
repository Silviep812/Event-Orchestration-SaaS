import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LANDING_DEMO_VIDEO_LABEL, LANDING_DEMO_VIDEO_SRC } from "@/lib/landingDemo";

type LandingDemoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LandingDemoModal({ open, onOpenChange }: LandingDemoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(96vw,56rem)] w-full gap-3 border-amber-100/70 bg-background p-4 sm:p-6"
        aria-describedby="landing-demo-description"
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>Watch Demo</DialogTitle>
          <DialogDescription id="landing-demo-description">
            IEP presentation overview. Use the video controls to play, pause, or adjust volume. Press Escape or the
            close button to dismiss.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-amber-100/70 bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full max-h-[70vh] bg-black"
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            aria-label={LANDING_DEMO_VIDEO_LABEL}
          >
            <source src={LANDING_DEMO_VIDEO_SRC} type="video/mp4" />
            Your browser does not support embedded video. You can{" "}
            <a href={LANDING_DEMO_VIDEO_SRC} className="underline">
              download the presentation
            </a>
            .
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
