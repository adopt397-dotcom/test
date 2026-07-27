# GongBoo graphic reference library

This folder keeps two deliberately separate layers.

## 1. Complete upstream reference

`reference/jsxgraph-official/` is the official JSXGraph repository, tracked as a Git submodule.
It includes the complete upstream `examples/` collection and documentation without filtering or rewriting.

- Upstream: https://github.com/jsxgraph/jsxgraph
- License: JSXGraph is dual licensed under MIT and LGPL-3.0-or-later.
- Purpose: source reference, not a runtime dependency of the GongBoo viewer.

## 2. GongBoo reusable templates

`jsxgraph-templates.js` contains the small, tested template set that appears in the Viewer menu.
It is the only place where examples are converted to compact GongBoo `engine: "jsxgraph"` JSON.

Workflow:

1. Keep every upstream example in the reference library.
2. When a course needs a pattern, adapt that example into `jsxgraph-templates.js`.
3. Put high-frequency patterns in the Viewer menu; leave specialist examples in the complete reference library.

No upstream example is deleted merely because it is not currently common.
