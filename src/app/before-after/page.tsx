'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
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
  X,
  ArrowRight,
  ArrowDown,
  Film,
  Scissors,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  CreditCard,
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';

type AspectRatio = 'square' | 'landscape' | 'portrait';

const TEMPLATE_FORMATS: Record<string, AspectRatio[]> = {
  'side-by-side':  ['square', 'landscape'],
  'vertical':      ['square', 'portrait'],
  'gif-transition': ['square', 'landscape', 'portrait'],
  'split-reveal':  ['square', 'landscape', 'portrait'],
  'frame-overlay': ['square', 'landscape', 'portrait'],
  'glitch-wipe':   ['square', 'landscape'],
  'reveal-card':   ['square', 'portrait'],
};

const FORMAT_LABELS: Record<AspectRatio, string> = {
  square: '1:1',
  landscape: '16:9',
  portrait: '9:16',
};

interface BeforeAfterTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  forceGif?: boolean;
}

const TEMPLATES: BeforeAfterTemplate[] = [
  { id: 'side-by-side', name: 'Side by Side', description: 'Before left, After right', icon: <ArrowRight className="w-4 h-4" /> },
  { id: 'vertical', name: 'Vertical', description: 'Before top, After bottom', icon: <ArrowDown className="w-4 h-4" /> },
  { id: 'gif-transition', name: 'Transition', description: 'Animated glitch wipe', icon: <Film className="w-4 h-4" />, forceGif: true },
  { id: 'split-reveal', name: 'Split', description: 'Vertical 50/50 split', icon: <Scissors className="w-4 h-4" /> },
  { id: 'frame-overlay', name: 'Frame', description: 'Full image with PIP', icon: <Layers className="w-4 h-4" /> },
  { id: 'glitch-wipe', name: 'Glitch', description: 'Glitchy center divider', icon: <Zap className="w-4 h-4" /> },
  { id: 'reveal-card', name: 'Card', description: 'Top/bottom reveal card', icon: <CreditCard className="w-4 h-4" /> },
];

const PRESET_TEXTS = [
  'Interfered',
  'Before → After',
  'The glow up',
  'Art Is Never Finished',
];

