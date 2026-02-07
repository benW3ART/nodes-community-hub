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
  Sparkles,
  Gift,
  Quote,
  BarChart3,
  Megaphone,
  ArrowRight,
  Grid3X3
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';

interface PostTemplate {
  id: string;
  name: string;
  slots: number;
  layout: string;
  description: string;
  icon?: React.ReactNode;
  category: 'basic' | 'styled';
}

const POST_TEMPLATES: PostTemplate[] = [
  // Basic templates
  { id: 'text-only', name: 'Text Only', slots: 0, layout: 'text-only', description: 'Pure text with NODES branding', category: 'basic' },
  { id: 'single', name: 'Single', slots: 1, layout: 'single', description: 'One NFT, big and beautiful', category: 'basic' },
  { id: 'duo', name: 'Duo', slots: 2, layout: 'duo', description: 'Two NFTs side by side', category: 'basic' },
  { id: 'trio', name: 'Trio', slots: 3, layout: 'trio', description: 'Three NFTs in triangle layout', category: 'basic' },
  { id: 'quad', name: 'Quad', slots: 4, layout: 'quad', description: 'Four NFTs in grid', category: 'basic' },
  { id: 'six', name: 'Six', slots: 6, layout: 'six', description: 'Six NFTs in 2x3 grid', category: 'basic' },
  { id: 'full-set', name: 'Full Set', slots: 8, layout: 'eight', description: 'All 8 Inner States', category: 'basic' },
  
  // Styled templates
  { id: 'gm', name: 'GM Post', slots: 5, layout: 'gm', description: 'Big GM with NFT row', icon: <Megaphone className="w-4 h-4" />, category: 'styled' },
  { id: 'quote', name: 'Quote', slots: 1, layout: 'quote', description: 'Inspirational quote style', icon: <Quote className="w-4 h-4" />, category: 'styled' },
  { id: 'stats', name: 'Stats', slots: 6, layout: 'stats', description: 'Show off your stats', icon: <BarChart3 className="w-4 h-4" />, category: 'styled' },
  { id: 'giveaway', name: 'Giveaway', slots: 1, layout: 'giveaway', description: 'Announce a giveaway', icon: <Gift className="w-4 h-4" />, category: 'styled' },
  { id: 'showcase', name: 'Showcase', slots: 5, layout: 'showcase', description: 'Feature your collection', icon: <Grid3X3 className="w-4 h-4" />, category: 'styled' },
  { id: 'before-after', name: 'Before/After', slots: 2, layout: 'before-after', description: 'Compare two states', icon: <ArrowRight className="w-4 h-4" />, category: 'styled' },
];

const PRESET_TEXTS: Record<string, string[]> = {
  'gm': ['gm NODES! ⚡️', 'Rise and grind 🌅', 'Another day, another block ⛓️'],
  'quote': ['Collect what you love, love what you collect.', 'The future is on-chain.', 'Art is the journey, not the destination.'],
  'stats': ['Floor: 0.1 ETH | Holders: 500 | Volume: 10 ETH', 'Minted: 8/8 | Rarity: Top 5% | Held: 100 days'],
  'giveaway': ['Follow + RT + Tag 3 friends', 'Like + RT to enter! 🎁', '48h giveaway - don\'t miss out!'],
  'showcase': ['My Inner States Collection', 'NODES Journey', 'The Full Set 🎯'],
  'before-after': ['Evolution 🔥', 'The glow up', 'From paper hands to diamond 💎'],
};

