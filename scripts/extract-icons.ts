/**
 * Extract the 6 inner state icons from NODES symbol.png
 * Icons are in a row below the "NODES" text (2500x2500 image)
 * Order L→R: Verified, HyperConnected, Equilibrium, Enlightened, Ascended, Diamond Hand
 *
 * Run: npx tsx scripts/extract-icons.ts
 */

import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const ICON_NAMES = [
  'verified',
  'hyperconnected',
  'equilibrium',
  'enlightened',
  'ascended',
  'diamond-hand',
];

// Approximate bounding boxes for each icon (measured from pixel scan of 2500x2500 image)
// Format: [x, y, width, height] — generous boxes, will be auto-trimmed
const ICON_REGIONS: [number, number, number, number][] = [
  [480, 1330, 200, 200],   // Verified (puzzle piece)
  [740, 1330, 200, 200],   // HyperConnected (globe)
  [990, 1330, 220, 200],   // Equilibrium (yin-yang)
  [1290, 1320, 180, 200],  // Enlightened (lightning)
  [1550, 1340, 200, 180],  // Ascended (wings)
  [1840, 1330, 200, 200],  // Diamond Hand (diamond)
];

async function extractIcons() {
  const srcPath = path.join(process.cwd(), 'public', 'logos', 'NODES symbol.png');
  const outDir = path.join(process.cwd(), 'public', 'icons');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const img = await loadImage(srcPath);
  console.log(`Loaded source image: ${img.width}x${img.height}`);

  // Draw source onto a canvas so we can read pixel data
  const srcCanvas = createCanvas(img.width, img.height);
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(img, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, img.width, img.height);

  function isNonBlack(x: number, y: number): boolean {
    const idx = (y * img.width + x) * 4;
    const r = srcData.data[idx];
    const g = srcData.data[idx + 1];
    const b = srcData.data[idx + 2];
    const a = srcData.data[idx + 3];
    return a > 30 && (r > 40 || g > 40 || b > 40);
  }

  for (let i = 0; i < ICON_NAMES.length; i++) {
    const [rx, ry, rw, rh] = ICON_REGIONS[i];
    const name = ICON_NAMES[i];

    // Auto-trim: find actual content bounds within the region
    let minX = rx + rw, minY = ry + rh, maxX = rx, maxY = ry;
    for (let y = ry; y < ry + rh && y < img.height; y++) {
      for (let x = rx; x < rx + rw && x < img.width; x++) {
        if (isNonBlack(x, y)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) {
      console.error(`  [${name}] No content found in region [${rx},${ry},${rw},${rh}]`);
      continue;
    }

    // Add small padding
    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(img.width - 1, maxX + pad);
    maxY = Math.min(img.height - 1, maxY + pad);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    // Make it square (use the larger dimension)
    const side = Math.max(cropW, cropH);
    const cx = minX - Math.floor((side - cropW) / 2);
    const cy = minY - Math.floor((side - cropH) / 2);

    // Output at a clean size (128x128 is good for web display)
    const outSize = 128;
    const outCanvas = createCanvas(outSize, outSize);
    const outCtx = outCanvas.getContext('2d');

    // Transparent background
    outCtx.clearRect(0, 0, outSize, outSize);
    outCtx.drawImage(img, cx, cy, side, side, 0, 0, outSize, outSize);

    const outPath = path.join(outDir, `${name}.png`);
    const buffer = outCanvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log(`  [${name}] Cropped from [${minX},${minY}] ${cropW}x${cropH} → ${outPath}`);
  }

  console.log('\nDone! Icons saved to public/icons/');
}

extractIcons().catch(console.error);
