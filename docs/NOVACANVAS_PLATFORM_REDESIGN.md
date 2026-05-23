# NovaCanvas Platform Redesign

## Product Direction
NovaCanvas is designed as a dark-mode AI image SaaS platform for image processing, prompt-driven generation, and social discovery. The target experience is inspired by Midjourney, Leonardo AI, MeiGen Gallery, and Playground AI: fast upload, realtime progress feedback, prompt composition, gallery exploration, and a premium command-center layout.

## Frontend Architecture
Recommended frontend stack:
- React + TypeScript + Vite for the current repository
- TailwindCSS or utility-first tokens for future component growth
- Framer Motion for motion, staged reveals, and transitions
- Zustand for lightweight workspace state, or Redux Toolkit when cross-feature orchestration grows
- Ant Design for accessible form primitives, overlays, and data display

Recommended route map:
- `/` social home feed
- `/explore` prompt and image discovery
- `/studio` upload and processing command center
- `/chat` Gemini-powered AI assistant
- `/my-images` private gallery
- `/admin` platform control center
- `/login`, `/register`, `/verify` auth flow

Frontend structure target:
- `src/app/` route composition and app shell
- `src/features/auth/` login, register, verification
- `src/features/studio/` upload, pipeline editor, preview, history
- `src/features/generation/` prompt composer, negative prompt, remix flow
- `src/features/social/` feed, likes, comments, favorites, trending
- `src/features/chat/` Gemini assistant and context blocks
- `src/components/` shared UI primitives
- `src/core/` API client, theme tokens, utilities, shared hooks

## Backend Architecture
Recommended backend approach:
- Spring Boot modular monolith with clear bounded contexts
- REST API for CRUD, auth, gallery, social, and admin flows
- WebSocket for realtime job progress, notifications, and assistant streaming later
- Redis for caching, queue coordination, rate limiting, and short-lived session state
- PostgreSQL for relational persistence and auditability
- S3 or MinIO for all binary image assets
- Gemini API for prompt generation, prompt improvement, explanation, and chatbot responses

Backend package boundaries:
- `auth`
- `users`
- `media`
- `processing`
- `generation`
- `gallery`
- `social`
- `notifications`
- `assistant`
- `admin`
- `audit`

Clean architecture layers:
- `domain` for entities, value objects, and business rules
- `application` for use cases, orchestration, and transactional workflows
- `infrastructure` for JPA, S3, Redis, Gemini, WebSocket, and queue adapters
- `api` for controllers, DTOs, validation, and response mapping

## Database Schema
Core tables:
- `users` - profile, role, status, avatar, bio, timestamps
- `roles` - role metadata
- `permissions` - granular access rules
- `user_roles` - many-to-many join if needed
- `images` - uploaded or generated image metadata, owner, visibility, storage key, dimensions, size, status
- `image_versions` - before/after versions and derived outputs
- `image_pipeline_steps` - step-by-step pipeline definition or execution log
- `pipeline_presets` - reusable workflow templates
- `prompts` - prompt drafts, templates, and saved prompt records
- `image_generation_histories` - generation runs, model, seed, aspect ratio, prompt, negative prompt
- `comments` - threaded comments with parent/child structure
- `likes` - image reactions
- `favorites` - saved items or collections
- `tags` - searchable tags
- `image_tags` - many-to-many join
- `notifications` - activity notifications
- `chatbot_histories` - AI assistant conversations
- `audit_logs` - security and traceability
- `system_settings` - feature flags, defaults, runtime settings

Schema guidelines:
- Use UUID primary keys.
- Store timestamps in UTC.
- Index `owner_id`, `visibility`, `created_at`, `status`, and foreign keys heavily.
- Keep large binaries in object storage, not in PostgreSQL.
- Add soft delete where moderation or recovery matters.
- Add full-text/search support for prompt and gallery discovery.

## API Design
Suggested API groups:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/images/upload`
- `POST /api/v1/images/process`
- `GET /api/v1/images/public`
- `GET /api/v1/images/me`
- `GET /api/v1/images/{id}`
- `GET /api/v1/images/{id}/versions`
- `POST /api/v1/pipelines/presets`
- `GET /api/v1/pipelines/presets`
- `POST /api/v1/generation/prompts`
- `POST /api/v1/generation/generate`
- `GET /api/v1/generation/history`
- `POST /api/v1/chat`
- `GET /api/v1/social/trending`
- `POST /api/v1/social/{imageId}/like`
- `POST /api/v1/social/{imageId}/favorite`
- `POST /api/v1/social/{imageId}/comments`
- `GET /api/v1/notifications`
- `GET /api/v1/admin/stats`

API design notes:
- Use a shared response wrapper with `statusCode`, `message`, `data`, and `error`.
- Paginate all feed, gallery, and admin lists.
- Keep upload and generation operations async where possible.
- Emit WebSocket events for processing progress, completion, and notifications.
- Return lightweight DTOs, not JPA entities.

## Feature Roadmap
Phase 1 - UI/platform shell:
- dark glassmorphism shell
- responsive sidebar and mobile bottom nav
- social home feed
- prompt gallery and studio dashboard
- upload preview and pipeline history

Phase 2 - Generation workflows:
- Gemini prompt assistant
- negative prompt support
- generation history
- public/private publishing
- preset management

Phase 3 - Social discovery:
- likes, comments, favorites, and shares
- trending images and trending prompts
- infinite scroll and search
- user profile galleries

Phase 4 - Scale and realtime:
- WebSocket job progress
- queue-backed processing
- Redis caching and rate limiting
- CDN-backed asset delivery
- analytics and audit dashboards

## Folder Structure Target
Recommended clean structure for the frontend:
```text
src/
  api/
  app/
  components/
  core/
  context/
  features/
  hooks/
  layouts/
  pages/
  ui/
  utils/
  types/
```

Recommended clean structure for the backend:
```text
src/main/java/com/pipeline/
  api/
  application/
  domain/
  infrastructure/
  config/
```

## Performance and UX Notes
- Use route-level splitting for large surfaces such as studio, chat, and admin.
- Use skeletons and empty states for all feeds and galleries.
- Prefer optimistic updates for likes, favorites, and comments.
- Lazy-load images and use responsive thumbnails.
- Keep the public feed SEO-friendly and shareable.
- Preserve accessible focus states and keyboard navigation everywhere.
