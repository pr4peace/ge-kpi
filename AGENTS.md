# GoodEarth KPI — Agent Coordination

## Current Phase
Phase 1 — Build and deploy the live financial dashboard.

## Last Action
Claude (2026-05-22): Created spec and implementation plan. Project scaffolded and pushed to GitHub.

## Next Action
Gemini: Pick up Task 3 (parseSheet module). Pull latest main before starting.

## Open Questions / Blockers
None.

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
