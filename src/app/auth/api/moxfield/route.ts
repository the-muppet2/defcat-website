// Next.js API Route with EXACT Moxfield headers
// app/api/moxfield/route.ts

import { NextRequest, NextResponse } from 'next/server'

const MOXFIELD_API_BASE = 'https://api2.moxfield.com/v3/decks'

// Get current Moxfield version (update this periodically)
// Check https://moxfield.com and inspect network tab for latest version
const MOXFIELD_VERSION = '2025.10.13.2'

export async function POST(request: NextRequest) {
  try {
    const { publicId, action = 'get' } = await request.json()

    if (action === 'get' && !publicId) {
      return NextResponse.json({ error: 'publicId required' }, { status: 400 })
    }

    const moxfieldUrl = `${MOXFIELD_API_BASE}/all/${publicId}`

    console.log(`Fetching: ${moxfieldUrl}`)

    // Use EXACT headers from browser inspection
    const response = await fetch(moxfieldUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        authorization: 'Bearer undefined',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'sec-ch-ua': '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'x-moxfield-version': MOXFIELD_VERSION,
        Referer: 'https://moxfield.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
      },
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Moxfield error:', response.status, errorText)

      return NextResponse.json(
        {
          error: 'Failed to fetch from Moxfield',
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET method also supported (for browser testing)
export async function GET(request: NextRequest) {
  const publicId = request.nextUrl.searchParams.get('publicId')

  if (!publicId) {
    return NextResponse.json({ error: 'publicId query parameter required' }, { status: 400 })
  }

  // Reuse POST logic
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ publicId, action: 'get' }),
    })
  )
}