export default function PostCreatorPage() {
  const { address, isConnected } = useWalletAddress();
  const { nfts, setNfts } = useNodesStore();
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate>(POST_TEMPLATES[1]);
  const [selectedNfts, setSelectedNfts] = useState<(NodeNFT | null)[]>([]);
  const [customText, setCustomText] = useState('gm NODES! ⚡️');
  const [bgColor, setBgColor] = useState('#000000');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [showNftPicker, setShowNftPicker] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showBasicTemplates, setShowBasicTemplates] = useState(true);
  const [showStyledTemplates, setShowStyledTemplates] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize slots when template changes
  useEffect(() => {
    setSelectedNfts(new Array(selectedTemplate.slots).fill(null));
    // Set default text for styled templates
    if (selectedTemplate.category === 'styled' && PRESET_TEXTS[selectedTemplate.id]) {
      setCustomText(PRESET_TEXTS[selectedTemplate.id][0]);
    }
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
    setIsExporting(true);
    try {
      const response = await fetch('/api/create-post-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate.id,
          nfts: selectedNfts.filter(Boolean).map(nft => ({
            image: nft!.image,
            name: nft!.name,
          })),
          text: customText,
          bgColor,
          showWatermark: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `nodes-post-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderPreview = () => {
    const slots = selectedNfts;
    const isStyled = selectedTemplate.category === 'styled';
    
    return (
      <div 
        ref={canvasRef}
        className="w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] relative overflow-hidden flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {/* Subtle glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
        </div>

        {/* Template-specific layouts */}
        {selectedTemplate.id === 'text-only' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12">
            <div className="text-center">
              <div className="text-2xl sm:text-5xl font-bold gradient-text mb-3 sm:mb-6 leading-tight">{customText}</div>
              <div className="text-sm sm:text-xl text-[#00D4FF] uppercase tracking-widest">NODES Community</div>
            </div>
          </div>
        )}

        {selectedTemplate.id === 'gm' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="text-6xl sm:text-[120px] font-bold gradient-text mb-4">GM</div>
            <div className="flex gap-2 sm:gap-3 mb-4">
              {slots.slice(0, 5).map((nft, i) => nft ? (
                <Image key={i} src={nft.image} alt={nft.name} width={50} height={50} className="rounded-lg sm:w-[100px] sm:h-[100px] border border-[#00D4FF]/30" />
              ) : (
                <div key={i} className="w-[50px] h-[50px] sm:w-[100px] sm:h-[100px] border border-dashed border-[#1a1a1a] rounded-lg" />
              ))}
            </div>
            {customText && customText.toLowerCase() !== 'gm' && (
              <div className="text-sm sm:text-xl text-white">{customText}</div>
            )}
          </div>
        )}

        {selectedTemplate.id === 'quote' && (
          <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-16">
            <div className="text-center">
              <div className="text-5xl sm:text-8xl text-[#00D4FF]/20 font-serif mb-2">"</div>
              <div className="text-lg sm:text-3xl italic text-white leading-relaxed max-w-[80%] mx-auto">{customText}</div>
              <div className="text-5xl sm:text-8xl text-[#00D4FF]/20 font-serif mt-2">"</div>
              {slots[0] && (
                <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12">
                  <Image src={slots[0].image} alt={slots[0].name} width={60} height={60} className="rounded-lg sm:w-[100px] sm:h-[100px] border border-[#00D4FF]/30" />
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTemplate.id === 'stats' && (
          <div className="absolute inset-0 flex flex-col items-center p-4 sm:p-8">
            <div className="text-lg sm:text-3xl font-bold text-white mb-4 sm:mb-8">COLLECTION STATS</div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
              {customText.split('|').slice(0, 6).map((stat, i) => {
                const [label, value] = stat.split(':').map(s => s.trim());
                return (
                  <div key={i} className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-lg sm:text-3xl font-bold text-[#00D4FF]">{value}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{label}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 sm:gap-2">
              {slots.filter(Boolean).slice(0, 6).map((nft, i) => (
                <Image key={i} src={nft!.image} alt={nft!.name} width={40} height={40} className="rounded sm:w-[70px] sm:h-[70px] border border-[#00D4FF]/30" />
              ))}
            </div>
          </div>
        )}

        {selectedTemplate.id === 'giveaway' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="text-2xl sm:text-5xl font-bold mb-4 sm:mb-8">
              <span className="text-yellow-400">🎉</span>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> GIVEAWAY </span>
              <span className="text-yellow-400">🎉</span>
            </div>
            {slots[0] && (
              <div className="relative mb-4 sm:mb-8">
                <Image src={slots[0].image} alt={slots[0].name} width={150} height={150} className="rounded-xl sm:w-[280px] sm:h-[280px] border-2 border-yellow-400/50" />
                <div className="absolute -top-2 -left-2 text-2xl sm:text-4xl">✨</div>
                <div className="absolute -top-2 -right-2 text-2xl sm:text-4xl">✨</div>
                <div className="absolute -bottom-2 -left-2 text-2xl sm:text-4xl">⭐</div>
                <div className="absolute -bottom-2 -right-2 text-2xl sm:text-4xl">⭐</div>
              </div>
            )}
            <div className="text-sm sm:text-2xl text-white text-center">{customText}</div>
            <div className="text-xs sm:text-lg text-[#00D4FF] mt-2 sm:mt-4">Ends in 48 hours ⏰</div>
          </div>
        )}

        {selectedTemplate.id === 'showcase' && (
          <div className="absolute inset-0 p-4 sm:p-8">
            <div className="text-lg sm:text-3xl font-bold text-white text-center mb-4 sm:mb-6">{customText}</div>
            <div className="flex gap-2 sm:gap-4 h-[200px] sm:h-[400px]">
              {/* Featured large */}
              <div className="flex-1">
                {slots[0] && (
                  <Image src={slots[0].image} alt={slots[0].name} width={200} height={200} className="w-full h-full object-cover rounded-xl border border-[#00D4FF]/30" />
                )}
              </div>
              {/* Grid */}
              <div className="grid grid-cols-2 gap-1 sm:gap-2 w-[100px] sm:w-[200px]">
                {slots.slice(1, 5).map((nft, i) => nft ? (
                  <Image key={i} src={nft.image} alt={nft.name} width={60} height={60} className="w-full aspect-square object-cover rounded-lg border border-[#00D4FF]/30" />
                ) : (
                  <div key={i} className="w-full aspect-square border border-dashed border-[#1a1a1a] rounded-lg" />
                ))}
              </div>
            </div>
            <div className="text-sm sm:text-xl text-[#00D4FF] text-center mt-4 sm:mt-6">NODES INNER STATES</div>
          </div>
        )}

        {selectedTemplate.id === 'before-after' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="text-center">
                <div className="text-xs sm:text-lg text-gray-500 mb-2">BEFORE</div>
                {slots[0] ? (
                  <Image src={slots[0].image} alt={slots[0].name} width={120} height={120} className="rounded-xl sm:w-[240px] sm:h-[240px] border border-[#00D4FF]/30" />
                ) : (
                  <div className="w-[120px] h-[120px] sm:w-[240px] sm:h-[240px] border border-dashed border-[#1a1a1a] rounded-xl flex items-center justify-center text-gray-600">1</div>
                )}
              </div>
              <div className="text-3xl sm:text-6xl text-[#4FFFDF]">→</div>
              <div className="text-center">
                <div className="text-xs sm:text-lg text-[#00D4FF] mb-2">AFTER</div>
                {slots[1] ? (
                  <Image src={slots[1].image} alt={slots[1].name} width={120} height={120} className="rounded-xl sm:w-[240px] sm:h-[240px] border border-[#00D4FF]/30" />
                ) : (
                  <div className="w-[120px] h-[120px] sm:w-[240px] sm:h-[240px] border border-dashed border-[#1a1a1a] rounded-xl flex items-center justify-center text-gray-600">2</div>
                )}
              </div>
            </div>
            {customText && (
              <div className="text-lg sm:text-3xl text-white mt-6 sm:mt-12">{customText}</div>
            )}
          </div>
        )}

        {/* Basic layouts */}
        {selectedTemplate.id === 'single' && slots[0] && (
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

        {selectedTemplate.id === 'duo' && (
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

        {selectedTemplate.id === 'trio' && (
          <div className="absolute inset-4 sm:inset-8">
            {/* Top center */}
            <div className="flex justify-center mb-2 sm:mb-4">
              {slots[0] ? (
                <Image src={slots[0].image} alt={slots[0].name} width={100} height={100} className="rounded-lg sm:rounded-xl w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] border border-[#00D4FF]/30" />
              ) : (
                <div className="w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] border-2 border-dashed border-[#1a1a1a] rounded-lg flex items-center justify-center text-gray-700">1</div>
              )}
            </div>
            {/* Bottom row */}
            <div className="flex justify-center gap-2 sm:gap-4">
              {[1, 2].map((i) => slots[i] ? (
                <Image key={i} src={slots[i]!.image} alt={slots[i]!.name} width={100} height={100} className="rounded-lg sm:rounded-xl w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] border border-[#00D4FF]/30" />
              ) : (
                <div key={i} className="w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] border-2 border-dashed border-[#1a1a1a] rounded-lg flex items-center justify-center text-gray-700">{i + 1}</div>
              ))}
            </div>
          </div>
        )}

        {selectedTemplate.id === 'quad' && (
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

        {selectedTemplate.id === 'six' && (
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

        {selectedTemplate.id === 'full-set' && (
          <div className="absolute inset-2 sm:inset-4 grid grid-cols-4 grid-rows-2 gap-1 sm:gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={70}
                    height={70}
                    className="rounded sm:rounded-lg shadow-lg w-[70px] h-[70px] sm:w-[140px] sm:h-[140px] object-cover border border-[#00D4FF]/30"
                  />
                ) : (
                  <div className="w-[70px] h-[70px] sm:w-[140px] sm:h-[140px] border-2 border-dashed border-[#1a1a1a] rounded sm:rounded-lg flex items-center justify-center text-gray-700 text-[10px] sm:text-xs">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom Text Overlay for basic templates */}
        {customText && !isStyled && selectedTemplate.id !== 'text-only' && (
          <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 text-center">
            <div className="inline-block px-3 sm:px-6 py-1.5 sm:py-3 bg-black/60 backdrop-blur-sm rounded-full border border-[#00D4FF]/30">
              <span className="text-sm sm:text-xl font-semibold text-white">{customText}</span>
            </div>
          </div>
        )}

        {/* NODES Watermark */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1.5 text-[#00D4FF]/50 text-xs sm:text-sm font-medium">
          <div className="w-4 h-4 sm:w-5 sm:h-5 relative opacity-50">
            <Image
              src="/nodes-logo.png"
              alt="NODES"
              fill
              className="object-cover rounded"
            />
          </div>
          <span className="uppercase tracking-widest">NODES</span>
        </div>
      </div>
    );
  };

  const basicTemplates = POST_TEMPLATES.filter(t => t.category === 'basic');
  const styledTemplates = POST_TEMPLATES.filter(t => t.category === 'styled');

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
            <div className="flex flex-col items-center gap-3">
              <ConnectButton />
              <ViewOnlyLink />
            </div>
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
                {/* Template Selection - Styled */}
                <div className="card">
                  <button
                    onClick={() => setShowStyledTemplates(!showStyledTemplates)}
                    className="w-full font-semibold mb-3 sm:mb-4 flex items-center justify-between text-sm sm:text-base uppercase tracking-wide"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#4FFFDF]" />
                      Styled Templates
                    </div>
                    {showStyledTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showStyledTemplates && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {styledTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-all active:scale-95 flex flex-col items-center gap-1 ${
                            selectedTemplate.id === template.id
                              ? 'bg-gradient-to-br from-[#00D4FF] to-[#4FFFDF] text-black'
                              : 'bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#4FFFDF]/50'
                          }`}
                        >
                          {template.icon}
                          <div className="font-medium text-[10px] sm:text-xs">{template.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Template Selection - Basic */}
                <div className="card">
                  <button
                    onClick={() => setShowBasicTemplates(!showBasicTemplates)}
                    className="w-full font-semibold mb-3 sm:mb-4 flex items-center justify-between text-sm sm:text-base uppercase tracking-wide"
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                      Basic Templates
                    </div>
                    {showBasicTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showBasicTemplates && (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {basicTemplates.map((template) => (
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
                  )}
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
                    className="input text-sm sm:text-base mb-3"
                    maxLength={100}
                  />
                  {/* Preset suggestions */}
                  {PRESET_TEXTS[selectedTemplate.id] && (
                    <div className="flex flex-wrap gap-2">
                      {PRESET_TEXTS[selectedTemplate.id].map((preset, i) => (
                        <button
                          key={i}
                          onClick={() => setCustomText(preset)}
                          className="text-xs px-2 py-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded hover:border-[#00D4FF]/50 transition-colors truncate max-w-[150px]"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Background Color */}
                <div className="card">
                  <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                    Background
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {['#000000', '#0a0a0a', '#050505', '#111111', '#0a0a0f', '#0f0a0a', '#0a0f0a'].map((color) => (
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
