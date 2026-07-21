# Phase 6 - Chat

## Built

- Chat participant state table for per-user mute, archive, delivered, and read state
- Message reply relation
- Protected chat REST APIs
- Socket.IO gateway authenticated by signed HttpOnly access cookie
- Realtime match rooms
- Realtime message send
- Typing indicators
- Online/offline presence events
- Delivered and read receipt events
- Message edit and soft delete
- Text, image, GIF, and voice-note message types
- Chat list screen at `/chats`
- Chat room screen at `/chats/:matchId`
- Chat search
- Quick emoji composer
- Reply/edit/delete message controls
- Mute, archive, report, and block controls
- Match screen chat button routing into the chat room

## API Endpoints

- `GET /api/chats`
- `GET /api/chats/:matchId/messages`
- `POST /api/chats/:matchId/messages`
- `PATCH /api/chats/:matchId/messages/:messageId`
- `DELETE /api/chats/:matchId/messages/:messageId`
- `POST /api/chats/:matchId/delivered`
- `POST /api/chats/:matchId/read`
- `PATCH /api/chats/:matchId/settings`
- `POST /api/chats/:matchId/report`
- `POST /api/chats/:matchId/block`

## Socket Events

Client emits:

- `chat:join`
- `chat:leave`
- `chat:typing:start`
- `chat:typing:stop`
- `chat:message:send`
- `chat:message:delivered`
- `chat:message:read`

Server emits:

- `chat:message:new`
- `chat:typing`
- `chat:presence`
- `chat:message:delivered`
- `chat:message:read`

## Security Notes

- Sockets authenticate from the same signed HttpOnly cookie as REST requests.
- Chat access requires an active match.
- Blocked chats are denied.
- Client-created system messages are rejected.
- Message body content is sanitized before storage.
- Deleting a message is soft-delete only, preserving audit-safe history.

## Deferred To Later Phases

- Cloudinary signed upload widgets for images and voice notes
- GIF provider integration
- Push notifications through Firebase Cloud Messaging
- Admin-side chat moderation inbox
- End-to-end encryption research
