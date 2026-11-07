# ciscorustdeerplant.com

The official website of **Rust Deer Plant**, wild game processing at 8913 Highway 6, Cisco, Texas.

This guide is for the family. You can make every common change on the GitHub website, without installing anything. When you save ("commit") a change to the `main` branch, the site rebuilds and goes live in about 3 minutes on its own.

> **How to edit a file on GitHub:** open the file in the repo, click the pencil icon (✏️ "Edit this file"), make the change, then click **Commit changes…** → **Commit changes**. To check that it worked, open the **Actions** tab: a green check means it's live; a red ✗ usually means a missing comma or quote (see "If something breaks" below).

Almost everything lives in one file: **`src/data/business.json`**.

---

## Change the hours

In `src/data/business.json`, find `"hours"`.

- Each day has an `open` and `close` time in 24-hour format: `"09:00"` is 9 AM and `"21:00"` is 9 PM.

  ```json
  { "day": "Saturday", "open": "09:00", "close": "21:00" },
  ```

- `"summary"` is the short version shown in several places: `"9 AM to 9 PM, seven days a week"`.
- `"seasonNote"`, `"holidayClosures"`, `"holidayNote"` and `"offSeason"` are the sentences under the hours table.

## Change prices

In `src/data/business.json`, find `"pricing"`. Every section of the price guide is there (Basic Processing, Hog Processing, Fees & Euros, Link Sausage, and so on).

- Change the number after `"price":`. Write just the number, with no `$`:

  ```json
  { "item": "Whitetail", "price": 125 },
  { "item": "Jalapeño Cheese", "price": 5.5, "perLb": true },
  ```

- `"perLb": true` adds `/lb` after the price.
- `"price": null` with a `"note"` shows the note instead of a price, for example `"Ask for pricing"`.
- To add an item, copy a whole line, including the `{ }` and the comma, and change it.
- `"updated"` (for example `"2026 season"`) shows at the top of the price page. Update it each year.

## Change the season banner

The orange strip at the top of every page. In `src/data/business.json`, find `"season"`:

```json
"status": "open",
```

Set `status` to one of:

| `status` | Banner shows |
|---|---|
| `"open"` | the `banner.open` text, in orange. The home page also shows "Open now / Closed now" based on the hours. |
| `"closing"` | the `banner.closing` text (pickup-only weeks) |
| `"closed"` | the `banner.closed` text, in gray (off-season) |

Edit the three `banner` sentences to say whatever you like. Set `"lastPickupDate"` (for example `"January 31, 2027"`) and it appears on the Drop-Off Guide.

## Change sausage flavors

There are two places:

1. **Prices:** `"pricing"` → `"linkSausage"`, `"summerSausage"`, `"moreSpecialties"`.
2. **Descriptions** (the flavor tags on the home page and the "What to put on your cut ticket" section): `"flavors"` → `"linkSausage"`, `"summerSausage"`, `"jerky"`, `"snackSticks"`.

```json
{ "name": "Hot Link", "description": "The 2025 flavor-poll winner. Bring the heat." },
```

To add a new flavor, add it in both places. To mark something new, add `"badge": "New"` to its price line.

## Add or change gallery photos

1. Use a clear, landscape or portrait JPG. Phone photos are fine; the site makes the smaller web versions automatically.
2. Give the file a short descriptive name with dashes, like `big-axis-buck-2026.jpg`.
3. In GitHub, open the folder **`src/assets/gallery`** → **Add file → Upload files** → drop the photo in → **Commit changes**.
4. Then open **`src/data/gallery.json`** and add an entry so the photo gets the right section and a description for people using screen readers:

   ```json
   {
     "file": "big-axis-buck-2026.jpg",
     "category": "harvest",
     "alt": "Hunter kneeling beside a big axis buck on the drop-off deck"
   },
   ```

   `category` is one of `harvest` (On the Deck), `sausage` (Smokehouse), `cuts` (Cut & Wrapped), `euros` (European Mounts), `shop` (The Shop), or `crew` (The Crew). For `alt`, describe what is in the photo in one sentence.

   If you skip step 4, the photo still shows up under "On the Deck" with a generic description.

- **To remove a photo:** delete it from `src/assets/gallery` and delete its entry in `gallery.json`.
- **Please don't post photos of kids** unless their parents are fine with it being on the website.

## Other things in business.json

| What | Where |
|---|---|
| Phone numbers, email, address | `phone`, `phoneAlt`, `email`, `address` |
| Facebook / Instagram / TikTok links | `social` |
| Military discount, First Harvest Club | `discounts`, `firstHarvest` |
| Payment rules, freezer rent | `payment`, `pickup` |
| Merch list and prices | `merch` (set `"show": false` to hide it) |
| Saturday sausage sales note | `saturdaySales` |
| FAQ on the Drop-Off Guide | `faq` |
| Reviews | `reviews` (first name and last initial only) |
| Map pin | `geo` (latitude and longitude) |

## If something breaks

The most common mistake is a missing or extra comma or quote in a `.json` file. GitHub's **Actions** tab shows a red ✗ and the site stays on the last working version, so nothing goes down. Open the failed run to see the line number, fix it, and commit again. To undo a change completely, open the file's **History**, find the last good version, and copy it back.

---

## For developers

- [Astro](https://astro.build) 7, TypeScript, Tailwind CSS 4. Static output. Fonts are self-hosted through Astro's font API (Anton, Barlow, Barlow Condensed, Kaushan Script); there are no Google Fonts calls and no tracking scripts.
- `npm install`, then `npm run dev` (local server), `npm run build` (type-check + build to `dist/`), `npm run preview`.
- Pages are in `src/pages`, shared pieces in `src/components`, and the design tokens in `src/styles/global.css`.
- Contact form: `functions/api/contact.ts` (Cloudflare Pages Function, Resend). See [DEPLOY.md](DEPLOY.md).
- Brand assets: `node scripts/make-brand-assets.mjs` regenerates the favicons and the share image from `src/assets/antler-mark.svg`.
- Hosting, domains, secrets and transferring the repo: [DEPLOY.md](DEPLOY.md).
- The raw Facebook export (`facebook-export/`) is kept out of git. The content inventory is in [docs/content-inventory.md](docs/content-inventory.md).
