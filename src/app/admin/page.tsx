'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Shield, 
  Upload, 
  Trash2, 
  Plus,
  Image as ImageIcon,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

interface Asset {
  id: string;
  name: string;
  type: 'logo' | 'frame' | 'background' | 'sticker' | 'banner';
  url: string;
  createdAt: string;
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: 'logo' as Asset['type'] });

  // Check if user is whitelisted
  useEffect(() => {
    async function checkAuth() {
      if (!address) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/check?address=${address}`);
        const data = await response.json();
        setIsAuthorized(data.authorized);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [address]);

  // Fetch assets
  useEffect(() => {
    async function fetchAssets() {
      if (!isAuthorized) return;
      
      try {
        const response = await fetch('/api/admin/assets');
        const data = await response.json();
        setAssets(data.assets || []);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
      }
    }

    if (isAuthorized) {
      fetchAssets();
    }
  }, [isAuthorized]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newAsset.name) return;

    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', newAsset.name);
      formData.append('type', newAsset.type);

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAssets([...assets, data.asset]);
        setNewAsset({ name: '', type: 'logo' });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/api/admin/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAssets(assets.filter(a => a.id !== assetId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center py-16">
            <Shield className="w-16 h-16 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-4">Admin Access Required</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to access the admin panel</p>
            <ConnectButton />
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center py-16">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
            <p className="text-gray-400">Verifying access...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center py-16">
            <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-2">Your wallet is not authorized to access this page.</p>
            <p className="text-sm text-gray-500">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-purple-500" />
          <h1 className="section-title mb-0">Admin Panel</h1>
        </div>

        {/* Upload New Asset */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" />
            Upload New Asset
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              placeholder="Asset name"
              className="input"
            />
            
            <select
              value={newAsset.type}
              onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as Asset['type'] })}
              className="input"
            >
              <option value="logo">Logo</option>
              <option value="frame">Frame</option>
              <option value="background">Background</option>
              <option value="sticker">Sticker</option>
              <option value="banner">Banner (2×1)</option>
            </select>
            
            <label className={`btn-primary flex items-center justify-center gap-2 cursor-pointer ${
              uploadingFile || !newAsset.name ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              {uploadingFile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploadingFile || !newAsset.name}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            Assets Library ({assets.length})
          </h2>
          
          {assets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No assets uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="relative group">
                  <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500">{asset.type}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
