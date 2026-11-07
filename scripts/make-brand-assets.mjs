// Generates favicons, app icons and the Open Graph share image from the antler mark and a gallery photo.
// Run with: node scripts/make-brand-assets.mjs   (only needed if the logo or share photo changes)
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const mark = readFileSync('src/assets/antler-mark.svg', 'utf8').match(/d="([^"]+)"/)[1];
const ink = '#12100e';
const blaze = '#f26b1d';

// Square icon: orange mark on near-black tile. vb = mark viewBox (748 x 756.2).
const icon = (size, pad = 0.2, radius = 0.18) => {
  const inner = size * (1 - pad * 2);
  const scale = inner / 756.2;
  const tx = (size - 748 * scale) / 2;
  const ty = (size - 756.2 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${ink}"/>
  <path transform="translate(${tx} ${ty}) scale(${scale})" fill="${blaze}" fill-rule="evenodd" d="${mark}"/></svg>`;
};

writeFileSync('public/favicon.svg', icon(64, 0.16, 0.2));
await sharp(Buffer.from(icon(32, 0.12, 0.2))).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(icon(180, 0.18, 0))).png().toFile('public/icons/apple-touch-icon.png');
await sharp(Buffer.from(icon(192, 0.2, 0))).png().toFile('public/icons/icon-192.png');
await sharp(Buffer.from(icon(512, 0.2, 0))).png().toFile('public/icons/icon-512.png');

// Open Graph image, 1200 x 630: hero photo, dark gradient, big orange mark. No text so it never depends on system fonts.
const W = 1200, H = 630;
const photo = await sharp('src/assets/gallery/bull-elk-at-sunset.jpg').resize(W, H, { fit: 'cover', position: 'right' }).toBuffer();
const mScale = 360 / 756.2;
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${ink}" stop-opacity=".92"/><stop offset=".55" stop-color="${ink}" stop-opacity=".55"/><stop offset="1" stop-color="${ink}" stop-opacity=".05"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect y="${H - 14}" width="${W}" height="14" fill="${blaze}"/>
  <path transform="translate(90 120) scale(${mScale})" fill="${blaze}" fill-rule="evenodd" d="${mark}"/></svg>`;
await sharp(photo).composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og-image.jpg');
console.log('brand assets written');
