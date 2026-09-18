---
"@exre/exui": patch
---

Restore publication of tagged releases to npm. The release hook aborted before publishing because it required the registry to describe a missing package or version with an `error` field, while the registry answers a 404 with a bare message string. Every not-yet-published version was therefore rejected as inconsistent metadata, so a release could never publish its package.

- Treat a 404 carrying a non-empty message as an unpublished version, whether the message arrives as a string or as an `error` field
- Keep failing closed when a 404 arrives with an empty or unrecognised body
