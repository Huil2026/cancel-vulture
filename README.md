# Cancel Vulture

Cancel Vulture is a mobile-first subscription audit app. It helps users select recurring services, understand their long-term cost, rate how often they use them, prioritize possible cancellations, and track projected savings.

This folder is a complete local-source copy of the currently published Site. The application stores subscription selections and progress in the browser's local storage. It does not require a bank connection or a database for the current feature set.

## Included

- Next.js App Router application source
- TypeScript and Tailwind CSS styling
- Responsive desktop and mobile navigation
- Progressive Web App manifest and service worker
- Current seed catalog of 20 subscriptions
- Subscription cost, usage, cancellation-priority, and savings flows
- Current brand artwork and social-sharing image
- Cloudflare/vinext worker configuration
- Existing OpenAI Sites project linkage in `.openai/hosting.json`

## Requirements

- Node.js 22.13 or newer
- npm 10 or newer

## Local setup

1. Open a terminal in this folder.
2. Install dependencies:

   ```bash
   npm ci
   ```

3. Optionally copy `.env.example` to `.env.local`. The current app does not require an environment variable to run.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed in the terminal.

## Production build

```bash
npm run build
npm run start
```

## Quality checks

```bash
npm run lint
npm test
```

The test command creates a production build and performs a small rendered-output smoke test.

## Project structure

```text
app/                 Routes, UI, styles, layout, and service-worker registration
public/              Brand images, social card, manifest, icons, and service worker
build/               OpenAI Sites Vite integration
db/                  Optional database entry point and intentionally empty schema
drizzle/             Migration metadata
worker/              Cloudflare Worker entry point
tests/               Production-render smoke test
.openai/hosting.json Existing OpenAI Sites project link and logical bindings
```

The current subscription seed catalog lives in `app/page.tsx` as `seedSubscriptions`.

## Environment variables

No secret or required runtime variables are used by the current app. `.env.example` contains only an optional public site URL variable with an empty value.

Never commit `.env`, `.env.local`, credentials, API keys, access tokens, or passwords.

## Hosting linkage

`.openai/hosting.json` contains the non-secret project identifier for the existing hosted Cancel Vulture Site. Keeping it allows supported OpenAI Sites tooling to recognize the linked project. Local development does not depend on it beyond the bundled hosting configuration.

Do not create a new Site or redeploy unless you intentionally want to publish a new version.

## Data and trust notes

- Prices and savings are estimates and may vary by plan, tax, currency, and region.
- Cancellation flows change; the included guide UI uses clearly labelled templates and does not claim unverified provider-specific steps.
- Cancel Vulture is not financial advice.

