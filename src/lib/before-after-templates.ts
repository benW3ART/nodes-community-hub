import { CanvasRenderingContext2D, Image as CanvasImage } from 'canvas';
import {
  COLORS,
  loadLogo,
  loadBrandingAsset,
  drawRoundedRect,
  drawGradientText,
  drawTextWithGlow,
  drawImageWithBorder,
  drawWatermark,
} from '@/lib/canvas-utils';

export const SIZE = 1200;

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

export function drawBrandedWatermark(ctx: CanvasRenderingContext2D, assets: BrandingAssets, canvasSize: number) {
  if (assets.nodesGlitch) {
    const logoW = 120;
    const aspect = assets.nodesGlitch.height / assets.nodesGlitch.width;
    const logoH = logoW * aspect;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.drawImage(assets.nodesGlitch, canvasSize - logoW - 20, 16, logoW, logoH);
    ctx.restore();
  } else {
    drawWatermark(ctx, assets.logo, canvasSize);
  }
}

export function drawDRBanner(ctx: CanvasRenderingContext2D, assets: BrandingAssets, networkStatus: string, canvasSize: number) {
  if (networkStatus !== 'Digital Renaissance' || !assets.drBanner) return;
  const bannerH = 60;
  const aspect = assets.drBanner.width / assets.drBanner.height;
  const bannerW = bannerH * aspect;
  const x = (canvasSize - bannerW) / 2;
  const y = canvasSize - bannerH - 10;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(assets.drBanner, x, y, bannerW, bannerH);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Template renderers
// ---------------------------------------------------------------------------

export function renderSideBySideFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
) {
  const nftSize = SIZE * 0.38;
  const y = SIZE * 0.25;

  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#888888';
  ctx.fillText('LEGACY', SIZE * 0.27, SIZE * 0.17);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(networkStatus.toUpperCase(), SIZE * 0.73, SIZE * 0.17);

  if (beforeImg) drawImageWithBorder(ctx, beforeImg, SIZE * 0.08, y, nftSize);
  drawGradientText(ctx, '→', SIZE / 2, y + nftSize / 2, 80);
  if (afterImg) drawImageWithBorder(ctx, afterImg, SIZE * 0.54, y, nftSize);
  if (text) drawTextWithGlow(ctx, text, SIZE / 2, SIZE * 0.85, 36);

  drawDRBanner(ctx, assets, networkStatus, SIZE);
  drawBrandedWatermark(ctx, assets, SIZE);
}

export function renderVerticalFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
) {
  const nftSize = SIZE * 0.36;
  const centerX = (SIZE - nftSize) / 2;

  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#888888';
  ctx.fillText('LEGACY', SIZE / 2, SIZE * 0.08);
  if (beforeImg) drawImageWithBorder(ctx, beforeImg, centerX, SIZE * 0.11, nftSize);

  drawGradientText(ctx, '↓', SIZE / 2, SIZE * 0.52, 64);

  ctx.fillStyle = COLORS.cyan;
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(networkStatus.toUpperCase(), SIZE / 2, SIZE * 0.58);
  if (afterImg) drawImageWithBorder(ctx, afterImg, centerX, SIZE * 0.61, nftSize);
  if (text) drawTextWithGlow(ctx, text, SIZE / 2, SIZE * 0.96, 32);

  drawDRBanner(ctx, assets, networkStatus, SIZE);
  drawBrandedWatermark(ctx, assets, SIZE);
}

