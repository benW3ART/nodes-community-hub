import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import {
  COLORS,
  loadImageSafe,
  loadLogo,
  drawRoundedRect,
  drawGradientText,
  drawTextWithGlow,
  drawNftWithBorder,
  drawWatermark,
  drawSubtleGlows,
} from '@/lib/canvas-utils';

interface PostRequest {
  template: string;
  nfts: { image: string; name: string }[];
  text: string;
  bgColor: string;
  textStyle?: 'default' | 'glow' | 'gradient' | 'outline';
  showWatermark?: boolean;
}

const SIZE = 1200;

async function renderTextOnly(ctx: CanvasRenderingContext2D, text: string) {
  drawGradientText(ctx, text, SIZE / 2, SIZE / 2 - 40, 80);
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.cyan;
  ctx.textAlign = 'center';
  ctx.fillText('NODES COMMUNITY', SIZE / 2, SIZE / 2 + 60);
}

async function renderSingle(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[]) {
  if (!nfts[0]) return;
  const nftSize = SIZE * 0.7;
  const x = (SIZE - nftSize) / 2;
  const y = (SIZE - nftSize) / 2 - 40;
  await drawNftWithBorder(ctx, nfts[0], x, y, nftSize);
}

async function renderDuo(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[]) {
  const nftSize = SIZE * 0.42;
  const gap = SIZE * 0.04;
  const startX = (SIZE - (nftSize * 2 + gap)) / 2;
  const y = (SIZE - nftSize) / 2 - 30;
  for (let i = 0; i < 2; i++) {
    if (nfts[i]) {
      await drawNftWithBorder(ctx, nfts[i], startX + i * (nftSize + gap), y, nftSize);
    }
  }
}

async function renderTrio(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[]) {
  const nftSize = SIZE * 0.35;
  const gap = SIZE * 0.03;
  if (nfts[0]) {
    await drawNftWithBorder(ctx, nfts[0], (SIZE - nftSize) / 2, SIZE * 0.12, nftSize);
  }
  const bottomY = SIZE * 0.52;
  const startX = (SIZE - (nftSize * 2 + gap)) / 2;
  for (let i = 1; i < 3; i++) {
    if (nfts[i]) {
      await drawNftWithBorder(ctx, nfts[i], startX + (i - 1) * (nftSize + gap), bottomY, nftSize);
    }
  }
}

async function renderQuad(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[]) {
  const nftSize = SIZE * 0.4;
  const gap = SIZE * 0.04;
  const startX = (SIZE - (nftSize * 2 + gap)) / 2;
  const startY = (SIZE - (nftSize * 2 + gap)) / 2 - 30;
  for (let i = 0; i < 4; i++) {
    if (nfts[i]) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      await drawNftWithBorder(ctx, nfts[i], startX + col * (nftSize + gap), startY + row * (nftSize + gap), nftSize);
    }
  }
}

async function renderSix(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[]) {
  const nftSize = SIZE * 0.28;
  const gap = SIZE * 0.03;
  const startX = (SIZE - (nftSize * 3 + gap * 2)) / 2;
  const startY = (SIZE - (nftSize * 2 + gap)) / 2 - 20;
  for (let i = 0; i < 6; i++) {
    if (nfts[i]) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      await drawNftWithBorder(ctx, nfts[i], startX + col * (nftSize + gap), startY + row * (nftSize + gap), nftSize);
    }
  }
}

async function renderEight(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[]) {
  const nftSize = SIZE * 0.2;
  const gap = SIZE * 0.025;
  const startX = (SIZE - (nftSize * 4 + gap * 3)) / 2;
  const startY = (SIZE - (nftSize * 2 + gap)) / 2 - 20;
  for (let i = 0; i < 8; i++) {
    if (nfts[i]) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      await drawNftWithBorder(ctx, nfts[i], startX + col * (nftSize + gap), startY + row * (nftSize + gap), nftSize);
    }
  }
}

