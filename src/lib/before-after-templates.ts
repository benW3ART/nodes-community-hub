import { CanvasRenderingContext2D, Image as CanvasImage } from 'canvas';
import {
  COLORS,
  BRAND_FONT,
  loadLogo,
  loadBrandingAsset,
  drawRoundedRect,
  drawGradientText,
  drawTextWithGlow,
  drawImageWithBorder,
  drawImageWithBorderCover,
  drawImageCover,
  drawWatermark,
} from '@/lib/canvas-utils';

export const SIZE = 1200;

// ---------------------------------------------------------------------------
// Aspect ratio / dimensions
// ---------------------------------------------------------------------------

export type AspectRatio = 'square' | 'landscape' | 'portrait';

export const DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  square:    { w: 1200, h: 1200 },
  landscape: { w: 1200, h: 675 },
  portrait:  { w: 675,  h: 1200 },
};

/** Which aspect ratios each template supports */
export const TEMPLATE_FORMATS: Record<string, AspectRatio[]> = {
  'side-by-side':  ['square', 'landscape'],
  'vertical':      ['square', 'portrait'],
  'gif-transition': ['square', 'landscape', 'portrait'],
  'split-reveal':  ['square', 'landscape', 'portrait'],
  'frame-overlay': ['square', 'landscape', 'portrait'],
  'glitch-wipe':   ['square', 'landscape'],
  'reveal-card':   ['square', 'portrait'],
};

// ---------------------------------------------------------------------------
// Branding helpers
// ---------------------------------------------------------------------------

export interface BrandingAssets {
  logo: CanvasImage | null;
  nodesGlitch: CanvasImage | null;
  drBanner: CanvasImage | null;
}

export async function loadBrandingAssets(): Promise<BrandingAssets> {
  const [logo, nodesGlitch, drBanner] = await Promise.all([
    loadLogo(),
    loadBrandingAsset('nodes.png'),
    loadBrandingAsset('The Digital Renaissance.png'),
  ]);
  return { logo, nodesGlitch, drBanner };
}

/** NODES glitch logo — top-right corner */
export function drawBrandedWatermark(ctx: CanvasRenderingContext2D, assets: BrandingAssets, canvasW: number, _canvasH?: number) {
  if (assets.nodesGlitch) {
    const logoW = 100;
    const aspect = assets.nodesGlitch.height / assets.nodesGlitch.width;
    const logoH = logoW * aspect;
    ctx.save();
    ctx.globalAlpha = 0.40;
    ctx.drawImage(assets.nodesGlitch, canvasW - logoW - 16, 12, logoW, logoH);
    ctx.restore();
  } else {
    drawWatermark(ctx, assets.logo, canvasW);
  }
}

/** DR banner — bottom-center, small and non-intrusive. Preserves aspect ratio. */
export function drawDRBanner(ctx: CanvasRenderingContext2D, assets: BrandingAssets, networkStatus: string, canvasW: number, canvasH?: number) {
  if (networkStatus !== 'Digital Renaissance' || !assets.drBanner) return;
  const h = canvasH || canvasW;
  const bannerH = 36;
  const aspect = assets.drBanner.width / assets.drBanner.height;
  const bannerW = bannerH * aspect;
  const x = (canvasW - bannerW) / 2;
  const y = h - bannerH - 8;
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.drawImage(assets.drBanner, x, y, bannerW, bannerH);
  ctx.restore();
}

