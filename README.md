# AutoMate — Web

The four Next.js frontends for AutoMate / FixMyRide, plus the shared packages they
depend on. Deployed as **four separate Vercel projects** from this one repository.

```
apps/web/landing    role selection / entry point
apps/web/user       customer app
apps/web/mechanic   mechanic app
apps/web/admin      admin console
packages/shared-*   api client, types, utils, brand tokens
```

## Why the shared packages are here

Every app depends on `@automate/shared-api`, `@automate/shared-types`,
`@automate/shared-utils` or `@automate/shared-brand`. These are **workspace packages,
not published to npm** — without them in the repo, `npm install` fails with
`404 Not Found - @automate/shared-api@1.0.0`. They must ship alongside the apps.

## Local development

```bash
npm install        # from the repo root — installs all workspaces
npm run dev        # all four apps in parallel
```

| App | Port |
|---|---|
| landing | 3000 |
| user | 3001 |
| mechanic | 3002 |
| admin | 3003 |

Copy the relevant block from `.env.example` into `apps/web/<app>/.env.local`.
The apps expect the backend at `http://localhost:4000` (see the backend repo).

## Deploying to Vercel

Create **four** projects from this repo. They differ only by root directory:

| Project | Root Directory | Required env |
|---|---|---|
| landing | `apps/web/landing` | `NEXT_PUBLIC_*_APP_URL` |
| user | `apps/web/user` | `NEXT_PUBLIC_USER_API`, `NEXT_PUBLIC_LANDING_URL` |
| mechanic | `apps/web/mechanic` | `NEXT_PUBLIC_MECHANIC_API`, `NEXT_PUBLIC_LANDING_URL` |
| admin | `apps/web/admin` | `NEXT_PUBLIC_ADMIN_API`, `NEXT_PUBLIC_LANDING_URL` |

Leave Install Command empty — Vercel detects the npm workspace and installs from the
repo root, which is what makes the shared packages resolve. Do **not** add an
`.npmrc` with `workspaces=false` to an app directory; it breaks that resolution.

`NEXT_PUBLIC_*` values are inlined at build time, so changing one needs a redeploy.
