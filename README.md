# Task 5: Meta Campaign Mirroring UI

An interactive campaign manager that mirrors the core of Meta Ads Manager: **Campaign → Ad Set → Ad**, with one-click duplication, bulk editing, bulk status changes and **real-time validation** that tells you exactly what is missing *before* you try to launch.

It is a standalone front-end prototype. It does not call the Meta API, and nothing leaves your browser.

## Quick start

Requirements: **Node.js 18 or newer** and npm.

```bash
npm install
npm run dev        # open the URL it prints (usually http://localhost:5173)
```

Other commands:

```bash
npm test           # 27 unit and smoke tests (Vitest)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

On first run two sample campaigns are loaded: one complete ("Ready") and one deliberately incomplete so you can see the validation straight away. "Reset sample data" restores them at any time.

## Deploy to GitHub Pages

The included GitHub Actions workflow runs the test suite, builds the static site, and deploys `dist/` to GitHub Pages whenever code is pushed to `main`.

1. Push this project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to complete. The workflow summary contains the published URL.

The Vite build uses relative asset paths, so the app works from a repository subpath on GitHub Pages as well as when served locally.

## Tech stack and why

| Choice | Why |
|---|---|
| **React 18 + Vite** | Fast dev server, simple setup, the standard front-end stack |
| **`useReducer`** | Duplicate, bulk edit, status cascade and delete are all changes to one nested tree, so one reducer keeps them in one tested place |
| **Pure validation functions** | `logic/validation.js` has no React in it, so the rules are unit-tested and reused by the forms, the tree badges, the bulk bar and the launch button |
| **localStorage** | Work survives a refresh with no backend, no accounts and no keys |
| **Plain CSS** | No extra dependency, small bundle (about 55 kB gzipped JS) |
| **Vitest** | Same toolchain as Vite, runs in under a second |

Dropdown values (objectives, CTA types, budget types) follow Meta Ads Manager terminology.

## Project structure

```
src/
  App.jsx                  campaign home, editor navigation and user actions
  data/constants.js        dropdown values, limits, bulk-edit field list
  data/sampleData.js       the two sample campaigns
  logic/helpers.js         create / find / clone / status-cascade helpers (pure)
  logic/validation.js      all validation rules and readiness (pure)
  logic/reducer.js         every state change
  logic/storage.js         safe localStorage load/save
  components/              CampaignHome, Tree, forms, BulkBar, IssuePanel, badges, modal
  *.test.js(x)             unit and smoke tests
