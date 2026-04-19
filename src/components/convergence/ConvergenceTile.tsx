'use client';

import Image from 'next/image';
import type { NodeNFT } from '@/types/nft';
import type { Phase } from '@/lib/convergence-phases';

interface ConvergenceTileProps {
  nft: NodeNFT;
  phase: Phase;
  willEvolve: boolean;
}

function proxyUrl(raw: string): string {
  return `/api/proxy-gif?url=${encodeURIComponent(raw)}`;
}

function findForm(nft: NodeNFT): string {
  const typeAttr = nft.metadata?.attributes?.find(
    (a) => a.trait_type === 'Type'
  );
  return typeAttr?.value ?? '—';
}

export function ConvergenceTile({ nft, phase, willEvolve }: ConvergenceTileProps) {
  const isPreReveal = phase === 'announce' || phase === 'snapshot';
  const isIntermediate = phase === 'intermediate';
  const isRevealed = phase === 'reveal';

  // Pre-reveal shows the clean/unevolved form; reveal shows evolved image.
  const baseRaw =
    isRevealed || !nft.cleanImage ? nft.image : nft.cleanImage;
  const imgSrc = proxyUrl(baseRaw);

  const form = findForm(nft);

  return (
    <div
      style={{
        position: 'relative',
        background: '#0A0A0A',
        border: `1px solid ${willEvolve ? 'rgba(0,212,255,0.3)' : '#1a1a1a'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.3s',
      }}
    >
      <div
        style={{
          aspectRatio: '1 / 1',
          position: 'relative',
          background: '#111',
          overflow: 'hidden',
        }}
      >
        <Image
          src={imgSrc}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{
            imageRendering: 'pixelated',
            objectFit: 'cover',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '2px 8px',
            borderRadius: 9999,
            background: 'rgba(0,212,255,0.2)',
            color: '#00D4FF',
            border: '1px solid rgba(0,212,255,0.3)',
            fontSize: 10,
            fontWeight: 600,
            zIndex: 3,
          }}
        >
          #{nft.tokenId}
        </div>

        {isPreReveal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.85))',
              backdropFilter: 'blur(6px) saturate(0.7)',
              WebkitBackdropFilter: 'blur(6px) saturate(0.7)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,212,255,0.06) 2px 3px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                right: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10,
                letterSpacing: '0.1em',
                color: 'rgba(0,212,255,0.8)',
                textTransform: 'uppercase',
              }}
            >
              Awaiting Snapshot
            </div>
          </div>
        )}

        {isIntermediate && (
          <>
            <Image
              src={imgSrc}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, 25vw"
              style={{
                imageRendering: 'pixelated',
                objectFit: 'cover',
                mixBlendMode: 'screen',
                transform: 'translateX(-2px)',
                filter: 'hue-rotate(140deg) saturate(2) brightness(1.1)',
                animation: 'glitch-x 1.6s steps(2) infinite',
                opacity: 0.6,
                zIndex: 2,
              }}
            />
            <Image
              src={imgSrc}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, 25vw"
              style={{
                imageRendering: 'pixelated',
                objectFit: 'cover',
                mixBlendMode: 'screen',
                transform: 'translateX(2px)',
                filter: 'hue-rotate(320deg) saturate(2) brightness(1.1)',
                animation: 'glitch-x 1.6s steps(2) -0.2s infinite',
                opacity: 0.6,
                zIndex: 3,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 4,
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.07) 2px 3px)',
                animation: 'scan 6s linear infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                right: 10,
                zIndex: 5,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10,
                letterSpacing: '0.1em',
                color: '#4FFFDF',
                textTransform: 'uppercase',
                textShadow: '0 0 8px rgba(79,255,223,0.6)',
              }}
            >
              Evolving…
            </div>
          </>
        )}

        {isRevealed && nft.interference && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 3,
              color: '#4FFFDF',
              fontSize: 14,
              textShadow: '0 0 10px rgba(79,255,223,0.8)',
            }}
            aria-hidden="true"
          >
            ⚡
          </div>
        )}
      </div>

      <div style={{ padding: 10 }}>
        <div
          style={{
            fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
          }}
        >
          NODE #{nft.tokenId}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            marginTop: 3,
          }}
        >
          <span style={{ color: isRevealed ? '#00D4FF' : '#4B5563' }}>
            {isRevealed ? nft.innerState : '— — —'}
          </span>
          <span
            style={{
              color: '#6B7280',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {form}
          </span>
        </div>
      </div>
    </div>
  );
}
