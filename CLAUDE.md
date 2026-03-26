## Design System
Always read DESIGN.md (the "Visual Design System" section) before making any UI or styling decisions.
Font choices, colors, spacing, border-radius, and component patterns are all defined there.
Do not deviate from the design system without explicit user approval.
Key rules:
- Fonts: Cabinet Grotesk (headings) + DM Sans (body) + Geist (data/numbers)
- Accent color: #C2440A (burnt sienna) — not blue, not green
- Background: #FAF9F7 (warm off-white) — not pure white
- Cards use --surface (#F2EFE9) with --border (#E0D9CE), border-radius 12px
- Max-width: max-w-xl on all screens

## gstack
- Use the /browse skill from gstack for all web browsing
- Never use mcp__claude-in-chrome__* tools
- Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /retro, /debug, /document-release
- If gstack skills aren't working, run `cd ~/.claude/skills/gstack && ./setup` to build the binary and register skills
- **Teammates (first-time setup):** requires [bun](https://bun.sh) — install with `curl -fsSL https://bun.sh/install | bash`, restart your terminal, then run `cd ~/.claude/skills/gstack && ./setup`