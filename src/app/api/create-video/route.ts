import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, Image as CanvasImage } from 'canvas';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

interface GridCell {
  image: string;
  row: number;
  col: number;
  isLogo?: boolean;
}

interface GridConfig {
  rows: number;
  cols: number;
  name: string;
}

interface GifData {
  frames: any[];
  width: number;
  height: number;
  frameDelays: number[];
}

// Helper to fetch and parse GIF frames
async function fetchGifFrames(url: string): Promise<GifData | null> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);
    
    if (!frames || frames.length === 0) throw new Error('No frames');
    
    const validFrames = frames.filter(f => f && f.dims && f.patch);
    if (validFrames.length === 0) throw new Error('No valid frames');
    
    // gifuct-js already converts delay to milliseconds
    const frameDelays = validFrames.map(f => {
      const delay = f.delay || 0; // already in ms from gifuct-js
      return delay >= 20 ? delay : (delay > 0 ? 20 : 50);
    });
    
    console.log(`GIF frame delays (first 5): ${frameDelays.slice(0, 5).join(', ')}ms`);
    
    return { frames: validFrames, width: gif.lsd.width, height: gif.lsd.height, frameDelays };
  } catch (error) {
    console.error('GIF parsing failed:', url, error);
    return null;
  }
}

// Fallback: load static image
async function loadStaticImage(url: string): Promise<CanvasImage | null> {
  try {
    return await loadImage(url);
  } catch (error) {
    console.error('Static image load failed:', url, error);
    return null;
  }
}

// Pre-render GIF frames with timestamps for time-based lookup
function prerenderGifFrames(gifData: GifData): { canvases: any[], delays: number[], timestamps: number[], totalDuration: number } {
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
      const frameDelay = delays.length > 0 ? delays[delays.length - 1] : 50;
      timestamps.push(cumulative);
      cumulative += frameDelay;
      if (canvases.length > 0) {
        canvases.push(canvases[canvases.length - 1]);
        delays.push(frameDelay);
      } else {
        canvases.push(createCanvas(width, height));
        delays.push(100);
      }
    }
  }
  
  return { canvases, delays, timestamps, totalDuration: cumulative };
}

// Find which frame to show at a given time (with looping)
function getFrameAtTime(timestamps: number[], totalDuration: number, timeMs: number): number {
  const loopedTime = timeMs % totalDuration;
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (loopedTime >= timestamps[i]) {
      return i;
    }
  }
  return 0;
}

export async function POST(request: NextRequest) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nodes-video-'));
  
  try {
    const { gridConfig, cells }: { gridConfig: GridConfig; cells: GridCell[] } = await request.json();
    
    if (!gridConfig || !cells || cells.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const cellSize = 200;
    const gap = 8;
    const padding = 16;
    
    const totalWidth = gridConfig.cols * cellSize + (gridConfig.cols - 1) * gap + padding * 2;
    const totalHeight = gridConfig.rows * cellSize + (gridConfig.rows - 1) * gap + padding * 2;
    
    console.log(`Creating video: ${gridConfig.cols}x${gridConfig.rows} grid`);
    
    // Load all images
    const loadedCells: { 
      cell: GridCell; 
      renderedFrames?: { canvases: any[], delays: number[], timestamps: number[], totalDuration: number }; 
      staticImg?: CanvasImage;
      isAnimated: boolean;
    }[] = [];
    
    for (const cell of cells) {
      // Handle logo specially
      if (cell.isLogo) {
        try {
          const logoPath = process.cwd() + '/public/nodes-logo.png';
          const logoImg = await loadImage(logoPath);
          console.log(`  Cell [${cell.row},${cell.col}]: LOGO`);
          loadedCells.push({ cell, staticImg: logoImg, isAnimated: false });
          continue;
        } catch (err) {
          console.error(`  Failed to load logo:`, err);
          continue;
        }
      }
      
      const gifData = await fetchGifFrames(cell.image);
      if (gifData) {
        const renderedFrames = prerenderGifFrames(gifData);
        console.log(`  Cell [${cell.row},${cell.col}]: ${renderedFrames.canvases.length} frames, ${renderedFrames.totalDuration}ms`);
        loadedCells.push({ cell, renderedFrames, isAnimated: true });
        continue;
      }
      
      const staticImg = await loadStaticImage(cell.image);
      if (staticImg) {
        loadedCells.push({ cell, staticImg, isAnimated: false });
      }
    }
    
    if (loadedCells.length === 0) {
      return NextResponse.json({ error: 'Could not load any images' }, { status: 400 });
    }
    
    // Find longest animation duration
    const animatedCells = loadedCells.filter(c => c.isAnimated && c.renderedFrames);
    let totalDuration = 1000;
    
    if (animatedCells.length > 0) {
      totalDuration = Math.max(...animatedCells.map(c => c.renderedFrames!.totalDuration));
    }
    
    // Use fixed 30fps, duration based on longest GIF
    // Cap at 10 seconds max to prevent huge files, but allow full loop
    const fps = 30;
    const frameInterval = Math.round(1000 / fps);
    const maxDuration = Math.min(totalDuration, 10000); // cap at 10 seconds
    const maxFrames = Math.ceil(maxDuration / frameInterval);
    
    console.log(`Generating ${maxFrames} frames at ${fps} FPS (${maxDuration}ms duration, original: ${totalDuration}ms)...`);
    
    // Create main canvas
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Generate and save each frame as PNG (time-based)
    for (let frameIdx = 0; frameIdx < maxFrames; frameIdx++) {
      const currentTimeMs = frameIdx * frameInterval;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.cols; col++) {
          const x = padding + col * (cellSize + gap);
          const y = padding + row * (cellSize + gap);
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }
      
      for (const { cell, renderedFrames, staticImg, isAnimated } of loadedCells) {
        const x = padding + cell.col * (cellSize + gap);
        const y = padding + cell.row * (cellSize + gap);
        
        try {
          if (isAnimated && renderedFrames && renderedFrames.canvases.length > 0) {
            // Time-based frame selection - each GIF plays at its own speed
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
            ctx.drawImage(staticImg, x, y, cellSize, cellSize);
          }
        } catch (err) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
      
      // Save frame as PNG
      const frameBuffer = canvas.toBuffer('image/png');
      await fs.writeFile(path.join(tmpDir, `frame_${String(frameIdx).padStart(4, '0')}.png`), frameBuffer);
    }
    
    console.log('Encoding video with ffmpeg...');
    
    // Use ffmpeg to create video
    const outputPath = path.join(tmpDir, 'output.mp4');
    const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${tmpDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${outputPath}"`;
    
    await execAsync(ffmpegCmd);
    
    // Read the video file
    const videoBuffer = await fs.readFile(outputPath);
    
    console.log(`Video created: ${videoBuffer.length} bytes`);
    
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="nodes-grid-${gridConfig.name}-${Date.now()}.mp4"`,
      },
    });
    
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json({ error: 'Failed to create video: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to cleanup temp dir:', e);
    }
  }
}
