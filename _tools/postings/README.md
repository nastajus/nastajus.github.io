# Saved postings publisher

Public index: https://nastajus.github.io/postings/

This checkout lives at `jvs/postings-site/`. The original captures stay in your manually managed sibling folders, such as `jvs/search week 37 in 2026/`. Generated copies, indexes and friendly URLs live in this checkout's `postings/` tree. The tools are under `_tools/postings/`, which GitHub Pages' default Jekyll build excludes from the website.

## Add more postings and push

Save more SingleFile HTML postings into a configured search folder. From this directory:

```powershell
npm.cmd ci             # first setup only
npm.cmd run publish
```

Publish fast-forwards this checkout from GitHub, builds the indexes and saved-page copies, runs tests and link/content checks, commits the scoped changes, then pushes `master`. GitHub Pages deploys automatically. No password or token is stored by this project; Git uses your existing GitHub authentication. A push rejected by remote changes stops safely; rerun after reconciling rather than force-pushing.

For a future search burst, add an object to `config.json` under `bursts`. `source` is relative to the repository root, so your existing local source folder names can stay unchanged. Choose a unique `year`/`slug` pair, label, actual `searchedOn` date and source label. This first search happened Friday, **2026-09-11** and uses `/postings/2026/w37/`. Folder names map to friendly URL segments automatically; `groups` can override a folder's label/slug or mark it hidden. Nested subfolders remain nested online. NVM is collapsed on the root and burst pages, but is public and visible on its direct group index.

## Preview and verify

With the `career` folder open in VS Code, choose **Run and Debug → Saved postings: preview in Firefox**, then press **F5**. This starts the local preview and opens Firefox; it does not publish or rebuild postings. Stop debugging to stop the preview server. The existing Boardwatch launcher stays available separately. To reinstall this parent-workspace entry, run `node install-preview-launch.mjs` from this directory. The parent `.vscode/launch.json` is outside this repository; its installer is tracked here.

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run verify
npm.cmd run preview
```

Preview: http://127.0.0.1:18766/postings/. Copy-link buttons always copy the **public** URL, including in local preview. Sidebar toggle: button or Ctrl+Shift+S. The index is plain HTML and works without JavaScript; scripts add search, clipboard support and the sidebar toggle.

After GitHub Pages finishes deploying, run `node check-live.mjs` to compare every current page, saved copy and asset with the published version. Add `--local` to check the local preview instead.

## Preservation and metadata

- Friendly pages include readable posting content and a link to `saved.html`, a styled copy of the original capture with account navigation and active controls removed. Originals are never rewritten. Captured wording is retained. The Java posting's display title follows its actual description; the source title is recorded explicitly.
- Saved time comes first from SingleFile's `saved date` comment. File creation and last-modified timestamps are also recorded. If the capture date is missing, file last-modified is used and labelled. Times display in America/Toronto, including daylight-saving changes.
- Job number identifies repeated captures in a burst. The newest saved capture wins. Existing slugs stay stable when titles change. Moving an item to another group produces a redirect at its prior URL. Removing an input removes it from current indexes but does not erase previously shared pages or registry records. Missing source directories fail the build instead of emptying the archive.
- Reference images are copied separately with friendly names. Browser `.url` shortcuts, including private ChatGPT conversation links, are not published. The full original-path mapping and skip list live only in gitignored `.local/source-map.json`.
- `manifest.json` is the public parsable list and URL registry. It contains job metadata and capture timestamps, not original filenames or local filesystem paths.
- Search engines are asked not to index these pages. That is not access control: anyone with the URL can view and share the postings, including NVM.

The existing home page and other sections of nastajus.github.io are outside this publisher's scope.
