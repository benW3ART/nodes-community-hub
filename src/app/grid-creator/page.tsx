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

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      // Clone the element to avoid CORS issues
      const element = canvasRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#000000',
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Fix images in cloned document
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            img.crossOrigin = 'anonymous';
          });
        }
      });
      
      const link = document.createElement('a');
      link.download = `nodes-grid-${gridConfig.name}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Try refreshing the page and trying again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVideo = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      // Create a canvas for video recording
      const element = canvasRef.current;
      const rect = element.getBoundingClientRect();
      
      const canvas = document.createElement('canvas');
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      // Capture the current state
      const screenshot = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#000000',
        useCORS: true,
        allowTaint: true,
      });

      // Set up MediaRecorder
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });

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
      };

      // Record for ~1.1 seconds to match NODES GIF duration
      mediaRecorder.start();
      
      let frame = 0;
      const totalFrames = 33; // ~1.1 seconds at 30fps (matching NODES GIF duration)
      
      const animate = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw with subtle pulse effect
        const scale = 1 + Math.sin(frame * 0.1) * 0.02;
        const offsetX = (canvas.width - screenshot.width * scale) / 2;
        const offsetY = (canvas.height - screenshot.height * scale) / 2;
        
        ctx.drawImage(
          screenshot,
          offsetX,
          offsetY,
          screenshot.width * scale,
          screenshot.height * scale
        );
        
        frame++;
        requestAnimationFrame(animate);
      };
      
      animate();
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed. Your browser may not support this feature.');
      setIsExporting(false);
    }
  };

  const cellSize = Math.floor(600 / Math.max(gridConfig.rows, gridConfig.cols));

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Grid Montage Creator</h1>
        <p className="text-gray-400 mb-8">
          Create stunning grid montages with your NODES NFTs
        </p>

        {!isConnected ? (
          <div className="card text-center py-16">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect to access your NODES NFTs</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Grid Size Selection */}
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-purple-400" />
                  Grid Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {GRID_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setGridConfig(preset)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        gridConfig.name === preset.name
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                
                {/* Custom Grid */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Custom Size:</p>
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
                    <span className="text-gray-500">×</span>
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
                <h3 className="font-semibold mb-4">Quick Actions</h3>
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
                    className={`btn-secondary flex items-center gap-2 ${showLogoOption ? 'ring-2 ring-purple-500' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Logo
                  </button>
                </div>
              </div>

              {/* NFT Gallery */}
              <div className="card">
                <h3 className="font-semibold mb-4">Your NODES</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Click on a cell in the preview, then click an NFT to place it
                </p>
                {isLoadingNfts ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading NFTs...
                  </div>
                ) : nfts.length === 0 ? (
                  <p className="text-gray-500">No NODES found in your wallet</p>
                ) : (
                  <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                    {nfts.map((nft) => (
                      <NFTCardMini
                        key={nft.tokenId}
                        nft={nft}
                        onClick={() => {
                          const emptyCell = gridCells.findIndex(c => c === null);
                          if (emptyCell !== -1) {
                            handleCellClick(emptyCell, nft);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Export PNG
                </button>
                <button
                  onClick={handleExportVideo}
                  disabled={isExporting}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Export Video (1.1s)
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="card">
              <h3 className="font-semibold mb-4">Preview ({gridConfig.name})</h3>
              <div className="flex justify-center">
                <div 
                  ref={canvasRef}
                  className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800"
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
                        <div className="w-full h-full flex items-center justify-center bg-purple-600/20">
                          <span className="text-2xl font-bold text-purple-400">N</span>
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
                        <span className="text-gray-600 text-xs">{index + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                Click cells to clear. Click &quot;Add Logo&quot; then a cell to add NODES logo.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
