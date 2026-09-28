# ExUI global message design

Status: approved in the 2026-09-28 `grilling --major` interview.

## Contract

Export `<ExMessageContext />` and the imperative `ExMessage` object from the
`@exre/exui` root. The host renders ExUI's existing `Toaster` and mounts once
beside the application tree. It is not a React provider and takes no children.

`ExMessage` exposes `info`, `warn`, `error`, `success`, `loading`, and `dismiss`.
Ordinary calls take React-renderable content and optional `{ duration }`, return
the toast ID, and `dismiss(id)` closes a managed message. `loading` returns
`{ onSuccess, onError, dismiss }`; completion updates the original toast ID.

The host keeps `duration=3000` milliseconds, `placement="top-right"`, and
`maxCount=3`. It supports all six Sonner positions. Invalid durations,
placements, and counts throw. The wrapper closes the oldest active managed
message before exceeding capacity. Loading is persistent without an explicit
deadline; an explicit `duration` closes it without changing it to an error.
Completion uses the current host default duration unless overridden. A finished,
closed, or evicted loading message cannot reappear through a late callback.
Calls before host mount fail explicitly. Host unmount clears managed messages
and timers; a second host is rejected.

React sibling effects may call the wrapper before Sonner's passive subscription
is active. The host registers in its layout effect, then publishes messages
created during that gap once its child Toaster has subscribed. Early completion
or dismissal changes the pending message before it is published. This keeps the
single-host API independent of sibling order without allowing pre-mount calls.

`ExMessage` and `<ExMessageContext />` use the bundled Sonner instance already
used by ExUI's public `Toaster` and `toast`. Those existing exports remain
available. Direct `toast` calls are outside the wrapper's `maxCount` registry.
No persistence, cross-tab synchronization, interactive actions, or Sonner option
pass-through is part of this API.

## Delivery

First add, test, document, and release the ExUI API with a Changeset. Once a
published version contains it, update ExWebsite's dependency and callers and
remove its site-local ExMessage implementation. Keep unrelated dirty work in
both repositories untouched.

Source design: ExWebsite `.notes/ex-message/specs/2026-09-24-ex-message-design.md`
and `.notes/ex-message/rfcs/ex-message-rfc.md`; the interview overrides their
ExWebsite-only placement and extends the public method set.
