# Unibyte Open Day

A one-page landing page using the Open Day poster artwork and the original Unibyte logo.

## Preview locally

Serve this folder with any static HTTP server, for example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

This static server previews the page and teaser only. It does not execute the Vercel functions in `api/`, so giveaway submissions and the admin dashboard cannot be tested through this command. Use a Vercel environment with the server variables below when checking those flows.

The vertical teaser is stored at `assets/Open_Day.mp4` and uses the original custom player with playback, seeking, mute, and fullscreen.

## Registration and links

The active **Our Page** link opens the club's Instagram profile. Registration is currently described as taking place on-site at Open Day; the **Registration at Open Day** button is disabled. Update the page copy and button behavior in `index.html` if the registration process changes.

## Canva giveaway setup

Completed entries are reserved atomically by `api/giveaway.js`. The private maximum is configurable from the admin dashboard and is never exposed by the public API. Configure the server-only values from `.env.example` in Vercel:

- `FIREBASE_SERVICE_ACCOUNT`: the complete Firebase service-account JSON.
- `GIVEAWAY_ADMIN_TOKEN`: a long random token for `/admin.html`.
- `GIVEAWAY_FINGERPRINT_SALT`: a separate random value used to hash the device and IP identifiers recorded with each entry.

The admin page lists every answer and the Canva activation email, allows marking accounts as activated, changes the participant limit, resets only the current counter while preserving history, and exports CSV. Never expose server secrets in browser code.

The dashboard and its CSV export load the 1,000 newest entries (`api/admin.js` limits the query to 1,000). If a campaign can exceed that size, raise the limit or add pagination before relying on the export as a complete archive.

`firestore.rules` denies every direct client read/write. The landing page talks only to the Vercel server functions, whose Firebase Admin SDK access is not affected by client Security Rules.

After deployment, open `/api/giveaway` on the deployed domain to check the public API. A healthy response is JSON containing a boolean `soldOut` field. This GET request reads campaign state and does not reserve an entry; a server error indicates the function or Firebase configuration needs attention.

Before sharing the page for an event, check the deployed registration copy and Instagram link, confirm `/api/giveaway` responds, and verify the intended participant limit in `/admin.html`. The static preview cannot confirm the API or dashboard configuration.

Open the deployed dashboard at `/admin.html` and paste the server-only `GIVEAWAY_ADMIN_TOKEN`. The counter-reset action keeps participation history and starts a new cycle. The red delete action removes giveaway test entries and leftover guard records after a typed confirmation.

Every submission is accepted even when the same email, browser, or network was used before. Only the participant limit and the basic bot checks (honeypot and minimum answering time) can stop an entry.

## Daily activity log

- 2026-10-29 — Verified the GitHub remote and documented the project’s local preview workflow during routine maintenance.
- 2026-10-30 — Confirmed the published branch is current and retained the local preview instructions for straightforward static-site checks.
- 2026-10-31 — Checked the upstream branch and kept the deployment-facing documentation current as part of routine project maintenance.
- 2026-11-01 — Revalidated the static preview guidance and GitHub connection during the daily project review.
