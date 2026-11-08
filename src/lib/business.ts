import type { ImageMetadata } from 'astro';
import business from '../data/business.json';
import gallery from '../data/gallery.json';

export const biz = business;
export type Business = typeof business;

export const fullAddress = `${biz.address.street}, ${biz.address.city}, ${biz.address.state} ${biz.address.zip}`;

/** "$125" or "$5.50/lb". A null price returns the note (for example "Ask for pricing"). */
export function formatPrice(price: number | null | undefined, perLb = false, note?: string): string {
  if (price === null || price === undefined) return note ?? 'Call';
  const hasCents = Math.round(price * 100) % 100 !== 0 || perLb;
  const amount = hasCents ? price.toFixed(2) : String(price);
  return `$${amount}${perLb ? '/lb' : ''}`;
}

/** "09:00" -> "9 AM", "21:00" -> "9 PM", "13:30" -> "1:30 PM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

/** Text for the seasonal banner, based on season.status in business.json. */
export function seasonBanner(): string {
  const s = biz.season;
  const map = s.banner as Record<string, string>;
  return map[s.status] ?? map.open;
}

/** The current or next season window, used for structured data. */
export function seasonWindow(now = new Date()) {
  const [sm, sd] = biz.hours.seasonStart.split('-').map(Number);
  const [em, ed] = biz.hours.seasonEnd.split('-').map(Number);
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  // Season crosses New Year (Oct -> Jan).
  const startYear = month <= em ? y - 1 : y;
  const start = `${startYear}-${String(sm).padStart(2, '0')}-${String(sd).padStart(2, '0')}`;
  const end = `${startYear + 1}-${String(em).padStart(2, '0')}-${String(ed).padStart(2, '0')}`;
  return { start, end };
}

/* ---------------- Gallery ---------------- */

const imageModules = import.meta.glob<{ default: ImageMetadata }>('../assets/gallery/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}', {
  eager: true,
});

export type Photo = { file: string; alt: string; category: string; src: ImageMetadata };

export const categories: { key: string; title: string; blurb: string }[] = [
  { key: 'harvest', title: 'On the Deck', blurb: 'Hunters and their harvest: whitetail, mule deer, elk, exotics and hogs.' },
  { key: 'sausage', title: 'Smokehouse', blurb: 'Sausage, jerky and snack sticks smoked right here at the plant.' },
  { key: 'cuts', title: 'Cut & Wrapped', blurb: 'Steaks, roasts and grind, cut to your ticket and vacuum sealed.' },
  { key: 'euros', title: 'European Mounts', blurb: 'Euros of all kinds, cleaned and whitened in-house.' },
  { key: 'shop', title: 'The Shop', blurb: 'Caps, koozies, tumblers and a look around the plant.' },
  { key: 'crew', title: 'The Crew', blurb: 'The family and crew who make every season happen.' },
];

export const photos: Photo[] = gallery
  .map((g) => {
    const mod = imageModules[`../assets/gallery/${g.file}`];
    if (!mod) {
      console.warn(`[gallery] ${g.file} is listed in gallery.json but missing from src/assets/gallery`);
      return null;
    }
    return { ...g, src: mod.default };
  })
  .filter((p): p is Photo => p !== null);

// Photos dropped into the folder but not yet listed in gallery.json still show up, with a generic alt text.
for (const [path, mod] of Object.entries(imageModules)) {
  const file = path.split('/').pop()!;
  if (!gallery.some((g) => g.file === file)) {
    photos.push({ file, alt: 'Photo from Rust Deer Plant in Cisco, Texas', category: 'harvest', src: mod.default });
  }
}

export function photo(file: string): Photo {
  const p = photos.find((x) => x.file === file);
  if (!p) throw new Error(`Photo not found: ${file}. Check src/assets/gallery and src/data/gallery.json.`);
  return p;
}

/* ---------------- Structured data ---------------- */

export function localBusinessJsonLd() {
  const { start, end } = seasonWindow();
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${biz.siteUrl}/#business`,
    name: biz.name,
    alternateName: 'Rust Deer Plant Wild Game Processing',
    description:
      'Family-owned deer and wild game processing in Cisco, Texas. Whitetail, mule deer, elk, hogs and exotics, smoked specialty sausage and jerky, and European mounts.',
    slogan: biz.tagline,
    url: `${biz.siteUrl}/`,
    telephone: biz.phone.tel,
    email: biz.email,
    priceRange: '$',
    image: `${biz.siteUrl}/og-image.jpg`,
    logo: `${biz.siteUrl}/icons/icon-512.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: biz.address.street,
      addressLocality: biz.address.city,
      addressRegion: biz.address.state,
      postalCode: biz.address.zip,
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: biz.geo.lat, longitude: biz.geo.lng },
    hasMap: biz.mapsUrl,
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Eastland County, Texas' },
      ...biz.serviceArea.map((c) => ({ '@type': 'City', name: `${c}, Texas` })),
      { '@type': 'State', name: 'Texas' },
      { '@type': 'State', name: 'New Mexico' },
      { '@type': 'State', name: 'Arizona' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: biz.hours.days.map((d) => d.day),
        opens: biz.hours.days[0].open,
        closes: biz.hours.days[0].close,
        validFrom: start,
        validThrough: end,
      },
    ],
    paymentAccepted: biz.payment.methods.join(', '),
    currenciesAccepted: 'USD',
    sameAs: [biz.social.facebook, biz.social.instagram, biz.social.tiktok],
    founder: biz.owners,
    knowsAbout: ['Deer processing', 'Wild game processing', 'Hog processing', 'European skull mounts', 'Smoked venison sausage', 'Venison jerky'],
  };
}
