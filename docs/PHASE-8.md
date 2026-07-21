# Phase 8 - Concert Mode

## Built

- Protected Concert Mode REST APIs
- Concert search by city, text, and genre
- Current user's concert list
- Concert detail with participant previews
- Join Concert Mode with intent
- Update concert intent
- Confirm meetup
- Cancel concert participation
- In-app notifications when people join the same concert
- `/concert-mode` mobile-first web screen
- Figma-inspired concert hero card, upcoming list, city search, genre filters, vibe tags, and looking-for controls

## API Endpoints

- `GET /api/concerts`
- `GET /api/concerts/my`
- `GET /api/concerts/:concertId`
- `POST /api/concerts/:concertId/join`
- `PATCH /api/concerts/:concertId/intent`
- `POST /api/concerts/:concertId/confirm`
- `POST /api/concerts/:concertId/cancel`

## Intent Options

- Concert buddy
- New friends
- Maybe more
- Group vibe

## Safety Notes

- Only authenticated users can access Concert Mode.
- Cancelled participants are hidden from attendee previews.
- Past concerts cannot be joined.
- Meetup confirmation uses participant status and can later drive safety reminders.

## Deferred To Later Phases

- Dedicated concert group chat room
- Ticket-provider import
- Map and venue navigation
- Music-provider preference sync
- Admin creation and moderation tools for concerts
