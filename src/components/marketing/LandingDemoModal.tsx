import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { LANDING_DEMO_VIDEO_LABEL, LANDING_DEMO_VIDEO_SRC } from "@/lib/landingDemo";

type LandingDemoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Acceptance test 3: the demo must start playing on its own, then hand over to the native controls.
 * Browsers only allow unattended playback when the video is muted, so we try with sound first
 * (the modal is opened by a click, which usually satisfies autoplay policies) and fall back to a
 * muted start plus an explicit "Unmute" affordance rather than leaving a silent, paused player.
 */
export function LandingDemoModal({ open, onOpenChange }: LandingDemoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [startedMuted, setStartedMuted] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [failureDetail, setFailureDetail] = useState<string | null>(null);

  /**
   * `<video>` only reports "not supported", which is the same symptom whether the file is missing,
   * the host returned index.html from an SPA rewrite, or the codec is unusable. Ask the server
   * directly so the console names the real cause.
   */
  const diagnoseFailure = useCallback(async () => {
    setLoadFailed(true);
    try {
      const res = await fetch(LANDING_DEMO_VIDEO_SRC, { method: "GET", headers: { Range: "bytes=0-0" } });
      const type = res.headers.get("content-type") ?? "unknown";
      if (!res.ok) {
        setFailureDetail(`The server returned HTTP ${res.status} for ${LANDING_DEMO_VIDEO_SRC}.`);
      } else if (type.includes("text/html")) {
        setFailureDetail(
          `${LANDING_DEMO_VIDEO_SRC} returned HTML, not video — the file is missing and the host fell back to index.html.`,
        );
      } else {
        setFailureDetail(`The browser could not decode the video (server sent ${type}).`);
      }
      console.warn("Landing demo failed:", { url: LANDING_DEMO_VIDEO_SRC, status: res.status, type });
    } catch (e) {
      setFailureDetail("The video file could not be reached.");
      console.warn("Landing demo failed:", e);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!open) {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      setStartedMuted(false);
      setLoadFailed(false);
      setFailureDetail(null);
      return;
    }
    if (!video) return;

    let cancelled = false;
    video.muted = false;
    video.currentTime = 0;

    const autoplay = async () => {
      try {
        await video.play();
        if (!cancelled) setStartedMuted(false);
        return;
      } catch {
        // Autoplay with sound was blocked — retry muted so the demo still plays.
      }
      if (cancelled) return;
      video.muted = true;
      setStartedMuted(true);
      try {
        await video.play();
      } catch {
        // Still blocked: the native controls remain available.
      }
    };

    const timer = window.setTimeout(autoplay, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open]);

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setStartedMuted(false);
    void video.play().catch(() => undefined);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(96vw,56rem)] w-full gap-3 border-amber-100/70 bg-background p-4 sm:p-6"
        aria-describedby="landing-demo-description"
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>Watch Demo</DialogTitle>
          <DialogDescription id="landing-demo-description">
            The IEP presentation starts automatically. Use the video controls to pause, seek, or adjust volume. Press
            Escape or the close button to dismiss.
          </DialogDescription>
        </DialogHeader>
        <div className="relative overflow-hidden rounded-lg border border-amber-100/70 bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full max-h-[70vh] bg-black"
            controls
            autoPlay
            playsInline
            preload="auto"
            controlsList="nodownload"
            aria-label={LANDING_DEMO_VIDEO_LABEL}
            onError={() => void diagnoseFailure()}
          >
            <source src={LANDING_DEMO_VIDEO_SRC} type="video/mp4" />
            Your browser does not support embedded video. You can{" "}
            <a href={LANDING_DEMO_VIDEO_SRC} className="underline">
              download the presentation
            </a>
            .
          </video>

          {startedMuted && !loadFailed ? (
            <Button
              type="button"
              size="sm"
              onClick={unmute}
              className="absolute left-3 top-3 shadow-md"
            >
              <Volume2 className="h-4 w-4" aria-hidden />
              Unmute
            </Button>
          ) : null}
        </div>

        {loadFailed ? (
          <p className="text-sm text-destructive">
            {failureDetail ?? "The demo video could not be loaded."}{" "}
            <a href={LANDING_DEMO_VIDEO_SRC} className="underline" download>
              Download the presentation
            </a>{" "}
            instead.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
