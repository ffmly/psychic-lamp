# Unibyte Open Day

A one-page landing page using the Open Day poster artwork and the original Unibyte logo.

## Preview locally

Serve this folder with any static HTTP server, for example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

The vertical teaser is stored at `assets/Open_Day.mp4` and uses the original custom player with playback, seeking, mute, and fullscreen.

## Registration and links

The active **Our Page** link opens the club's Instagram profile. Registration is currently described as taking place on-site at Open Day; the **Registration at Open Day** button is disabled. Update the page copy and button behavior in `index.html` if the registration process changes.

## Canva giveaway setup

The first 15 completed entries are reserved atomically by `api/giveaway.js`. Configure the two server-only values from `.env.example` in Vercel:

- `FIREBASE_SERVICE_ACCOUNT`: the complete Firebase service-account JSON.
- `GIVEAWAY_ADMIN_TOKEN`: a long random token for `/admin.html`.

The admin page lists the Canva activation email as the final field, allows marking accounts as activated, and exports CSV. Never expose either secret in browser code.

Open the deployed dashboard at `/admin.html` and paste the server-only `GIVEAWAY_ADMIN_TOKEN`. The red reset button deletes giveaway test entries and resets the campaign counter to zero after a typed confirmation.

## Daily activity log

- 2026-10-29 — Verified the GitHub remote and documented the project’s local preview workflow during routine maintenance.
- 2026-10-30 — Confirmed the published branch is current and retained the local preview instructions for straightforward static-site checks.
- 2026-10-31 — Checked the upstream branch and kept the deployment-facing documentation current as part of routine project maintenance.
- 2026-11-01 — Revalidated the static preview guidance and GitHub connection during the daily project review.
