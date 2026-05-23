# NovaCanvas AI Platform Spec

## Vision
NovaCanvas AI is a futuristic AI image processing and generation SaaS platform inspired by Midjourney, Leonardo AI, Playground AI, and MeiGen Gallery. The product should feel like a premium creative workspace: fast upload, realtime processing feedback, strong visual hierarchy, and a gallery-first workflow for creators and teams.

## UX Principles
- Dark mode first, with glassmorphism surfaces and subtle neon gradients.
- Mobile-first responsive layout that scales cleanly to tablet, laptop, and desktop.
- Fast feedback for every action: upload, pipeline progress, processing result, and gallery sync.
- Clear separation between creation, history, administration, and community surfaces.
- Accessible by default: keyboard navigation, visible focus states, semantic landmarks, and descriptive labels.
- SEO-friendly public shell for marketing/landing pages, with app content optimized for performance.

## Frontend Architecture Target
Recommended target stack:
- Next.js App Router
- TailwindCSS for tokens, spacing, and component primitives
- Framer Motion for transitions and staged reveals
- Zustand for local workspace state, or Redux Toolkit if cross-cutting workflows grow larger
- React Query or SWR for remote data fetching and caching
- next/image, dynamic imports, and route-level loading states for performance

Recommended frontend boundaries:
- app/ for route-level shells and page composition
- features/ for domain slices such as auth, processing, generation, gallery, social, and admin
- components/ for reusable primitives: cards, chips, upload zones, preview panes, dialogs, sidebars, and timelines
- core/ for API client, auth helpers, theme tokens, and shared utilities
- stores/ for state management

## Backend Architecture Target
Recommended backend structure:
- Spring Boot as a modular monolith with clear packages or bounded contexts
- REST API for CRUD, auth, gallery, and admin flows
- WebSocket for live progress updates, queue status, and collaborative signals
- Redis for caching, rate limiting, session or token support, and queue coordination
- PostgreSQL for relational persistence and auditability
- S3 or MinIO for image/object storage
- Gemini API for prompt assistance, generation assistance, and content enrichment

Recommended backend modules:
- auth
- users
- media
- processing
- generation
- gallery
- social
- notifications
- admin
- audit

Clean architecture approach:
- domain layer for entities and business rules
- application layer for use cases and orchestration
- infrastructure layer for JPA, S3, Redis, Gemini, and WebSocket adapters
- api layer for controllers, DTO mapping, validation, and response wrappers

## Scalable Database Schema
Core tables and relations:
- users: identity, profile, role, status, timestamps
- roles: role metadata
- permissions: granular access rules
- user_roles: many-to-many join if needed
- images: uploaded or generated image metadata, owner, visibility, storage key, dimensions, size, status
- image_versions: before/after or derived variants
- processing_jobs: queue job state, step progress, timings, error payload
- pipeline_presets: reusable workflow settings
- ai_generations: prompt, model, seed, aspect ratio, style, output image reference
- prompts: prompt templates and saved prompt drafts
- tags: searchable tags
- image_tags: many-to-many join
- likes: social reactions
- comments: threaded comments
- favorites: saved collections
- follows: user-to-user relations
- notifications: in-app alerts
- audit_logs: security and traceability
- system_settings: feature flags, defaults, and runtime configuration

Recommended schema notes:
- Use UUID primary keys.
- Store timestamps in UTC.
- Index owner_id, visibility, created_at, status, and foreign keys heavily.
- Keep large blobs out of PostgreSQL; store assets in object storage and persist only metadata.
- Add soft delete where moderation or recovery matters.
- Add full-text or search indexing for prompt and gallery discovery features.

## Feature Roadmap
Phase 1 - Core studio:
- premium landing/dashboard shell
- upload and preview optimization
- processing pipeline UX
- gallery history and pagination
- auth, roles, and admin controls

Phase 2 - AI generation:
- prompt composer with Gemini assist
- style presets and prompt templates
- generation history and remixing
- private/public toggle
- seed and aspect ratio controls

Phase 3 - Collaboration:
- social gallery feed
- likes, comments, saves, follows
- profile pages and collections
- trending prompts and featured assets

Phase 4 - Platform scale:
- WebSocket progress events
- queue-backed processing and generation jobs
- caching and rate limiting
- analytics and audit dashboards

## Performance and SEO
- Split large features into route-level lazy chunks.
- Use skeletons and optimistic UI for long-running operations.
- Prefer server-side or edge-rendered public pages in the Next.js target architecture.
- Cache repeatable data aggressively.
- Provide meta tags, Open Graph, and canonical URLs for public content.
- Compress and serve responsive images in modern formats where possible.

## Migration Note
The current repository uses a React/Vite frontend. The redesign implemented in this branch modernizes the current shell and visual language first. A separate migration phase can move the frontend to Next.js while preserving the same component and domain structure.
