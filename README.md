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

The custom player enables playback, seeking, mute, and fullscreen once the video source is set. The Register button goes to the club website's contact section.

## Daily activity log

- 2026-10-29 — Verified the GitHub remote and documented the project’s local preview workflow during routine maintenance.
- 2026-10-30 — Confirmed the published branch is current and retained the local preview instructions for straightforward static-site checks.
