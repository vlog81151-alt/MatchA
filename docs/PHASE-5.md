# Phase 5 - Matching

## Built

- Recommendation API with compatibility scoring
- Basic preference matching for gender and interested-in
- Filters for age range, distance, gender, interests, profession, religion, lifestyle, and relationship goal
- Swipe actions for like, pass, super like, and undo
- Mutual match creation with compatibility score
- Like and match notifications
- Audit logging for likes and matches
- Match list API with latest message preview
- Web Home screen backed by live recommendations
- Mobile-first filters, like, pass, super-like, and undo controls
- Web Matches screen backed by the match list API

## API Endpoints

- `GET /api/matching/recommendations`
- `POST /api/matching/like`
- `POST /api/matching/pass`
- `POST /api/matching/undo`
- `GET /api/matching/matches`
- `GET /api/matching/filters`
- `PATCH /api/matching/filters`

All matching endpoints require access-token authentication through bearer tokens or signed HttpOnly cookies.

## Compatibility Inputs

The current scoring model uses:

- Shared interests
- Music overlap
- Food overlap
- Travel overlap
- Language overlap
- Relationship goal alignment
- City proximity
- Distance
- Verification status
- Profile completion

## Web Screens

- `/home` now shows a recommendation deck instead of the logged-in user's own profile.
- `/matches` shows active mutual matches with score, profile context, and latest message preview.

## Deferred To Later Phases

- Advanced ML-based ranking
- Paid boosts and spotlight ordering
- Swipe gesture physics
- Chat launch into the Phase 6 realtime chat module
- Admin moderation review for abusive matching behavior
