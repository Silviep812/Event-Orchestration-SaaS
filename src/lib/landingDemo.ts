/**
 * Demo asset served from Vite `public/`.
 *
 * The filename deliberately contains no spaces. The original
 * `IEP Presentation.mp4` had to be requested as `/IEP%20Presentation.mp4`, and
 * SPA hosts that fail to decode that path fall through to the catch-all rewrite
 * and return `index.html` — the `<video>` element then rejects the HTML payload
 * and the demo never plays.
 *
 * The file is also remuxed with `-movflags +faststart` (moov atom ahead of
 * mdat) so playback can begin without first range-requesting the end of file.
 */
export const LANDING_DEMO_VIDEO_SRC = "/iep-presentation.mp4";
export const LANDING_DEMO_VIDEO_LABEL = "IEP product presentation demo";
