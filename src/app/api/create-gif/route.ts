import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, Image as CanvasImage } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { parseGIF, decompressFrames } from 'gifuct-js';

interface GridCell {
  image: string;
  row: number;
  col: number;
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
    
    // Extract frame delays (GIF stores in centiseconds, convert to ms)
    // Minimum 20ms (browser limit), default to 50ms if unspecified
    const frameDelays = validFrames.map(f => {
      const delay = (f.delay || 0) * 10; // centiseconds to ms
      // 20ms minimum (browser floor), 50ms default if 0
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
function prerenderGifFrames(gifData: GifData): { canvases: any[], delays: number[] } {
  const { frames, width, height, frameDelays } = gifData;
  const canvases: any[] = [];
  const delays: number[] = [];
  
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
      
      canvases.push(frameCanvas);
      delays.push(frameDelays[i] || 100);
    } catch (err) {
      console.error(`Failed to render frame ${i}:`, err);
      // Push previous frame or empty canvas as fallback
      if (canvases.length > 0) {
        canvases.push(canvases[canvases.length - 1]);
        delays.push(delays[delays.length - 1] || 100);
      } else {
        canvases.push(createCanvas(width, height));
        delays.push(100);
      }
    }
  }
  
  return { canvases, delays };
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
      renderedFrames?: { canvases: any[], delays: number[] }; 
      staticImg?: CanvasImage;
      isAnimated: boolean;
    }[] = [];
    
    for (const cell of cells) {
      console.log(`Loading cell [${cell.row},${cell.col}]: ${cell.image.substring(0, 50)}...`);
      
      // Try as animated GIF first
      const gifData = await fetchGifFrames(cell.image);
      if (gifData) {
        console.log(`  -> Animated GIF with ${gifData.frames.length} frames, delays: ${gifData.frameDelays.slice(0, 3).join(',')}...ms`);
        const renderedFrames = prerenderGifFrames(gifData);
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
    
    // Find the animated cell with the most frames (this will be our "master" timing)
    const animatedCells = loadedCells.filter(c => c.isAnimated && c.renderedFrames);
    let masterDelays: number[] = [100]; // default if no animated
    let maxFrames = 1;
    
    if (animatedCells.length > 0) {
      // Sort by frame count descending, pick the one with most frames
      const sorted = animatedCells.sort((a, b) => 
        (b.renderedFrames?.canvases.length || 0) - (a.renderedFrames?.canvases.length || 0)
      );
      const master = sorted[0].renderedFrames!;
      maxFrames = Math.min(60, master.canvases.length); // cap at 60 frames
      masterDelays = master.delays.slice(0, maxFrames);
    }
    
    console.log(`Generating ${maxFrames} frames with delays from master GIF...`);
    
    // Create GIF encoder
    const encoder = new GIFEncoder(totalWidth, totalHeight);
    encoder.setRepeat(0);  // Loop forever
    encoder.setQuality(10);
    encoder.start();
    
    // Create main canvas
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Generate each frame
    for (let frameIdx = 0; frameIdx < maxFrames; frameIdx++) {
      // Set delay for THIS frame (from master GIF timing)
      const frameDelay = masterDelays[frameIdx] || masterDelays[0] || 100;
      encoder.setDelay(frameDelay);
      
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
      
      // Draw each loaded image
      for (const { cell, renderedFrames, staticImg, isAnimated } of loadedCells) {
        const x = padding + cell.col * (cellSize + gap);
        const y = padding + cell.row * (cellSize + gap);
        
        try {
          if (isAnimated && renderedFrames && renderedFrames.canvases.length > 0) {
            // Get the appropriate frame (loop if needed)
            const frameIndex = frameIdx % renderedFrames.canvases.length;
            const frameCanvas = renderedFrames.canvases[frameIndex];
            
            if (frameCanvas) {
              ctx.drawImage(frameCanvas, 0, 0, frameCanvas.width, frameCanvas.height, x, y, cellSize, cellSize);
            }
          } else if (staticImg) {
            ctx.drawImage(staticImg, x, y, cellSize, cellSize);
          }
        } catch (err) {
          console.error(`Error drawing cell [${cell.row},${cell.col}] frame ${frameIdx}:`, err);
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
