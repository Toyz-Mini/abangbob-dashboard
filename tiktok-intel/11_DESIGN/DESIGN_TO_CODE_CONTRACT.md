# Design-to-Code Contract V1.7

## Claude Code must follow

1. Read all `/11_DESIGN/*` before implementing UI.
2. Use semantic design tokens.
3. Do not introduce one-off visual styles without documenting them.
4. Build reusable components before composing pages.
5. Keep page-specific business logic out of visual components.
6. Use real loading/empty/error states.
7. Never use fake analytics values in production paths.
8. Never use color as the only status signal.
9. Do not add charts unless they answer a defined business question.
10. Every screen must map to a screen ID in `SCREEN_SPEC.md`.

## Component hierarchy

AppShell
→ Navigation
→ PageHeader
→ FilterBar
→ ContentGrid
→ DomainCard
→ Evidence/Action

## Implementation preference

Use the existing project stack and component library where possible. Do not add a second design system.

If a required component does not exist:
1. check current component primitives;
2. compose from primitives;
3. add a reusable component;
4. document it in COMPONENT_SPEC.md.

## Visual QA

A UI feature is not done after TypeScript passes.
It requires:
- responsive check
- keyboard/focus check
- loading/error/empty check
- visual hierarchy check
- accessibility check
- screenshot review where available.