async function renderGMPost(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[], text: string) {
  ctx.font = 'bold 200px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const gradient = ctx.createLinearGradient(SIZE * 0.2, SIZE * 0.3, SIZE * 0.8, SIZE * 0.5);
  gradient.addColorStop(0, COLORS.cyan);
  gradient.addColorStop(1, COLORS.teal);
  ctx.fillStyle = gradient;
  ctx.fillText('GM', SIZE / 2, SIZE * 0.35);
  if (nfts.length > 0) {
    const nftSize = SIZE * 0.18;
    const totalWidth = nfts.length * nftSize + (nfts.length - 1) * SIZE * 0.02;
    const startX = (SIZE - totalWidth) / 2;
    for (let i = 0; i < Math.min(nfts.length, 5); i++) {
      if (nfts[i]) {
        await drawNftWithBorder(ctx, nfts[i], startX + i * (nftSize + SIZE * 0.02), SIZE * 0.58, nftSize);
      }
    }
  }
  if (text && text.toLowerCase() !== 'gm') {
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, SIZE / 2, SIZE * 0.88);
  }
}

async function renderQuote(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[], text: string) {
  ctx.font = '300px Georgia, serif';
  ctx.fillStyle = `${COLORS.cyan}20`;
  ctx.textAlign = 'left';
  ctx.fillText('"', SIZE * 0.08, SIZE * 0.35);
  ctx.textAlign = 'right';
  ctx.fillText('"', SIZE * 0.92, SIZE * 0.75);
  ctx.font = 'italic 48px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxWidth = SIZE * 0.7;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  const lineHeight = 60;
  const startY = SIZE / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, SIZE / 2, startY + i * lineHeight);
  });
  if (nfts[0]) {
    await drawNftWithBorder(ctx, nfts[0], SIZE * 0.78, SIZE * 0.78, SIZE * 0.15);
  }
}

async function renderStats(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[], text: string) {
  const parts = text.split('|').map(s => s.trim());
  ctx.font = 'bold 48px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('COLLECTION STATS', SIZE / 2, SIZE * 0.15);
  const statsPerRow = Math.min(parts.length, 3);
  const statWidth = SIZE * 0.28;
  const gap = SIZE * 0.04;
  const startX = (SIZE - (statWidth * statsPerRow + gap * (statsPerRow - 1))) / 2;
  for (let i = 0; i < parts.length; i++) {
    const [label, value] = parts[i].split(':').map(s => s.trim());
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (statWidth + gap) + statWidth / 2;
    const y = SIZE * 0.35 + row * SIZE * 0.22;
    ctx.fillStyle = `${COLORS.cyan}10`;
    drawRoundedRect(ctx, x - statWidth / 2, y - SIZE * 0.08, statWidth, SIZE * 0.16, 16);
    ctx.fill();
    ctx.strokeStyle = `${COLORS.cyan}30`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 56px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.cyan;
    ctx.textAlign = 'center';
    ctx.fillText(value || '', x, y - 10);
    ctx.font = '24px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText(label || '', x, y + 35);
  }
  if (nfts.length > 0) {
    const nftSize = SIZE * 0.12;
    const totalWidth = Math.min(nfts.length, 6) * (nftSize + SIZE * 0.015);
    const nftStartX = (SIZE - totalWidth) / 2;
    for (let i = 0; i < Math.min(nfts.length, 6); i++) {
      if (nfts[i]) {
        await drawNftWithBorder(ctx, nfts[i], nftStartX + i * (nftSize + SIZE * 0.015), SIZE * 0.82, nftSize);
      }
    }
  }
}

