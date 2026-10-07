# Cancel Vulture

Cancel Vulture is a subscription audit app with **Vulture Watch**, an evidence-first editorial system for cancellation guides, price alerts, fee warnings, refund policies, free trials, alternatives and consumer education.

The MVP catalog also covers recurring household services: printer plans, home internet, mobile plans, delivery memberships, news, education, cloud storage, security monitoring and other recurring bills. New provider records are region- and plan-aware. Missing facts display as **Not yet verified** instead of being inferred.

Vulture Watch is manual-first. It builds and publishes articles normally without an OpenAI API key. AI discovery and drafting are optional enhancements that can be enabled later without changing the content format or publishing workflow.

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` only if you want optional AI generation. Never commit `.env.local` or API keys.

## Commands

- `npm run build` — production build
- `npm test` — build plus editorial and rendered-page tests
- `npm run editorial:manual -- path/to/article.json` — validate and prepare a hand-written article
- `npm run editorial:validate` — validate article records, official sources and internal links
- `npm run editorial:daily` — optionally discover, research, draft and review up to five topics
- `npm run editorial:alert` — optionally prepare a confirmed time-sensitive price alert

## Manual publishing (recommended now)

1. Copy `content/vulture-watch/manual/article-template.json` to a new descriptive filename.
2. Complete every field. Verify each factual claim against the official source URL and update `lastVerified`.
3. Add a company domain to `editorial/config.mjs` first if it is not already in the official-source registry.
4. Run:

```bash
npm run editorial:manual -- content/vulture-watch/manual/your-article.json
npm run editorial:validate
npm test
```

5. Review the generated article, source ledger and `/vulture-watch/[slug]` page, then commit and publish through the normal review process.

You can also commit a completed manual JSON file and run **Vulture Watch manual article** in GitHub Actions with its repository path. That workflow validates the article, runs the production build and opens a draft pull request. It does not use or require OpenAI.

Manual articles are not assigned a simulated AI quality score. They remain marked for manual review, and official source URLs, extracted claims, duplicate intent and internal-link formats are still validated.

## Optional AI generation

`OPENAI_API_KEY` is optional. When it is absent:

- the site, Vulture Watch dashboard, manual articles, validation and builds continue normally;
- scheduled AI discovery and expedited AI alert drafting exit successfully without generating content;
- no empty editorial pull request is created.

To enable AI later, set the `OPENAI_API_KEY` GitHub Actions secret or local environment variable. `OPENAI_MODEL` is optional and defaults to the model configured in `editorial/config.mjs`. No source-code changes are required.

The daily workflow runs at 10:15 UTC and can also be started manually. With a key configured, it researches up to five distinct topics, validates official sources, performs quality review and opens a draft pull request containing no more than one standard article. Manual approval remains required before merge.

## Analytics

Vulture Watch inherits the sitewide analytics from the root application layout:

- Google Analytics 4: the existing Cancel Vulture measurement ID is reused.
- Microsoft Clarity: the existing Cancel Vulture project ID is reused.

No new tracking properties or IDs are created. Initial page loads and client-side route changes are tracked across the homepage, `/vulture-watch` and article routes. Keep the shared integration in `app/layout.tsx` and `app/analytics.tsx` so new routes inherit it automatically.

## Service catalog and verification

- `/` → **My Subs** contains the expanded catalog and user-local subscription audit.
- `/services/[slug]` shows plan, region, price type, price freshness, cancellation method and official sources.
- `/check-my-area` offers provider-owned availability links and labels all results as likely until a provider confirms the exact address.
- `/admin/verification-queue` surfaces missing regional data, unverified prices, missing official sources and cancellation methods awaiting review.

The schema in `db/schema.ts` defines `provider_plans`, `service_prices`, `cancellation_methods`, source records, regions, billing platforms and verification reports. Hosting currently has no D1 binding, so the catalog seed in `app/catalog.ts` is the active MVP data source. Add a D1 binding and migration before treating the admin queue as a multi-user database workflow.

Freshness targets are 30–60 days for price records and 60–90 days for cancellation methods. A report of a moved cancel button, changed price, new fee or changed phone number should immediately move the record to **Needs Review**.

## Content storage

- `content/vulture-watch/manual/*.json` — hand-written source files and reusable template
- `content/vulture-watch/index.json` — duplicate-detection and publication ledger
- `content/vulture-watch/articles/*.json` — complete article documents
- `content/vulture-watch/sources/*.sources.json` — source URLs, retrieval timestamps and extracted claims
- `app/vulture-watch/generated.ts` — build-safe dashboard and article data
- `.editorial-output/` — temporary run logs and AI draft evaluations; ignored by Git

The dashboard is available at `/vulture-watch`. Article documents render at `/vulture-watch/[slug]` after their pull request is merged and deployed.

## Editorial and repository controls

- Protect the default branch and require build/test checks.
- Require at least one approving review and disable editorial auto-merge during launch.
- Review every cancellation step, price, date, fee and refund statement before publishing.
- Use official company help centers, pricing pages, terms, support documents and announcements.
- Do not publish a second article that answers substantially the same search intent.

Network and API calls retry transient failures. Articles with insufficient evidence receive manual-verification or rejected status. The production build, source validation and duplicate checks run before an editorial pull request is opened.

## Hosting

The project is linked to OpenAI Sites through `.openai/hosting.json`. Runtime secrets belong in GitHub Actions or the hosting platform, never in source control.