screenshots/               screenshots of the key features
.github/workflows/          GitHub Pages deployment workflow
```

## Feature walkthrough

1. **Campaign home:** the home page shows a card for each campaign. Open a card to edit that campaign; its campaign-specific tree appears in a compact side rail.
2. **Tree navigation:** hover or focus the side rail to reveal the campaign's tree. Expand or collapse any level and select a name to edit it. A breadcrumb shows where you are.
3. **Create:** "+ New campaign", then "+ Ad set" on a campaign and "+ Ad" on an ad set. Every form has sensible defaults and dropdowns for known values.
4. **Real-time validation:** every keystroke re-runs the rules. Problems appear under the field that caused them (red border plus message), and a panel lists everything that blocks launch, e.g. *"Ad “Winter Hero Banner” cannot be launched: headline is missing, creative is not uploaded, landing page URL is not a valid http(s) link."* "Fix →" jumps to the item.
5. **Readiness indicator:** campaign cards and every tree row show a green **Ready** or a red **N issues** badge, rolled up from everything below it.
6. **Launch:** the button is disabled while issues remain (tooltip says how many). Launching is simulated and marks the campaign and its non-archived children Active.
7. **Duplicate:** one click on any campaign, ad set or ad. All settings are copied, every child gets a new id, and the copy is named "(Copy)".
8. **Bulk edit:** tick several items of the same level. The bulk bar lets you change one field on all of them: campaigns (objective, budget type), ad sets (budget, gender, start or end date), ads (CTA, headline, primary text, landing URL, swap creative image).
9. **Bulk status:** Pause, Activate or Archive the selection. Status cascades to children. **Activate is blocked for items that still have issues**, with a message saying which one.
10. **Confirmations:** delete, archive and reset ask first.
11. **Creative upload:** choose an image file (validated, resized, previewed) or paste an image URL. A live ad preview sits beside the ad form.

### Validation rules

| Level | Rules |
|---|---|
| Campaign | name, objective and budget type present; at least one ad set |
| Ad set | name; budget greater than zero; start date; end date not before start; **end date required for Lifetime budgets**; age 13–65 and min ≤ max; at least one location; at least one ad |
| Ad | name; headline (max 40 chars); primary text; creative uploaded; CTA; landing URL present and a valid http(s) link; description max 30 chars |

Archived items are excluded from launch checks.

## Edge cases handled

- Corrupted or unreadable saved data: falls back to sample data and shows a warning
- Storage full or blocked: a banner warns that changes will not persist (uploaded images are resized to stay small)
- Non-image, oversized (over 8 MB) or undecodable uploads: clear error toast
- Zero, negative, empty or non-numeric budgets; invalid dates and age ranges
- Bulk edit with an invalid value is rejected before it touches anything
- Activating incomplete items is blocked instead of silently allowed
- Deleting items that are selected or being edited: selection and editor clean up automatically
- Empty states for no campaigns and no selection

## Testing

`npm test` runs 27 tests covering the validation rules, duplication (new ids, correct position, original untouched), bulk update, status cascade, delete, launch and render smoke tests. The features were also exercised end to end in a real browser (create, validation, duplicate, bulk edit, blocked activation, launch, reload persistence, delete), and the screenshots in `screenshots/` come from that run.

## Write-up: UI vs Google Sheets automation (Task 2)

| | This UI | Google Sheets + Apps Script |
|---|---|---|
| **Error feedback** | Instant, inline, next to the field | Only after the script runs, then read from an error log |
| **Hierarchy** | Campaign → Ad set → Ad is the real structure | Flattened into rows; parent values repeated or linked by naming |
| **Guardrails** | Dropdowns, date pickers, number limits, confirmations | Free text in cells, easy to mistype an objective or CTA |
| **Readiness** | Per-item and per-campaign status at a glance | No overview unless built by hand |
| **Duplication and bulk edits** | One click; multi-select then apply | Copy-paste rows, fill-down, find-and-replace |
| **Preview** | Live ad preview | None |
| **Where Sheets wins** | | Fast mass data entry and import, familiar to non-technical teams, easy sharing and version history, no app to host |

**Conclusion:** a spreadsheet is good for entering a lot of data quickly, but it is weak at telling you what is wrong and why. A UI prevents invalid launches in the first place, which is where most wasted time and failed API calls come from. For a real team the best answer is both: this UI for building and checking, a sheet import for bulk loading.

## Ethics and compliance

- All data stays in the browser's localStorage. No analytics, no network calls, no personal data collected.
- The prototype never contacts Meta, so it cannot spend money or publish ads.
- If connected to the real Meta Marketing API later, follow Meta's Platform Terms and Advertising Standards, request only the permissions needed (`ads_management`), keep access tokens on a server (never in front-end code or Git), create campaigns **paused** by default, and respect rate limits.
- Targeting options should comply with Meta's anti-discrimination policy for special ad categories (housing, employment, credit).

## Limitations and next steps

- The Marketing API integration (the bonus) is **not implemented**. It would be a small server (e.g. Node or Flask) that maps the tree to `POST /act_<AD_ACCOUNT_ID>/campaigns`, `/adsets`, `/adcreatives` and `/ads`, creating everything with `status=PAUSED`. Objectives would map to Meta's outcome-based values (e.g. `OUTCOME_SALES`, `OUTCOME_TRAFFIC`); check the current Graph API version in Meta's documentation.
- Creatives are stored as small images in the browser; a real system would upload to Meta (image hash) instead.
- Only one level can be bulk-selected at a time, and there is no undo.
- No user accounts or multi-user editing.

## Submission checklist

```bash
git init
git add .
git commit -m "Task 5: Meta campaign mirroring UI"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Then ZIP the folder **without** `node_modules` and `dist`, and add your own demo video (create a campaign with ad sets and ads, duplicate an ad set, bulk edit ads, show validation errors).
