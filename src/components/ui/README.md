# components/ui/

Presentational primitives of the Yumio admin design system (Figma Admin Panel). The full
component reference, theme tokens and usage rules are in [`../README.md`](../README.md).

Conventions:
- One PascalCase `.jsx` file per component family with named exports (`export const Button`),
  re-exported from `index.js` and imported via `@components`.
- Styling uses the Tailwind theme tokens from `src/App.css` (`bg-primary`, `text-ink-muted`,
  `border-line`, `font-display`, …) — no raw grey/green classes or hex values.
- Variants and sizes live in `VARIANTS` / `SIZES` maps inside the component and are merged
  with `clsx`.
- A file that exports components exports only components (React Fast Refresh); shared helpers
  go into `.js` modules (`tokens.js`, `status.js`, `time.js`, `chart.js`, `fieldStyles.js`,
  `menuFocus.js`, `translations.js`); hooks get their own `useXxx.js` (`useAutoTranslate.js`).
- `TranslateButton` / `useAutoTranslate` are the only primitives that call the API (RTK Query
  hooks from `@store/api`, translate status + `POST /admin/translate`).
- Keep old props working when changing a component that pages already use.
