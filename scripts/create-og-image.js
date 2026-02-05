const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function createOGImage() {
  const width = 1200;
  const height = 630;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background gradient (dark)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle grid pattern
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Try to load some NODES NFTs to feature
  const nftIds = [1, 100, 500, 1000, 2000]; // Mix of different ones
  const nftSize = 100;
  const startX = 100;
  const nftY = 80;
  
  for (let i = 0; i < nftIds.length; i++) {
    try {
      const url = `https://storage.googleapis.com/node-nft/innerstate/${nftIds[i]}.gif`;
      const buffer = await fetchImage(url);
      const img = await loadImage(buffer);
      const x = startX + (i * (nftSize + 100));
      ctx.drawImage(img, x, nftY, nftSize, nftSize);
    } catch (e) {
      console.log(`Could not load NFT ${nftIds[i]}:`, e.message);
    }
  }
  
  // Main title: "NODES"
  ctx.fillStyle = '#00D4FF';
  ctx.font = 'bold 90px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NODES', width / 2, 290);
  
  // Subtitle: "Community Hub"
  ctx.fillStyle = '#4FFFDF';
  ctx.font = 'bold 45px Arial, sans-serif';
  ctx.fillText('Community Hub', width / 2, 370);
  
  // Tagline
  ctx.fillStyle = '#888888';
  ctx.font = '26px Arial, sans-serif';
  ctx.fillText('3,333 Digital Identities on Base', width / 2, 450);
  
  // Features
  ctx.fillStyle = '#666666';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('Gallery • Grid Creator • Banner Creator • Leaderboard • Full Sets', width / 2, 520);
  
  // Decorative elements - cyan glow corners
  const glowGradient1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 250);
  glowGradient1.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
  glowGradient1.addColorStop(1, 'rgba(0, 212, 255, 0)');
  ctx.fillStyle = glowGradient1;
  ctx.fillRect(0, 0, 250, 250);
  
  const glowGradient2 = ctx.createRadialGradient(width, height, 0, width, height, 250);
  glowGradient2.addColorStop(0, 'rgba(79, 255, 223, 0.2)');
  glowGradient2.addColorStop(1, 'rgba(79, 255, 223, 0)');
  ctx.fillStyle = glowGradient2;
  ctx.fillRect(width - 250, height - 250, 250, 250);
  
  // Add border with gradient effect
  ctx.strokeStyle = '#00D4FF';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, width - 30, height - 30);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, '../public/og-image.png');
  fs.writeFileSync(outputPath, buffer);
  console.log('OG image created:', outputPath);
  console.log('Size:', buffer.length, 'bytes');
}

createOGImage().catch(console.error);
