import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
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
  GifData,
} from '@/lib/canvas-utils';
import {
  DIMENSIONS,
  loadBrandingAssets,
  drawBrandedWatermark,
  drawDRBanner,
  drawArtIsNeverFinished,
  renderTemplate,
} from '@/lib/before-after-templates';
import type { AspectRatio } from '@/lib/before-after-templates';

interface BeforeAfterRequest {
  template: string;
  beforeImage: string;
  afterImage: string;
  tokenId: string;
  nftName: string;
  networkStatus: string;
  text: string;
  outputFormat: 'png' | 'gif';
  aspectRatio?: AspectRatio;
}

export async function POST(request: NextRequest) {
  try {
    const body: BeforeAfterRequest = await request.json();
    const { template, beforeImage, afterImage, tokenId, nftName, networkStatus, text, outputFormat, aspectRatio = 'square' } = body;
    const dims = DIMENSIONS[aspectRatio] || DIMENSIONS.square;
    const canvasW = dims.w;
    const canvasH = dims.h;

    if (!beforeImage || !afterImage) {
      return NextResponse.json({ error: 'Both before and after images are required' }, { status: 400 });
    }

    const assets = await loadBrandingAssets();

    // Determine if we need GIF output
    const isGifTransition = template === 'gif-transition';
    const needsGif = outputFormat === 'gif' || isGifTransition;

    // Try loading as GIF frames first for animated content
    let beforeGifData: GifData | null = null;
    let afterGifData: GifData | null = null;
    let beforeRendered: ReturnType<typeof prerenderGifFrames> | null = null;
    let afterRendered: ReturnType<typeof prerenderGifFrames> | null = null;

    if (needsGif) {
      beforeGifData = await fetchGifFrames(beforeImage);
      afterGifData = await fetchGifFrames(afterImage);

      if (beforeGifData) {
        beforeRendered = prerenderGifFrames(beforeGifData);
      }
      if (afterGifData) {
        afterRendered = prerenderGifFrames(afterGifData);
      }
    }

    // Load static images (always needed as fallback or for PNG output)
    const beforeImgStatic = await loadImageSafe(beforeImage);
    const afterImgStatic = await loadImageSafe(afterImage);

    if (!beforeImgStatic && !beforeRendered) {
      return NextResponse.json({ error: 'Failed to load before image' }, { status: 400 });
    }
    if (!afterImgStatic && !afterRendered) {
      return NextResponse.json({ error: 'Failed to load after image' }, { status: 400 });
    }

    // -----------------------------------------------------------------------
    // GIF Transition template — glitch/scanline wipe animation
    // -----------------------------------------------------------------------
    if (isGifTransition) {
      const fps = 30;
      const frameInterval = Math.round(1000 / fps);
      const totalDuration = 4000;
      const totalFrames = Math.ceil(totalDuration / frameInterval);

      const encoder = new GIFEncoder(canvasW, canvasH);
      encoder.setDelay(frameInterval);
      encoder.setRepeat(0);
      encoder.setQuality(10);
      encoder.start();

      const canvas = createCanvas(canvasW, canvasH);
      const ctx = canvas.getContext('2d');

      // Pre-generate deterministic random offsets for scanline strips
      const stripCount = 40;
      const stripOffsets = Array.from({ length: stripCount }, () => (Math.random() - 0.5) * 30);

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const timeMs = frameIdx * frameInterval;
        const phase = timeMs / 1000;

        ctx.fillStyle = COLORS.black;
        ctx.fillRect(0, 0, canvasW, canvasH);
        drawSubtleGlows(ctx, Math.max(canvasW, canvasH));

        const imgSize = Math.min(canvasW, canvasH) * 0.7;
        const imgX = (canvasW - imgSize) / 2;
        const imgY = canvasH * 0.1;
        const borderRadius = imgSize * 0.08;

        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        // Phase timing: 0-1s show before, 1-2s wipe to after, 2-3s show after, 3-4s wipe to before
        let showBefore: boolean;
        let wipeProgress = -1; // -1 = no wipe active

        if (phase < 1) {
          showBefore = true;
        } else if (phase < 2) {
          wipeProgress = phase - 1; // 0→1 wipe from before to after
          showBefore = true;
        } else if (phase < 3) {
          showBefore = false;
        } else {
          wipeProgress = phase - 3; // 0→1 wipe from after to before
          showBefore = false;
        }

        if (wipeProgress < 0) {
          // Static frame — show one image fully
          const img = showBefore ? bImg : aImg;
          if (img) {
            ctx.save();
            drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
            ctx.clip();
            drawImageCover(ctx, img, imgX, imgY, imgSize, imgSize);
            ctx.restore();
          }
        } else {
          // Scanline wipe — horizontal strips transition with glitch offset
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
            const offset = nearWipe ? stripOffsets[i] * (1 - Math.abs(stripMid - wipeLine) / (stripH * 3)) : 0;

            if (img) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(imgX, stripY, imgSize, stripH);
              ctx.clip();
              drawImageCover(ctx, img, imgX + offset, imgY, imgSize, imgSize);
              ctx.restore();
            }

            // Cyan scanline near wipe edge
            if (nearWipe && Math.abs(stripMid - wipeLine) < stripH * 1.5) {
              ctx.fillStyle = `${COLORS.cyan}25`;
              ctx.fillRect(imgX, stripY, imgSize, 2);
            }
          }

          // Flash at wipe midpoint
          if (wipeProgress > 0.45 && wipeProgress < 0.55) {
            ctx.fillStyle = `${COLORS.cyan}15`;
            ctx.fillRect(imgX, imgY, imgSize, imgSize);
          }

          ctx.restore();
        }

        // Border
        ctx.strokeStyle = `${COLORS.cyan}30`;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
        ctx.stroke();

        // Label
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

        if (text) drawTextWithGlow(ctx, text, canvasW / 2, canvasH * 0.9, 36);
        drawArtIsNeverFinished(ctx, canvasW, canvasH, networkStatus);
        drawDRBanner(ctx, assets, networkStatus, canvasW, canvasH);
        drawBrandedWatermark(ctx, assets, canvasW, canvasH);

        encoder.addFrame(ctx as any);
      }

      encoder.finish();
      const buffer = encoder.out.getData();

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="nodes-interference-${tokenId}-${Date.now()}.gif"`,
        },
      });
    }

    // -----------------------------------------------------------------------
    // Animated GIF output for non-transition templates
    // -----------------------------------------------------------------------
    if (needsGif && (beforeRendered || afterRendered)) {
      const fps = 30;
      const frameInterval = Math.round(1000 / fps);

      let maxDuration = 1000;
      if (beforeRendered) maxDuration = Math.max(maxDuration, beforeRendered.totalDuration);
      if (afterRendered) maxDuration = Math.max(maxDuration, afterRendered.totalDuration);
      maxDuration = Math.min(maxDuration, 10000);

      const totalFrames = Math.ceil(maxDuration / frameInterval);

      const encoder = new GIFEncoder(canvasW, canvasH);
      encoder.setDelay(frameInterval);
      encoder.setRepeat(0);
      encoder.setQuality(10);
      encoder.start();

      const canvas = createCanvas(canvasW, canvasH);
      const ctx = canvas.getContext('2d');

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const timeMs = frameIdx * frameInterval;

        ctx.fillStyle = COLORS.black;
        ctx.fillRect(0, 0, canvasW, canvasH);
        drawSubtleGlows(ctx, Math.max(canvasW, canvasH));

        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        renderTemplate(ctx, template, bImg, aImg, text, networkStatus, assets, canvasW, canvasH);

        encoder.addFrame(ctx as any);
      }

      encoder.finish();
      const buffer = encoder.out.getData();

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="nodes-interference-${tokenId}-${Date.now()}.gif"`,
        },
      });
    }

    // -----------------------------------------------------------------------
    // Static PNG output
    // -----------------------------------------------------------------------
    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, canvasW, canvasH);
    drawSubtleGlows(ctx, Math.max(canvasW, canvasH));

    renderTemplate(ctx, template, beforeImgStatic, afterImgStatic, text, networkStatus, assets, canvasW, canvasH);

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="nodes-interference-${tokenId}-${Date.now()}.png"`,
      },
    });

  } catch (error) {
    console.error('Before/After creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create before/after image', details: String(error) },
      { status: 500 }
    );
  }
}
