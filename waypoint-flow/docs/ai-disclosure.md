# AI Tool Disclosure

This document discloses the use of AI tools in the development of Waypoint Flow for the Tech-Triathlon 2026 Hackathon.

## Tools Used

- **Google Gemini / Antigravity IDE** — primary AI coding assistant
- **Claude** — used for code review and documentation drafting

## Work Areas and AI Involvement

| Work Area | AI-Assisted | Detail |
|---|---|---|
| System architecture design | Partial | AI suggested component boundaries; team finalised structure based on Designathon handoff |
| Allocation engine (9 constraints) | Partial | AI drafted TypeScript scaffold; team implemented and verified all 9 constraint functions |
| Firebase Firestore data model | Partial | AI suggested schema; team designed from challenge CSV data + Designathon screen specs |
| React component UI code | Partial | AI generated boilerplate components; team implemented business logic and interaction design |
| Socket.IO event taxonomy | No | Team designed all real-time events from Designathon handoff requirements |
| Seed data scripts | Partial | AI helped structure CSV → Firestore parser; team validated against challenge data |
| Vercel + Firebase configuration | Partial | AI generated base config; team customised for actual project requirements |
| Visual design system (colors, icons, typography) | Yes | Directly from `Docs-ui/` specification files produced with AI assistance during Designathon |
| Demo video script and recording | No | Team wrote, recorded, and narrated |
| Security rules and auth logic | Partial | Team wrote NextAuth + middleware; AI reviewed for completeness |

## Human Decisions

All architectural decisions, constraint implementations, and screen designs were reviewed, tested, and approved by the team. AI-generated code was never committed without human review. The team is accountable for all functionality described in the submission.