export default function BeforeAfterPage() {
  const { address, isConnected } = useWalletAddress();
  const { nfts, setNfts } = useNodesStore();
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NodeNFT | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BeforeAfterTemplate>(TEMPLATES[0]);
  const [legacyImageUrl, setLegacyImageUrl] = useState<string | null>(null);
  const [legacyProxyUrl, setLegacyProxyUrl] = useState<string | null>(null);
  const [legacyFormat, setLegacyFormat] = useState<string | null>(null);
  const [isLoadingLegacy, setIsLoadingLegacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [customText, setCustomText] = useState('Interfered');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('square');
  const [showGISection, setShowGISection] = useState(true);
  const [showDRSection, setShowDRSection] = useState(true);

  // When template changes, ensure current aspect ratio is supported
  useEffect(() => {
    const supported = TEMPLATE_FORMATS[selectedTemplate.id] || ['square'];
    if (!supported.includes(aspectRatio)) {
      setAspectRatio(supported[0]);
    }
  }, [selectedTemplate.id, aspectRatio]);

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

  // Filter evolved NFTs
  const genesisInterferenceNfts = useMemo(
    () => nfts.filter(nft => nft.networkStatus === 'Genesis Interference'),
    [nfts]
  );
  const digitalRenaissanceNfts = useMemo(
    () => nfts.filter(nft => nft.networkStatus === 'Digital Renaissance'),
    [nfts]
  );
  const hasEvolvedNfts = genesisInterferenceNfts.length > 0 || digitalRenaissanceNfts.length > 0;

  // Resolve legacy image when NFT is selected
  const handleSelectNft = async (nft: NodeNFT) => {
    setSelectedNft(nft);
    setLegacyImageUrl(null);
    setLegacyProxyUrl(null);
    setLegacyFormat(null);
    setIsLoadingLegacy(true);
    try {
      const res = await fetch(`/api/resolve-legacy-image?tokenId=${nft.tokenId}`);
      if (res.ok) {
        const data = await res.json();
        setLegacyImageUrl(data.url);
        setLegacyProxyUrl(data.proxyUrl);
        setLegacyFormat(data.format);
      }
    } catch {
      // Legacy image not available
    } finally {
      setIsLoadingLegacy(false);
    }
  };

  const closeModal = () => {
    setSelectedNft(null);
    setLegacyImageUrl(null);
    setLegacyProxyUrl(null);
    setLegacyFormat(null);
  };

  const getRequestBody = () => ({
    template: selectedTemplate.id,
    beforeImage: legacyImageUrl!,
    afterImage: selectedNft!.image,
    tokenId: selectedNft!.tokenId,
    nftName: selectedNft!.name,
    networkStatus: selectedNft!.networkStatus || '',
    text: customText,
    aspectRatio,
  });

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `nodes-interference-${selectedNft!.tokenId}-${Date.now()}.${ext}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    if (!selectedNft || !legacyImageUrl) return;
    setIsExporting(true);
    setExportProgress('');
    try {
      const response = await fetch('/api/create-before-after', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...getRequestBody(), outputFormat: 'png' }),
      });
      if (!response.ok) throw new Error('Export failed');
      triggerDownload(await response.blob(), 'png');
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('PNG export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGIF = async () => {
    if (!selectedNft || !legacyImageUrl) return;
    setIsExporting(true);
    setExportProgress('Creating animated GIF (server-side)...');
    try {
      const response = await fetch('/api/create-before-after', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...getRequestBody(), outputFormat: 'gif' }),
      });
      if (!response.ok) throw new Error('Export failed');
      triggerDownload(await response.blob(), 'gif');
    } catch (err) {
      console.error('GIF export failed:', err);
      alert('GIF export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleExportVideo = async () => {
    if (!selectedNft || !legacyImageUrl) return;
    setIsExporting(true);
    setExportProgress('Creating animated video (server-side)...');
    try {
      const response = await fetch('/api/create-before-after-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getRequestBody()),
      });
      if (!response.ok) throw new Error('Export failed');
      triggerDownload(await response.blob(), 'mp4');
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Preview dimensions based on aspect ratio
  const getPreviewDimensions = () => {
    switch (aspectRatio) {
      case 'landscape': return { w: 500, h: 281, sm: { w: 500, h: 281 }, base: { w: 300, h: 169 } };
      case 'portrait':  return { w: 281, h: 500, sm: { w: 281, h: 500 }, base: { w: 169, h: 300 } };
      default:          return { w: 500, h: 500, sm: { w: 500, h: 500 }, base: { w: 300, h: 300 } };
    }
  };
  const previewDims = getPreviewDimensions();

  // Client-side preview
  const renderPreview = () => {
    if (!selectedNft) return null;

    const beforeSrc = legacyProxyUrl || '';
    const afterSrc = selectedNft.image;
    const networkStatus = selectedNft.networkStatus || '';
    const isDR = networkStatus === 'Digital Renaissance';

    // DR banner element — shown at the bottom of all templates for Digital Renaissance NFTs
    // The Digital Renaissance.png is 1200x600 (2:1), render at proper aspect ratio
    const drBannerEl = isDR ? (
      <div className="absolute bottom-0 sm:bottom-1 left-1/2 -translate-x-1/2 opacity-40">
        <Image src="/logos/The Digital Renaissance.png" alt="The Digital Renaissance" width={100} height={50} unoptimized className="sm:w-[140px] sm:h-[70px] object-contain" />
      </div>
    ) : null;

    if (selectedTemplate.id === 'side-by-side') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-center">
                <div className="text-[10px] sm:text-sm text-gray-500 mb-1 sm:mb-2">LEGACY</div>
                {beforeSrc ? (
                  <Image src={beforeSrc} alt="Before" width={110} height={110} unoptimized className="rounded-xl sm:w-[190px] sm:h-[190px] border border-[#00D4FF]/30" />
                ) : (
                  <div className="w-[110px] h-[110px] sm:w-[190px] sm:h-[190px] border border-dashed border-[#1a1a1a] rounded-xl flex items-center justify-center">
                    {isLoadingLegacy ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> : <span className="text-gray-600 text-xs">No image</span>}
                  </div>
                )}
              </div>
              <div className="text-2xl sm:text-4xl text-[#4FFFDF]">→</div>
              <div className="text-center">
                <div className="text-[10px] sm:text-sm text-[#00D4FF] mb-1 sm:mb-2">{networkStatus.toUpperCase()}</div>
                <Image src={afterSrc} alt="After" width={110} height={110} unoptimized className="rounded-xl sm:w-[190px] sm:h-[190px] border border-[#00D4FF]/30" />
              </div>
            </div>
            {customText && <div className="text-sm sm:text-xl text-white mt-4 sm:mt-8">{customText}</div>}
          </div>
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={60} height={60} unoptimized className="sm:w-[80px] sm:h-[80px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'vertical') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-6">
            <div className="text-[10px] sm:text-sm text-gray-500 mb-1">LEGACY</div>
            {beforeSrc ? (
              <Image src={beforeSrc} alt="Before" width={100} height={100} unoptimized className="rounded-lg sm:w-[170px] sm:h-[170px] border border-[#00D4FF]/30" />
            ) : (
              <div className="w-[100px] h-[100px] sm:w-[170px] sm:h-[170px] border border-dashed border-[#1a1a1a] rounded-lg flex items-center justify-center">
                {isLoadingLegacy ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> : <span className="text-gray-600 text-xs">No image</span>}
              </div>
            )}
            <div className="text-xl sm:text-3xl text-[#4FFFDF] my-2">↓</div>
            <div className="text-[10px] sm:text-sm text-[#00D4FF] mb-1">{networkStatus.toUpperCase()}</div>
            <Image src={afterSrc} alt="After" width={100} height={100} unoptimized className="rounded-lg sm:w-[170px] sm:h-[170px] border border-[#00D4FF]/30" />
            {customText && <div className="text-xs sm:text-base text-white mt-2 sm:mt-4">{customText}</div>}
          </div>
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={60} height={60} unoptimized className="sm:w-[80px] sm:h-[80px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'gif-transition') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="text-[10px] sm:text-sm text-[#00D4FF] mb-2">ANIMATED TRANSITION</div>
            <div className="relative">
              {beforeSrc && (
                <Image src={beforeSrc} alt="Before" width={170} height={170} unoptimized className="rounded-xl sm:w-[300px] sm:h-[300px] border border-[#00D4FF]/30 animate-pulse" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-8 h-8 sm:w-12 sm:h-12 text-[#00D4FF]/60" />
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-4">Preview shows static — export for animation</div>
            {customText && <div className="text-sm sm:text-lg text-white mt-2">{customText}</div>}
          </div>
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={60} height={60} unoptimized className="sm:w-[80px] sm:h-[80px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'split-reveal') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          {/* Labels above images */}
          <div className="absolute top-2 sm:top-4 left-0 right-0 flex justify-between px-6 sm:px-10">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold">LEGACY</span>
            <span className="text-[10px] sm:text-xs text-[#00D4FF] font-bold">{networkStatus.toUpperCase()}</span>
          </div>
          {/* Vertical 50/50 split */}
          <div className="absolute inset-0 flex" style={{ top: '10%', bottom: '12%', left: '4%', right: '4%' }}>
            {/* Before - left half */}
            <div className="relative flex-1 overflow-hidden rounded-l-xl">
              {beforeSrc ? (
                <Image src={beforeSrc} alt="Before" fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center">
                  {isLoadingLegacy ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> : <span className="text-gray-600 text-xs">No image</span>}
                </div>
              )}
            </div>
            {/* Glowing divider */}
            <div className="w-[3px] bg-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.6)] z-10" />
            {/* After - right half */}
            <div className="relative flex-1 overflow-hidden rounded-r-xl">
              <Image src={afterSrc} alt="After" fill unoptimized className="object-cover" />
            </div>
          </div>
          {customText && <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center text-xs sm:text-sm text-white">{customText}</div>}
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={50} height={50} unoptimized className="sm:w-[70px] sm:h-[70px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'frame-overlay') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          {/* Full-bleed after image */}
          <Image src={afterSrc} alt="After" fill unoptimized className="object-cover" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/50" />
          {/* Interference label */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 text-[10px] sm:text-sm text-[#00D4FF] font-bold drop-shadow-lg">{networkStatus.toUpperCase()}</div>
          {/* PIP before frame */}
          <div className="absolute bottom-12 sm:bottom-16 left-3 sm:left-5">
            <div className="text-[8px] sm:text-[10px] text-gray-400 mb-1 text-center">LEGACY</div>
            <div className="relative w-[70px] h-[70px] sm:w-[120px] sm:h-[120px] rounded-lg overflow-hidden border-2 border-[#00D4FF]/40 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              {beforeSrc ? (
                <Image src={beforeSrc} alt="Before" fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center">
                  <span className="text-gray-600 text-[8px]">No image</span>
                </div>
              )}
            </div>
          </div>
          {customText && <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center text-xs sm:text-sm text-white drop-shadow-lg">{customText}</div>}
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={50} height={50} unoptimized className="sm:w-[70px] sm:h-[70px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'glitch-wipe') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          {/* Labels */}
          <div className="absolute top-2 sm:top-4 left-0 right-0 flex justify-between px-6 sm:px-10">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold">LEGACY</span>
            <span className="text-[10px] sm:text-xs text-[#00D4FF] font-bold">{networkStatus.toUpperCase()}</span>
          </div>
          {/* Two halves with glitch band */}
          <div className="absolute flex" style={{ top: '10%', bottom: '14%', left: '4%', right: '4%' }}>
            <div className="relative flex-1 overflow-hidden rounded-l-xl">
              {beforeSrc ? (
                <Image src={beforeSrc} alt="Before" fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0d0d0d]" />
              )}
            </div>
            {/* Glitch band */}
            <div className="w-[16px] sm:w-[24px] bg-black relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-[#00D4FF]/10" style={{ opacity: Math.random() * 0.4 + 0.1, transform: `translateX(${(Math.random() - 0.5) * 8}px)` }} />
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 w-px bg-[#00D4FF]/30 shadow-[0_0_6px_rgba(0,212,255,0.4)]" />
              <div className="absolute inset-y-0 right-0 w-px bg-[#00D4FF]/30 shadow-[0_0_6px_rgba(0,212,255,0.4)]" />
            </div>
            <div className="relative flex-1 overflow-hidden rounded-r-xl">
              <Image src={afterSrc} alt="After" fill unoptimized className="object-cover" />
            </div>
          </div>
          {customText && <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center text-xs sm:text-sm text-white">{customText}</div>}
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={50} height={50} unoptimized className="sm:w-[70px] sm:h-[70px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'reveal-card') {
      return (
        <div className="relative overflow-hidden bg-black" style={{ width: previewDims.base.w, height: previewDims.base.h }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute flex flex-col" style={{ top: '8%', bottom: '10%', left: '6%', right: '6%' }}>
            {/* Before - top half */}
            <div className="relative flex-1 overflow-hidden rounded-t-xl">
              {beforeSrc ? (
                <Image src={beforeSrc} alt="Before" fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center">
                  <span className="text-gray-600 text-xs">No image</span>
                </div>
              )}
              <div className="absolute bottom-1 left-2 text-[8px] sm:text-[10px] text-gray-400 font-bold">LEGACY</div>
            </div>
            {/* Glitch band separator */}
            <div className="h-[8px] sm:h-[12px] bg-black relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#4FFFDF]/20 via-[#00D4FF]/30 to-[#4FFFDF]/20" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
            </div>
            {/* After - bottom half */}
            <div className="relative flex-1 overflow-hidden rounded-b-xl">
              <Image src={afterSrc} alt="After" fill unoptimized className="object-cover" />
              <div className="absolute top-1 right-2 text-[8px] sm:text-[10px] text-[#00D4FF] font-bold">{networkStatus.toUpperCase()}</div>
            </div>
          </div>
          {customText && <div className="absolute bottom-1 sm:bottom-2 left-0 right-0 text-center text-[10px] sm:text-xs text-white">{customText}</div>}
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={50} height={50} unoptimized className="sm:w-[70px] sm:h-[70px]" />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderNftSection = (title: string, nftList: NodeNFT[], isOpen: boolean, toggle: () => void) => {
    if (nftList.length === 0) return null;
    return (
      <div className="card">
        <button
          onClick={toggle}
          className="w-full font-semibold mb-3 sm:mb-4 flex items-center justify-between text-sm sm:text-base uppercase tracking-wide"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#4FFFDF]" />
            {title}
            <span className="text-xs text-gray-500 normal-case">({nftList.length})</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isOpen && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {nftList.map((nft) => (
              <NFTCardMini
                key={nft.tokenId}
                nft={nft}
                onClick={() => handleSelectNft(nft)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Before / After</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
          See how your NODES were interfered — compare legacy and current states
        </p>

        {!isConnected ? (
          <div className="card text-center py-12 sm:py-16">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Connect to see your evolved NODES NFTs</p>
            <div className="flex flex-col items-center gap-3">
              <ConnectButton />
              <ViewOnlyLink />
            </div>
          </div>
        ) : isLoadingNfts ? (
          <div className="card text-center py-12">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-[#00D4FF]" />
            <p className="text-gray-500">Loading your NODES...</p>
          </div>
        ) : !hasEvolvedNfts ? (
          <div className="card text-center py-12 sm:py-16">
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">No Evolved NFTs Found</h2>
            <p className="text-gray-500 text-sm sm:text-base">
              None of your NODES have evolved yet. Evolved NFTs will appear here once their Network Status changes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderNftSection(
              'Genesis Interference',
              genesisInterferenceNfts,
              showGISection,
              () => setShowGISection(!showGISection)
            )}
            {renderNftSection(
              'Digital Renaissance',
              digitalRenaissanceNfts,
              showDRSection,
              () => setShowDRSection(!showDRSection)
            )}
          </div>
        )}

        {/* Comparison Modal */}
        {selectedNft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#1a1a1a]">
                <div>
                  <h3 className="font-semibold text-sm sm:text-lg">{selectedNft.name}</h3>
                  <p className="text-xs sm:text-sm text-[#00D4FF]">{selectedNft.networkStatus}</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Preview */}
                <div className="flex justify-center">
                  <div className="rounded-xl overflow-hidden shadow-2xl border border-[#1a1a1a]">
                    {renderPreview()}
                  </div>
                </div>

                {/* Template Selector */}
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wide mb-3">Template</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl)}
                        className={`p-2 sm:p-3 rounded-lg text-xs transition-all active:scale-95 flex flex-col items-center gap-1 ${
                          selectedTemplate.id === tmpl.id
                            ? 'bg-gradient-to-br from-[#00D4FF] to-[#4FFFDF] text-black'
                            : 'bg-black border border-[#1a1a1a] hover:border-[#4FFFDF]/50'
                        }`}
                      >
                        {tmpl.icon}
                        <div className="font-medium text-[10px] sm:text-xs">{tmpl.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format / Aspect Ratio */}
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wide mb-3">Format</h4>
                  <div className="flex gap-2">
                    {(['square', 'landscape', 'portrait'] as AspectRatio[]).map((ar) => {
                      const supported = (TEMPLATE_FORMATS[selectedTemplate.id] || ['square']).includes(ar);
                      return (
                        <button
                          key={ar}
                          onClick={() => supported && setAspectRatio(ar)}
                          disabled={!supported}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            aspectRatio === ar
                              ? 'bg-gradient-to-br from-[#00D4FF] to-[#4FFFDF] text-black'
                              : supported
                                ? 'bg-black border border-[#1a1a1a] hover:border-[#4FFFDF]/50'
                                : 'bg-black/50 border border-[#1a1a1a]/50 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {FORMAT_LABELS[ar]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Text */}
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wide mb-3">Caption</h4>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add a caption..."
                    className="input text-sm mb-2"
                    maxLength={60}
                  />
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TEXTS.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => setCustomText(preset)}
                        className="text-xs px-2 py-1 bg-black border border-[#1a1a1a] rounded hover:border-[#00D4FF]/50 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export */}
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleExportPNG}
                      disabled={isExporting || !legacyImageUrl}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-3 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={isExporting || !legacyImageUrl}
                      className="btn-primary flex items-center justify-center gap-2 text-sm py-3 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={isExporting || !legacyImageUrl}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-3 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    PNG = still image &bull; GIF/Video = animated
                  </p>
                  {exportProgress && (
                    <p className="text-xs text-[#00D4FF] mt-2 text-center animate-pulse">
                      {exportProgress}
                    </p>
                  )}
                  {!legacyImageUrl && !isLoadingLegacy && (
                    <p className="text-xs text-red-400 mt-2 text-center">No legacy image available for this NFT</p>
                  )}
                  {isLoadingLegacy && (
                    <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Resolving legacy image...
                    </p>
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
