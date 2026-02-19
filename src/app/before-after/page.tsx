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
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';

interface BeforeAfterTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  forceGif?: boolean;
}

const TEMPLATES: BeforeAfterTemplate[] = [
  { id: 'side-by-side', name: 'Side by Side', description: 'Before on left, After on right', icon: <ArrowRight className="w-4 h-4" /> },
  { id: 'vertical', name: 'Vertical', description: 'Before on top, After on bottom', icon: <ArrowDown className="w-4 h-4" /> },
  { id: 'gif-transition', name: 'Transition', description: 'Animated crossfade loop', icon: <Film className="w-4 h-4" />, forceGif: true },
  { id: 'split-reveal', name: 'Split', description: 'Diagonal split reveal', icon: <Scissors className="w-4 h-4" /> },
  { id: 'timeline', name: 'Timeline', description: 'Evolution timeline strip', icon: <Clock className="w-4 h-4" /> },
];

const PRESET_TEXTS = [
  'Evolution',
  'The glow up',
  'Before → After',
  'Evolved',
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
  const [customText, setCustomText] = useState('Evolution');
  const [showGISection, setShowGISection] = useState(true);
  const [showDRSection, setShowDRSection] = useState(true);

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
  });

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `nodes-evolution-${selectedNft!.tokenId}-${Date.now()}.${ext}`;
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

  // Client-side preview
  const renderPreview = () => {
    if (!selectedNft) return null;

    const beforeSrc = legacyProxyUrl || '';
    const afterSrc = selectedNft.image;
    const networkStatus = selectedNft.networkStatus || '';
    const isDR = networkStatus === 'Digital Renaissance';

    // DR banner element — shown at the bottom of all templates for Digital Renaissance NFTs
    const drBannerEl = isDR ? (
      <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 opacity-55">
        <Image src="/logos/The Digital Renaissance.png" alt="The Digital Renaissance" width={140} height={30} unoptimized className="sm:w-[200px] sm:h-[44px]" />
      </div>
    ) : null;

    if (selectedTemplate.id === 'side-by-side') {
      return (
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] relative overflow-hidden bg-black">
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
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] relative overflow-hidden bg-black">
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
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] relative overflow-hidden bg-black">
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
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] relative overflow-hidden bg-black">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
            <div className="relative w-[250px] h-[250px] sm:w-[420px] sm:h-[420px]">
              {/* After image (bottom-right triangle via CSS) */}
              <div className="absolute inset-0 overflow-hidden rounded-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                <Image src={afterSrc} alt="After" fill unoptimized className="object-cover" />
              </div>
              {/* Before image (top-left triangle via CSS) */}
              {beforeSrc && (
                <div className="absolute inset-0 overflow-hidden rounded-xl" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}>
                  <Image src={beforeSrc} alt="Before" fill unoptimized className="object-cover" />
                </div>
              )}
              {/* Diagonal line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100" y2="100" stroke="#00D4FF" strokeWidth="0.5" style={{ filter: 'drop-shadow(0 0 4px #00D4FF)' }} />
              </svg>
              {/* Labels */}
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-[10px] sm:text-sm text-gray-400 font-bold">LEGACY</div>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[10px] sm:text-sm text-[#00D4FF] font-bold">{networkStatus.toUpperCase()}</div>
            </div>
          </div>
          {customText && <div className="absolute bottom-3 sm:bottom-5 left-0 right-0 text-center text-xs sm:text-base text-white">{customText}</div>}
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={60} height={60} unoptimized className="sm:w-[80px] sm:h-[80px]" />
          </div>
        </div>
      );
    }

    if (selectedTemplate.id === 'timeline') {
      return (
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] relative overflow-hidden bg-black">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4FFFDF]/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 p-4 sm:p-8">
            {/* Images */}
            <div className="flex justify-between mb-3 sm:mb-6">
              <div className="flex-shrink-0">
                {beforeSrc ? (
                  <Image src={beforeSrc} alt="Before" width={90} height={90} unoptimized className="rounded-lg sm:w-[150px] sm:h-[150px] border border-[#00D4FF]/30" />
                ) : (
                  <div className="w-[90px] h-[90px] sm:w-[150px] sm:h-[150px] border border-dashed border-[#1a1a1a] rounded-lg" />
                )}
              </div>
              <div className="flex-shrink-0">
                <Image src={afterSrc} alt="After" width={90} height={90} unoptimized className="rounded-lg sm:w-[150px] sm:h-[150px] border border-[#00D4FF]/30" />
              </div>
            </div>
            {/* Caption */}
            {customText && <div className="text-center text-sm sm:text-xl text-white mb-3 sm:mb-6">{customText}</div>}
            {/* Timeline */}
            <div className="relative mx-4 sm:mx-8">
              <div className="h-0.5 bg-[#333333] w-full" />
              <div
                className="absolute top-0 h-0.5 bg-gradient-to-r from-[#4FFFDF] to-[#00D4FF]"
                style={{ width: networkStatus === 'Digital Renaissance' ? '100%' : '50%' }}
              />
              {/* Dots */}
              {['Legacy', 'Genesis Interference', 'Digital Renaissance'].map((label, i) => {
                const isActive = i === 0 ||
                  (i === 1 && (networkStatus === 'Genesis Interference' || networkStatus === 'Digital Renaissance')) ||
                  (i === 2 && networkStatus === 'Digital Renaissance');
                return (
                  <div key={label} className="absolute -top-1.5" style={{ left: `${i * 50}%`, transform: 'translateX(-50%)' }}>
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.6)]' : 'bg-[#333333]'}`} />
                    <div className={`text-[8px] sm:text-[10px] mt-1 text-center whitespace-nowrap ${isActive ? 'text-[#00D4FF]' : 'text-gray-600'}`}>
                      {label.split(' ').map((w, j) => <div key={j}>{w}</div>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {drBannerEl}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-45">
            <Image src="/logos/nodes.png" alt="NODES" width={60} height={60} unoptimized className="sm:w-[80px] sm:h-[80px]" />
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
          See how your NODES evolved — compare legacy and current states
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
                  <div className="grid grid-cols-5 gap-2">
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
