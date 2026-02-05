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

// Helper to fetch and parse GIF frames
async function fetchGifFrames(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);
  
  return {
    frames,
    width: gif.lsd.width,
    height: gif.lsd.height
  };
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
    
    // Fetch all GIF data
    const gifDataList = await Promise.all(
      cells.map(async (cell) => {
        try {
          const data = await fetchGifFrames(cell.image);
          return { ...cell, ...data };
        } catch (err) {
          console.error('Failed to fetch GIF:', cell.image, err);
          return null;
        }
      })
    );
    
    const validGifs = gifDataList.filter(g => g !== null);
    
    if (validGifs.length === 0) {
      return NextResponse.json({ error: 'Could not load any GIFs' }, { status: 400 });
    }
    
    // Find max frames
    const maxFrames = Math.min(30, Math.max(...validGifs.map(g => g!.frames.length)));
    
    // Create GIF encoder
    const encoder = new GIFEncoder(totalWidth, totalHeight);
    encoder.setDelay(100);
    encoder.setRepeat(0); // Loop forever
    encoder.setQuality(10);
    encoder.start();
    
    // Create canvas
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Create frame canvases for each GIF
    const gifCanvases = validGifs.map(gifData => {
      const frameCanvas = createCanvas(gifData!.width, gifData!.height);
      return { gifData, canvas: frameCanvas, ctx: frameCanvas.getContext('2d') };
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
      
      // Draw each GIF's current frame
      for (const { gifData, canvas: frameCanvas, ctx: frameCtx } of gifCanvases) {
        if (!gifData || !frameCtx) continue;
        
        const frameIndex = frameIdx % gifData.frames.length;
        const frame = gifData.frames[frameIndex];
        
        // Create ImageData from frame
        const imageData = frameCtx.createImageData(frame.dims.width, frame.dims.height);
        imageData.data.set(new Uint8ClampedArray(frame.patch));
        
        // Handle disposal
        if (frame.disposalType === 2) {
          frameCtx.clearRect(0, 0, gifData.width, gifData.height);
        }
        
        // Draw frame patch
        const patchCanvas = createCanvas(frame.dims.width, frame.dims.height);
        const patchCtx = patchCanvas.getContext('2d');
        patchCtx.putImageData(imageData, 0, 0);
        frameCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
        
        // Draw to main canvas
        const x = padding + gifData.col * (cellSize + gap);
        const y = padding + gifData.row * (cellSize + gap);
        ctx.drawImage(frameCanvas, 0, 0, gifData.width, gifData.height, x, y, cellSize, cellSize);
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
    return NextResponse.json({ error: 'Failed to create GIF' }, { status: 500 });
  }
}
