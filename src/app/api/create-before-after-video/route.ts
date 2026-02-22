import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { exec } from 'child_process';
import { checkRateLimit, acquireConcurrentSlot, releaseConcurrentSlot, serverBusyResponse } from '@/lib/rate-limit';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  COLORS,
  BRAND_FONT,
  loadImageSafe,
  drawRoundedRect,
  drawImageCover,
  drawTextWithGlow,
  drawSubtleGlows,
  fetchGifFrames,
  prerenderGifFrames,
  getFrameAtTime,
} from '@/lib/canvas-utils';
import {
  DIMENSIONS,
  loadBrandingAssets,
  drawBrandedWatermark,
  drawDRBanner,
  drawArtIsNeverFinished,
  renderTemplate,
  isSliderTemplate,
  getSliderDirection,
  getSliderProgress,
  renderSliderFrame,
  SLIDER_DURATION,
} from '@/lib/before-after-templates';
import type { AspectRatio } from '@/lib/before-after-templates';

const execAsync = promisify(exec);

interface BeforeAfterVideoRequest {
  template: string;
  beforeImage: string;
  afterImage: string;
  tokenId: string;
  nftName: string;
  networkStatus: string;
  text: string;
  aspectRatio?: AspectRatio;
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'video');
  if (limited) return limited;
  if (!acquireConcurrentSlot()) return serverBusyResponse();

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nodes-ba-video-'));

  try {
    const body: BeforeAfterVideoRequest = await request.json();
    const { template, beforeImage, afterImage, tokenId, networkStatus, text, aspectRatio = 'square' } = body;
    const dims = DIMENSIONS[aspectRatio] || DIMENSIONS.square;
    const canvasW = dims.w;
    const canvasH = dims.h;

    if (!beforeImage || !afterImage) {
      return NextResponse.json({ error: 'Both before and after images are required' }, { status: 400 });
    }

    console.log(`Creating before/after video: template=${template}, token=${tokenId}`);

    const assets = await loadBrandingAssets();

    // Load GIF frames for animated sources
    const beforeGifData = await fetchGifFrames(beforeImage);
    const afterGifData = await fetchGifFrames(afterImage);
    const beforeRendered = beforeGifData ? prerenderGifFrames(beforeGifData) : null;
    const afterRendered = afterGifData ? prerenderGifFrames(afterGifData) : null;

    // Load static images as fallback
    const beforeImgStatic = await loadImageSafe(beforeImage);
    const afterImgStatic = await loadImageSafe(afterImage);

    if (!beforeImgStatic && !beforeRendered) {
      return NextResponse.json({ error: 'Failed to load before image' }, { status: 400 });
    }
    if (!afterImgStatic && !afterRendered) {
      return NextResponse.json({ error: 'Failed to load after image' }, { status: 400 });
    }

    const isGifTransition = template === 'gif-transition';
    const isSlider = isSliderTemplate(template);

    // Determine duration
    let totalDuration: number;
    if (isGifTransition || isSlider) {
      totalDuration = isSlider ? SLIDER_DURATION : 4000;
    } else {
      totalDuration = 1000;
      if (beforeRendered) totalDuration = Math.max(totalDuration, beforeRendered.totalDuration);
      if (afterRendered) totalDuration = Math.max(totalDuration, afterRendered.totalDuration);
      totalDuration = Math.min(totalDuration, 10000);
    }

    const fps = 30;
    const frameInterval = Math.round(1000 / fps);
    const totalFrames = Math.ceil(totalDuration / frameInterval);

    console.log(`Generating ${totalFrames} frames at ${fps}fps (${totalDuration}ms)`);

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const timeMs = frameIdx * frameInterval;

      ctx.fillStyle = COLORS.black;
      ctx.fillRect(0, 0, canvasW, canvasH);
      drawSubtleGlows(ctx, Math.max(canvasW, canvasH));

      if (isSlider) {
        // Slider reveal animation
        const direction = getSliderDirection(template);
        const progress = getSliderProgress(timeMs);

        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        renderSliderFrame(ctx, direction, progress, bImg, aImg, tokenId, assets, canvasW, canvasH);
      } else if (isGifTransition) {
        // Glitch/scanline wipe transition
        const phase = timeMs / 1000;
        const imgSize = Math.min(canvasW, canvasH) * 0.7;
        const imgX = (canvasW - imgSize) / 2;
        const imgY = canvasH * 0.1;
        const borderRadius = imgSize * 0.08;
        const stripCount = 40;

        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        let showBefore: boolean;
        let wipeProgress = -1;

        if (phase < 1) {
          showBefore = true;
        } else if (phase < 2) {
          wipeProgress = phase - 1;
          showBefore = true;
        } else if (phase < 3) {
          showBefore = false;
        } else {
          wipeProgress = phase - 3;
          showBefore = false;
        }

        if (wipeProgress < 0) {
          const img = showBefore ? bImg : aImg;
          if (img) {
            ctx.save();
            drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
            ctx.clip();
            drawImageCover(ctx, img, imgX, imgY, imgSize, imgSize);
            ctx.restore();
          }
        } else {
          const wipeLine = imgY + imgSize * wipeProgress;
          const fromImg = showBefore ? bImg : aImg;
          const toImg = showBefore ? aImg : bImg;
          const stripH = imgSize / stripCount;

          ctx.save();
          drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
          ctx.clip();

          for (let i = 0; i < stripCount; i++) {
            const stripY = imgY + i * stripH;
            const stripMid = stripY + stripH / 2;
            const isRevealed = stripMid < wipeLine;
            const img = isRevealed ? toImg : fromImg;
            const nearWipe = Math.abs(stripMid - wipeLine) < stripH * 3;
            const seed = Math.sin(i * 127.1 + frameIdx * 0.1) * 0.5 + 0.5;
            const offset = nearWipe ? (seed - 0.5) * 30 * (1 - Math.abs(stripMid - wipeLine) / (stripH * 3)) : 0;

            if (img) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(imgX, stripY, imgSize, stripH);
              ctx.clip();
              drawImageCover(ctx, img, imgX + offset, imgY, imgSize, imgSize);
              ctx.restore();
            }

            if (nearWipe && Math.abs(stripMid - wipeLine) < stripH * 1.5) {
              ctx.fillStyle = `${COLORS.cyan}25`;
              ctx.fillRect(imgX, stripY, imgSize, 2);
            }
          }

          if (wipeProgress > 0.45 && wipeProgress < 0.55) {
            ctx.fillStyle = `${COLORS.cyan}15`;
            ctx.fillRect(imgX, imgY, imgSize, imgSize);
          }

          ctx.restore();
        }

        ctx.strokeStyle = `${COLORS.cyan}30`;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
        ctx.stroke();

        ctx.font = `bold 28px ${BRAND_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const showingBefore = wipeProgress < 0 ? showBefore : (wipeProgress < 0.5 ? showBefore : !showBefore);
        if (showingBefore) {
          ctx.fillStyle = '#888888';
          ctx.fillText('LEGACY', canvasW / 2, canvasH * 0.05);
        } else {
          ctx.fillStyle = COLORS.cyan;
          ctx.fillText(networkStatus.toUpperCase(), canvasW / 2, canvasH * 0.05);
        }

        if (text) drawTextWithGlow(ctx, text, canvasW / 2, canvasH * 0.88, 36);
        drawArtIsNeverFinished(ctx, canvasW, canvasH, networkStatus, !!text);
        drawDRBanner(ctx, assets, networkStatus, canvasW, canvasH);
        drawBrandedWatermark(ctx, assets, canvasW, canvasH);
      } else {
        // Standard templates — get current frame for animated sources
        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        renderTemplate(ctx, template, bImg, aImg, text, networkStatus, assets, canvasW, canvasH);
      }

      // Save frame as PNG
      const frameBuffer = canvas.toBuffer('image/png');
      await fs.writeFile(path.join(tmpDir, `frame_${String(frameIdx).padStart(4, '0')}.png`), frameBuffer);
    }

    console.log('Encoding video with ffmpeg...');

    const outputPath = path.join(tmpDir, 'output.mp4');
    const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${tmpDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${outputPath}"`;

    await execAsync(ffmpegCmd);

    const videoBuffer = await fs.readFile(outputPath);
    console.log(`Video created: ${videoBuffer.length} bytes`);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="nodes-interference-${tokenId}-${Date.now()}.mp4"`,
      },
    });

  } catch (error) {
    console.error('Before/After video creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  } finally {
    releaseConcurrentSlot();
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to cleanup temp dir:', e);
    }
  }
}
