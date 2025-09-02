## AWS Amplify Vue.js Starter Template

This repository provides a starter template for creating applications using Vue.js and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

This template equips you with a foundational Vue application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/vue/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## University-specific Onboarding (QR/Social + Theming)

This app supports per‑university onboarding with:
- Branded landing pages (logo, colors)
- A shared onboarding flow (same steps for all schools)
- A per‑school sports list shown in SportSelection
- Optional invite code gating for beta cohorts (via `?code=`)

### Link formats (QR and social)
Create and share links using the university slug:
- Landing page: `https://<your-domain>/join/<uniSlug>?code=ABCD1234`
  - Example: `https://app.example.com/join/ucsd?code=ABCD1234`

Users can scan a QR or click the link—both land on a branded page and then start onboarding.

### Files and structure
- Branding and sports catalog
  - `src/config/universities.ts` — A single source of truth for each university’s:
    - `slug`, `name`, `logo`, `colors.primary`, `colors.secondary`, optional `colors.backgroundOverlay`
    - `sports`: an array of sport names for that school
- Theme helper
  - `src/services/universityTheme.ts` — Reads a university config by slug and applies CSS variables:
    - `--primary-color`, `--secondary-color`, `--background-overlay` (used throughout onboarding UI)
- Landing + wizard
  - `src/views/OnboardingLanding.vue` — Branded entry page (reads `:uniSlug` and optional `?code=`).
  - `src/views/OnboardingWizard.vue` — Wraps the step components in a shared, branded layout.
  - `src/components/onboarding/OnboardingLayout.vue` — Minimal layout used across onboarding steps.
- Router
  - Add routes:
    - `/join/:uniSlug` → OnboardingLanding
    - `/onboarding/:uniSlug` → OnboardingWizard (renders your step components as children)

### Sport selection (per school)
`src/components/onboarding/SportSelection.vue` reads the sports list from the university config (instead of a hard‑coded array) and displays only the sports for the active `uniSlug`.

### Adding a new university (one-time setup per school)
1) Add a logo under `public/images/` (SVG or PNG).
2) Add an entry to `src/config/universities.ts`:
```ts
export const UNIVERSITIES = {
  ucsd: {
    slug: 'ucsd',
    name: 'UC San Diego',
    logo: '/images/ucsd-trident.svg',
    colors: { primary: '#182B49', secondary: '#FFCD00', backgroundOverlay: 'rgba(24,43,73,0.85)' },
    sports: ['Baseball', "Basketball (Men's)", "Basketball (Women's)", "Soccer (Men's)", "Soccer (Women's)", 'Softball']
  },
  // sfsu, ucla, etc...
};
```
3) Share the link: `https://app.example.com/join/ucsd?code=ABCD1234` and print the same URL as a QR code.

### Environment variables
Create `/.env.local` with:
```
VITE_PREFS_API_URL=https://<your-api-gateway-domain>
```
Restart the dev server after adding or changing `.env.local`.

### Optional: Beta gating (invite codes)
If you’re running a closed beta, add `?code=ABCD1234` to the link. The landing page should store this code in `localStorage` so it can be submitted with preferences to attribute onboarding to a cohort.