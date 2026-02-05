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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap
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
  { id: 'dark', name: 'Pure Black', gradient: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)', textColor: 'white' },
  { id: 'midnight', name: 'Midnight', gradient: 'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)', textColor: 'white' },
  { id: 'cyber', name: 'Cyber', gradient: 'linear-gradient(135deg, #000000 0%, #001a1a 50%, #000000 100%)', textColor: 'white' },
  { id: 'void', name: 'Void', gradient: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)', textColor: 'white' },
  { id: 'deep', name: 'Deep', gradient: 'linear-gradient(135deg, #000000 0%, #0a0a0f 50%, #000000 100%)', textColor: 'white' },
  { id: 'carbon', name: 'Carbon', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%)', textColor: 'white' },
];

interface PatternOption {
  id: string;
  name: string;
  pattern: string;
}

const PATTERN_OPTIONS: PatternOption[] = [
  { id: 'none', name: 'None', pattern: '' },
  { id: 'dots', name: 'Dots', pattern: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 1px, transparent 1px)' },
  { id: 'grid', name: 'Grid', pattern: 'linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)' },
  { id: 'diagonal', name: 'Diagonal', pattern: 'repeating-linear-gradient(45deg, rgba(0, 212, 255, 0.03), rgba(0, 212, 255, 0.03) 2px, transparent 2px, transparent 12px)' },
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
  const [showNftPicker, setShowNftPicker] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
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
    setShowNftPicker(false);
    setActiveSlot(null);
  };

  const clearSlot = (index: number) => {
    const newSelection = [...selectedNfts];
    newSelection[index] = null;
    setSelectedNfts(newSelection);
  };

  const openNftPicker = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    setShowNftPicker(true);
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
            className="rounded-xl shadow-2xl border border-[#00D4FF]/30"
            style={{ width: size, height: size, objectFit: 'cover' }}
          />
          {nft.interference && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#4FFFDF] rounded-full flex items-center justify-center text-xs text-black">
              ⚡
            </div>
          )}
        </div>
      );
    }
    return (
      <div 
        key={index}
        className={`border-2 border-dashed border-[#1a1a1a] rounded-xl flex items-center justify-center text-gray-600 ${className || ''}`}
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
        className="w-[750px] h-[250px] relative overflow-hidden flex-shrink-0"
        style={patternStyle}
      >
        {/* Ambient glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
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
            <div className="inline-block px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-[#00D4FF]/30">
              <span className="text-lg font-semibold text-white">{customText}</span>
            </div>
          </div>
        )}

        {/* NODES Branding */}
        {showBranding && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <Image
                src="/nodes-logo.png"
                alt="NODES"
                fill
                className="object-cover rounded"
              />
            </div>
            <span className="text-[#00D4FF]/80 text-sm font-medium tracking-widest uppercase">NODES</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Banner Creator</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
          Create X/Twitter header banners (1500×500) featuring your NODES NFTs
        </p>

        {!isConnected ? (
          <div className="card text-center py-12 sm:py-16">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Connect to access your NODES NFTs</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Preview - Scrollable on mobile */}
            <div className="card">
              <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                Preview
                <span className="text-xs text-gray-600 font-normal normal-case">(scroll to see full banner)</span>
              </h3>
              <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-[#1a1a1a] inline-block">
                  {renderPreview()}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4">
                <button
                  onClick={autoFillSlots}
                  disabled={nfts.length === 0}
                  className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto Fill
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2"
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

            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Controls */}
              <div className="space-y-4 sm:space-y-6">
                {/* Template Selection */}
                <div className="card">
                  <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                    <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Template
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                    {BANNER_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-all active:scale-95 ${
                          selectedTemplate.id === template.id
                            ? 'bg-[#00D4FF] text-black'
                            : 'bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#00D4FF]/50'
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
                  <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Background
                  </h3>
                  
                  <div className="mb-4">
                    <label className="text-xs sm:text-sm text-gray-500 mb-2 block uppercase tracking-wide">Gradient</label>
                    <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
                      {GRADIENT_OPTIONS.map((gradient) => (
                        <button
                          key={gradient.id}
                          onClick={() => setSelectedGradient(gradient)}
                          className={`h-10 sm:h-12 rounded-lg border-2 transition-all active:scale-95 ${
                            selectedGradient.id === gradient.id
                              ? 'border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.5)]'
                              : 'border-[#1a1a1a]'
                          }`}
                          style={{ background: gradient.gradient }}
                          title={gradient.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-2 block uppercase tracking-wide">Pattern Overlay</label>
                    <div className="grid grid-cols-4 gap-2">
                      {PATTERN_OPTIONS.map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => setSelectedPattern(pattern)}
                          className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-all active:scale-95 ${
                            selectedPattern.id === pattern.id
                              ? 'bg-[#00D4FF] text-black'
                              : 'bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#00D4FF]/50'
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
                  <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                    <Type className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Text & Branding
                  </h3>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add your message (optional)..."
                    className="input text-sm sm:text-base mb-4"
                    maxLength={40}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBranding}
                      onChange={(e) => setShowBranding(e.target.checked)}
                      className="w-5 h-5 rounded border-[#1a1a1a] bg-[#0a0a0a]"
                    />
                    <span className="text-sm">Show NODES branding</span>
                  </label>
                </div>
              </div>

              {/* NFT Selection */}
              <div className="card">
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wide">Select NFTs for Slots</h3>
                
                {/* Slot buttons - Mobile friendly */}
                <div className="space-y-2 mb-4">
                  {selectedNfts.map((selected, slotIndex) => (
                    <div 
                      key={slotIndex} 
                      className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg"
                    >
                      <span className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16 flex-shrink-0">
                        Slot {slotIndex + 1}
                      </span>
                      {selected ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Image
                            src={selected.image}
                            alt={selected.name}
                            width={40}
                            height={40}
                            className="rounded flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm truncate">{selected.name}</span>
                          <button
                            onClick={() => clearSlot(slotIndex)}
                            className="ml-auto text-gray-600 hover:text-red-400 p-2 -mr-1 flex-shrink-0"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openNftPicker(slotIndex)}
                          className="flex-1 text-left text-xs sm:text-sm text-[#00D4FF] hover:text-[#4FFFDF] py-2"
                        >
                          Tap to select NFT →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* NFT Gallery - Collapsible on mobile */}
                <div className="border-t border-[#1a1a1a] pt-4">
                  <button
                    onClick={() => setShowNftPicker(!showNftPicker)}
                    className="w-full flex items-center justify-between text-sm text-gray-500 mb-3 py-2"
                  >
                    <span>Your NODES ({nfts.length})</span>
                    {showNftPicker ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {showNftPicker && (
                    <>
                      {activeSlot !== null && (
                        <div className="mb-3 p-2 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg text-sm text-[#00D4FF]">
                          Selecting for Slot {activeSlot + 1}
                        </div>
                      )}
                      {isLoadingNfts ? (
                        <div className="flex items-center gap-2 text-gray-600 py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </div>
                      ) : nfts.length === 0 ? (
                        <p className="text-gray-600 text-sm py-4">No NODES found in your wallet</p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                          {nfts.map((nft) => (
                            <NFTCardMini
                              key={nft.tokenId}
                              nft={nft}
                              onClick={() => {
                                const targetSlot = activeSlot !== null 
                                  ? activeSlot 
                                  : selectedNfts.findIndex(s => s === null);
                                if (targetSlot !== -1) {
                                  handleSlotClick(targetSlot, nft);
                                }
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
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
