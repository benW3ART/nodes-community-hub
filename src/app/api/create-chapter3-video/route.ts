import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { checkRateLimit, acquireConcurrentSlot, releaseConcurrentSlot, serverBusyResponse } from '@/lib/rate-limit';
import {
  COLORS,
  loadImageSafe,
  drawSubtleGlows,
  fetchGifFrames,
  prerenderGifFrames,
  getFrameAtTime,
} from '@/lib/canvas-utils';
import {
  CH3_TOTAL,
  ch3GetPhase,
  renderChapter3SliderFrame,
  renderChapter3TransitionFrame,
  getSliderDirection,
} from '@/lib/before-after-templates';

const execAsync = promisify(exec);

interface Chapter3VideoRequest {
  nftImageUrl: string;
  template: string; // 'transition' | 'slider-horizontal' | 'slider-vertical' | 'slider-diagonal'
  tokenId?: string;
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'video');
  if (limited) return limited;
  if (!acquireConcurrentSlot()) return serverBusyResponse();

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nodes-ch3-'));

  try {
    const body: Chapter3VideoRequest = await request.json();
    const { nftImageUrl, template, tokenId = 'unknown' } = body;

    if (!nftImageUrl) {
      return NextResponse.json({ error: 'nftImageUrl is required' }, { status: 400 });
    }

    console.log(`Creating Chapter III video: template=${template}, token=${tokenId}`);

    const cW = 1200;
    const cH = 1200;

    // ── Load static Chapter III assets ───────────────────────────────────────
    // Slot 0: CHAPTER III logo (static image)
    // Slot 1: Selected NFT image (may be animated GIF)
    // Slot 2: Unknown "?" (static image)
    const logoPath    = path.join(process.cwd(), 'public', 'assets', 'chapter3', 'chapter3-logo.png');
    const unknownPath = path.join(process.cwd(), 'public', 'assets', 'chapter3', 'unknown.png');

    const [logoImg, unknownImg] = await Promise.all([
      loadImageSafe(logoPath),
      loadImageSafe(unknownPath),
    ]);

    if (!logoImg)    return NextResponse.json({ error: 'Failed to load Chapter III logo'    }, { status: 500 });
    if (!unknownImg) return NextResponse.json({ error: 'Failed to load Chapter III unknown' }, { status: 500 });

    // NFT image — try GIF first, fall back to static
    const nftGifData  = await fetchGifFrames(nftImageUrl);
    const nftRendered = nftGifData ? prerenderGifFrames(nftGifData) : null;
    const nftImgStatic = nftRendered ? null : await loadImageSafe(nftImageUrl);

    if (!nftRendered && !nftImgStatic) {
      return NextResponse.json({ error: 'Failed to load NFT image' }, { status: 400 });
    }

    if (nftRendered) {
      console.log(`NFT is animated GIF: ${nftRendered.canvases.length} frames, ${nftRendered.totalDuration}ms`);
    }

    // ── Frame generation ──────────────────────────────────────────────────────
    const fps = 30;
    const totalFrames = Math.ceil(CH3_TOTAL / (1000 / fps));

    console.log(`Generating ${totalFrames} frames @ ${fps}fps (${CH3_TOTAL}ms)`);

    const canvas = createCanvas(cW, cH);
    const ctx = canvas.getContext('2d');

    const isSlider = template.startsWith('slider-');

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const timeMs = frameIdx * (1000 / fps);

      // Black background
      ctx.fillStyle = COLORS.black;
      ctx.fillRect(0, 0, cW, cH);
      drawSubtleGlows(ctx, cW);

      // Slot 1: NFT frame at current time (animates if GIF, static otherwise)
      const nftFrame = nftRendered
        ? nftRendered.canvases[getFrameAtTime(nftRendered.timestamps, nftRendered.totalDuration, timeMs)]
        : nftImgStatic;

      // Slots: [CHAPTER III logo, NFT (current frame), unknown "?"]
      const slots: [any, any, any] = [logoImg, nftFrame, unknownImg];

      if (isSlider) {
        const direction = getSliderDirection(template);
        renderChapter3SliderFrame(ctx, direction, timeMs, slots, cW, cH);
      } else {
        // 'transition' — glitch wipe
        renderChapter3TransitionFrame(ctx, timeMs, slots, cW, cH);
      }

      const frameBuffer = canvas.toBuffer('image/png');
      await fs.writeFile(path.join(tmpDir, `frame_${String(frameIdx).padStart(4, '0')}.png`), frameBuffer);
    }

    // ── Encode ────────────────────────────────────────────────────────────────
    console.log('Encoding video with ffmpeg...');
    const outputPath = path.join(tmpDir, 'output.mp4');
    await execAsync(
      `ffmpeg -y -framerate ${fps} -i "${tmpDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${outputPath}"`
    );

    const videoBuffer = await fs.readFile(outputPath);
    console.log(`Chapter III video: ${videoBuffer.length} bytes`);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="nodes-chapter3-${tokenId}-${Date.now()}.mp4"`,
      },
    });

  } catch (error) {
    console.error('Chapter III video creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  } finally {
    releaseConcurrentSlot();
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
}
