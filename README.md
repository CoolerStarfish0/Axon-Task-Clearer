# Assignment Helper

A clean, mobile-first productivity dashboard for bringing schoolwork, deadlines, and planning into one place.

## Current foundation

- Next.js App Router + TypeScript
- Responsive clean-light dashboard with blue accents
- First-visit onboarding preferences survey
- Add tasks with subject, due-date notes, and priority
- Search tasks and mark them complete/incomplete
- Tasks and onboarding preferences saved in the current browser
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

This is currently a browser-local website foundation. Tasks and onboarding preferences are saved in local storage on the device/browser being used; they are not synced between devices or accounts. Google services, real push notifications, user accounts, and AI execution are not connected yet. The service cards and AI panel are honest placeholders until their secure server-side integrations are configured.
