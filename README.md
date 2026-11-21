# Assignment Helper

A clean, mobile-first productivity dashboard for bringing schoolwork, deadlines, and planning into one place.

## Current foundation

- Next.js App Router + TypeScript
- Responsive clean-light dashboard with blue accents
- First-visit onboarding preferences survey
- Local demo task list with completion toggles
- Notification drawer and AI assistant request panel (clearly marked as not connected)
- Responsive mobile navigation and compact layouts

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

## Planned integrations

Gmail, Google Calendar, Google Classroom, Google Drive, and Google Tasks will be added through secure server-side OAuth integrations. No Google credentials or AI provider secrets belong in browser code.

## Current limitations

This is the UI foundation only. Tasks are demo data held in component state; onboarding preferences are stored in the current browser's local storage. Google services, persistent accounts, real push notifications, and AI execution are not connected yet.
