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
  Palette
} from 'lucide-react';
import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';

interface PostTemplate {
  id: string;
  name: string;
  slots: number;
  layout: 'single' | 'duo' | 'trio' | 'quad' | 'five' | 'six' | 'seven' | 'text-only';
  description: string;
}

const POST_TEMPLATES: PostTemplate[] = [
  { id: 'text-only', name: 'Text Only', slots: 0, layout: 'text-only', description: 'Pure text with NODES branding' },
  { id: 'single', name: 'Single Feature', slots: 1, layout: 'single', description: 'One NFT, big and beautiful' },
  { id: 'duo', name: 'Dynamic Duo', slots: 2, layout: 'duo', description: 'Two NFTs side by side' },
  { id: 'trio', name: 'Trifecta', slots: 3, layout: 'trio', description: 'Three NFTs in triangle layout' },
  { id: 'quad', name: 'Quad Squad', slots: 4, layout: 'quad', description: 'Four NFTs in grid' },
  { id: 'five', name: 'High Five', slots: 5, layout: 'five', description: 'Five NFTs showcase' },
  { id: 'six', name: 'Six Pack', slots: 6, layout: 'six', description: 'Six NFTs in 2x3 grid' },
  { id: 'full-set', name: 'Full Set', slots: 7, layout: 'seven', description: 'All 7 Inner States' },
];

export default function PostCreatorPage() {
  const { address, isConnected } = useAccount();
  const { nfts, setNfts, setLoading } = useNodesStore();
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate>(POST_TEMPLATES[1]);
  const [selectedNfts, setSelectedNfts] = useState<(NodeNFT | null)[]>([]);
  const [customText, setCustomText] = useState('gm NODES! 🟣');
  const [bgColor, setBgColor] = useState('#0a0a0f');
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
        className="w-[600px] h-[600px] relative overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        
        {/* NFT Layout */}
        {selectedTemplate.layout === 'text-only' && (
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="text-6xl font-bold gradient-text mb-6">{customText}</div>
              <div className="text-2xl text-purple-400">NODES Community</div>
            </div>
          </div>
        )}

        {selectedTemplate.layout === 'single' && slots[0] && (
          <div className="absolute inset-8 flex items-center justify-center">
            <Image
              src={slots[0].image}
              alt={slots[0].name}
              width={500}
              height={500}
              className="rounded-2xl shadow-2xl"
            />
          </div>
        )}

        {selectedTemplate.layout === 'duo' && (
          <div className="absolute inset-8 flex gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={260}
                    height={260}
                    className="rounded-xl shadow-xl"
                  />
                ) : (
                  <div className="w-[260px] h-[260px] border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-600">
                    Slot {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTemplate.layout === 'quad' && (
          <div className="absolute inset-8 grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={250}
                    height={250}
                    className="rounded-xl shadow-xl"
                  />
                ) : (
                  <div className="w-[250px] h-[250px] border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-600">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTemplate.layout === 'six' && (
          <div className="absolute inset-4 grid grid-cols-3 grid-rows-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-center">
                {slots[i] ? (
                  <Image
                    src={slots[i]!.image}
                    alt={slots[i]!.name}
                    width={180}
                    height={180}
                    className="rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-[180px] h-[180px] border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom Text Overlay */}
        {customText && selectedTemplate.layout !== 'text-only' && (
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <div className="inline-block px-6 py-3 bg-black/60 backdrop-blur-sm rounded-full">
              <span className="text-xl font-semibold text-white">{customText}</span>
            </div>
          </div>
        )}

        {/* NODES Watermark */}
        <div className="absolute top-4 right-4 text-purple-400/50 text-sm font-medium">
          NODES
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Post Creator</h1>
        <p className="text-gray-400 mb-8">
          Create beautiful posts for X featuring your NODES NFTs
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
              {/* Template Selection */}
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  Choose Template
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POST_TEMPLATES.map((template) => (
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

              {/* NFT Selection */}
              {selectedTemplate.slots > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-4">Select NFTs for Each Slot</h3>
                  <div className="space-y-4">
                    {selectedNfts.map((selected, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-4">
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
                            <span className="text-sm">{selected.name}</span>
                            <button
                              onClick={() => clearSlot(slotIndex)}
                              className="ml-auto text-gray-500 hover:text-red-400"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 text-sm text-gray-500">
                            Select from gallery below
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* NFT Gallery */}
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <h4 className="text-sm text-gray-400 mb-3">Your NODES:</h4>
                    {isLoadingNfts ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
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
              )}

              {/* Custom Text */}
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5 text-purple-400" />
                  Custom Text
                </h3>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Add your message..."
                  className="input"
                  maxLength={50}
                />
              </div>

              {/* Background Color */}
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-400" />
                  Background
                </h3>
                <div className="flex gap-2">
                  {['#0a0a0f', '#1a1a2e', '#16213e', '#1a0a1a', '#0a1a0a'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        bgColor === color ? 'border-purple-500 scale-110' : 'border-gray-700'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Export PNG
              </button>
            </div>

            {/* Preview */}
            <div className="card">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="flex justify-center">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
