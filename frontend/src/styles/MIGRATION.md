Migration Guide — Design Tokens & Primitives
=========================================

Summary
-------
This document maps old CSS variables and common component usages to the new design-system tokens and primitives.

Tokens
------
- `--primary`  → use `--accent` or `--accent-bright` for interactive states
- `--text-primary` → `--foreground`
- `--text-secondary` → `--foreground-muted`
- `--bg-canvas` → `--background-base`
- `--border-soft` → `--border-default`

Primitives
----------
- `Card` — wrap existing `antd` card usage with `components/ui/Card.tsx`. Keeps `className` and `bordered` props.
- `Button` — use `components/ui/Button.tsx` with `variant` prop (`primary` | `secondary` | `ghost`). Prefer this for CTAs to ensure consistent glow and interactions.
- `Input` — re-exports AntD input but centralizes tokens. Use `Input.TextArea` for multi-line prompts.
- `Spotlight` — wrapper that provides mouse-tracking radial glow. Use on interactive panels (desktop-only by CSS media query).

Migration Steps
---------------
1. Replace visual-only `antd` components with `Card` / `Button` wrapper where style consistency matters.
2. Centralize tokens: reference `--accent`, `--foreground` in component styles instead of hard-coded hex values.
3. Add `AmbientBackground` to top-level app shell (done). Keep it off on small screens.
4. For performance: enable `Spotlight` on desktop-only interactive surfaces; respect `prefers-reduced-motion`.

Notes
-----
- Existing styles remain functional; tokens were added as a compatibility layer. Gradual migration is recommended.