export function renderSplitRevealFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
) {
  const imgSize = SIZE * 0.85;
  const imgX = (SIZE - imgSize) / 2;
  const imgY = SIZE * 0.05;

  if (afterImg) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(imgX, imgY);
    ctx.lineTo(imgX + imgSize, imgY);
    ctx.lineTo(imgX + imgSize, imgY + imgSize);
    ctx.closePath();
    ctx.clip();
    drawImageWithBorder(ctx, afterImg, imgX, imgY, imgSize);
    ctx.restore();
  }

  if (beforeImg) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(imgX, imgY);
    ctx.lineTo(imgX + imgSize, imgY + imgSize);
    ctx.lineTo(imgX, imgY + imgSize);
    ctx.closePath();
    ctx.clip();
    drawImageWithBorder(ctx, beforeImg, imgX, imgY, imgSize);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(imgX, imgY);
  ctx.lineTo(imgX + imgSize, imgY + imgSize);
  ctx.stroke();
  ctx.restore();

  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#888888';
  ctx.fillText('LEGACY', imgX + 20, imgY + imgSize - 30);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(networkStatus.toUpperCase(), imgX + imgSize - 20, imgY + 30);
  if (text) drawTextWithGlow(ctx, text, SIZE / 2, SIZE * 0.96, 32);

  drawDRBanner(ctx, assets, networkStatus, SIZE);
  drawBrandedWatermark(ctx, assets, SIZE);
}

export function renderTimelineFrame(
  ctx: CanvasRenderingContext2D,
  beforeImg: any,
  afterImg: any,
  text: string,
  networkStatus: string,
  assets: BrandingAssets,
) {
  const nftSize = SIZE * 0.32;
  const timelineY = SIZE * 0.68;

  if (beforeImg) drawImageWithBorder(ctx, beforeImg, SIZE * 0.08, SIZE * 0.12, nftSize);
  if (afterImg) drawImageWithBorder(ctx, afterImg, SIZE * 0.60, SIZE * 0.12, nftSize);

  const barLeft = SIZE * 0.1;
  const barRight = SIZE * 0.9;
  const barWidth = barRight - barLeft;

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(barLeft, timelineY);
  ctx.lineTo(barRight, timelineY);
  ctx.stroke();

  const milestones = [
    { x: barLeft, label: 'Legacy', active: true },
    { x: barLeft + barWidth * 0.5, label: 'Genesis\nInterference', active: networkStatus === 'Genesis Interference' || networkStatus === 'Digital Renaissance' },
    { x: barRight, label: 'Digital\nRenaissance', active: networkStatus === 'Digital Renaissance' },
  ];

  for (const ms of milestones) {
    ctx.beginPath();
    ctx.arc(ms.x, timelineY, ms.active ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = ms.active ? COLORS.cyan : '#333333';
    ctx.fill();
    if (ms.active) {
      ctx.save();
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ms.x, timelineY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = ms.active ? COLORS.cyan : '#666666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const lines = ms.label.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, ms.x, timelineY + 22 + i * 24);
    });
  }

  const activeEnd = networkStatus === 'Digital Renaissance' ? barRight : barLeft + barWidth * 0.5;
  const progressGradient = ctx.createLinearGradient(barLeft, timelineY, activeEnd, timelineY);
  progressGradient.addColorStop(0, COLORS.teal);
  progressGradient.addColorStop(1, COLORS.cyan);
  ctx.strokeStyle = progressGradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(barLeft, timelineY);
  ctx.lineTo(activeEnd, timelineY);
  ctx.stroke();

  if (text) drawTextWithGlow(ctx, text, SIZE / 2, SIZE * 0.55, 36);

  drawDRBanner(ctx, assets, networkStatus, SIZE);
  drawBrandedWatermark(ctx, assets, SIZE);
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
) {
  switch (template) {
    case 'side-by-side':
      renderSideBySideFrame(ctx, beforeImg, afterImg, text, networkStatus, assets);
      break;
    case 'vertical':
      renderVerticalFrame(ctx, beforeImg, afterImg, text, networkStatus, assets);
      break;
    case 'split-reveal':
      renderSplitRevealFrame(ctx, beforeImg, afterImg, text, networkStatus, assets);
      break;
    case 'timeline':
      renderTimelineFrame(ctx, beforeImg, afterImg, text, networkStatus, assets);
      break;
    default:
      renderSideBySideFrame(ctx, beforeImg, afterImg, text, networkStatus, assets);
  }
}
