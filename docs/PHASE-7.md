# Phase 7 - Instant Date

## Built

- Protected Instant Date REST APIs
- Activity and time-window validation
- Nearby compatible recipient selection
- Open request fallback when no immediate recipient is found
- Incoming and outgoing Instant Date listing
- Accept, reject, cancel, reschedule, complete, and share-location actions
- In-app notifications for requests and status changes
- Automatic active match creation when an Instant Date is accepted
- Chat handoff for accepted plans
- `/instant-date` mobile-first web screen
- Figma-inspired activity grid, time chips, how-it-works panel, and plan cards

## API Endpoints

- `GET /api/instant-dates`
- `POST /api/instant-dates`
- `POST /api/instant-dates/:instantDateId/accept`
- `POST /api/instant-dates/:instantDateId/reject`
- `POST /api/instant-dates/:instantDateId/cancel`
- `POST /api/instant-dates/:instantDateId/complete`
- `PATCH /api/instant-dates/:instantDateId/reschedule`
- `PATCH /api/instant-dates/:instantDateId/location`

## Activities

- Coffee
- Dinner
- Walk
- Drive
- Art
- Market
- Casual

## Time Windows

- Now
- Tonight
- This weekend
- Custom

## Safety Notes

- Only authenticated users can create or act on Instant Dates.
- Only the invited recipient can accept or reject.
- Either participant can cancel active plans.
- Blocked users are excluded from nearby recipient selection.
- The accepted plan creates or reactivates a normal MatchA match before chat handoff.

## Deferred To Later Phases

- Google Maps venue search and route previews
- SOS/emergency contact integration
- Live-location expiry and map visualization
- Admin moderation dashboard for Instant Date abuse
