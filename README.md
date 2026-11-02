# rpisani.dev

Personal site for Roman Pisani: homepage, markdown blog, a feed of photo/video/text posts, a photo & video gallery, comments, and an admin dashboard for writing, uploading, and site stats.

Built with Next.js (App Router) on Vercel. The look is the [Minimal Light](https://github.com/yaoyao-liu/minimal-light) Jekyll theme, carried over unchanged.

## How it fits together

| Piece | Where | Cost |
| --- | --- | --- |
| Site and admin | Next.js on Vercel (Hobby) | Free |
| Posts, comments, stats | Postgres on Neon, via the Vercel Marketplace | Free tier (0.5 GB) |
| Photos and videos | Cloudflare R2, served from `media.rpisani.dev` | 10 GB free, then $0.015/GB-month; no bandwidth fees |
| Bike-weather cron | Python functions in `api/` (unchanged) | Free |

```
app/(site)/        public pages: /, /blog/, /posts/<slug>/, /feed/, /feed/<id>/, /gallery/
app/admin/         admin: dashboard, posts, blog, media, comments (password protected)
app/actions/       Server Actions: saving, uploads, comments, page-view tracking
components/        page pieces; components/admin/ for the dashboard
db/                Drizzle schema and SQL migrations
lib/               data access, markdown, storage (R2), auth, stats, browser upload pipeline
styles/            the theme's original CSS, plus site.scss (feed, gallery) and admin.scss
content/blog/      the original markdown posts, imported into the database on first deploy
api/, automation/  bike-weather reminder (Python, Vercel Cron)
```

**Feed vs. blog.** Blog posts are long-form markdown at `/posts/<slug>/`. Feed posts are short: text, up to 20 photos/videos, or any mix, shown newest first at `/feed/`, with a page per post for comments. `/gallery/` shows every photo and video from published feed posts as a grid with a full-screen viewer.

**Uploads.** The browser does the heavy lifting: it resizes photos to a 2048px web copy and a 640px thumbnail (re-encoding strips EXIF/GPS), grabs a poster frame from videos, checks videos are 20 minutes or less, blanks the GPS location phones write into MP4/MOV files, then uploads straight to R2 in parallel 16 MB chunks with retries. Large videos never pass through Vercel. Photo originals are kept under a private, unguessable path as a backup.

**Videos** are served as uploaded, with no transcoding. H.264 MP4 plays everywhere; iPhone HEVC `.mov` files play in Safari and most Chrome installs, and the uploader warns if your own browser can't play a file. If you later want YouTube-style adaptive quality, Cloudflare Stream (about $5 per 1,000 minutes stored) is the upgrade path.

**Stats** are first-party and cookie-free: one row per page view, with visitors counted by a daily-rotating hash (no raw IPs stored, no consent banner needed). Your own visits aren't counted while you're signed in.

**Comments** need a name and text, no account. Spam is filtered with a hidden honeypot field, a minimum fill time, and a per-visitor rate limit. You can hide or delete any comment from the admin.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no database or R2 settings, development uses an embedded Postgres in `.data/pglite` (migrated and seeded with the blog posts automatically) and stores uploads in `.data/uploads`. Delete `.data/` to start over.

The admin is at http://localhost:3000/admin/. The local password is `ADMIN_PASSWORD` in `.env.local` (gitignored). See `.env.example` for every setting.

Other commands: `npm run build`, `npm run typecheck`, `npm run db:generate` (after editing `db/schema.ts`), `npm run hash-password -- 'password'`.

## Deploying

The repo is already linked to the `rpisani` Vercel project, and `vercel.json` overrides the old Jekyll settings (framework, install, build, and output), so nothing needs changing under Build & Development Settings. What's left is creating the database and media bucket and adding their settings. Do steps 1 to 5 before merging to `main`: production builds will fail without a database.

### 1. Move DNS for rpisani.dev to Cloudflare (free, about 15 minutes)

R2 can only serve a bucket from your own domain if that domain's DNS is on Cloudflare. Today it's on Namecheap's nameservers.

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com) and choose **Add a domain**: `rpisani.dev`, Free plan. Cloudflare imports your existing records.
2. On the DNS records page, check that the records pointing at Vercel are there (the `A` record for `rpisani.dev` → `216.198.79.1`, and `www` if you use it). Set each Vercel record to **DNS only** (grey cloud). Vercel issues its own certificates, and proxying through Cloudflare on top can break them.
3. Keep any email records (MX/TXT) Cloudflare imported, and delete any record you don't recognise. If you use Namecheap's email forwarding, it stops working once Namecheap no longer runs the DNS. Recreate the forwards in Cloudflare's free **Email Routing** after the move.
4. In Namecheap: **Domain List → Manage** next to rpisani.dev → the **Domain** tab (not Advanced DNS) → the **Nameservers** row. Change "Namecheap BasicDNS" to **Custom DNS**, enter the two nameservers Cloudflare gives you, and click the green checkmark. Ignore "Personal DNS Server" at the bottom of Advanced DNS; that is for hosting your own nameservers.
5. Wait for Cloudflare to email that the domain is active (often minutes, up to a day). The site keeps working throughout.

