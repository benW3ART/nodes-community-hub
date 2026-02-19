import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D, Image as CanvasImage } from 'canvas';
import { parseGIF, decompressFrames } from 'gifuct-js';
import path from 'path';
import fs from 'fs';

// Register Space Grotesk for server-side canvas rendering
const fontPaths = [
  path.join(process.cwd(), 'public', 'fonts', 'SpaceGrotesk-Bold.ttf'),
  '/app/public/fonts/SpaceGrotesk-Bold.ttf',
];
for (const fontPath of fontPaths) {
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, { family: 'Space Grotesk', weight: 'bold' });
      break;
    } catch (e) {
      console.error('Failed to register Space Grotesk font:', e);
    }
  }
}

// Brand font for all canvas text rendering
export const BRAND_FONT = 'Space Grotesk, Inter, system-ui, sans-serif';

// NODES brand colors
export const COLORS = {
  cyan: '#00D4FF',
  teal: '#4FFFDF',
  darkBg: '#0a0a0a',
  black: '#000000',
};

// ---------------------------------------------------------------------------
// Image loading utilities
// ---------------------------------------------------------------------------

export async function loadImageSafe(src: string): Promise<CanvasImage | null> {
  try {
    if (src.startsWith('data:')) {
      return await loadImage(src);
    }
    if (src.startsWith('http://') || src.startsWith('https://')) {
      const response = await fetch(src);
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      return await loadImage(buffer);
    }
    if (fs.existsSync(src)) {
      return await loadImage(src);
    }
    return null;
  } catch (err) {
    console.error('Failed to load image:', src, err);
    return null;
  }
}

export async function loadLogo(): Promise<CanvasImage | null> {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'logos', 'nodes.png'),
    path.join(process.cwd(), 'public', 'nodes-logo.png'),
    path.join(process.cwd(), '.next', 'static', 'nodes-logo.png'),
    '/app/public/logos/nodes.png',
    '/app/public/nodes-logo.png',
  ];
  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      try {
        return await loadImage(logoPath);
      } catch (e) {
        console.error('Failed to load logo from', logoPath, e);
      }
    }
  }
  return null;
}

/**
 * Load a branding asset from public/logos/ directory.
 * Available assets: 'nodes.png', 'NODES symbol.png', 'banner.png',
 *   'The Digital Renaissance.png', 'Frame NODE.png'
 */
