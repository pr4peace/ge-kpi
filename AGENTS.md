# GoodEarth KPI — Agent Coordination

## Current Phase
Phase 1 — COMPLETE. Planning Phase 2 when ready.

## Live URL
https://hopeful-nature-production-cd29.up.railway.app

## Last Action
Claude (2026-05-22): Phase 1 fully deployed. All 8 tasks complete. Dashboard live at Railway URL above — verified 4 project cards (Motif, Octave, Ochre, Cadence), live financial data from Google Sheets, Chart.js chart, 3 placeholder sections.

## Next Action
Claude/Prashanth: Kick off Phase 2 planning when ready.
- Add PostgreSQL snapshot storage (monthly KPI snapshots → trend charts)
- Add project CRUD (add/edit/archive projects without code changes)
- Connect Google Sheets for External Projects, Initiators, Sales & Marketing

## Open Questions / Blockers
None. Phase 1 shipped.

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
