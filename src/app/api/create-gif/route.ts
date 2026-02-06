import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, Image as CanvasImage } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { parseGIF, decompressFrames } from 'gifuct-js';

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
  isAnimated: true;
  frameDelays: number[]; // delay in ms for each frame
}

interface StaticData {
  staticImg: CanvasImage;
  isAnimated: false;
}

type ImageData = (GridCell & GifData) | (GridCell & StaticData);

// Helper to fetch and parse GIF frames with error handling
async function fetchGifFrames(url: string): Promise<GifData | null> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(10000) // 10s timeout
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
    
    // Validate frames have required data
    const validFrames = frames.filter(f => f && f.dims && f.patch);
    if (validFrames.length === 0) {
      throw new Error('No valid frames');
    }
    
    // gifuct-js already converts delay to milliseconds (see lib/index.js:78)
    // Just use it directly, with 20ms minimum (browser floor)
    const frameDelays = validFrames.map(f => {
      const delay = f.delay || 0; // already in ms from gifuct-js
      return delay >= 20 ? delay : (delay > 0 ? 20 : 50);
    });
    
    console.log(`GIF frame delays (first 5): ${frameDelays.slice(0, 5).join(', ')}ms`);
    
    return {
      frames: validFrames,
      width: gif.lsd.width,
      height: gif.lsd.height,
      isAnimated: true,
      frameDelays
    };
  } catch (error) {
    console.error('GIF parsing failed for', url, error);
    return null;
  }
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

// Pre-render all frames of an animated GIF into complete canvases
// Also calculates cumulative timestamps for time-based frame lookup
function prerenderGifFrames(gifData: GifData): { canvases: any[], delays: number[], timestamps: number[], totalDuration: number } {
  const { frames, width, height, frameDelays } = gifData;
  const canvases: any[] = [];
  const delays: number[] = [];
  const timestamps: number[] = []; // cumulative time at start of each frame
  let cumulative = 0;
  
  // Create a persistent canvas to composite frames (GIF disposal handling)
  const compositeCanvas = createCanvas(width, height);
  const compositeCtx = compositeCanvas.getContext('2d');
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    try {
      // Handle disposal from previous frame
      if (i > 0) {
        const prevFrame = frames[i - 1];
        if (prevFrame.disposalType === 2) {
          // Restore to background (clear)
          compositeCtx.clearRect(
            prevFrame.dims.left, 
            prevFrame.dims.top, 
            prevFrame.dims.width, 
            prevFrame.dims.height
          );
        }
        // disposalType 3 (restore to previous) is complex, skip for now
      }
      
      // Create ImageData for this frame's patch
      const patchCanvas = createCanvas(frame.dims.width, frame.dims.height);
      const patchCtx = patchCanvas.getContext('2d');
      const imageData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
      imageData.data.set(new Uint8ClampedArray(frame.patch));
      patchCtx.putImageData(imageData, 0, 0);
      
      // Draw patch onto composite
      compositeCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
      
      // Save a copy of current composite state
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
        delays.push(frameDelay);
      } else {
        canvases.push(createCanvas(width, height));
        delays.push(frameDelay);
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
        const logoPaths = [
          `${cwd}/public/nodes-logo.png`,                      // Dev & Railway
          `${cwd}/.next/standalone/public/nodes-logo.png`,     // Next standalone
          `${cwd}/.next/static/nodes-logo.png`,                // Static build
          '/app/public/nodes-logo.png',                        // Docker absolute
        ];
        console.log(`  Logo paths to try (cwd=${cwd}):`, logoPaths);
        
        let logoLoaded = false;
        for (const logoPath of logoPaths) {
          try {
            const logoImg = await loadImage(logoPath);
            console.log(`  -> Logo loaded from ${logoPath}`);
            loadedCells.push({ cell, staticImg: logoImg, isAnimated: false });
            logoLoaded = true;
            break;
          } catch {
            // Try next path
          }
        }
        
        if (!logoLoaded) {
          // Last resort: try loading from URL (requires request origin)
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
      // Use the longest animation duration (so all GIFs complete at least one loop)
      totalDuration = Math.max(...animatedCells.map(c => c.renderedFrames!.totalDuration));
    }
    
    // Use fixed 30fps output (33ms per frame), each GIF plays at its own speed
    // Cap at 10 seconds max to prevent huge files, but allow full loop of longest GIF
    const outputFps = 30;
    const frameInterval = Math.round(1000 / outputFps); // ~33ms
    const maxDuration = Math.min(totalDuration, 10000); // cap at 10 seconds
    const totalFrames = Math.ceil(maxDuration / frameInterval);
    
    console.log(`Output: ${totalFrames} frames at ${outputFps}fps (${maxDuration}ms duration, original: ${totalDuration}ms)`);
    
    // Create GIF encoder
    const encoder = new GIFEncoder(totalWidth, totalHeight);
    encoder.setDelay(frameInterval); // fixed frame rate
    encoder.setRepeat(0);  // Loop forever
    encoder.setQuality(10);
    encoder.start();
    
    // Create main canvas
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Generate each frame based on elapsed time
    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const currentTimeMs = frameIdx * frameInterval;
      
      // Clear with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      // Draw cell borders for ALL grid positions (including empty ones)
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.cols; col++) {
          const x = padding + col * (cellSize + gap);
          const y = padding + row * (cellSize + gap);
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }
      
      // Draw each loaded image at the correct frame for this time
      for (const { cell, renderedFrames, staticImg, isAnimated } of loadedCells) {
        const x = padding + cell.col * (cellSize + gap);
        const y = padding + cell.row * (cellSize + gap);
        
        try {
          if (isAnimated && renderedFrames && renderedFrames.canvases.length > 0) {
            // Find the correct frame for this GIF at current time
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
          console.error(`Error drawing cell [${cell.row},${cell.col}] at ${currentTimeMs}ms:`, err);
          // Draw a placeholder on error
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
  }
}
