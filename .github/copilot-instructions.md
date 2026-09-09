# StageRight — Copilot instructions

This is a live-event operations dashboard MVP. Full spec: `docs/StageRight_PRD.md`.

## Stack
React + TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, Zustand (with
localStorage persist). Mock data only — no backend.

## Conventions
- Use the `@/` import alias.
- Keep the readiness computation in pure functions (`src/lib/readiness.ts`);
  never store the overall percentage as source of truth — derive it.
- Follow the build phases and functional requirements (FR-x) in the PRD.
- Status is always shown as color + icon + text label, never color alone.
