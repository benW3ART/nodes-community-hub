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
  'side-by-side':       ['square', 'landscape'],
  'vertical':           ['square', 'portrait'],
  'gif-transition':     ['square', 'landscape', 'portrait'],
  'split-reveal':       ['square', 'landscape', 'portrait'],
  'frame-overlay':      ['square', 'landscape', 'portrait'],
  'glitch-wipe':        ['square', 'landscape'],
  'reveal-card':        ['square', 'portrait'],
  'slider-horizontal':  ['square', 'landscape', 'portrait'],
  'slider-vertical':    ['square', 'landscape', 'portrait'],
  'slider-diagonal':    ['square', 'landscape', 'portrait'],
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

/**
 * "ART IS NEVER FINISHED" branding text — only shown when there's no custom text,
 * to avoid overlapping with caption. Positioned above DR banner.
 */
export function drawArtIsNeverFinished(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, networkStatus: string, hasCustomText: boolean = false) {
  if (hasCustomText) return; // Don't show when there's a caption — they'd overlap
  ctx.save();
  ctx.font = `bold 14px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.25;
  const yPos = networkStatus === 'Digital Renaissance' ? canvasH - 56 : canvasH - 20;
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

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus, !!text);
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
  // Adapt sizing: for portrait (tall), use more of the width; for square, keep moderate
  const isPortrait = cH > cW * 1.2;
  const nftSize = isPortrait ? cW * 0.58 : Math.min(cW, cH) * 0.32;
  const centerX = (cW - nftSize) / 2;
  const labelSize = isPortrait ? 20 : 24;
  const arrowSize = isPortrait ? 40 : 48;

  ctx.font = `bold ${labelSize}px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  const startY = isPortrait ? cH * 0.05 : cH * 0.07;
  ctx.fillText('LEGACY', cW / 2, startY);
  const beforeImgY = startY + cH * 0.03;
  if (beforeImg) drawImageWithBorderCover(ctx, beforeImg, centerX, beforeImgY, nftSize, nftSize);

  const arrowY = beforeImgY + nftSize + cH * 0.025;
  drawGradientText(ctx, '↓', cW / 2, arrowY, arrowSize);

  const afterLabelY = arrowY + cH * 0.03;
  ctx.fillStyle = COLORS.cyan;
  ctx.font = `bold ${labelSize}px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(getInterferenceLabel(networkStatus), cW / 2, afterLabelY);

  const afterImgY = afterLabelY + cH * 0.025;
  if (afterImg) drawImageWithBorderCover(ctx, afterImg, centerX, afterImgY, nftSize, nftSize);

  const textY = Math.min(cH * 0.90, afterImgY + nftSize + cH * 0.035);
  if (text) drawTextWithGlow(ctx, text, cW / 2, textY, isPortrait ? 24 : 30);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus, !!text);
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

  // Adapt label size for narrow canvases to avoid watermark collision
  const isNarrow = cW < 800;
  const splitLabelSize = isNarrow ? 16 : 22;
  ctx.font = `bold ${splitLabelSize}px ${BRAND_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.fillText('LEGACY', leftX + leftW / 2, cH * 0.055);
  ctx.fillStyle = COLORS.cyan;
  // For narrow canvases, left-align the right label to avoid NODES watermark
  if (isNarrow) {
    ctx.textAlign = 'left';
    ctx.fillText(getInterferenceLabel(networkStatus), rightX + 8, cH * 0.055);
  } else {
    ctx.fillText(getInterferenceLabel(networkStatus), rightX + rightW / 2, cH * 0.055);
  }

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.89, 28);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus, !!text);
  drawDRBanner(ctx, assets, networkStatus, cW, cH);
  drawBrandedWatermark(ctx, assets, cW, cH);
}

