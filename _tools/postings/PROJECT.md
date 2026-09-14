# Saved postings: requirements and handoff

Recovered and checked on 2026-09-14 from prior conversation
`01a091be-1960-7f80-8767-47e0111b8f17`, the implementation, Git history,
and the deployed files. That conversation's final reorder request failed
with a recorded usage-limit error before implementation.

## Purpose and locations

Maintain a shareable personal archive of saved job postings, organized by
user-managed search bursts. This project is separate from `jvs/boardwatch`.

- Repository: `jvs/postings-site/`, remote `nastajus/nastajus.github.io`, branch `master`.
- Publisher sources: `_tools/postings/` within the repository.
- Generated public archive: `postings/` within the repository.
- Original captures: sibling `jvs/search week 37 in 2026/`; leave originals untouched.
- Public entry: https://nastajus.github.io/postings/
- First burst: https://nastajus.github.io/postings/2026/w37/
- Local preview: http://127.0.0.1:18766/postings/

## Confirmed requirements

1. Keep original filenames and user-created search folders separate from generated copies.
2. Support periodic additions and future bursts through configured source folders.
3. Provide root, year, burst, group, and individual posting pages with friendly, stable links.
4. Preserve source folder grouping. NVM is collapsed by default, expandable, and public.
5. Include titles, sidebar navigation, and easy copying of public share links.
6. Identify JVS as the source; date the first search Friday, September 11, 2026.
7. Preserve capture timestamps and file timestamps, displayed in Toronto time.
8. Rebuild, validate, commit, and push through a repeatable publishing workflow.
9. Provide a second VS Code Run and Debug launcher opening the postings preview in Firefox.
10. Allow the owner to drag postings into a preferred order, with visitors unable to
    change the shared published order. This final request remains outstanding.

## Existing behavior and validation

The archive currently has 13 postings: seven main entries, six NVM entries,
and one reference image. All six tests passed; verification covered 30 HTML
pages; live verification matched 34 public URLs byte-for-byte with local output.
This was an automated content/interface check, not a new visual browser review.

`config.json` configures bursts. `extract.mjs` parses the current JVS capture
format and removes account controls and active content from public copies.
`build.mjs` manages copies, metadata, stable URLs and redirects. `render.mjs`
renders indexes and currently sorts postings alphabetically inside each group.
`assets/` contains editable interface sources; the build copies these to `postings/assets/`.
`manifest.json` is generated metadata and the URL registry. Local source mappings
and skipped browser shortcuts are recorded in gitignored `.local/source-map.json`.

The Firefox launcher is present in the parent career workspace's `.vscode/launch.json`.
Its tracked installer and preview changes are commit `758c9d7`, which was one commit
ahead of GitHub at takeover. The deployed archive matched the generated local files.

## Outstanding work and implementation direction

- Drag ordering has no implementation, saved order file, or write endpoint yet.
- The earlier answer recommended local dragging, saving stable posting IDs to a
  tracked order file, then publishing so all visitors see that order. This was a
  recommendation, not an explicit user selection between local and live editing.
- A local editor is the natural next implementation given the requested Firefox
  launcher. Persist order across rebuilds and apply it consistently to root, burst,
  and group indexes. Preserve grouping and existing URLs; accommodate new postings.
- If editing directly on the public site is required, choose an authenticated owner
  write mechanism. The current site and preview server provide no such mechanism.
- Publishing is automated after invoking `npm.cmd run publish`; there is no folder
  watcher or automatic upload triggered by saving a capture.
- No new postings or further interface specifications were supplied in the takeover
  prompt. The current extractor is specific to JVS; other capture layouts need support.

## Working commands

From `career`:

```powershell
npm.cmd --prefix jvs/postings-site/_tools/postings run build
npm.cmd --prefix jvs/postings-site/_tools/postings test
npm.cmd --prefix jvs/postings-site/_tools/postings run verify
npm.cmd --prefix jvs/postings-site/_tools/postings run publish
node jvs/postings-site/_tools/postings/check-live.mjs
```

For preview, select **Saved postings: preview in Firefox** in VS Code and press F5.
Preview serves existing generated files; it does not rebuild or publish them.
Follow `AGENTS.md` for scope, preservation, checks, commits, and fast-forward publishing.
