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
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';

interface PostTemplate {
  id: string;
  name: string;
  slots: number;
  layout: 'single' | 'duo' | 'trio' | 'quad' | 'five' | 'six' | 'seven' | 'eight' | 'text-only';
  description: string;
}

const POST_TEMPLATES: PostTemplate[] = [
  { id: 'text-only', name: 'Text', slots: 0, layout: 'text-only', description: 'Pure text with NODES branding' },
  { id: 'single', name: 'Single', slots: 1, layout: 'single', description: 'One NFT, big and beautiful' },
  { id: 'duo', name: 'Duo', slots: 2, layout: 'duo', description: 'Two NFTs side by side' },
  { id: 'trio', name: 'Trio', slots: 3, layout: 'trio', description: 'Three NFTs in triangle layout' },
  { id: 'quad', name: 'Quad', slots: 4, layout: 'quad', description: 'Four NFTs in grid' },
  { id: 'five', name: 'Five', slots: 5, layout: 'five', description: 'Five NFTs showcase' },
  { id: 'six', name: 'Six', slots: 6, layout: 'six', description: 'Six NFTs in 2x3 grid' },
  { id: 'full-set', name: 'Full Set', slots: 8, layout: 'eight', description: 'All 8 Inner States' },
];

export default function PostCreatorPage() {
  const { address, isConnected } = useAccount();
  const { nfts, setNfts } = useNodesStore();
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate>(POST_TEMPLATES[1]);
  const [selectedNfts, setSelectedNfts] = useState<(NodeNFT | null)[]>([]);
  const [customText, setCustomText] = useState('gm NODES! ⚡️');
  const [bgColor, setBgColor] = useState('#000000');
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
        backgroundColor: bgColor,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `nodes-post-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const renderPreview = () => {
    const slots = selectedNfts;
    
    return (
      <div 
        ref={canvasRef}
        className="w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] relative overflow-hidden flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {/* Subtle glow effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
        </div>
        
        {/* NFT Layout */}
        {selectedTemplate.layout === 'text-only' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12">
            <div className="text-center">
              <div className="text-2xl sm:text-6xl font-bold gradient-text mb-3 sm:mb-6">{customText}</div>
              <div className="text-sm sm:text-2xl text-[#00D4FF] uppercase tracking-widest">NODES Community</div>
            </div>
          </div>
        )}

        {selectedTemplate.layout === 'single' && slots[0] && (
          <div className="absolute inset-4 sm:inset-8 flex items-center justify-center">
            <Image
              src={slots[0].image}
              alt={slots[0].name}
              width={250}
              height={250}
              className="rounded-xl sm:rounded-2xl shadow-2xl w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] object-cover border border-[#00D4FF]/30"
            />
          </div>
        )}

        {selectedTemplate.layout === 'duo' && (
          <div className="absolute inset-4 sm:inset-8 flex gap-2 sm:gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={130}
                    height={130}
                    className="rounded-lg sm:rounded-xl shadow-xl w-[130px] h-[130px] sm:w-[260px] sm:h-[260px] object-cover border border-[#00D4FF]/30"
                  />
                ) : (
                  <div className="w-[130px] h-[130px] sm:w-[260px] sm:h-[260px] border-2 border-dashed border-[#1a1a1a] rounded-lg sm:rounded-xl flex items-center justify-center text-gray-700 text-xs sm:text-base">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTemplate.layout === 'quad' && (
          <div className="absolute inset-4 sm:inset-8 grid grid-cols-2 gap-2 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={125}
                    height={125}
                    className="rounded-lg sm:rounded-xl shadow-xl w-[125px] h-[125px] sm:w-[250px] sm:h-[250px] object-cover border border-[#00D4FF]/30"
                  />
                ) : (
                  <div className="w-[125px] h-[125px] sm:w-[250px] sm:h-[250px] border-2 border-dashed border-[#1a1a1a] rounded-lg sm:rounded-xl flex items-center justify-center text-gray-700 text-xs sm:text-base">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTemplate.layout === 'six' && (
          <div className="absolute inset-2 sm:inset-4 grid grid-cols-3 grid-rows-2 gap-1.5 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={90}
                    height={90}
                    className="rounded-md sm:rounded-lg shadow-lg w-[90px] h-[90px] sm:w-[180px] sm:h-[180px] object-cover border border-[#00D4FF]/30"
                  />
                ) : (
                  <div className="w-[90px] h-[90px] sm:w-[180px] sm:h-[180px] border-2 border-dashed border-[#1a1a1a] rounded-md sm:rounded-lg flex items-center justify-center text-gray-700 text-xs">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom Text Overlay */}
        {customText && selectedTemplate.layout !== 'text-only' && (
          <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 text-center">
            <div className="inline-block px-3 sm:px-6 py-1.5 sm:py-3 bg-black/60 backdrop-blur-sm rounded-full border border-[#00D4FF]/30">
              <span className="text-sm sm:text-xl font-semibold text-white">{customText}</span>
            </div>
          </div>
        )}

        {/* NODES Watermark */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 text-[#00D4FF]/50 text-xs sm:text-sm font-medium">
          <span>⚡️</span>
          <span className="uppercase tracking-widest">NODES</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Post Creator</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
          Create stunning posts for X featuring your NODES NFTs
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
            {/* Preview - Mobile first */}
            <div className="card">
              <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                Preview
              </h3>
              <div className="flex justify-center overflow-x-auto pb-4">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-[#1a1a1a]">
                  {renderPreview()}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4">
                {selectedTemplate.slots > 0 && (
                  <button
                    onClick={autoFillSlots}
                    disabled={nfts.length === 0}
                    className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto Fill
                  </button>
                )}
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
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Template
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {POST_TEMPLATES.map((template) => (
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
                        <div className="text-[10px] sm:text-xs opacity-70">{template.slots}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Text */}
                <div className="card">
                  <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                    <Type className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Text
                  </h3>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add your message..."
                    className="input text-sm sm:text-base"
                    maxLength={50}
                  />
                </div>

                {/* Background Color */}
                <div className="card">
                  <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Background
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {['#000000', '#0a0a0a', '#050505', '#111111', '#0a0a0f'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBgColor(color)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all active:scale-95 ${
                          bgColor === color ? 'border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.5)]' : 'border-[#1a1a1a]'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* NFT Selection */}
              {selectedTemplate.slots > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wide">Select NFTs</h3>
                  
                  {/* Slot buttons */}
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
                              width={36}
                              height={36}
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
                            Tap to select →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* NFT Gallery - Collapsible */}
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
                          <div className="mb-3 p-2 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg text-xs sm:text-sm text-[#00D4FF]">
                            Selecting for Slot {activeSlot + 1}
                          </div>
                        )}
                        {isLoadingNfts ? (
                          <div className="flex items-center gap-2 text-gray-600 py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </div>
                        ) : nfts.length === 0 ? (
                          <p className="text-gray-600 text-sm py-4">No NODES found</p>
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
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