/** "ART IS NEVER FINISHED" branding text — subtle, above DR banner */
export function drawArtIsNeverFinished(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, networkStatus: string) {
  ctx.save();
  ctx.font = `bold 14px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.25;
  // Position above DR banner if DR, otherwise near bottom
  const yPos = networkStatus === 'Digital Renaissance' ? canvasH - 54 : canvasH - 20;
  ctx.fillText('ART IS NEVER FINISHED', canvasW / 2, yPos);
  ctx.restore();
}

/** Interference type label — "GENESIS INTERFERENCE" or "DIGITAL RENAISSANCE INTERFERENCE" */
function getInterferenceLabel(networkStatus: string): string {
  if (networkStatus === 'Digital Renaissance') return 'DIGITAL RENAISSANCE';
  if (networkStatus === 'Genesis Interference') return 'GENESIS INTERFERENCE';
  return networkStatus.toUpperCase();
}

// ---------------------------------------------------------------------------
// Template renderers — render into canvasW x canvasH (default 1200x1200)
// ---------------------------------------------------------------------------

/**
 * SIDE-BY-SIDE — Before left, After right, with improved layout
 */
export function renderSideBySideFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  const nftSize = Math.min(cW, cH) * 0.40;
  const imgY = cH * 0.22;
  const leftX = cW * 0.06;
  const rightX = cW * 0.54;

  ctx.fillStyle = '#0d0d0d';
  drawRoundedRect(ctx, leftX - 8, imgY - 8, nftSize + 16, nftSize + 16, nftSize * 0.09);
  ctx.fill();
  drawRoundedRect(ctx, rightX - 8, imgY - 8, nftSize + 16, nftSize + 16, nftSize * 0.09);
  ctx.fill();

  ctx.font = `bold 26px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  ctx.fillText('LEGACY', leftX + nftSize / 2, cH * 0.14);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(getInterferenceLabel(networkStatus), rightX + nftSize / 2, cH * 0.14);

  if (beforeImg) drawImageWithBorderCover(ctx, beforeImg, leftX, imgY, nftSize, nftSize);
  if (afterImg) drawImageWithBorderCover(ctx, afterImg, rightX, imgY, nftSize, nftSize);

  drawGradientText(ctx, '→', cW / 2, imgY + nftSize / 2, 64);

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.78, 36);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * VERTICAL — Before top, After bottom
 */
export function renderVerticalFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  const nftSize = Math.min(cW, cH) * 0.36;
  const centerX = (cW - nftSize) / 2;

  ctx.font = `bold 24px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  ctx.fillText('LEGACY', cW / 2, cH * 0.07);
  if (beforeImg) drawImageWithBorderCover(ctx, beforeImg, centerX, cH * 0.10, nftSize, nftSize);

  drawGradientText(ctx, '↓', cW / 2, cH * 0.51, 48);

  ctx.fillStyle = COLORS.cyan;
  ctx.font = `bold 24px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(getInterferenceLabel(networkStatus), cW / 2, cH * 0.56);
  if (afterImg) drawImageWithBorderCover(ctx, afterImg, centerX, cH * 0.59, nftSize, nftSize);

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.92, 30);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * SPLIT — Vertical 50/50 split (before left, after right) with glowing divider
 * Clean layout: minimal text, no clutter
 */
