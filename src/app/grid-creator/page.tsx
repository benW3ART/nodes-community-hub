'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ViewOnlyLink } from '@/components/ViewOnlyInput';
import { getNFTsForOwner } from '@/lib/alchemy';
import { useNodesStore } from '@/stores/useNodesStore';
import { NFTCardMini } from '@/components/NFTCard';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';
// gifuct-js removed - animated GIF compositing was too heavy for browsers
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
  const { address, isConnected } = useWalletAddress();
  const { nfts, setNfts } = useNodesStore();
  const [gridConfig, setGridConfig] = useState<GridConfig>(GRID_PRESETS[1]); // 3x3 default
  const [gridCells, setGridCells] = useState<(NodeNFT | 'logo' | 'banner-start' | 'banner-end' | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [showLogoOption, setShowLogoOption] = useState(false);
  const [bannerLogoMode, setBannerLogoMode] = useState(false);
  const [bannerLogoUrl, setBannerLogoUrl] = useState('/nodes-banner-logo.jpg');
  const bannerFileRef = useRef<HTMLInputElement>(null);
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

  const handleCellClick = (index: number, content: NodeNFT | 'logo' | 'banner-start') => {
    const newCells = [...gridCells];
    if (content === 'banner-start') {
      const col = index % gridConfig.cols;
      if (col + 1 >= gridConfig.cols) return; // need room for 2 cells
      newCells[index] = 'banner-start';
      newCells[index + 1] = 'banner-end';
    } else {
      newCells[index] = content;
    }
    setGridCells(newCells);
  };

  const clearCell = (index: number) => {
    const newCells = [...gridCells];
    const cell = newCells[index];
    if (cell === 'banner-start') {
      newCells[index] = null;
      if (index + 1 < newCells.length) newCells[index + 1] = null;
    } else if (cell === 'banner-end') {
      newCells[index] = null;
      if (index - 1 >= 0) newCells[index - 1] = null;
    } else {
      newCells[index] = null;
    }
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
    const cellSizeExport = 600; // High quality export
    const gap = 24;
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
      if (cell === 'banner-end') {
        // Skip — rendered by banner-start
        continue;
      } else if (cell === 'banner-start') {
        const bannerWidth = cellSizeExport * 2 + gap;
        try {
          const img = await loadImage(bannerLogoUrl);
          ctx.fillStyle = '#00D4FF10';
          ctx.fillRect(x, y, bannerWidth, cellSizeExport);
          const imgAspect = img.width / img.height;
          const fitHeight = cellSizeExport * 0.8;
          const fitWidth = fitHeight * imgAspect;
          const cx = x + bannerWidth / 2 - fitWidth / 2;
          const cy = y + cellSizeExport / 2 - fitHeight / 2;
          ctx.drawImage(img, cx, cy, fitWidth, fitHeight);
        } catch {
          ctx.fillStyle = '#00D4FF';
          ctx.font = `bold ${Math.round(cellSizeExport * 0.24)}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('NODES', x + bannerWidth / 2, y + cellSizeExport / 2);
        }
      } else if (cell && cell !== 'logo' && typeof cell === 'object' && cell.image) {
        try {
          const img = await loadImage(cell.image);
          ctx.drawImage(img, x, y, cellSizeExport, cellSizeExport);
        } catch (err) {
          console.error('Failed to load image:', cell.image);
          ctx.fillStyle = '#111111';
          ctx.fillRect(x, y, cellSizeExport, cellSizeExport);
        }
      } else if (cell === 'logo') {
        ctx.fillStyle = '#00D4FF';
        ctx.font = `bold ${Math.round(cellSizeExport * 0.24)}px system-ui`;
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

  const [exportProgress, setExportProgress] = useState('');

  // Server-side GIF export with real animations
  const handleExportGIF = async () => {
    // Collect NFT cells with positions (including logo)
    const cells: {image: string; row: number; col: number; isLogo?: boolean; isBanner?: boolean}[] = [];
    for (let i = 0; i < gridCells.length; i++) {
      const cell = gridCells[i];
      if (cell === 'banner-start') {
        cells.push({
          image: bannerLogoUrl,
          row: Math.floor(i / gridConfig.cols),
          col: i % gridConfig.cols,
          isLogo: true,
          isBanner: true
        });
      } else if (cell === 'banner-end') {
        // skip
      } else if (cell === 'logo') {
        cells.push({
          image: '/nodes-logo.png',
          row: Math.floor(i / gridConfig.cols),
          col: i % gridConfig.cols,
          isLogo: true
        });
      } else if (cell && typeof cell === 'object' && cell.image) {
        cells.push({
          image: cell.image,
          row: Math.floor(i / gridConfig.cols),
          col: i % gridConfig.cols
        });
      }
    }
    
    if (cells.length === 0) {
      alert('Add some NFTs to the grid first!');
      return;
    }
    
    setIsExporting(true);
    setExportProgress('Creating animated GIF (server-side)...');
    
    try {
      const response = await fetch('/api/create-gif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gridConfig, cells }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create GIF');
      }
      
      const blob = await response.blob();
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
    } catch (err) {
      console.error('GIF export failed:', err);
      alert('GIF export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Server-side video export with real animations
  const handleExportVideo = async () => {
    // Collect NFT cells with positions (including logo)
    const cells: {image: string; row: number; col: number; isLogo?: boolean; isBanner?: boolean}[] = [];
    for (let i = 0; i < gridCells.length; i++) {
      const cell = gridCells[i];
      if (cell === 'banner-start') {
        cells.push({
          image: bannerLogoUrl,
          row: Math.floor(i / gridConfig.cols),
          col: i % gridConfig.cols,
          isLogo: true,
          isBanner: true
        });
      } else if (cell === 'banner-end') {
        // skip
      } else if (cell === 'logo') {
        cells.push({
          image: '/nodes-logo.png',
          row: Math.floor(i / gridConfig.cols),
          col: i % gridConfig.cols,
          isLogo: true
        });
      } else if (cell && typeof cell === 'object' && cell.image) {
        cells.push({
          image: cell.image,
          row: Math.floor(i / gridConfig.cols),
          col: i % gridConfig.cols
        });
      }
    }
    
    if (cells.length === 0) {
      alert('Add some NFTs to the grid first!');
      return;
    }
    
    setIsExporting(true);
    setExportProgress('Creating animated video (server-side)...');
    
    try {
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gridConfig, cells }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create video');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `nodes-grid-${gridConfig.name}-${Date.now()}.mp4`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setExportProgress('');
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Calculate cell size based on grid dimensions
  // Use 480px base to fit comfortably in the two-column desktop layout
  const cellSize = Math.floor(480 / Math.max(gridConfig.rows, gridConfig.cols));

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
            <div className="flex flex-col items-center gap-3">
              <ConnectButton />
              <ViewOnlyLink />
            </div>
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
                  <button
                    onClick={() => { setBannerLogoMode(!bannerLogoMode); setShowLogoOption(false); }}
                    className={`btn-secondary flex items-center gap-2 ${bannerLogoMode ? 'ring-2 ring-[#FF6B00]' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Banner (2×1)
                  </button>
                </div>
                {bannerLogoMode && (
                  <div className="mt-3 p-3 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-lg">
                    <p className="text-xs text-[#FF6B00] mb-2">Click a cell to place a 2×1 banner (spans 2 columns). Not available on last column.</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => bannerFileRef.current?.click()}
                        className="text-xs px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded hover:border-[#FF6B00]/50"
                      >
                        Upload Custom Image
                      </button>
                      {bannerLogoUrl !== '/nodes-banner-logo.jpg' && (
                        <button
                          onClick={() => setBannerLogoUrl('/nodes-banner-logo.jpg')}
                          className="text-xs text-gray-500 hover:text-white"
                        >
                          Reset to Default
                        </button>
                      )}
                      <input
                        ref={bannerFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setBannerLogoUrl(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
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
                  <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto p-1">
                    {nfts.map((nft) => (
                      <button
                        key={nft.tokenId}
                        onClick={() => {
                          const emptyCell = gridCells.findIndex(c => c === null);
                          if (emptyCell !== -1) {
                            handleCellClick(emptyCell, nft);
                          }
                        }}
                        className="relative rounded overflow-hidden border border-transparent hover:border-[#00D4FF] active:scale-95 transition-all w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0"
                      >
                        <Image
                          src={nft.image}
                          alt={nft.name}
                          fill
                          className="object-cover"
                          sizes="64px"
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
                PNG = static image • GIF/Video = animated
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
              <div className="flex justify-center overflow-x-auto lg:overflow-x-visible">
                <div 
                  ref={canvasRef}
                  className="bg-black rounded-xl overflow-hidden border border-[#1a1a1a] flex-shrink-0"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridConfig.cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridConfig.rows}, ${cellSize}px)`,
                    gap: '4px',
                    padding: '4px',
                  }}
                >
                  {gridCells.map((cell, index) => {
                    if (cell === 'banner-end') return null;
                    return (
                      <div
                        key={index}
                        className={`grid-cell ${cell ? 'grid-cell-filled' : ''} ${cell === 'logo' ? 'grid-cell-logo' : ''} ${cell === 'banner-start' ? 'border-[#FF6B00]/50' : ''}`}
                        style={{
                          height: cellSize,
                          gridColumn: cell === 'banner-start' ? 'span 2' : undefined,
                          ...(cell !== 'banner-start' ? { width: cellSize } : { overflow: 'hidden', aspectRatio: 'auto' }),
                        }}
                        onClick={() => {
                          if (cell) {
                            clearCell(index);
                          } else if (bannerLogoMode) {
                            handleCellClick(index, 'banner-start');
                            setBannerLogoMode(false);
                          } else if (showLogoOption) {
                            handleCellClick(index, 'logo');
                            setShowLogoOption(false);
                          }
                        }}
                      >
                        {cell === 'banner-start' ? (
                          <div className="w-full h-full flex items-center justify-center bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded overflow-hidden relative">
                            <Image
                              src={bannerLogoUrl}
                              alt="Banner"
                              fill
                              className="object-contain p-2"
                              unoptimized
                            />
                          </div>
                        ) : cell === 'logo' ? (
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
                    );
                  })}
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
