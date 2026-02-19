import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  COLORS,
  loadImageSafe,
  drawRoundedRect,
  drawTextWithGlow,
  drawSubtleGlows,
  fetchGifFrames,
  prerenderGifFrames,
  getFrameAtTime,
} from '@/lib/canvas-utils';
import {
  SIZE,
  loadBrandingAssets,
  drawBrandedWatermark,
  drawDRBanner,
  renderTemplate,
} from '@/lib/before-after-templates';

const execAsync = promisify(exec);

interface BeforeAfterVideoRequest {
  template: string;
  beforeImage: string;
  afterImage: string;
  tokenId: string;
  nftName: string;
  networkStatus: string;
  text: string;
}

export async function POST(request: NextRequest) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nodes-ba-video-'));

  try {
    const body: BeforeAfterVideoRequest = await request.json();
    const { template, beforeImage, afterImage, tokenId, networkStatus, text } = body;

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

    // Determine duration
    let totalDuration: number;
    if (isGifTransition) {
      totalDuration = 4000; // 4s crossfade loop
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

    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const timeMs = frameIdx * frameInterval;

      ctx.fillStyle = COLORS.black;
      ctx.fillRect(0, 0, SIZE, SIZE);
      drawSubtleGlows(ctx, SIZE);

      if (isGifTransition) {
        // Crossfade logic (same as create-before-after GIF transition)
        const phase = timeMs / 1000;
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

        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        if (beforeAlpha > 0 && bImg) {
          ctx.save();
          ctx.globalAlpha = beforeAlpha;
          const borderRadius = imgSize * 0.08;
          drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
          ctx.clip();
          ctx.drawImage(bImg, 0, 0, bImg.width, bImg.height, imgX, imgY, imgSize, imgSize);
          ctx.restore();
        }

        if (afterAlpha > 0 && aImg) {
          ctx.save();
          ctx.globalAlpha = afterAlpha;
          const borderRadius = imgSize * 0.08;
          drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, borderRadius);
          ctx.clip();
          ctx.drawImage(aImg, 0, 0, aImg.width, aImg.height, imgX, imgY, imgSize, imgSize);
          ctx.restore();
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
      } else {
        // Standard templates — get current frame for animated sources
        const bImg = beforeRendered
          ? beforeRendered.canvases[getFrameAtTime(beforeRendered.timestamps, beforeRendered.totalDuration, timeMs)]
          : beforeImgStatic;
        const aImg = afterRendered
          ? afterRendered.canvases[getFrameAtTime(afterRendered.timestamps, afterRendered.totalDuration, timeMs)]
          : afterImgStatic;

        renderTemplate(ctx, template, bImg, aImg, text, networkStatus, assets);
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
        'Content-Disposition': `attachment; filename="nodes-evolution-${tokenId}-${Date.now()}.mp4"`,
      },
    });

  } catch (error) {
    console.error('Before/After video creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to cleanup temp dir:', e);
    }
  }
}