/**
 * FRAME OVERLAY — Large after image centered, small before PIP at bottom-left
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
  // Main after image — large centered with border (not full-bleed)
  const mainSize = Math.min(cW, cH) * 0.60;
  const mainX = (cW - mainSize) / 2;
  const mainY = cH * 0.08;

  if (afterImg) drawImageWithBorderCover(ctx, afterImg, mainX, mainY, mainSize, mainSize);

  // Network status label above main image
  ctx.font = `bold 26px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(getInterferenceLabel(networkStatus), cW / 2, mainY - 20);

  // PIP (before image) at bottom-left, overlapping the main image slightly
  const pipSize = Math.min(cW, cH) * 0.25;
  const pipX = mainX - pipSize * 0.15;
  const pipY = mainY + mainSize - pipSize * 0.6;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  drawRoundedRect(ctx, pipX - 6, pipY - 6, pipSize + 12, pipSize + 12, pipSize * 0.08);
  ctx.fill();

  if (beforeImg) drawImageWithBorderCover(ctx, beforeImg, pipX, pipY, pipSize, pipSize);

  ctx.font = `bold 14px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#999999';
  ctx.fillText('LEGACY', pipX + pipSize / 2, pipY - 16);

  if (text) drawTextWithGlow(ctx, text, cW / 2, mainY + mainSize + (cH - mainY - mainSize) * 0.45, 32);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus, !!text);
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

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.89, 30);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus, !!text);
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

  if (text) drawTextWithGlow(ctx, text, cW / 2, cH * 0.89, 28);

  drawArtIsNeverFinished(ctx, cW, cH, networkStatus, !!text);
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

// ---------------------------------------------------------------------------
// Slider templates — animated reveal (horizontal / vertical / diagonal)
// ---------------------------------------------------------------------------

export type SliderDirection = 'horizontal' | 'vertical' | 'diagonal';

export const SLIDER_TEMPLATES = ['slider-horizontal', 'slider-vertical', 'slider-diagonal'] as const;

export function isSliderTemplate(template: string): boolean {
  return (SLIDER_TEMPLATES as readonly string[]).includes(template);
}

export function getSliderDirection(template: string): SliderDirection {
  if (template === 'slider-vertical') return 'vertical';
  if (template === 'slider-diagonal') return 'diagonal';
  return 'horizontal';
}

/** Cubic ease-in-out for smooth slider motion */
export function sliderEase(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Total slider animation duration in ms */
export const SLIDER_DURATION = 4000;

/**
 * Get slider progress (0-1) at a given time.
 * Timing: 0-0.5s hold before → 0.5-2s slide to after → 2-2.5s hold after → 2.5-4s slide back
 */
export function getSliderProgress(timeMs: number): number {
  const t = (timeMs % SLIDER_DURATION) / 1000;
  if (t < 0.5) return 0;
  if (t < 2) return sliderEase((t - 0.5) / 1.5);
  if (t < 2.5) return 1;
  return 1 - sliderEase((t - 2.5) / 1.5);
}

/**
 * SLIDER — Renders a single frame of the slider animation.
 * Minimal overlay: NODES watermark top-right, token ID bottom-center.
 */
export function renderSliderFrame(
  ctx: CanvasRenderingContext2D,
  direction: SliderDirection,
  progress: number,
  beforeImg: any,
  afterImg: any,
  tokenId: string,
  assets: BrandingAssets,
  cW: number = SIZE,
  cH: number = SIZE,
) {
  const padding = Math.min(cW, cH) * 0.03;
  const bottomReserve = 35;
  const imgX = padding;
  const imgY = padding;
  const imgW = cW - padding * 2;
  const imgH = cH - padding - bottomReserve;
  const borderRadius = Math.min(imgW, imgH) * 0.03;

  // 1) Draw before image (full area)
  if (beforeImg) {
    ctx.save();
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
    ctx.clip();
    drawImageCover(ctx, beforeImg, imgX, imgY, imgW, imgH);
    ctx.restore();
  }

  // 2) Draw after image clipped by slider position
  if (afterImg && progress > 0) {
    ctx.save();
    // Clip to rounded image area first
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
    ctx.clip();

    // Then clip to the revealed slider region
    ctx.beginPath();
    if (direction === 'horizontal') {
      ctx.rect(imgX, imgY, imgW * progress, imgH);
    } else if (direction === 'vertical') {
      ctx.rect(imgX, imgY, imgW, imgH * progress);
    } else {
      // Diagonal: angled line sweeping from top-left to bottom-right
      const tilt = imgH * 0.35;
      const travel = imgW + tilt;
      const x = progress * travel;
      ctx.moveTo(imgX, imgY);
      ctx.lineTo(imgX + Math.min(x, imgW), imgY);
      if (x > imgW) {
        ctx.lineTo(imgX + imgW, imgY);
        ctx.lineTo(imgX + imgW, imgY + imgH * Math.min(1, (x - imgW) / tilt));
      }
      ctx.lineTo(imgX + Math.max(0, x - tilt), imgY + imgH);
      ctx.lineTo(imgX, imgY + imgH);
      ctx.closePath();
    }
    ctx.clip();

    drawImageCover(ctx, afterImg, imgX, imgY, imgW, imgH);
    ctx.restore();
  }

  // 3) Draw border around image area
  ctx.strokeStyle = `${COLORS.cyan}30`;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
  ctx.stroke();

  // 4) Draw the slider line (clipped to image area)
  if (progress > 0.005 && progress < 0.995) {
    ctx.save();
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
    ctx.clip();

    // Glowing cyan line
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;

    let handleX: number, handleY: number;

    ctx.beginPath();
    if (direction === 'horizontal') {
      const x = imgX + imgW * progress;
      ctx.moveTo(x, imgY);
      ctx.lineTo(x, imgY + imgH);
      handleX = x;
      handleY = imgY + imgH / 2;
    } else if (direction === 'vertical') {
      const y = imgY + imgH * progress;
      ctx.moveTo(imgX, y);
      ctx.lineTo(imgX + imgW, y);
      handleX = imgX + imgW / 2;
      handleY = y;
    } else {
      const tilt = imgH * 0.35;
      const travel = imgW + tilt;
      const x = progress * travel;
      const topX = imgX + Math.min(x, imgW);
      const botX = imgX + Math.max(0, x - tilt);
      ctx.moveTo(topX, imgY);
      ctx.lineTo(botX, imgY + imgH);
      handleX = (topX + botX) / 2;
      handleY = imgY + imgH / 2;
    }
    ctx.stroke();

    // Draw slider handle (small circle at center of line)
    ctx.beginPath();
    ctx.arc(handleX, handleY, 10, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Small arrows on handle
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (direction === 'horizontal') {
      ctx.fillText('◂▸', handleX, handleY);
    } else if (direction === 'vertical') {
      ctx.fillText('▴▾', handleX, handleY);
    } else {
      ctx.fillText('◂▸', handleX, handleY);
    }

    ctx.restore();
  }

  // 5) Token ID at bottom center
  ctx.save();
  ctx.font = `bold 22px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(`#${tokenId}`, cW / 2, cH - bottomReserve / 2);
  ctx.restore();

  // 6) NODES watermark top-right
  drawBrandedWatermark(ctx, assets, cW, cH);
}