> In a hurry? You can skip this step and use the bucket's `r2.dev` URL (step 2.3) for now. Cloudflare rate-limits `r2.dev` and doesn't cache it, so switch to the custom domain before posting much.

### 2. Create the R2 bucket

1. In Cloudflare, open **R2 Object Storage**. Enabling R2 asks for a payment method even on the free tier; you aren't charged under 10 GB.
2. **Create bucket** → name `rpisani-media`, location Automatic.
3. Bucket → **Settings → Custom Domains → Connect Domain** → `media.rpisani.dev`. (Or, if you skipped step 1: **Public Development URL → Allow**, and copy the `https://pub-….r2.dev` URL.)
4. Bucket → **Settings → CORS Policy → Edit**, paste:

   ```json
   [
     {
       "AllowedOrigins": ["https://rpisani.dev", "https://www.rpisani.dev", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   `ExposeHeaders: ETag` is required for large video uploads. To upload from a Vercel preview deployment, add its URL to `AllowedOrigins`.
5. Back on the R2 overview: **Manage API tokens → Create API token**. Permission: **Object Read & Write**, applied to **`rpisani-media` only**. Copy the **Access Key ID**, **Secret Access Key**, and your **Account ID** (shown on the R2 overview page). The secret is shown once.

### 3. Create the database

1. Vercel dashboard → `rpisani` project → **Storage → Create Database → Neon** (Serverless Postgres) → Free plan, region `Washington, D.C., USA (iad1)` to sit next to Vercel's default functions.
2. Connect it to the `rpisani` project for **Production** and **Preview**. This adds `DATABASE_URL` and related variables automatically.

### 4. Make the admin password and session secret

Run these locally:

```bash
npm run hash-password -- 'choose-a-long-password-here'
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The first prints the `ADMIN_PASSWORD_HASH` value (keep the password itself in your password manager). The second prints a `SESSION_SECRET`.

### 5. Add the environment variables to Vercel

In the dashboard (**Settings → Environment Variables**), add each of these for **Production and Preview**, marked Sensitive:

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD_HASH` | output of `npm run hash-password` |
| `SESSION_SECRET` | the random string from step 4 |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | from the R2 API token |
| `R2_SECRET_ACCESS_KEY` | from the R2 API token |
| `R2_BUCKET` | `rpisani-media` |
| `MEDIA_PUBLIC_URL` | `https://media.rpisani.dev` (or the `r2.dev` URL) |

Or from this folder with the CLI, one at a time (it prompts for the value):

```bash
vercel env add ADMIN_PASSWORD_HASH production --sensitive
```

The existing bike-weather variables stay as they are.

### 6. Deploy

Merge the `nextjs-migration` branch into `main` (or run `vercel --prod`). The build runs `npm run db:migrate`, which creates the tables and imports the three posts from `content/blog/` once. Look for `Imported 3 legacy blog posts` in the build log.

### 7. Check it

1. https://rpisani.dev looks as before, with the new About Me, Feed and Gallery links, and Drip Screen Time as the only project.
2. https://rpisani.dev/admin/ → sign in.
3. **Posts → New post**, add a photo, **Save draft**, then **Preview**. The image URL should start with `https://media.rpisani.dev/`. Delete the test post.
4. **Blog**: “How to Talk to Anyone” is waiting as a draft. Finish it and press **Publish**; it gets dated the day you publish unless you set a date.
5. Vercel → **Settings → Cron Jobs** still lists the four bike-weather jobs.
6. After some visits, the admin **Dashboard** shows views, top pages, referrers, and countries.

## Writing

- **Feed post**: Admin → Posts → New post. Text is optional if there's media and vice versa. Drag tiles to reorder (the first is the cover), add alt text under each, and leave the date empty to use the publish time. Save draft or Publish; ⌘S saves.
- **Blog post**: Admin → Blog → New blog post. Markdown with HTML allowed, a live preview that uses the real post styles, toolbar buttons for formatting, uploads (inserted at the cursor), and footnotes in the style of the existing posts. Kramdown attributes like `{: .side-note #note-1}` still work.
- **Media**: Admin → Media lists every upload, where it's used, and its size. **Unused** finds uploads no post uses (for example from a discarded draft) so you can delete them from storage.
- Unpublishing moves a post back to drafts; drafts are only visible to you, with a banner, at their normal URL.
