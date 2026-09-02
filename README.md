# ChaiBuilder Starter

A website builder you host yourself, built with Next.js and Payload CMS.

## Getting started

Two ways in. Both ask the same questions and end at the same place — an admin
account, a database, and a site you can edit at `/admin`.

| | Best for |
| --- | --- |
| [**1. The CLI**](#1-the-cli) | Starting a brand new project on your own machine. |
| [**2. Clone and run `/setup`**](#2-clone-and-run-setup) | Working from this repository, or a site already deployed to a host. |

### 1. The CLI

```bash
npx chaibuilder-app create
```

The CLI walks you through naming the site, creating your login, and connecting a
database, then scaffolds the project and writes a `.env` with everything filled
in. When it finishes:

```bash
pnpm install
pnpm dev
```

Sign in at `http://localhost:3000/admin` and start building.

### 2. Clone and run `/setup`

Use this when you already have the code — either cloned locally, or deployed to
a host. Running it locally:

```bash
git clone https://github.com/chaibuilder/chaibuilder-starter.git my-chai-site
cd my-chai-site
pnpm install
pnpm dev
```

Then open **`http://localhost:3000/setup`** and follow the wizard. Deploying
first instead? Click below, then open `/setup` on the deployed address, for
example `https://my-chai-site.vercel.app/setup`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchaibuilder%2Fchaibuilder-starter&project-name=my-chai-site&repository-name=my-chai-site)

Vercel copies this project to your own GitHub account and puts it online — you do
not need to fill in any settings before running `/setup`.

**The wizard is three steps:**

1. **Your site and login.** The site name, plus the email address and password
   you will use to edit it.
2. **Connect a database.** Free to create; the wizard links to
   [Turso](https://turso.tech) and checks the connection before moving on.
3. **Create.** Optionally add media storage and an AI key — both are collapsed,
   and leaving them closed skips them. The wizard then creates your database
   tables, your account, and your site, and shows you the environment variables
   to copy.

**Then save the settings it prints.** Locally, paste them into `.env` and restart
`pnpm dev`. On Vercel, paste them under **Settings → Environment Variables** and
**redeploy** from the **Deployments** tab. That is it — sign in at `/admin` and
start building.

> **Why the extra redeploy?** The settings include your database password and
> other secrets. They belong in your hosting provider's settings, not in the
> code, and a site only picks up new settings when it is deployed again. You
> only ever have to do this once.

Anything you fill in on the last step ships in that same block, so adding storage
or AI up front costs you no extra deploy. If you skip them, adding them later is
just more environment variables plus a deploy — you never run setup again.
Visiting `/setup` on a configured site shows what is in place and what is
missing.

Setup disables itself once your site is configured, so `/setup` is safe to leave
in place as a status page. To remove it entirely, delete `src/app/(setup)` and
the `/setup` redirect in `src/proxy.ts` — all of the wizard's code lives in those
two places.

Nothing you type into the wizard is stored on the server. It runs on your own
deployment, talks to your own database, and hands the values back to you.

#### Deploying somewhere else

Any host that runs Next.js works — the process is the same. On Netlify, the
settings screen is **Site configuration → Environment variables → Import from a
.env file**, then redeploy.

Requires Node.js 20.9+ and pnpm 9+.

## Environment variables

The CLI and `/setup` generate these for you, but you can also set them by hand. See
[`.env.example`](./.env.example) for the full list with comments.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Where content is stored. A local file, or a `libsql://` address for a hosted database. |
| `DATABASE_AUTH_TOKEN` | For hosted databases | The token that grants access to it. |
| `PAYLOAD_SECRET` | Yes | Signs login sessions. Generate with `openssl rand -hex 32`. |
| `CHAIBUILDER_APP_KEY` | Yes | Identifies your site in the database. |
| `NEXT_PUBLIC_SERVER_URL` | Recommended | Your site's public address, used in sitemaps and share links. |
| `BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Recommended | Object storage for uploads. **Without these, uploaded images are lost on every deploy.** `S3_ENDPOINT` is also needed for Cloudflare R2. |
| `AI_GATEWAY_API_KEY` | Optional | Enables AI-assisted editing through the Vercel AI Gateway. |
| `OPENROUTER_API_KEY` | Optional | Enables AI-assisted editing through [OpenRouter](https://openrouter.ai). Use this *or* `AI_GATEWAY_API_KEY`. |
| `PAYLOAD_ADMIN_ROUTE` | Optional | Serves the admin panel from a custom path. |

Visit `/setup` on a configured site at any time to see which of these are in
place and which are still missing.

## Configuring by hand

If you would rather not use either wizard, copy the example file and fill it in
yourself:

```bash
cp .env.example .env      # then fill in DATABASE_URL and PAYLOAD_SECRET
pnpm install
pnpm dev
```

You still need a `CHAIBUILDER_APP_KEY` for a site record in the database;
`/setup` prints one when it creates the site.

## Media storage

Hosts like Vercel and Netlify do not keep files that your site writes to disk, so
uploads must go to object storage. Cloudflare R2 and Amazon S3 both work:

1. Create a bucket.
2. Create an API token for it with read and write access.
3. Add `BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (plus
   `S3_ENDPOINT` for R2) to your environment variables and redeploy.

## Database migrations

Database tables are created from the migrations in `src/migrations`. `/setup`
applies them when it first prepares an empty database.

They are deliberately **not** applied automatically on every production start:
against a database whose tables came from `PAYLOAD_DB_PUSH`, Payload asks an
interactive "data loss will occur" question that a build or a serverless boot
cannot answer. After upgrading the starter, apply any new migrations yourself:

```bash
pnpm payload migrate           # apply pending migrations
pnpm payload migrate:create    # create one after changing a collection
```

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm test:int` | Run integration tests |
| `pnpm test:e2e` | Run end-to-end tests |

## Documentation

Full documentation is at [chaibuilder.com/docs](https://www.chaibuilder.com/docs).
