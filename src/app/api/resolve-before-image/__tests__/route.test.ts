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

  it('appends /before to the tokenURI and returns the previous image', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ image: 'https://storage.googleapis.com/node-nft/refined/42-before.gif' })
    )

    const res = await call('?tokenId=42')
    const data = await res.json()

    expect(mockFetch).toHaveBeenCalledWith(
      `${NODES_METADATA_API}/42/before`,
      expect.anything()
    )
    expect(res.status).toBe(200)
    expect(data.url).toBe('https://storage.googleapis.com/node-nft/refined/42-before.gif')
    expect(data.format).toBe('gif')
    expect(data.proxyUrl).toContain('/api/proxy-gif?url=')
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
