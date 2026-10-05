# ExMessage ExUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an ExUI global message wrapper that ExWebsite can consume after release.

**Architecture:** A host component owns configuration and renders the existing ExUI Toaster. A separate controller owns only ExMessage-created IDs and loading timers, calling the same bundled Sonner instance as Toaster. Browser tests consume only the public package entry.

**Tech Stack:** React 19, TypeScript, bundled Sonner, Vitest Browser Mode, pnpm 11.9.0.

**Spec:** `.notes/ex-message/specs/2026-09-28-ex-message-exui-design.md`

## Global Constraints

- Public entry is `@exre/exui`; no new published package or Sonner copy.
- Existing `Toaster` and `toast` remain available.
- Defaults: 3000 ms, `top-right`, maximum 3 managed messages.
- Preserve unrelated changes; do not edit generated `dist/` or `types/` files.
- Follow `TESTING.md` and add a minor Changeset.

---

### Task 1: Public host and managed message behavior

**Files:**
- Create: `packages/components/src/components/ex-message-context.tsx`
- Create: `packages/components/src/lib/ex-message-controller.ts`
- Modify: `packages/components/src/index.ts`
- Test: `packages/showcase/src/showcase/ExMessage.vrt.test.tsx`

**Interfaces:**
- Produces: `ExMessageContext(props: ExMessageContextProps)` with `duration?`, `placement?`, `maxCount?`.
- Produces: `ExMessage.info/warn/error/success(content, {duration?})`, returning `string | number`.
- Produces: `ExMessage.loading(content, {duration?})`, returning `LoadingHandle`.
- Produces: `ExMessage.dismiss(id)` and public `ExMessagePlacement`, `ExMessageOptions`, `ExMessageContextProps`, `ExMessageLoadingHandle` types.

- [x] Write browser tests that import the desired root API and prove mounted calls render; run the focused test and observe failure because the API is absent.
- [x] Add the minimal host, controller, and root exports; rebuild and run the focused test until green.
- [x] Add failing tests for defaults, capacity eviction, loading completion and deadline, late callback no-op, manual dismissal, host lifecycle, and validation; implement each behavior and rerun the focused test.
- [x] Run `pnpm typecheck`, `pnpm lint`, and `pnpm build` after the behavior tests pass.

### Task 2: Public consumer guidance and release evidence

**Files:**
- Modify: `packages/components/README.md`
- Modify: `skills/exui-usage/references/components/Sonner.md` if present; otherwise the Sonner reference selected by the usage skill inventory.
- Modify: `TESTING.md` for the new browser test placement/command only if the existing rule does not already cover it.
- Create: `.changeset/ex-message.md`
- Modify: packed consumer fixture and browser gate only where needed to prove the published API works from a tarball.

**Interfaces:**
- Consumes: the root exports from Task 1.
- Produces: a concise mounting and imperative-call example, and a minor Changeset.

- [x] Add an isolated packed-consumer assertion for the new root imports and a real browser interaction, then run `pnpm verify:pack` to verify it.
- [x] Document host placement, methods, defaults, raw `toast` coexistence, and loading cleanup; add the release note.
- [x] Run the affected usage-skill checks, `pnpm test:visual`, `pnpm verify:pack`, and `git diff --check`; report any unavailable gate precisely.

### Task 3: Downstream migration after publication

**Files:**
- Modify: ExWebsite dependency manifests and lockfile.
- Modify: ExWebsite `packages/components/src/index.ts` and message callers.
- Delete: ExWebsite `packages/components/src/ExMessage.tsx` and `exMessageController.ts` after replacement.
- Modify: ExWebsite root host to import `ExMessageContext` from `@exre/exui`.

**Interfaces:**
- Consumes: a published `@exre/exui` version containing Task 1.

- [ ] Confirm the published version contains the API and passes installation.
- [ ] Write or update downstream tests against that version, migrate imports and host, and remove the local wrapper.
- [ ] Run ExWebsite's required typecheck, tests, build, and browser checks without touching unrelated work.

## Self-review

Tasks 1 and 2 cover all approved public methods, host behavior, compatibility,
documentation, packed distribution, and Changeset. Task 3 is explicitly gated
on actual publication. The task interfaces use consistent names and types.
