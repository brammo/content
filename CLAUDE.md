# CLAUDE.md

@AGENTS.md

## Claude-specific notes

- Run `composer check` before finishing; use `composer cs-fix` only for local style fixes.
- Tests that force `driver => 'gd'` must skip when `gd` is not loaded (dev hosts may have only imagick).
- `webroot/js/editor.js` has no JS test suite: verify editor changes manually in a browser and keep `tests/TestCase/View/Element/EditorElementTest.php` in sync with the element's inline script.
- Client-side editor sanitising is not a security boundary; keep the docs saying stored HTML must be sanitised on the server.