export function renderSplitRevealFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  const padding = cW * 0.04;
  const imgTop = cH * 0.10;
  const imgBottom = cH * 0.88;
  const imgH = imgBottom - imgTop;
  const gap = 4;
  const leftX = padding;
  const rightX = cW / 2 + gap / 2;
  const leftW = cW / 2 - gap / 2 - padding;
  const rightW = cW / 2 - gap / 2 - padding;

  if (beforeImg) {
    ctx.save();
    drawRoundedRect(ctx, leftX, imgTop, leftW, imgH, 16);
    ctx.clip();
    drawImageCover(ctx, beforeImg, leftX, imgTop, leftW, imgH);
    ctx.restore();
  }

  if (afterImg) {
    ctx.save();
    drawRoundedRect(ctx, rightX, imgTop, rightW, imgH, 16);
    ctx.clip();
    drawImageCover(ctx, afterImg, rightX, imgTop, rightW, imgH);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.moveTo(cW / 2, imgTop);
  ctx.lineTo(cW / 2, imgBottom);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const bandW = 6;
  for (let y = imgTop; y < imgBottom; y += 12) {
    const stripH = 4 + Math.floor(Math.random() * 4);
    const offset = Math.random() > 0.5 ? bandW : -bandW;
    ctx.fillStyle = `${COLORS.cyan}20`;
    ctx.fillRect(cW / 2 - bandW / 2 + offset, y, bandW, stripH);
  }
  ctx.restore();

  ctx.font = `bold 22px ${BRAND_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.fillText('LEGACY', leftX + leftW / 2, cH * 0.055);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(getInterferenceLabel(networkStatus), rightX + rightW / 2, cH * 0.055);

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.93, 28);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * FRAME OVERLAY — Full-bleed after image with small before frame (PIP)
 */
export function renderFrameOverlayFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  if (afterImg) {
    drawImageCover(ctx, afterImg, 0, 0, cW, cH);
    const grad = ctx.createRadialGradient(cW / 2, cH / 2, Math.min(cW, cH) * 0.3, cW / 2, cH / 2, Math.min(cW, cH) * 0.7);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cW, cH);
  }

  const pipSize = Math.min(cW, cH) * 0.28;
  const pipX = cW * 0.04;
  const pipY = cH - pipSize - cH * 0.12;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  drawRoundedRect(ctx, pipX - 6, pipY - 6, pipSize + 12, pipSize + 12, pipSize * 0.08);
  ctx.fill();

  if (beforeImg) drawImageWithBorderCover(ctx, beforeImg, pipX, pipY, pipSize, pipSize);

  ctx.font = `bold 16px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#999999';
  ctx.fillText('LEGACY', pipX + pipSize / 2, pipY - 18);

  ctx.font = `bold 28px ${BRAND_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.cyan;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText(getInterferenceLabel(networkStatus), cW * 0.04, cH * 0.06);
  ctx.restore();

  if (text) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    drawTextWithGlow(ctx, text, cW / 2, cH * 0.93, 32);
    ctx.restore();
  }

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * GLITCH WIPE — Before left half, After right half, glitchy center divider
 */
export function renderGlitchWipeFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  const imgTop = cH * 0.10;
  const imgBottom = cH * 0.85;
  const imgH = imgBottom - imgTop;
  const padding = cW * 0.04;
  const glitchBandW = cW * 0.05;

  const leftW = (cW - padding * 2 - glitchBandW) / 2;
  const rightW = leftW;
  const leftX = padding;
  const rightX = cW - padding - rightW;
  const centerX = leftX + leftW;

  if (beforeImg) {
    ctx.save();
    drawRoundedRect(ctx, leftX, imgTop, leftW, imgH, 12);
    ctx.clip();
    drawImageCover(ctx, beforeImg, leftX, imgTop, leftW, imgH);
    ctx.restore();
  }

  if (afterImg) {
    ctx.save();
    drawRoundedRect(ctx, rightX, imgTop, rightW, imgH, 12);
    ctx.clip();
    drawImageCover(ctx, afterImg, rightX, imgTop, rightW, imgH);
    ctx.restore();
  }

  const stripCount = 40;
  const stripH = imgH / stripCount;
  for (let i = 0; i < stripCount; i++) {
    const y = imgTop + i * stripH;
    const useAfter = Math.random() > 0.5;
    const offset = (Math.random() - 0.5) * glitchBandW * 0.8;
    const img = useAfter ? afterImg : beforeImg;
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(centerX, y, glitchBandW, stripH);
      ctx.clip();
      const srcScale = img.width / cW;
      const srcY = (y - imgTop) / imgH * img.height;
      const srcH = stripH / imgH * img.height;
      const srcX = (centerX + offset) / cW * img.width;
      const srcW = glitchBandW / cW * img.width;
      ctx.drawImage(img, Math.max(0, srcX * srcScale), srcY, Math.max(1, srcW), srcH, centerX + offset, y, glitchBandW, stripH);
      ctx.restore();
    }

    if (Math.random() > 0.6) {
      ctx.fillStyle = `${COLORS.cyan}15`;
      ctx.fillRect(centerX, y, glitchBandW, 2);
    }
  }

  ctx.save();
  ctx.strokeStyle = `${COLORS.cyan}40`;
  ctx.lineWidth = 1;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(centerX, imgTop);
  ctx.lineTo(centerX, imgBottom);
  ctx.moveTo(centerX + glitchBandW, imgTop);
  ctx.lineTo(centerX + glitchBandW, imgBottom);
  ctx.stroke();
  ctx.restore();

  ctx.font = `bold 22px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  ctx.fillText('LEGACY', leftX + leftW / 2, cH * 0.055);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(getInterferenceLabel(networkStatus), rightX + rightW / 2, cH * 0.055);

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.92, 30);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * REVEAL CARD — Top half before, bottom half after, horizontal glitch separator
 */
