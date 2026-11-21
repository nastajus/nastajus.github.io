# Mobile responsive regression suite

This Playwright suite protects the sticky mobile project scenes against the failures that are easy to miss in a single desktop preview:

- feature narrative overlapping the active gallery;
- section kicker overlapping the feature narrative;
- galleries or captions leaving the viewport;
- images becoming too small, unloaded, inset, or horizontally cropped by layout;
- horizontal document overflow;
- browser-engine differences under enlarged text.

The matrix covers Chromium, Firefox, and WebKit at 390 × 844 and 430 × 932, with normal and 150% root-font conditions. Every feature frame in all three projects is checked—144 responsive states per run. Playwright retains a screenshot and trace for every failure.

From the project root on Windows, run:

```text
qa-mobile.cmd
```

Or run the suite directly:

```powershell
cd qa
npm ci
npx playwright install chromium firefox webkit
npm test
```

The GitHub Pages repository runs the same suite automatically for changes under `folio/`.