async function renderGiveaway(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[], text: string) {
  ctx.font = 'bold 72px Inter, system-ui, sans-serif';
  const gradient = ctx.createLinearGradient(SIZE * 0.2, 0, SIZE * 0.8, 0);
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(0.5, '#FFA500');
  gradient.addColorStop(1, '#FFD700');
  ctx.fillStyle = gradient;
  ctx.textAlign = 'center';
  ctx.fillText('🎉 GIVEAWAY 🎉', SIZE / 2, SIZE * 0.12);
  if (nfts[0]) {
    const nftSize = SIZE * 0.45;
    await drawNftWithBorder(ctx, nfts[0], (SIZE - nftSize) / 2, SIZE * 0.2, nftSize);
    ctx.font = '40px serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('✨', SIZE * 0.22, SIZE * 0.3);
    ctx.fillText('✨', SIZE * 0.78, SIZE * 0.35);
    ctx.fillText('⭐', SIZE * 0.25, SIZE * 0.6);
    ctx.fillText('⭐', SIZE * 0.75, SIZE * 0.55);
  }
  ctx.font = '32px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text || 'Follow + RT + Tag 3 friends', SIZE / 2, SIZE * 0.78);
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText('Ends in 48 hours ⏰', SIZE / 2, SIZE * 0.88);
}

async function renderShowcase(ctx: CanvasRenderingContext2D, nfts: { image: string; name: string }[], text: string) {
  ctx.font = 'bold 48px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text || 'MY COLLECTION', SIZE / 2, SIZE * 0.1);
  if (nfts.length > 0) {
    const featuredSize = SIZE * 0.5;
    await drawNftWithBorder(ctx, nfts[0], SIZE * 0.08, SIZE * 0.2, featuredSize);
    const gridSize = SIZE * 0.22;
    const gridGap = SIZE * 0.02;
    const gridStartX = SIZE * 0.62;
    const gridStartY = SIZE * 0.2;
    for (let i = 1; i < Math.min(nfts.length, 5); i++) {
      const col = (i - 1) % 2;
      const row = Math.floor((i - 1) / 2);
      if (nfts[i]) {
        await drawNftWithBorder(ctx, nfts[i], gridStartX + col * (gridSize + gridGap), gridStartY + row * (gridSize + gridGap), gridSize);
      }
    }
  }
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText('NODES INNER STATES', SIZE / 2, SIZE * 0.92);
}

export async function POST(request: NextRequest) {
  try {
    const body: PostRequest = await request.json();
    const { template, nfts, text, bgColor, showWatermark = true } = body;

    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor || COLORS.black;
    ctx.fillRect(0, 0, SIZE, SIZE);

    drawSubtleGlows(ctx, SIZE);

    switch (template) {
      case 'text-only':
        await renderTextOnly(ctx, text);
        break;
      case 'single':
        await renderSingle(ctx, nfts);
        break;
      case 'duo':
        await renderDuo(ctx, nfts);
        break;
      case 'trio':
        await renderTrio(ctx, nfts);
        break;
      case 'quad':
        await renderQuad(ctx, nfts);
        break;
      case 'six':
        await renderSix(ctx, nfts);
        break;
      case 'full-set':
      case 'eight':
        await renderEight(ctx, nfts);
        break;
      case 'gm':
        await renderGMPost(ctx, nfts, text);
        break;
      case 'quote':
        await renderQuote(ctx, nfts, text);
        break;
      case 'stats':
        await renderStats(ctx, nfts, text);
        break;
      case 'giveaway':
        await renderGiveaway(ctx, nfts, text);
        break;
      case 'showcase':
        await renderShowcase(ctx, nfts, text);
        break;
      default:
        await renderSingle(ctx, nfts);
    }

    // Text overlay for basic templates
    if (text && !['text-only', 'gm', 'quote', 'stats', 'giveaway', 'showcase'].includes(template)) {
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      const metrics = ctx.measureText(text);
      const pillWidth = metrics.width + 60;
      const pillHeight = 70;
      const pillX = (SIZE - pillWidth) / 2;
      const pillY = SIZE - 100;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 35);
      ctx.fill();
      ctx.strokeStyle = `${COLORS.cyan}40`;
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 35);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, SIZE / 2, pillY + pillHeight / 2);
    }

    if (showWatermark) {
      const logo = await loadLogo();
      drawWatermark(ctx, logo, SIZE);
    }

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="nodes-post-${Date.now()}.png"`,
      },
    });
  } catch (error) {
    console.error('Post image creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create post image', details: String(error) },
      { status: 500 }
    );
  }
}