export function renderRevealCardFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  const padding = cW * 0.06;
  const cardW = cW - padding * 2;
  const glitchH = cH * 0.03;
  const topH = (cH * 0.80 - glitchH) / 2;
  const botH = topH;
  const topY = cH * 0.08;
  const botY = topY + topH + glitchH;

  ctx.fillStyle = '#0d0d0d';
  drawRoundedRect(ctx, padding - 4, topY - 4, cardW + 8, topH + glitchH + botH + 8, 20);
  ctx.fill();

  if (beforeImg) {
    ctx.save();
    drawRoundedRect(ctx, padding, topY, cardW, topH, 12);
    ctx.clip();
    drawImageCover(ctx, beforeImg, padding, topY, cardW, topH);
    ctx.restore();
  }

  if (afterImg) {
    ctx.save();
    drawRoundedRect(ctx, padding, botY, cardW, botH, 12);
    ctx.clip();
    drawImageCover(ctx, afterImg, padding, botY, cardW, botH);
    ctx.restore();
  }

  const bandY = topY + topH;
  ctx.fillStyle = '#000000';
  ctx.fillRect(padding, bandY, cardW, glitchH);

  const stripW = cardW / 30;
  for (let i = 0; i < 30; i++) {
    const x = padding + i * stripW;
    const h = glitchH * (0.3 + Math.random() * 0.7);
    const yOff = (glitchH - h) * Math.random();
    ctx.fillStyle = Math.random() > 0.5 ? `${COLORS.cyan}30` : `${COLORS.teal}20`;
    ctx.fillRect(x, bandY + yOff, stripW - 1, h);
  }

  ctx.save();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(padding, bandY + glitchH / 2);
  ctx.lineTo(padding + cardW, bandY + glitchH / 2);
  ctx.stroke();
  ctx.restore();

  ctx.font = `bold 18px ${BRAND_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'left';
  ctx.fillText('LEGACY', padding + 12, bandY - 14);
  ctx.fillStyle = COLORS.cyan;
  ctx.textAlign = 'right';
  ctx.fillText(getInterferenceLabel(networkStatus), padding + cardW - 12, bandY + glitchH + 14);

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.93, 28);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * Render any template by name. Dispatches to the correct renderer.
 */
export function renderTemplate(
  ctx: CanvasRenderingContext2D,
  template: string,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
  canvasW: number = SIZE,
  canvasH: number = SIZE,
) {
  switch (template) {
    case 'side-by-side':
      renderSideBySideFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
      break;
    case 'vertical':
      renderVerticalFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
      break;
    case 'split-reveal':
      renderSplitRevealFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
      break;
    case 'frame-overlay':
      renderFrameOverlayFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
      break;
    case 'glitch-wipe':
      renderGlitchWipeFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
      break;
    case 'reveal-card':
      renderRevealCardFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
      break;
    default:
      renderSideBySideFrame(ctx, beforeImg, afterImg, text, networkStatus, assets, canvasW, canvasH);
  }
}
