# Unibyte Open Day

A one-page landing page using the Open Day poster artwork and the original Unibyte logo.

## Preview locally

Serve this folder with any static HTTP server, for example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Add the teaser later

1. Put the vertical 9:16 video in `assets/teaser.mp4`.
2. Set `TEASER_VIDEO_URL` in `script.js` to `'assets/teaser.mp4'`.

The custom player enables playback, seeking, mute, and fullscreen once the video source is set.

## Registration and links

The active **Our Page** link opens the club's Instagram profile. Registration is currently described as taking place on-site at Open Day; the **Registration at Open Day** button is disabled. Update the page copy and button behavior in `index.html` if the registration process changes.

## Countdown behavior

The teaser countdown starts at 24 hours for each visitor and stores its deadline in that browser's `localStorage` under `unibyteTeaserCountdownDeadline`. It is not a shared event deadline: a first visit in another browser starts a separate timer, and an expired timer starts again on a later page load. If the teaser must unlock for everyone at the same time, replace the per-browser deadline in `script.js` with a fixed release timestamp before publishing that announcement.

## Daily activity log

- 2026-10-29 — Verified the GitHub remote and documented the project’s local preview workflow during routine maintenance.
- 2026-10-30 — Confirmed the published branch is current and retained the local preview instructions for straightforward static-site checks.
- 2026-10-31 — Checked the upstream branch and kept the deployment-facing documentation current as part of routine project maintenance.
- 2026-11-01 — Revalidated the static preview guidance and GitHub connection during the daily project review.
