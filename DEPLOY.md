# Deploying ciscorustdeerplant.com

The site is static HTML built by Astro and hosted on **Cloudflare Pages**. GitHub Actions builds it and deploys it with Wrangler, using two repository secrets. There is no Cloudflare GitHub app connection, so the setup keeps working after the repo moves to the family's GitHub account.

```
push to main ─► GitHub Actions (.github/workflows/deploy.yml)
                 npm ci → npm run build → wrangler pages deploy dist
                                              │
                                              ▼
                      Cloudflare Pages project "ciscorustdeerplant"
                      + Pages Function /api/contact (functions/api/contact.ts)
```

Pushes to `main` go live. Pull requests get their own preview URL.

---

## 1. Add the domain to Cloudflare

Do this in the **ciscorustdeerplant** Cloudflare account.

1. Sign in at <https://dash.cloudflare.com>.
2. **Add a domain** → enter `ciscorustdeerplant.com` → pick the **Free** plan.
3. Cloudflare scans the existing DNS records. Delete any old `A`/`CNAME` records for `@` and `www` that point at a parking page or another host. Pages adds the right records in step 3.
4. Cloudflare shows two nameservers, for example `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`. Copy them.

## 2. Point the registrar at Cloudflare

1. Sign in wherever `ciscorustdeerplant.com` was bought (GoDaddy, Namecheap, Squarespace, etc).
2. Find **Nameservers** for the domain and change them from the registrar's defaults to the two Cloudflare nameservers from step 1.4.
3. If DNSSEC is on at the registrar, turn it off first. You can turn it on again later from Cloudflare (**DNS → Settings → DNSSEC**).
4. Wait for Cloudflare to email that the domain is **Active**. This usually takes under an hour but can take up to 24.

## 3. Create the Pages project

The first deploy creates the project automatically, but creating it by hand lets you add the domains before the first push.

1. **Workers & Pages → Create → Pages → Use direct upload**.
2. Project name: **`ciscorustdeerplant`** (it must match `wrangler.toml` and the workflow).
3. Production branch: **`main`**.
4. Upload any small placeholder folder, or skip and let GitHub Actions do the first deploy.

### Custom domains

1. Open the project → **Custom domains → Set up a custom domain**.
2. Add **`ciscorustdeerplant.com`**. Cloudflare creates the DNS record and the certificate.
3. Add **`www.ciscorustdeerplant.com`** the same way.

### Redirect www to the apex

1. In the **ciscorustdeerplant.com** zone: **Rules → Redirect Rules → Create rule**.
2. Use the template **"Redirect from WWW to root"**, or set it up by hand:
   - If **Hostname equals** `www.ciscorustdeerplant.com`
   - Then **Dynamic redirect** to `concat("https://ciscorustdeerplant.com", http.request.uri.path)`, status **301**, **preserve query string** on.
3. Save. Test by opening `https://www.ciscorustdeerplant.com/services/`. It should land on `https://ciscorustdeerplant.com/services/`.

Also in the zone: **SSL/TLS → Overview → Full (strict)**, and **SSL/TLS → Edge Certificates → Always Use HTTPS: On**.

## 4. Create the API token (minimum permissions)

1. Profile icon → **My Profile → API Tokens → Create Token → Create Custom Token**.
2. Name: `github-actions-ciscorustdeerplant`.
3. Permissions, exactly one row:
   - **Account → Cloudflare Pages → Edit**
4. Account Resources: **Include → the ciscorustdeerplant account** only.
5. Leave Zone Resources empty. Optionally set an expiry date and put a calendar reminder to renew it.
6. **Continue to summary → Create Token**. Copy the token now; Cloudflare only shows it once.
7. Copy the **Account ID** too: **Workers & Pages** overview, right-hand column (or the URL `dash.cloudflare.com/<account-id>/...`).

## 5. Add the secrets to GitHub

In the repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from step 4 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 4 |

Then **Actions → Deploy to Cloudflare Pages → Run workflow** (or push to `main`). The first build takes about 3 minutes because it optimizes every photo; later builds reuse a cache.

## 6. Contact form email

The form posts to `/api/contact`, a Cloudflare Pages Function (`functions/api/contact.ts`). It sends mail through [Resend](https://resend.com). Until a key is set, the form tells visitors to call the plant instead, so nothing breaks.

1. Create a free Resend account and **add the domain `ciscorustdeerplant.com`**.
2. Resend lists DNS records (SPF, DKIM and an MX for the return path). Add each one in **Cloudflare → DNS → Records** exactly as shown, with the proxy **off** (gray cloud). Wait until Resend shows the domain as **Verified**.
3. Resend → **API Keys → Create API key**, permission **Sending access**, domain `ciscorustdeerplant.com`.
4. Cloudflare → **Workers & Pages → ciscorustdeerplant → Settings → Variables and Secrets**, for **Production** (and Preview if you want previews to send too):
   - `RESEND_API_KEY` → **Type: Secret** → the Resend key
5. `CONTACT_TO` and `CONTACT_FROM` are already set in `wrangler.toml`:
   - `CONTACT_TO = "contact@ciscorustdeerplant.com"`
   - `CONTACT_FROM = "Rust Deer Plant Website <website@ciscorustdeerplant.com>"`

   To change where messages go, edit `wrangler.toml` and push. Separate several addresses with commas.
6. Redeploy (re-run the workflow) so the function picks up the secret, then send a test message from `/contact/`.

> **Mailbox for contact@ciscorustdeerplant.com:** that address has to actually receive mail. The simplest free option is **Cloudflare → Email → Email Routing**: create `contact@` and forward it to `rustdeerplant@yahoo.com` (or any inbox the family checks). Email Routing and Resend can both be on the same domain.

Never put the Resend key in the code, in `wrangler.toml`, or in GitHub.

To use another provider (Postmark, Mailgun, SendGrid), only the `fetch(...)` call in `functions/api/contact.ts` changes; keep the key in a Cloudflare secret the same way.

## 7. Moving the repo to the family's GitHub account

1. Current owner: repo **Settings → General → Danger Zone → Transfer ownership** → the family's GitHub username or organization. They accept the transfer from the email GitHub sends.
2. **Repository secrets do not transfer.** In the new location, re-add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (step 5). Creating a fresh token under the family's Cloudflare login is a good idea, then delete the old one.
3. Make sure **Settings → Actions → General → Allow all actions** is on in the new account.
4. Re-run **Actions → Deploy to Cloudflare Pages** once to confirm it works.
5. Nothing changes on the Cloudflare side: the project name and domains stay the same. If anyone has the repo cloned, they run `git remote set-url origin https://github.com/<new-owner>/ciscorustdeerplant.git` (GitHub also redirects the old URL).

## 8. After the site is live

- [ ] **Facebook:** Page → Edit details → **Website** → `https://ciscorustdeerplant.com`. This replaces the fake link the hacker added.
- [ ] **Google Business Profile:** <https://business.google.com> → Edit profile → **Website** → `https://ciscorustdeerplant.com`.
- [ ] Instagram and TikTok bios: add the link.
- [ ] Google Search Console: add the domain property (DNS verification works through Cloudflare) and submit `https://ciscorustdeerplant.com/sitemap-index.xml`.
- [ ] Send a test message through the contact form and confirm it arrives.
- [ ] Check that the map pin lands on the right building. If not, update `geo` in `src/data/business.json`.
