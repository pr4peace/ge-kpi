# GoodEarth KPI — Agent Coordination

## Current Phase
Phase 1 — Build and deploy the live financial dashboard.

## Last Action
Gemini (2026-05-22): Phase 1 frontend complete. Tasks 1–7 done. All 18 tests passing. Dashboard verified locally — 4 project cards live, financial tables, Chart.js bar chart, 3 placeholder sections. Ready for Railway deployment.

## Next Action
Human/Claude: Deploy to Railway (Task 8). Follow steps in docs/superpowers/plans/2026-05-22-goodearth-kpi-dashboard.md — Task 8 requires Railway account setup and manual steps in the Railway dashboard.

## Open Questions / Blockers
None — all code complete. Task 8 requires Railway account and manual deploy steps.

## Agent Roles
| Agent | Role |
|-------|------|
| Claude | Orchestrator — owns AGENTS.md, assigns tasks, resolves conflicts |
| Gemini | Builder — implements tasks, does ONE commit per completed task after Codex review |
| Codex | Reviewer — reviews Gemini's diff before commit, flags issues back to Gemini |

## Git Rules
- Gemini: always `git pull origin main` before starting
- Gemini: only commit after Codex review is clean
- Codex: review only, never commit
- Claude: update AGENTS.md only, never commit code
- Commit messages describe the work (e.g. "add /api/data endpoint"), not the agent

## Phase 2 Notes (for future reference)
- Add PostgreSQL snapshot storage (monthly)
- Add project CRUD (add/edit/archive projects without code changes)
- Connect remaining Google Sheets for External Projects, Initiators, Sales & Marketing
