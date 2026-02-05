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
  Image as ImageIcon,
  Type,
  Palette,
  Layout,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';

interface BannerTemplate {
  id: string;
  name: string;
  slots: number;
  layout: 'single' | 'duo' | 'trio' | 'quad' | 'five' | 'spread';
  description: string;
}

const BANNER_TEMPLATES: BannerTemplate[] = [
  { id: 'single', name: 'Spotlight', slots: 1, layout: 'single', description: 'One NFT, prominent display' },
  { id: 'duo', name: 'Duo', slots: 2, layout: 'duo', description: 'Two NFTs side by side' },
  { id: 'trio', name: 'Trio', slots: 3, layout: 'trio', description: 'Three NFTs centered' },
  { id: 'quad', name: 'Quartet', slots: 4, layout: 'quad', description: 'Four NFTs in a row' },
  { id: 'five', name: 'Quintet', slots: 5, layout: 'five', description: 'Five NFTs showcase' },
  { id: 'spread', name: 'Spread', slots: 5, layout: 'spread', description: 'Artistic spread layout' },
];

interface GradientOption {
  id: string;
  name: string;
  gradient: string;
  textColor: string;
}

const GRADIENT_OPTIONS: GradientOption[] = [
  { id: 'dark', name: 'Dark', gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)', textColor: 'white' },
  { id: 'purple', name: 'Purple Haze', gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)', textColor: 'white' },
  { id: 'cosmic', name: 'Cosmic', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', textColor: 'white' },
  { id: 'sunset', name: 'Sunset', gradient: 'linear-gradient(135deg, #1a0a1a 0%, #3d1f3d 50%, #1a0a1a 100%)', textColor: 'white' },
  { id: 'ocean', name: 'Ocean', gradient: 'linear-gradient(135deg, #0a1a1f 0%, #1a3a4f 50%, #0a1a1f 100%)', textColor: 'white' },
  { id: 'forest', name: 'Forest', gradient: 'linear-gradient(135deg, #0a1a0f 0%, #1a3a2e 50%, #0a1a0f 100%)', textColor: 'white' },
];

interface PatternOption {
  id: string;
  name: string;
  pattern: string;
}

const PATTERN_OPTIONS: PatternOption[] = [
  { id: 'none', name: 'None', pattern: '' },
  { id: 'dots', name: 'Dots', pattern: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 1px, transparent 1px)' },
  { id: 'grid', name: 'Grid', pattern: 'linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)' },
  { id: 'diagonal', name: 'Diagonal', pattern: 'repeating-linear-gradient(45deg, rgba(139, 92, 246, 0.03), rgba(139, 92, 246, 0.03) 2px, transparent 2px, transparent 12px)' },
];

export default function BannerCreatorPage() {
  const { address, isConnected } = useAccount();
  const { nfts, setNfts } = useNodesStore();
  const [selectedTemplate, setSelectedTemplate] = useState<BannerTemplate>(BANNER_TEMPLATES[2]);
  const [selectedNfts, setSelectedNfts] = useState<(NodeNFT | null)[]>([]);
  const [customText, setCustomText] = useState('');
  const [showBranding, setShowBranding] = useState(true);
  const [selectedGradient, setSelectedGradient] = useState<GradientOption>(GRADIENT_OPTIONS[0]);
  const [selectedPattern, setSelectedPattern] = useState<PatternOption>(PATTERN_OPTIONS[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize slots when template changes
  useEffect(() => {
    setSelectedNfts(new Array(selectedTemplate.slots).fill(null));
  }, [selectedTemplate]);

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

  const handleSlotClick = (index: number, nft: NodeNFT) => {
    const newSelection = [...selectedNfts];
    newSelection[index] = nft;
    setSelectedNfts(newSelection);
  };

  const clearSlot = (index: number) => {
    const newSelection = [...selectedNfts];
    newSelection[index] = null;
    setSelectedNfts(newSelection);
  };

  const autoFillSlots = () => {
    if (nfts.length === 0) return;
    const shuffled = [...nfts].sort(() => Math.random() - 0.5);
    const newSelection: (NodeNFT | null)[] = shuffled.slice(0, selectedTemplate.slots);
    while (newSelection.length < selectedTemplate.slots) {
      newSelection.push(null);
    }
    setSelectedNfts(newSelection);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      const link = document.createElement('a');
      link.download = `nodes-banner-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const renderNftSlot = (nft: NodeNFT | null, index: number, size: number, className?: string) => {
    if (nft) {
      return (
        <div key={index} className={`relative ${className || ''}`}>
          <Image
            src={nft.image}
            alt={nft.name}
            width={size}
            height={size}
            className="rounded-xl shadow-2xl border-2 border-purple-500/30"
            style={{ width: size, height: size, objectFit: 'cover' }}
          />
          {nft.interference && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs">
              ⚡
            </div>
          )}
        </div>
      );
    }
    return (
      <div 
        key={index}
        className={`border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center text-gray-500 ${className || ''}`}
        style={{ width: size, height: size }}
      >
        {index + 1}
      </div>
    );
  };

  const renderPreview = () => {
    const slots = selectedNfts;
    const patternStyle = selectedPattern.pattern ? {
      backgroundImage: `${selectedGradient.gradient}, ${selectedPattern.pattern}`,
      backgroundSize: selectedPattern.id === 'dots' ? '20px 20px' : selectedPattern.id === 'grid' ? '40px 40px' : 'auto',
    } : {
      background: selectedGradient.gradient,
    };
    
    return (
      <div 
        ref={canvasRef}
        className="w-[750px] h-[250px] relative overflow-hidden"
        style={patternStyle}
      >
        {/* Ambient glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* NFT Layout */}
        <div className="absolute inset-0 flex items-center justify-center">
          {selectedTemplate.layout === 'single' && (
            <div className="flex items-center gap-8">
              {renderNftSlot(slots[0], 0, 180)}
              {customText && (
                <div className="text-2xl font-bold text-white max-w-xs">
                  {customText}
                </div>
              )}
            </div>
          )}

          {selectedTemplate.layout === 'duo' && (
            <div className="flex items-center gap-6">
              {[0, 1].map((i) => renderNftSlot(slots[i], i, 160))}
            </div>
          )}

          {selectedTemplate.layout === 'trio' && (
            <div className="flex items-center gap-4">
              {renderNftSlot(slots[0], 0, 140)}
              {renderNftSlot(slots[1], 1, 180, '-mt-4')}
              {renderNftSlot(slots[2], 2, 140)}
            </div>
          )}

          {selectedTemplate.layout === 'quad' && (
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((i) => renderNftSlot(slots[i], i, 130))}
            </div>
          )}

          {selectedTemplate.layout === 'five' && (
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => renderNftSlot(slots[i], i, 110))}
            </div>
          )}

          {selectedTemplate.layout === 'spread' && (
            <div className="relative w-full h-full">
              {/* Artistic spread - NFTs at different positions */}
              {slots[0] && (
                <div className="absolute left-8 top-1/2 -translate-y-1/2 rotate-[-5deg]">
                  {renderNftSlot(slots[0], 0, 120)}
                </div>
              )}
              {slots[1] && (
                <div className="absolute left-32 top-4 rotate-[3deg]">
                  {renderNftSlot(slots[1], 1, 100)}
                </div>
              )}
              {slots[2] && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  {renderNftSlot(slots[2], 2, 140)}
                </div>
              )}
              {slots[3] && (
                <div className="absolute right-32 bottom-4 rotate-[-3deg]">
                  {renderNftSlot(slots[3], 3, 100)}
                </div>
              )}
              {slots[4] && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 rotate-[5deg]">
                  {renderNftSlot(slots[4], 4, 120)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Text Overlay (for non-single layouts) */}
        {customText && selectedTemplate.layout !== 'single' && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="inline-block px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
              <span className="text-lg font-semibold text-white">{customText}</span>
            </div>
          </div>
        )}

        {/* NODES Branding */}
        {showBranding && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400/80 text-sm font-medium tracking-wide">NODES</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Banner Creator</h1>
        <p className="text-gray-400 mb-8">
          Create X/Twitter header banners (1500×500) featuring your NODES NFTs
        </p>

        {!isConnected ? (
          <div className="card text-center py-16">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect to access your NODES NFTs</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Preview */}
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                Preview (750×250 - exports at 1500×500)
              </h3>
              <div className="flex justify-center overflow-x-auto pb-4">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                  {renderPreview()}
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={autoFillSlots}
                  disabled={nfts.length === 0}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto Fill
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn-primary flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Export PNG
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-6">
                {/* Template Selection */}
                <div className="card">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-purple-400" />
                    Template
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BANNER_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-3 rounded-lg text-sm transition-all ${
                          selectedTemplate.id === template.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs opacity-70">{template.slots} NFT{template.slots !== 1 ? 's' : ''}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div className="card">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Background
                  </h3>
                  
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Gradient</label>
                    <div className="grid grid-cols-3 gap-2">
                      {GRADIENT_OPTIONS.map((gradient) => (
                        <button
                          key={gradient.id}
                          onClick={() => setSelectedGradient(gradient)}
                          className={`h-12 rounded-lg border-2 transition-all ${
                            selectedGradient.id === gradient.id
                              ? 'border-purple-500 scale-105'
                              : 'border-gray-700'
                          }`}
                          style={{ background: gradient.gradient }}
                          title={gradient.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Pattern Overlay</label>
                    <div className="flex gap-2">
                      {PATTERN_OPTIONS.map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => setSelectedPattern(pattern)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedPattern.id === pattern.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {pattern.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Text */}
                <div className="card">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-purple-400" />
                    Text & Branding
                  </h3>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add your message (optional)..."
                    className="input mb-4"
                    maxLength={40}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBranding}
                      onChange={(e) => setShowBranding(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm">Show NODES branding</span>
                  </label>
                </div>
              </div>

              {/* NFT Selection */}
              <div className="card">
                <h3 className="font-semibold mb-4">Select NFTs for Slots</h3>
                
                <div className="space-y-3 mb-6">
                  {selectedNfts.map((selected, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-400 w-16">Slot {slotIndex + 1}:</span>
                      {selected ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Image
                            src={selected.image}
                            alt={selected.name}
                            width={40}
                            height={40}
                            className="rounded"
                          />
                          <span className="text-sm truncate">{selected.name}</span>
                          <button
                            onClick={() => clearSlot(slotIndex)}
                            className="ml-auto text-gray-500 hover:text-red-400 p-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 text-sm text-gray-500">
                          Click an NFT below to fill
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* NFT Gallery */}
                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm text-gray-400 mb-3">Your NODES ({nfts.length}):</h4>
                  {isLoadingNfts ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  ) : nfts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No NODES found in your wallet</p>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                      {nfts.map((nft) => (
                        <NFTCardMini
                          key={nft.tokenId}
                          nft={nft}
                          onClick={() => {
                            const emptySlot = selectedNfts.findIndex(s => s === null);
                            if (emptySlot !== -1) {
                              handleSlotClick(emptySlot, nft);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
