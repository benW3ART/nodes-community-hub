'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getNFTsForOwner } from '@/lib/alchemy';
import { useNodesStore } from '@/stores/useNodesStore';
import { NFTCardMini } from '@/components/NFTCard';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { 
  Loader2, 
  Wallet, 
  Download, 
  RotateCcw,
  Grid3X3,
  Shuffle,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';
import { GRID_PRESETS, type GridConfig } from '@/types/nft';

export default function GridCreatorPage() {
  const { address, isConnected } = useAccount();
  const { nfts, setNfts } = useNodesStore();
  const [gridConfig, setGridConfig] = useState<GridConfig>(GRID_PRESETS[1]); // 3x3 default
  const [gridCells, setGridCells] = useState<(NodeNFT | 'logo' | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [showLogoOption, setShowLogoOption] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize grid when config changes
  useEffect(() => {
    const totalCells = gridConfig.rows * gridConfig.cols;
    setGridCells(new Array(totalCells).fill(null));
  }, [gridConfig]);

  // Fetch NFTs
  useEffect(() => {
    async function fetchNFTs() {
      if (!address) return;
      setIsLoadingNfts(true);
      try {
        const fetchedNfts = await getNFTsForOwner(address);
        setNfts(fetchedNfts);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingNfts(false);
      }
    }
    if (isConnected && address) fetchNFTs();
  }, [address, isConnected, setNfts]);

  const handleCellClick = (index: number, content: NodeNFT | 'logo') => {
    const newCells = [...gridCells];
    newCells[index] = content;
    setGridCells(newCells);
  };

  const clearCell = (index: number) => {
    const newCells = [...gridCells];
    newCells[index] = null;
    setGridCells(newCells);
  };

  const clearAll = () => {
    setGridCells(new Array(gridConfig.rows * gridConfig.cols).fill(null));
  };

  const shuffleGrid = () => {
    if (nfts.length === 0) return;
    const totalCells = gridConfig.rows * gridConfig.cols;
    const shuffled = [...nfts].sort(() => Math.random() - 0.5);
    const newCells: (NodeNFT | 'logo' | null)[] = [];
    
    for (let i = 0; i < totalCells; i++) {
      if (i < shuffled.length) {
        newCells.push(shuffled[i]);
      } else {
        newCells.push(null);
      }
    }
    
    setGridCells(newCells);
  };

  // Helper to load image via proxy (CORS workaround)
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Try direct URL if proxy fails
        const directImg = new window.Image();
        directImg.crossOrigin = 'anonymous';
        directImg.onload = () => resolve(directImg);
        directImg.onerror = reject;
        directImg.src = src;
      };
      // Use proxy to avoid CORS issues
      img.src = `/api/proxy-gif?url=${encodeURIComponent(src)}`;
    });
  };

  // Render grid to canvas manually (bypasses html2canvas CORS issues)
  const renderGridToCanvas = async (): Promise<HTMLCanvasElement> => {
    const cellSizeExport = 200; // Fixed size for export
    const gap = 8;
    const padding = 16;
    
    const totalWidth = gridConfig.cols * cellSizeExport + (gridConfig.cols - 1) * gap + padding * 2;
    const totalHeight = gridConfig.rows * cellSizeExport + (gridConfig.rows - 1) * gap + padding * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');
    
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // Draw each cell
    for (let i = 0; i < gridCells.length; i++) {
      const row = Math.floor(i / gridConfig.cols);
      const col = i % gridConfig.cols;
      const x = padding + col * (cellSizeExport + gap);
      const y = padding + row * (cellSizeExport + gap);
      
      // Cell border
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellSizeExport, cellSizeExport);
      
      const cell = gridCells[i];
      if (cell && cell !== 'logo' && cell.image) {
        try {
          const img = await loadImage(cell.image);
          ctx.drawImage(img, x, y, cellSizeExport, cellSizeExport);
        } catch (err) {
          console.error('Failed to load image:', cell.image);
          // Draw placeholder
          ctx.fillStyle = '#111111';
          ctx.fillRect(x, y, cellSizeExport, cellSizeExport);
        }
      } else if (cell === 'logo') {
        // Draw NODES logo placeholder
        ctx.fillStyle = '#00D4FF';
        ctx.font = 'bold 48px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', x + cellSizeExport / 2, y + cellSizeExport / 2);
      }
    }
    
    return canvas;
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderGridToCanvas();
      
      const link = document.createElement('a');
      link.download = `nodes-grid-${gridConfig.name}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Try refreshing the page.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to fetch and parse GIF frames via proxy (CORS workaround)
  const fetchGifFrames = async (url: string): Promise<{frames: ImageData[], delays: number[], width: number, height: number}> => {
    // Use proxy to avoid CORS issues
    const proxyUrl = `/api/proxy-gif?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch GIF');
    const buffer = await response.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true).slice(0, 30); // Limit to 30 frames max
    
    const width = gif.lsd.width;
    const height = gif.lsd.height;
    
    // Convert frames to ImageData
    const imageDataFrames: ImageData[] = [];
    const delays: number[] = [];
    
    // Create a canvas to build up frames
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('No temp context');
    
    for (const frame of frames) {
      // Create ImageData from frame patch
      const frameImageData = new ImageData(
        new Uint8ClampedArray(frame.patch),
        frame.dims.width,
        frame.dims.height
      );
      
      // Draw frame patch at correct position
      const patchCanvas = document.createElement('canvas');
      patchCanvas.width = frame.dims.width;
      patchCanvas.height = frame.dims.height;
      const patchCtx = patchCanvas.getContext('2d');
      if (!patchCtx) continue;
      patchCtx.putImageData(frameImageData, 0, 0);
      
      // Handle disposal
      if (frame.disposalType === 2) {
        tempCtx.clearRect(0, 0, width, height);
      }
      
      tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
      
      // Get full frame
      const fullFrame = tempCtx.getImageData(0, 0, width, height);
      imageDataFrames.push(fullFrame);
      delays.push(frame.delay || 100);
    }
    
    return { frames: imageDataFrames, delays, width, height };
  };

  const [exportProgress, setExportProgress] = useState('');

  const handleExportGIF = async () => {
    // Count NFTs in grid
    const nftCount = gridCells.filter(c => c && c !== 'logo').length;
    if (nftCount === 0) {
      alert('Add some NFTs to the grid first!');
      return;
    }
    if (nftCount > 9) {
      alert(`Too many NFTs (${nftCount}). GIF export works best with 9 or fewer NFTs. Use PNG for larger grids.`);
      return;
    }
    
    setIsExporting(true);
    setExportProgress('Loading GIF frames...');
    
    try {
      const cellSizeExport = 200;
      const gap = 8;
      const padding = 16;
      
      const totalWidth = gridConfig.cols * cellSizeExport + (gridConfig.cols - 1) * gap + padding * 2;
      const totalHeight = gridConfig.rows * cellSizeExport + (gridConfig.rows - 1) * gap + padding * 2;
      
      // Collect all NFT GIFs with their positions
      const nftData: {url: string, row: number, col: number}[] = [];
      for (let i = 0; i < gridCells.length; i++) {
        const cell = gridCells[i];
        if (cell && cell !== 'logo' && cell.image) {
          nftData.push({
            url: cell.image,
            row: Math.floor(i / gridConfig.cols),
            col: i % gridConfig.cols
          });
        }
      }
      
      if (nftData.length === 0) {
        alert('Add some NFTs to the grid first!');
        setIsExporting(false);
        return;
      }
      
      // Fetch all GIF frames
      const allGifData = await Promise.all(
        nftData.map(async (nft) => {
          try {
            const gifData = await fetchGifFrames(nft.url);
            return { ...nft, ...gifData };
          } catch (err) {
            console.error('Failed to parse GIF:', nft.url, err);
            return null;
          }
        })
      );
      
      const validGifs = allGifData.filter(g => g !== null) as NonNullable<typeof allGifData[0]>[];
      
      if (validGifs.length === 0) {
        alert('Could not load any GIF frames. Try refreshing.');
        setIsExporting(false);
        return;
      }
      
      // Find max frames and typical delay
      const maxFrames = Math.max(...validGifs.map(g => g.frames.length));
      const avgDelay = Math.round(validGifs.reduce((sum, g) => sum + (g.delays[0] || 100), 0) / validGifs.length);
      
      // Create output GIF
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: totalWidth,
        height: totalHeight,
        workerScript: '/gif.worker.js',
        repeat: 0,
      });
      
      // Create composite canvas
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = totalWidth;
      compositeCanvas.height = totalHeight;
      const compositeCtx = compositeCanvas.getContext('2d');
      if (!compositeCtx) throw new Error('No composite context');
      
      // Generate each frame
      for (let frameIdx = 0; frameIdx < maxFrames; frameIdx++) {
        // Clear with black background
        compositeCtx.fillStyle = '#000000';
        compositeCtx.fillRect(0, 0, totalWidth, totalHeight);
        
        // Draw cell borders
        for (let i = 0; i < gridCells.length; i++) {
          const row = Math.floor(i / gridConfig.cols);
          const col = i % gridConfig.cols;
          const x = padding + col * (cellSizeExport + gap);
          const y = padding + row * (cellSizeExport + gap);
          compositeCtx.strokeStyle = '#1a1a1a';
          compositeCtx.lineWidth = 2;
          compositeCtx.strokeRect(x, y, cellSizeExport, cellSizeExport);
        }
        
        // Draw each NFT's current frame
        for (const gifData of validGifs) {
          const frameIndex = frameIdx % gifData.frames.length;
          const frame = gifData.frames[frameIndex];
          
          const x = padding + gifData.col * (cellSizeExport + gap);
          const y = padding + gifData.row * (cellSizeExport + gap);
          
          // Create temp canvas for this frame
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = gifData.width;
          tempCanvas.height = gifData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) continue;
          tempCtx.putImageData(frame, 0, 0);
          
          // Draw scaled to cell
          compositeCtx.drawImage(tempCanvas, x, y, cellSizeExport, cellSizeExport);
        }
        
        gif.addFrame(compositeCtx, { copy: true, delay: avgDelay });
      }
      
      setExportProgress('Creating GIF...');
      
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `nodes-grid-${gridConfig.name}-${Date.now()}.gif`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress('');
      });
      
      gif.render();
    } catch (err) {
      console.error('GIF export failed:', err);
      alert('GIF export failed. Try with fewer NFTs or use PNG export.');
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleExportVideo = async () => {
    const nftCount = gridCells.filter(c => c && c !== 'logo').length;
    if (nftCount === 0) {
      alert('Add some NFTs to the grid first!');
      return;
    }
    if (nftCount > 9) {
      alert(`Too many NFTs (${nftCount}). Video export works best with 9 or fewer NFTs. Use PNG for larger grids.`);
      return;
    }
    
    setIsExporting(true);
    setExportProgress('Loading GIF frames...');
    
    try {
      const cellSizeExport = 200;
      const gap = 8;
      const padding = 16;
      
      const totalWidth = gridConfig.cols * cellSizeExport + (gridConfig.cols - 1) * gap + padding * 2;
      const totalHeight = gridConfig.rows * cellSizeExport + (gridConfig.rows - 1) * gap + padding * 2;
      
      // Collect all NFT GIFs
      const nftData: {url: string, row: number, col: number}[] = [];
      for (let i = 0; i < gridCells.length; i++) {
        const cell = gridCells[i];
        if (cell && cell !== 'logo' && cell.image) {
          nftData.push({
            url: cell.image,
            row: Math.floor(i / gridConfig.cols),
            col: i % gridConfig.cols
          });
        }
      }
      
      // Fetch all GIF frames
      const allGifData = await Promise.all(
        nftData.map(async (nft) => {
          try {
            const gifData = await fetchGifFrames(nft.url);
            return { ...nft, ...gifData };
          } catch (err) {
            console.error('Failed to parse GIF:', nft.url, err);
            return null;
          }
        })
      );
      
      const validGifs = allGifData.filter(g => g !== null) as NonNullable<typeof allGifData[0]>[];
      
      if (validGifs.length === 0) {
        alert('Could not load any GIF frames.');
        setIsExporting(false);
        return;
      }
      
      const maxFrames = Math.max(...validGifs.map(g => g.frames.length));
      
      // Create video canvas
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });
      
      setExportProgress('Recording video...');
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `nodes-grid-${gridConfig.name}-${Date.now()}.webm`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress('');
      };
      
      mediaRecorder.start();
      
      let frameIdx = 0;
      const totalFramesToRecord = maxFrames * 2; // Loop twice
      
      const animate = () => {
        if (frameIdx >= totalFramesToRecord) {
          mediaRecorder.stop();
          return;
        }
        
        // Clear
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, totalWidth, totalHeight);
        
        // Draw cell borders
        for (let i = 0; i < gridCells.length; i++) {
          const row = Math.floor(i / gridConfig.cols);
          const col = i % gridConfig.cols;
          const x = padding + col * (cellSizeExport + gap);
          const y = padding + row * (cellSizeExport + gap);
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellSizeExport, cellSizeExport);
        }
        
        // Draw each NFT frame
        for (const gifData of validGifs) {
          const gifFrameIdx = frameIdx % gifData.frames.length;
          const frame = gifData.frames[gifFrameIdx];
          
          const x = padding + gifData.col * (cellSizeExport + gap);
          const y = padding + gifData.row * (cellSizeExport + gap);
          
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = gifData.width;
          tempCanvas.height = gifData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) continue;
          tempCtx.putImageData(frame, 0, 0);
          
          ctx.drawImage(tempCanvas, x, y, cellSizeExport, cellSizeExport);
        }
        
        frameIdx++;
        requestAnimationFrame(animate);
      };
      
      animate();
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed. Try with fewer NFTs or use PNG export.');
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const cellSize = Math.floor(600 / Math.max(gridConfig.rows, gridConfig.cols));

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Grid Montage Creator</h1>
        <p className="text-gray-500 mb-8">
          Create stunning grid montages with your NODES NFTs
        </p>

        {!isConnected ? (
          <div className="card text-center py-16">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-gray-700" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 mb-6">Connect to access your NODES NFTs</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Grid Size Selection */}
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Grid3X3 className="w-5 h-5 text-[#00D4FF]" />
                  Grid Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {GRID_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setGridConfig(preset)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        gridConfig.name === preset.name
                          ? 'bg-[#00D4FF] text-black'
                          : 'bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#00D4FF]/50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                
                {/* Custom Grid */}
                <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                  <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Custom Size:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gridConfig.rows}
                      onChange={(e) => setGridConfig({
                        ...gridConfig,
                        rows: parseInt(e.target.value) || 1,
                        name: 'Custom'
                      })}
                      className="input w-20 text-center"
                    />
                    <span className="text-gray-600">×</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gridConfig.cols}
                      onChange={(e) => setGridConfig({
                        ...gridConfig,
                        cols: parseInt(e.target.value) || 1,
                        name: 'Custom'
                      })}
                      className="input w-20 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="font-semibold mb-4 uppercase tracking-wide">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={shuffleGrid}
                    disabled={nfts.length === 0}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    Random Fill
                  </button>
                  <button
                    onClick={clearAll}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowLogoOption(!showLogoOption)}
                    className={`btn-secondary flex items-center gap-2 ${showLogoOption ? 'ring-2 ring-[#00D4FF]' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Logo
                  </button>
                </div>
              </div>

              {/* NFT Gallery */}
              <div className="card">
                <h3 className="font-semibold mb-4 uppercase tracking-wide">Your NODES</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Click on a cell in the preview, then click an NFT to place it
                </p>
                {isLoadingNfts ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading NFTs...
                  </div>
                ) : nfts.length === 0 ? (
                  <p className="text-gray-600">No NODES found in your wallet</p>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[50vh] overflow-y-auto p-1" style={{ gridAutoRows: '1fr' }}>
                    {nfts.map((nft) => (
                      <button
                        key={nft.tokenId}
                        onClick={() => {
                          const emptyCell = gridCells.findIndex(c => c === null);
                          if (emptyCell !== -1) {
                            handleCellClick(emptyCell, nft);
                          }
                        }}
                        className="relative rounded overflow-hidden border border-transparent hover:border-[#00D4FF] active:scale-95 transition-all"
                        style={{ aspectRatio: '1/1' }}
                      >
                        <Image
                          src={nft.image}
                          alt={nft.name}
                          fill
                          className="object-cover"
                          sizes="60px"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  PNG
                </button>
                <button
                  onClick={handleExportGIF}
                  disabled={isExporting}
                  className="btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  GIF
                </button>
                <button
                  onClick={handleExportVideo}
                  disabled={isExporting}
                  className="btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Video
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                GIF &amp; Video preserve animations (max 9 NFTs) ✨
              </p>
              {exportProgress && (
                <p className="text-xs text-[#00D4FF] mt-2 text-center animate-pulse">
                  {exportProgress}
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="card">
              <h3 className="font-semibold mb-4 uppercase tracking-wide">Preview ({gridConfig.name})</h3>
              <div className="flex justify-center">
                <div 
                  ref={canvasRef}
                  className="bg-black rounded-xl overflow-hidden border border-[#1a1a1a]"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridConfig.cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridConfig.rows}, ${cellSize}px)`,
                    gap: '4px',
                    padding: '4px',
                  }}
                >
                  {gridCells.map((cell, index) => (
                    <div
                      key={index}
                      className={`grid-cell ${cell ? 'grid-cell-filled' : ''} ${cell === 'logo' ? 'grid-cell-logo' : ''}`}
                      style={{ width: cellSize, height: cellSize }}
                      onClick={() => {
                        if (cell) {
                          clearCell(index);
                        } else if (showLogoOption) {
                          handleCellClick(index, 'logo');
                          setShowLogoOption(false);
                        }
                      }}
                    >
                      {cell === 'logo' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#00D4FF]/10 p-2">
                          <Image
                            src="/nodes-logo.png"
                            alt="NODES"
                            width={cellSize - 16}
                            height={cellSize - 16}
                            className="object-contain"
                          />
                        </div>
                      ) : cell ? (
                        <Image
                          src={cell.image}
                          alt={cell.name}
                          width={cellSize}
                          height={cellSize}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-700 text-xs">{index + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Click cells to clear. Click &quot;Add Logo&quot; then a cell to add NODES logo.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