export async function loadBrandingAsset(filename: string): Promise<CanvasImage | null> {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'logos', filename),
    path.join(process.cwd(), '.next', 'static', 'logos', filename),
    `/app/public/logos/${filename}`,
  ];
  for (const assetPath of possiblePaths) {
    if (fs.existsSync(assetPath)) {
      try {
        return await loadImage(assetPath);
      } catch (e) {
        console.error('Failed to load branding asset from', assetPath, e);
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Canvas drawing helpers
// ---------------------------------------------------------------------------

export function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawGlowEffect(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, opacity: number = 0.1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, `${color}80`);
  gradient.addColorStop(1, 'transparent');
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGradientText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number) {
  ctx.font = `bold ${fontSize}px ${BRAND_FONT}`;
  const metrics = ctx.measureText(text);
  const gradient = ctx.createLinearGradient(x - metrics.width / 2, y, x + metrics.width / 2, y);
  gradient.addColorStop(0, COLORS.cyan);
  gradient.addColorStop(1, COLORS.teal);
  ctx.fillStyle = gradient;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function drawTextWithGlow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, color: string = '#ffffff') {
  ctx.font = `bold ${fontSize}px ${BRAND_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export async function drawNftWithBorder(ctx: CanvasRenderingContext2D, nft: { image: string; name: string }, x: number, y: number, size: number) {
  const img = await loadImageSafe(nft.image);
  if (!img) return;
  drawImageWithBorder(ctx, img, x, y, size);
}

export function drawImageWithBorder(ctx: CanvasRenderingContext2D, img: CanvasImage, x: number, y: number, size: number) {
  const borderRadius = size * 0.08;
  const borderWidth = 2;

  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = `${COLORS.cyan}50`;
  ctx.lineWidth = borderWidth;
  drawRoundedRect(ctx, x, y, size, size, borderRadius);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, borderRadius);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  ctx.strokeStyle = `${COLORS.cyan}30`;
  ctx.lineWidth = borderWidth;
  drawRoundedRect(ctx, x, y, size, size, borderRadius);
  ctx.stroke();
}

/**
 * Draw an image inside a bounding box preserving aspect ratio (object-fit: cover).
 * Crops to fill the entire box.
 */
export function drawImageCover(ctx: CanvasRenderingContext2D, img: CanvasImage | any, x: number, y: number, boxW: number, boxH: number, borderRadius?: number) {
  const imgAspect = img.width / img.height;
  const boxAspect = boxW / boxH;
  let sx: number, sy: number, sw: number, sh: number;
  if (imgAspect > boxAspect) {
    sh = img.height;
    sw = img.height * boxAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / boxAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.save();
  if (borderRadius) {
    drawRoundedRect(ctx, x, y, boxW, boxH, borderRadius);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, boxW, boxH);
  ctx.restore();
}

/**
 * Draw an image with border, preserving aspect ratio via cover crop.
 */
export function drawImageWithBorderCover(ctx: CanvasRenderingContext2D, img: CanvasImage | any, x: number, y: number, w: number, h: number) {
  const borderRadius = Math.min(w, h) * 0.08;
  const borderWidth = 2;

  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = `${COLORS.cyan}50`;
  ctx.lineWidth = borderWidth;
  drawRoundedRect(ctx, x, y, w, h, borderRadius);
  ctx.stroke();
  ctx.restore();

  drawImageCover(ctx, img, x, y, w, h, borderRadius);

  ctx.strokeStyle = `${COLORS.cyan}30`;
  ctx.lineWidth = borderWidth;
  drawRoundedRect(ctx, x, y, w, h, borderRadius);
  ctx.stroke();
}

export function drawWatermark(ctx: CanvasRenderingContext2D, logo: CanvasImage | null, canvasSize: number) {
  const wmY = 30;
  const wmX = canvasSize - 30;
  if (logo) {
    const logoSize = 40;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(logo, wmX - 130, wmY - 5, logoSize, logoSize);
    ctx.globalAlpha = 1;
  }
  ctx.font = `bold 24px ${BRAND_FONT}`;
  ctx.fillStyle = `${COLORS.cyan}80`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('NODES', wmX, wmY);
}

export function drawSubtleGlows(ctx: CanvasRenderingContext2D, size: number) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.arc(-size * 0.1, -size * 0.1, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.teal;
  ctx.beginPath();
  ctx.arc(size * 1.1, size * 1.1, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// GIF utilities
// ---------------------------------------------------------------------------

export interface GifData {
  frames: any[];
  width: number;
  height: number;
  isAnimated: true;
  frameDelays: number[];
}

export async function fetchGifFrames(url: string): Promise<GifData | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);

    if (!frames || frames.length === 0) {
      throw new Error('No frames found');
    }
    const validFrames = frames.filter((f: any) => f && f.dims && f.patch);
    if (validFrames.length === 0) {
      throw new Error('No valid frames');
    }

    const frameDelays = validFrames.map((f: any) => {
      const delay = f.delay || 0;
      return delay >= 20 ? delay : (delay > 0 ? 20 : 50);
    });

    return {
      frames: validFrames,
      width: gif.lsd.width,
      height: gif.lsd.height,
      isAnimated: true,
      frameDelays,
    };
  } catch (error) {
    console.error('GIF parsing failed for', url, error);
    return null;
  }
}

export function prerenderGifFrames(gifData: GifData): { canvases: any[]; delays: number[]; timestamps: number[]; totalDuration: number } {
  const { frames, width, height, frameDelays } = gifData;
  const canvases: any[] = [];
  const delays: number[] = [];
  const timestamps: number[] = [];
  let cumulative = 0;

  const compositeCanvas = createCanvas(width, height);
  const compositeCtx = compositeCanvas.getContext('2d');

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    try {
      if (i > 0) {
        const prevFrame = frames[i - 1];
        if (prevFrame.disposalType === 2) {
          compositeCtx.clearRect(prevFrame.dims.left, prevFrame.dims.top, prevFrame.dims.width, prevFrame.dims.height);
        }
      }
      const patchCanvas = createCanvas(frame.dims.width, frame.dims.height);
      const patchCtx = patchCanvas.getContext('2d');
      const imageData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
      imageData.data.set(new Uint8ClampedArray(frame.patch));
      patchCtx.putImageData(imageData, 0, 0);
      compositeCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

      const frameCanvas = createCanvas(width, height);
      const frameCtx = frameCanvas.getContext('2d');
      frameCtx.drawImage(compositeCanvas, 0, 0);

      const frameDelay = frameDelays[i] || 50;
      timestamps.push(cumulative);
      cumulative += frameDelay;
      canvases.push(frameCanvas);
      delays.push(frameDelay);
    } catch (err) {
      console.error(`Failed to render frame ${i}:`, err);
      const frameDelay = delays.length > 0 ? delays[delays.length - 1] : 50;
      timestamps.push(cumulative);
      cumulative += frameDelay;
      if (canvases.length > 0) {
        canvases.push(canvases[canvases.length - 1]);
      } else {
        canvases.push(createCanvas(width, height));
      }
      delays.push(frameDelay);
    }
  }

  return { canvases, delays, timestamps, totalDuration: cumulative };
}

export function getFrameAtTime(timestamps: number[], totalDuration: number, timeMs: number): number {
  const loopedTime = timeMs % totalDuration;
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (loopedTime >= timestamps[i]) {
      return i;
    }
  }
  return 0;
}
