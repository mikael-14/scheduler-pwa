# PWA Scheduler Design

## Overview
This file captures the initial app architecture for the PWA scheduler, including route structure, API mapping, offline strategy, and notification approach.

## Recommended packages
- `pinia` — global store for auth, schedule state, offline action queue, and sync status
- `idb` — lightweight IndexedDB wrapper for offline and cached schedule/profile data
- `vite-plugin-pwa` — existing PWA service worker generation and manifest support
- `@fullcalendar/vue3`, `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction` — scheduler UI
- `axios` — HTTP API communication
- `vue-router` — route navigation and protected pages
- `tailwindcss` + `@tailwindcss/forms` — styling, forms, and mobile-ready UI

## Suggested frontend routes
- `/` — home / landing / quick access
- `/login` — email/password login + OAuth start
- `/register` — user registration
- `/calendar/:categoryId` — schedule view for selected category
- `/profile` — user profile and notification preferences
- `/settings` — app settings, offline sync status, logout
- `/share/:categoryId` — shared calendar link for a public category

## Backend API mapping
Use the existing auth and schedule API plus these recommended endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /user`
- `PUT /user` or `PATCH /user` — profile update
- `GET /categories` — calendar categories list
- `GET /categories/:id/schedules` — schedule list for category
- `GET /schedules/:id` — schedule detail
- `POST /schedules` — create schedule
- `PUT /schedules/:id` — update schedule
- `DELETE /schedules/:id` — delete schedule
- `GET /share/:categoryId` — optional shared calendar view

## PWA service worker strategy
- Cache app shell and static assets
- Cache API responses for schedule/category data
- Use `NetworkFirst` for schedule data and user profile data so the app stays fresh
- Use `StaleWhileRevalidate` for category metadata and less-critical resources
- Queue offline writes in IndexedDB and sync when online again
- Provide offline indicator and sync status in UI

## Offline support plan
- Load the app shell while offline
- Cache schedule data and category metadata
- Persist offline edits using IndexedDB
- Replay queued actions when connectivity returns
- Show local notifications or reminders when the app is open

## Notifications plan
- Use browser Notification API for reminders
- Permit user opt-in/opt-out from `/profile`
- Add service worker `push` and `notificationclick` handlers later if backend push is added

## Next steps
1. Add `pinia` to the app entrypoint
2. Create router and protected routes for authenticated areas
3. Build a Pinia store for auth, schedules, categories, and sync queue
4. Implement offline persistence with `idb`
5. Enhance the PWA service worker cache strategy for `/api/` responses
6. Add notification permission flow and reminder scheduling
