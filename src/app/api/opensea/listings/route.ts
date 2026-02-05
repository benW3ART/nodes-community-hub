import { NextRequest, NextResponse } from 'next/server';

const NODES_CONTRACT = '0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

interface Listing {
  tokenId: string;
  price: string;
  image: string;
  url: string;
}

export async function GET(request: NextRequest) {
  const states = request.nextUrl.searchParams.get('states');
  
  if (!states) {
    return NextResponse.json({ listings: {} });
  }

  const innerStates = states.split(',').map(s => s.trim());
  const listings: Record<string, Listing[]> = {};

  // Initialize empty arrays for each state
  innerStates.forEach(state => {
    listings[state] = [];
  });

  // If no API key, return direct OpenSea links
  if (!OPENSEA_API_KEY) {
    innerStates.forEach(state => {
      // Return placeholder with direct link to filtered OpenSea collection
      listings[state] = [{
        tokenId: '',
        price: 'View on OpenSea',
        image: '',
        url: `https://opensea.io/collection/nodes-by-hunter?search[stringTraits][0][name]=Inner%20State&search[stringTraits][0][values][0]=${encodeURIComponent(state)}`
      }];
    });
    
    return NextResponse.json({ listings });
  }

  // With API key, fetch actual listings
  try {
    for (const state of innerStates) {
      const response = await fetch(
        `https://api.opensea.io/api/v2/listings/collection/nodes-by-hunter?limit=5`,
        {
          headers: {
            'X-API-KEY': OPENSEA_API_KEY,
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Filter by Inner State trait and map to our format
        const filtered = data.listings
          ?.filter((listing: any) => {
            const traits = listing.protocol_data?.parameters?.consideration?.[0]?.identifierOrCriteria;
            // Note: This is simplified - actual filtering would require fetching token metadata
            return true;
          })
          .map((listing: any) => ({
            tokenId: listing.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria || '',
            price: (parseFloat(listing.price?.current?.value || '0') / 1e18).toFixed(4),
            image: '',
            url: `https://opensea.io/assets/base/${NODES_CONTRACT}/${listing.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria}`,
          }))
          .slice(0, 3);

        listings[state] = filtered || [];
      }
    }
  } catch (error) {
    console.error('OpenSea API error:', error);
  }

  return NextResponse.json({ listings });
}
