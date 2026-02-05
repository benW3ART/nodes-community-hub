import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
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

// Helper to fetch and parse GIF frames with error handling
async function fetchGifFrames(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);
    
    if (!frames || frames.length === 0) {
      throw new Error('No frames found');
    }
    
    return {
      frames,
      width: gif.lsd.width,
      height: gif.lsd.height,
      isAnimated: true
    };
  } catch (error) {
    console.error('GIF parsing failed for', url, error);
    return null;
  }
}

// Fallback: load image as static
async function loadStaticImage(url: string) {
  try {
    const img = await loadImage(url);
    return img;
  } catch (error) {
    console.error('Static image load failed for', url, error);
    return null;
  }
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
    
    // Try to fetch GIF frames, fallback to static images
    const gifDataList = await Promise.all(
      cells.map(async (cell) => {
        const gifData = await fetchGifFrames(cell.image);
        if (gifData) {
          return { ...cell, ...gifData };
        }
        // Fallback to static image
        const staticImg = await loadStaticImage(cell.image);
        if (staticImg) {
          return { ...cell, staticImg, isAnimated: false };
        }
        return null;
      })
    );
    
    const validData = gifDataList.filter(g => g !== null);
    
    if (validData.length === 0) {
      return NextResponse.json({ error: 'Could not load any images' }, { status: 400 });
    }
    
    // Check if we have any animated GIFs
    const hasAnimated = validData.some(d => d!.isAnimated);
    
    // Determine number of frames
    const animatedData = validData.filter(d => d!.isAnimated && 'frames' in d!);
    const maxFrames = animatedData.length > 0
      ? Math.min(30, Math.max(...animatedData.map(d => (d as any).frames?.length || 1)))
      : 1;
    
    // Create GIF encoder
    const encoder = new GIFEncoder(totalWidth, totalHeight);
    encoder.setDelay(100);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();
    
    // Create main canvas
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Create frame canvases for animated GIFs
    const frameCanvases = validData.map(data => {
      const d = data as any;
      if (d.isAnimated && d.frames) {
        const frameCanvas = createCanvas(d.width, d.height);
        return { data: d, canvas: frameCanvas, ctx: frameCanvas.getContext('2d') };
      }
      return { data: d, canvas: null, ctx: null };
    });
    
    // Generate each frame
    for (let frameIdx = 0; frameIdx < maxFrames; frameIdx++) {
      // Clear with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      // Draw cell borders
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.cols; col++) {
          const x = padding + col * (cellSize + gap);
          const y = padding + row * (cellSize + gap);
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }
      
      // Draw each image
      for (const { data, canvas: frameCanvas, ctx: frameCtx } of frameCanvases) {
        if (!data) continue;
        
        const x = padding + data.col * (cellSize + gap);
        const y = padding + data.row * (cellSize + gap);
        
        if (data.isAnimated && data.frames && frameCtx && frameCanvas) {
          // Animated GIF frame
          const frameIndex = frameIdx % data.frames.length;
          const frame = data.frames[frameIndex];
          
          if (frame && frame.dims && frame.patch) {
            try {
              // Create ImageData from frame
              const imageData = frameCtx.createImageData(frame.dims.width, frame.dims.height);
              imageData.data.set(new Uint8ClampedArray(frame.patch));
              
              // Handle disposal
              if (frame.disposalType === 2) {
                frameCtx.clearRect(0, 0, data.width!, data.height!);
              }
              
              // Draw frame patch
              const patchCanvas = createCanvas(frame.dims.width, frame.dims.height);
              const patchCtx = patchCanvas.getContext('2d');
              patchCtx.putImageData(imageData, 0, 0);
              frameCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
              
              // Draw to main canvas
              ctx.drawImage(frameCanvas, 0, 0, data.width!, data.height!, x, y, cellSize, cellSize);
            } catch (err) {
              console.error('Frame rendering error:', err);
            }
          }
        } else if (data.staticImg) {
          // Static image
          ctx.drawImage(data.staticImg, x, y, cellSize, cellSize);
        }
      }
      
      encoder.addFrame(ctx as any);
    }
    
    encoder.finish();
    
    const buffer = encoder.out.getData();
    
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
