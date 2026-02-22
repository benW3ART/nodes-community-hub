import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, Image as CanvasImage } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import {
  fetchGifFrames,
  prerenderGifFrames,
  getFrameAtTime,
} from '@/lib/canvas-utils';
import { checkRateLimit, acquireConcurrentSlot, releaseConcurrentSlot, serverBusyResponse } from '@/lib/rate-limit';

interface GridCell {
  image: string;
  row: number;
  col: number;
  isLogo?: boolean;
  isBanner?: boolean;
}

interface GridConfig {
  rows: number;
  cols: number;
  name: string;
}

// Fallback: load image as static
async function loadStaticImage(url: string): Promise<CanvasImage | null> {
  try {
    const img = await loadImage(url);
    return img;
  } catch (error) {
    console.error('Static image load failed for', url, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'gif');
  if (limited) return limited;
  if (!acquireConcurrentSlot()) return serverBusyResponse();

  try {
    const body = await request.json();
    const { gridConfig, cells, gridStyle: rawGridStyle }: { gridConfig: GridConfig; cells: GridCell[]; gridStyle?: { exportGap?: number; bgColor?: string; border?: boolean } } = body;

    if (!gridConfig || !cells || cells.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const styleGap = rawGridStyle?.exportGap ?? 24;
    const styleBgColor = rawGridStyle?.bgColor ?? '#000000';
    const styleBorder = rawGridStyle?.border ?? true;

    const cellSize = 600;
    const gap = styleGap;
    const padding = 16;

    const totalWidth = gridConfig.cols * cellSize + (gridConfig.cols - 1) * gap + padding * 2;
    const totalHeight = gridConfig.rows * cellSize + (gridConfig.rows - 1) * gap + padding * 2;

    console.log(`Creating GIF: ${gridConfig.cols}x${gridConfig.rows} grid with ${cells.length} cells`);

    // Load all images - try GIF first, then static
    const loadedCells: {
      cell: GridCell;
      renderedFrames?: { canvases: any[], delays: number[], timestamps: number[], totalDuration: number };
      staticImg?: CanvasImage;
      isAnimated: boolean;
    }[] = [];

    for (const cell of cells) {
      console.log(`Loading cell [${cell.row},${cell.col}]: ${cell.isLogo ? 'LOGO' : cell.image.substring(0, 50)}...`);

      // Handle logo specially - try multiple paths
      if (cell.isLogo) {
        const cwd = process.cwd();
        const logoFile = cell.isBanner ? 'nodes-banner-logo.jpg' : 'logos/nodes.png';
        const logoPaths = [
          `${cwd}/public/${logoFile}`,
          `${cwd}/.next/standalone/public/${logoFile}`,
          `${cwd}/.next/static/${logoFile}`,
          `/app/public/${logoFile}`,
          // Fallback to old logo path
          ...(cell.isBanner ? [] : [
            `${cwd}/public/nodes-logo.png`,
            `/app/public/nodes-logo.png`,
          ]),
        ];
        console.log(`  Logo paths to try (cwd=${cwd}, banner=${!!cell.isBanner}):`, logoPaths);

        let logoLoaded = false;
        for (const logoPath of logoPaths) {
          try {
            const logoImg = await loadImage(logoPath);
            console.log(`  -> ${cell.isBanner ? 'BANNER' : 'LOGO'} loaded from ${logoPath}`);
            loadedCells.push({ cell, staticImg: logoImg, isAnimated: false });
            logoLoaded = true;
            break;
          } catch {
            // Try next path
          }
        }

        if (!logoLoaded) {
          console.error(`  -> Failed to load logo from any path`);
        }
        continue;
      }

      // Try as animated GIF first
      const gifData = await fetchGifFrames(cell.image);
      if (gifData) {
        const renderedFrames = prerenderGifFrames(gifData);
        console.log(`  -> Animated GIF: ${renderedFrames.canvases.length} frames, ${renderedFrames.totalDuration}ms total`);
        loadedCells.push({ cell, renderedFrames, isAnimated: true });
        continue;
      }

      // Fallback to static image
      const staticImg = await loadStaticImage(cell.image);
      if (staticImg) {
        console.log(`  -> Static image loaded`);
        loadedCells.push({ cell, staticImg, isAnimated: false });
        continue;
      }

      // Both failed - log but continue (cell will show as empty)
      console.warn(`  -> FAILED to load image for cell [${cell.row},${cell.col}]`);
    }

    if (loadedCells.length === 0) {
      return NextResponse.json({ error: 'Could not load any images' }, { status: 400 });
    }

    console.log(`Loaded ${loadedCells.length}/${cells.length} cells successfully`);

    // Find the longest animation duration to determine output length
    const animatedCells = loadedCells.filter(c => c.isAnimated && c.renderedFrames);
    let totalDuration = 1000; // default 1 second for static only

    if (animatedCells.length > 0) {
      totalDuration = Math.max(...animatedCells.map(c => c.renderedFrames!.totalDuration));
    }

    // Use fixed 30fps output, cap at 10 seconds
    const outputFps = 30;
    const frameInterval = Math.round(1000 / outputFps);
    const maxDuration = Math.min(totalDuration, 10000);
    const totalFrames = Math.ceil(maxDuration / frameInterval);

    console.log(`Output: ${totalFrames} frames at ${outputFps}fps (${maxDuration}ms duration, original: ${totalDuration}ms)`);

    // Create GIF encoder
    const encoder = new GIFEncoder(totalWidth, totalHeight);
    encoder.setDelay(frameInterval);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();

    // Create main canvas
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');

    // Generate each frame based on elapsed time
    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const currentTimeMs = frameIdx * frameInterval;

      // Clear with background color
      ctx.fillStyle = styleBgColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Draw cell borders for ALL grid positions
      if (styleBorder) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        for (let row = 0; row < gridConfig.rows; row++) {
          for (let col = 0; col < gridConfig.cols; col++) {
            const x = padding + col * (cellSize + gap);
            const y = padding + row * (cellSize + gap);
            ctx.strokeRect(x, y, cellSize, cellSize);
          }
        }
      }

      // Draw each loaded image at the correct frame for this time
      for (const { cell, renderedFrames, staticImg, isAnimated } of loadedCells) {
        const x = padding + cell.col * (cellSize + gap);
        const y = padding + cell.row * (cellSize + gap);

        try {
          if (isAnimated && renderedFrames && renderedFrames.canvases.length > 0) {
            const frameIndex = getFrameAtTime(
              renderedFrames.timestamps,
              renderedFrames.totalDuration,
              currentTimeMs
            );
            const frameCanvas = renderedFrames.canvases[frameIndex];

            if (frameCanvas) {
              ctx.drawImage(frameCanvas, 0, 0, frameCanvas.width, frameCanvas.height, x, y, cellSize, cellSize);
            }
          } else if (staticImg) {
            if (cell.isBanner) {
              const bannerWidth = cellSize * 2 + gap;
              const imgAspect = staticImg.width / staticImg.height;
              const fitHeight = cellSize * 0.8;
              const fitWidth = fitHeight * imgAspect;
              const cx = x + bannerWidth / 2 - fitWidth / 2;
              const cy = y + cellSize / 2 - fitHeight / 2;
              ctx.fillStyle = '#0a0a0a';
              ctx.fillRect(x, y, bannerWidth, cellSize);
              ctx.drawImage(staticImg, cx, cy, fitWidth, fitHeight);
            } else {
              ctx.drawImage(staticImg, x, y, cellSize, cellSize);
            }
          }
        } catch (err) {
          console.error(`Error drawing cell [${cell.row},${cell.col}] at ${currentTimeMs}ms:`, err);
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.fillStyle = '#333';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', x + cellSize/2, y + cellSize/2);
        }
      }

      encoder.addFrame(ctx as any);
    }

    encoder.finish();

    const buffer = encoder.out.getData();
    console.log(`GIF created: ${buffer.length} bytes`);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Disposition': `attachment; filename="nodes-grid-${gridConfig.name}-${Date.now()}.gif"`,
      },
    });

  } catch (error) {
    console.error('Create GIF error:', error);
    return NextResponse.json({ error: 'Failed to create GIF: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  } finally {
    releaseConcurrentSlot();
  }
}
