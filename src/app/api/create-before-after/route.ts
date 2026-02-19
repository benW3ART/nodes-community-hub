import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import {
  COLORS,
  loadImageSafe,
  drawRoundedRect,
  drawTextWithGlow,
  drawSubtleGlows,
  fetchGifFrames,
  prerenderGifFrames,
  getFrameAtTime,
  GifData,
} from '@/lib/canvas-utils';
import {
  SIZE,
  loadBrandingAssets,
  drawBrandedWatermark,
  drawDRBanner,
  renderTemplate,
} from '@/lib/before-after-templates';

interface BeforeAfterRequest {
  template: string;
  beforeImage: string;
  afterImage: string;
  tokenId: string;
  nftName: string;
  networkStatus: string;
  text: string;
  outputFormat: 'png' | 'gif';
}

export async function POST(request: NextRequest) {
  try {
    const body: BeforeAfterRequest = await request.json();
    const { template, beforeImage, afterImage, tokenId, nftName, networkStatus, text, outputFormat } = body;

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
    // GIF Transition template — always animated
    // -----------------------------------------------------------------------
    if (isGifTransition) {
      const fps = 30;
      const frameInterval = Math.round(1000 / fps);
      const totalDuration = 4000;
      const totalFrames = Math.ceil(totalDuration / frameInterval);

      const encoder = new GIFEncoder(SIZE, SIZE);
      encoder.setDelay(frameInterval);
      encoder.setRepeat(0);
      encoder.setQuality(10);
      encoder.start();

      const canvas = createCanvas(SIZE, SIZE);
      const ctx = canvas.getContext('2d');

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const timeMs = frameIdx * frameInterval;
        const phase = timeMs / 1000;

        ctx.fillStyle = COLORS.black;
        ctx.fillRect(0, 0, SIZE, SIZE);
        drawSubtleGlows(ctx, SIZE);

        const imgSize = SIZE * 0.7;
        const imgX = (SIZE - imgSize) / 2;
        const imgY = SIZE * 0.1;

        let beforeAlpha: number;
        let afterAlpha: number;

        if (phase < 1) {
          beforeAlpha = 1; afterAlpha = 0;
        } else if (phase < 2) {
          const t = phase - 1; beforeAlpha = 1 - t; afterAlpha = t;
        } else if (phase < 3) {
          beforeAlpha = 0; afterAlpha = 1;
        } else {
          const t = phase - 3; beforeAlpha = t; afterAlpha = 1 - t;
        }

        const getBeforeFrame = () => {
          if (beforeRendered) {
            return beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)];
          }
          return beforeImgStatic;
        };
        const getAfterFrame = () => {
          if (afterRendered) {
            return afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)];
          }
          return afterImgStatic;
        };

        if (beforeAlpha > 0) {
          const bImg = getBeforeFrame();
          if (bImg) {
            ctx.save();
            ctx.globalAlpha = beforeAlpha;
            const borderRadius = imgSize * 0.08;
            drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
            ctx.clip();
            ctx.drawImage(bImg, 0, 0, bImg.width, bImg.height, imgX, imgY, imgSize, imgSize);
            ctx.restore();
          }
        }

        if (afterAlpha > 0) {
          const aImg = getAfterFrame();
          if (aImg) {
            ctx.save();
            ctx.globalAlpha = afterAlpha;
            const borderRadius = imgSize * 0.08;
            drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
            ctx.clip();
            ctx.drawImage(aImg, 0, 0, aImg.width, aImg.height, imgX, imgY, imgSize, imgSize);
            ctx.restore();
          }
        }

        ctx.globalAlpha = 1;
        ctx.strokeStyle = `${COLORS.cyan}30`;
        ctx.lineWidth = 2;
        const borderRadius = imgSize * 0.08;
        drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
        ctx.stroke();

        ctx.font = 'bold 28px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (beforeAlpha > afterAlpha) {
          ctx.fillStyle = '#888888';
          ctx.globalAlpha = beforeAlpha;
          ctx.fillText('LEGACY', SIZE / 2, SIZE * 0.05);
        } else {
          ctx.fillStyle = COLORS.cyan;
          ctx.globalAlpha = afterAlpha;
          ctx.fillText(networkStatus.toUpperCase(), SIZE / 2, SIZE * 0.05);
        }
        ctx.globalAlpha = 1;

        if (text) drawTextWithGlow(ctx, text, SIZE / 2, SIZE * 0.9, 36);
        drawDRBanner(ctx, assets, networkStatus, SIZE);
        drawBrandedWatermark(ctx, assets, SIZE);

        encoder.addFrame(ctx as any);
      }

      encoder.finish();
      const buffer = encoder.out.getData();

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="nodes-evolution-${tokenId}-${Date.now()}.gif"`,
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

      const encoder = new GIFEncoder(SIZE, SIZE);
      encoder.setDelay(frameInterval);
      encoder.setRepeat(0);
      encoder.setQuality(10);
      encoder.start();

      const canvas = createCanvas(SIZE, SIZE);
      const ctx = canvas.getContext('2d');

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const timeMs = frameIdx * frameInterval;

        ctx.fillStyle = COLORS.black;
        ctx.fillRect(0, 0, SIZE, SIZE);
        drawSubtleGlows(ctx, SIZE);

        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        renderTemplate(ctx, template, bImg, aImg, text, networkStatus, assets);

        encoder.addFrame(ctx as any);
      }

      encoder.finish();
      const buffer = encoder.out.getData();

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="nodes-evolution-${tokenId}-${Date.now()}.gif"`,
        },
      });
    }

    // -----------------------------------------------------------------------
    // Static PNG output
    // -----------------------------------------------------------------------
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, SIZE, SIZE);
    drawSubtleGlows(ctx, SIZE);

    renderTemplate(ctx, template, beforeImgStatic, afterImgStatic, text, networkStatus, assets);

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="nodes-evolution-${tokenId}-${Date.now()}.png"`,
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
