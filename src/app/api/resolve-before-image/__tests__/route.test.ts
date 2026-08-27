import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { NODES_METADATA_API } from '@/lib/constants'

const mockFetch = vi.fn()
global.fetch = mockFetch

const call = (query: string) =>
  GET(new NextRequest(`http://localhost/api/resolve-before-image${query}`))

const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 404,
  json: async () => body,
})

describe('GET /api/resolve-before-image', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('rejects a non-numeric tokenId', async () => {
    const res = await call('?tokenId=abc')
    expect(res.status).toBe(400)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // Real payload of /metadata/1330/before: a token refined out of Genesis
  // Interference, so its previous art lives in the interference bucket while
  // the refined art lives under nodes-art/the-refinement.
  const TOKEN_1330_BEFORE = {
    attributes: [
      { trait_type: 'Background', value: 'Black Void' },
      { trait_type: 'Type', value: 'Skull' },
      { trait_type: 'Gradient', value: 'None' },
      { trait_type: 'Grid', value: 'Velvet [Skull]' },
      { trait_type: 'Shade', value: 'Heat Large [Skull dots]' },
      { trait_type: 'Glow', value: 'None' },
      { trait_type: 'Inner State', value: 'Equilibrium' },
      { trait_type: 'Network Status', value: 'Genesis Interference' },
    ],
    image: 'https://storage.googleapis.com/node-nft/interference/1330.png',
    name: 'NODE #1330',
    description: 'an artistic network of digital identities.',
    id: '1330',
    cleanimage: 'https://storage.googleapis.com/node-nft/interference/cleaninterference/1330.png',
  }

  it('appends /before to the tokenURI and returns the previous image', async () => {
    mockFetch.mockResolvedValue(jsonResponse(TOKEN_1330_BEFORE))

    const res = await call('?tokenId=1330')
    const data = await res.json()

    expect(mockFetch).toHaveBeenCalledWith(
      `${NODES_METADATA_API}/1330/before`,
      expect.anything()
    )
    expect(res.status).toBe(200)
    // The pre-Refinement art, not the refined one and not cleanimage
    expect(data.url).toBe('https://storage.googleapis.com/node-nft/interference/1330.png')
    expect(data.format).toBe('png')
    expect(data.proxyUrl).toBe(
      '/api/proxy-gif?url=' + encodeURIComponent('https://storage.googleapis.com/node-nft/interference/1330.png')
    )
  })

  it('resolves a gif before image', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ image: 'https://storage.googleapis.com/node-nft/interference/42.gif' })
    )
    const data = await (await call('?tokenId=42')).json()
    expect(data.format).toBe('gif')
  })

  it('detects png format', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ image: 'https://example.com/7.png' }))
    const data = await (await call('?tokenId=7')).json()
    expect(data.format).toBe('png')
  })

  it('falls back to cleanimage when image is missing', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ cleanimage: 'https://example.com/9.png' }))
    const data = await (await call('?tokenId=9')).json()
    expect(data.url).toBe('https://example.com/9.png')
  })

  it('returns 404 when the before metadata has no image', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ name: 'NODES #1' }))
    const res = await call('?tokenId=1')
    expect(res.status).toBe(404)
    expect((await res.json()).url).toBeNull()
  })

  it('returns 404 when the metadata API responds with an error', async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false))
    const res = await call('?tokenId=1')
    expect(res.status).toBe(404)
  })

  it('returns 404 when the fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))
    const res = await call('?tokenId=1')
    expect(res.status).toBe(404)
  })
})
