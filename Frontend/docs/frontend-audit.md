# Frontend Audit — Drishti (SIH26038)

**Audit date:** 2026-10-02
**Auditor:** Senior Frontend Engineer (Phase 0 mandatory audit)

---

## 1. Repository State at Audit Time

| Property | Found |
|---|---|
| Framework | React 19 (via `@vitejs/plugin-react`) |
| Build tool | Vite 8 |
| Language | **TypeScript ~6 configured; USER has requested JavaScript (JSX) for app source — see deviation note** |
| Package manager | npm (package-lock.json present) |
| Existing routes | None |
| Existing components | None (only Vite default `App.tsx` counter + links — no product code) |
| Styling system | None (Vite default `index.css` with template variables; no Tailwind) |
| Existing auth / API code | None |
| Folder conventions | Flat `src/` with only `App.tsx`, `main.tsx`, `index.css`, `assets/` |
| Lint config | oxlint v1 (`.oxlintrc.json`) — react + typescript + oxc plugins |
| Project management | GSD methodology (PROJECT_RULES.md, ARCHITECTURE.md, GSD-STYLE.md) |
| Existing product functionality | None (safe to replace the Vite demo) |

---

## 2. What Is Reused

- `vite.config.ts` — preserved; extended with path alias `@/` -> `src/`
- `tsconfig*.json` — preserved (build-tool config); not used for app JSX source
- `.oxlintrc.json` — preserved, oxlint rules unchanged
- `index.html` — updated (title, meta description, Inter font link, skip-to-content)
- `ARCHITECTURE.md`, `PROJECT_RULES.md`, `GSD-STYLE.md` — methodology docs, untouched

---

## 3. Dependencies Added

| Package | Reason |
|---|---|
| `react-router-dom` | Client-side routing, nested layouts, route guards |
| `@tanstack/react-query` | Server-state caching, polling for AI processing status |
| `react-hook-form` | Form state management (wizard, patient registration, review) |
| `zod` | Runtime schema validation paired with react-hook-form |
| `@hookform/resolvers` | Bridge between zod schemas and react-hook-form |
| `recharts` | Accessible, responsive charts for analytics |
| `lucide-react` | Icon library — every semantic status paired with an icon |
| `clsx` | Conditional className composition (avoids string bugs) |
| `tailwind-merge` | Merges Tailwind classes without conflicts |
| `tailwindcss` + `@tailwindcss/vite` | Utility CSS; design tokens via `@theme` in CSS |

No other dependencies added.

---

## 4. Design Decisions and Deviations

1. **JavaScript (JSX) instead of TypeScript** — User explicit request. All application source files use `.jsx`/`.js`. `tsconfig` is preserved for Vite compatibility but not applied to source files. JSDoc comments used where type documentation is important.
2. **Tailwind v4 (`@tailwindcss/vite` plugin)** — Matches the existing Vite-first approach; no `postcss.config.js` required. Design tokens defined via `@theme` in `globals.css`.
3. **oxlint** retained — ESLint not added. This matches the repo's lint tooling choice.
4. **Inter font via Google Fonts** `<link>` in `index.html` — no npm font package needed.
5. **No dark mode** — `prefers-color-scheme: dark` block from the Vite template `index.css` removed. Dark mode is explicitly out of scope.
6. **VITE_USE_MOCKS=true default** — All source control committed with mocks on until a backend exists.
7. **No mapping library** — District analytics: charts + tables only. A `<!-- CHOROPLETH_EXTENSION_POINT -->` comment marks where a map would plug in later.
8. **Session storage not used** — Auth is HTTP-only cookie. In-memory React state only for wizard draft.

---

## 5. Folder Structure Created

```
src/
  app/            router.jsx, providers.jsx, RequireAuth.jsx, RequireRole.jsx
  api/            client.js, endpoints.js, types.js (JSDoc), *.api.js, adapters/http/, adapters/mock/
  mocks/          data/, handlers.js, DemoControls.jsx
  features/       auth/, patients/, screening/, ai-xai/, review/, admin/, analytics/, notifications/
  components/
    ui/           Button, Input, Select, Textarea, SearchInput, Badge, Card, Tabs, Dialog,
                  Drawer, Toast, Skeleton, Pagination, Tooltip, Accordion, Switch, Breadcrumbs, PageHeader
    layout/       AppShell, Sidebar, Header, MobileNav, ProfileMenu
    feedback/     LoadingState, EmptyState, ErrorState, SuccessState, ConfirmDialog, PermissionDenied, NotFound
    clinical/     PatientHeaderStrip, StatusBadge, SeverityBadge, ConfidenceMeter, AiAnalysisCard,
                  ClinicalReviewPanel, TriagePanel, ReferralPanel, FollowUpPanel, Timeline,
                  FundusViewer, XaiViewer, ImageCompare, QualityResultPanel, ProcessingPanel, CameraCapture
    charts/       StatCard, TrendChart, DistributionChart, ComparisonBarChart
  hooks/          useAuth.js, usePolling.js, useToast.js, useUnsavedChanges.js, useDebounce.js
  lib/            cn.js, constants.js, formatters.js
  styles/         globals.css
```

---

## 6. Provisional API Endpoints

All endpoint paths centralized in `src/api/endpoints.js` marked `// PROVISIONAL`.
Setting `VITE_USE_MOCKS=false` + `VITE_API_BASE_URL=<url>` routes all calls through the http adapter with zero component changes.

---

_Last updated: Phase 1 complete_
