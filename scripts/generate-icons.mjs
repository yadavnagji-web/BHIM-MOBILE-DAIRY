import sharp from 'sharp';
import fs from 'fs';

async function generate() {
  const sourcePath = 'public/ambedkar_portrait.jpg';
  
  // 1. Generate 192x192 PNG
  await sharp(sourcePath)
    .resize(192, 192)
    .png({ quality: 95 })
    .toFile('public/pwa-192x192.png');
  console.log('Created public/pwa-192x192.png');

  // 2. Generate 512x512 PNG
  await sharp(sourcePath)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile('public/pwa-512x512.png');
  console.log('Created public/pwa-512x512.png');

  // 3. Generate 180x180 Apple Touch Icon
  await sharp(sourcePath)
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile('public/apple-touch-icon.png');
  console.log('Created public/apple-touch-icon.png');

  // 4. Generate Maskable Icon (512x512 canvas, 380x380 centered image, padding 66px, background #172554)
  const innerResized = await sharp(sourcePath)
    .resize(380, 380)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 23, g: 37, b: 84, alpha: 1 } // #172554 deep blue
    }
  })
    .composite([
      {
        input: innerResized,
        top: 66,
        left: 66
      }
    ])
    .png({ quality: 95 })
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Created public/pwa-maskable-512x512.png');

  // 5. Generate public/icon.svg
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="50%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#172554"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#60a5fa" stroke-width="12"/>
  <circle cx="256" cy="256" r="190" fill="#2563eb" fill-opacity="0.2"/>
  <text x="256" y="275" font-family="system-ui, sans-serif" font-size="78" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">BHIM</text>
  <text x="256" y="340" font-family="system-ui, sans-serif" font-size="34" font-weight="700" fill="#93c5fd" text-anchor="middle" letter-spacing="4">DIRECTORY</text>
  <path d="M256 120 L270 162 L314 162 L278 188 L292 230 L256 204 L220 230 L234 188 L198 162 L242 162 Z" fill="#fbbf24"/>
</svg>`;
  fs.writeFileSync('public/icon.svg', svgContent);
  console.log('Created public/icon.svg');
}

generate().catch(console.error);
