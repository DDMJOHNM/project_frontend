/**
 * @jest-environment node
 */
import { POST, PUT } from './route'
import { NextRequest } from 'next/server'

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => undefined),
  })),
}))

describe('POST /api/client', () => {
  const originalFetch = global.fetch
  const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:9999'
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          first_name: 'Updated',
          last_name: 'Person',
          email: 'updated@example.com',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ) as jest.Mock
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (originalBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl
    }
    jest.clearAllMocks()
  })

  it('forwards client payload to the backend (create or update)', async () => {
    const payload = {
      first_name: 'Updated',
      last_name: 'Person',
      email: 'updated@example.com',
    }
    const req = new NextRequest('http://localhost:3000/api/client', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { success?: boolean; client?: { email?: string } }
    expect(json.success).toBe(true)
    expect(json.client?.email).toBe('updated@example.com')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toBe('http://localhost:9999/api/clients/add')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual(payload)
  })

  it('forwards initial_consult_notes when provided', async () => {
    const payload = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      initial_consult_notes: 'Feeling anxious and overwhelmed.',
    }
    const req = new NextRequest('http://localhost:3000/api/client', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(JSON.parse(init.body as string)).toEqual(payload)
  })

  it('forwards requested_counsellor and urgency when provided', async () => {
    const payload = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      requested_counsellor: 'Dr. Alex Morgan',
      urgency: 'soon',
    }
    const req = new NextRequest('http://localhost:3000/api/client', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(JSON.parse(init.body as string)).toEqual(payload)
  })
})

describe('PUT /api/client (counsellor selection)', () => {
  const originalFetch = global.fetch
  const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8081'
    global.fetch = jest.fn().mockResolvedValue(new Response('', { status: 200 })) as jest.Mock
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (originalBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl
    }
    jest.clearAllMocks()
  })

  it('sends PUT with counsellor payload to /api/clients/update/:client_id', async () => {
    const clientId = 'client-cf186df5-d4e5-4281-84ed-77ac7708cc38'
    const req = new NextRequest('http://localhost:3000/api/client', {
      method: 'PUT',
      body: JSON.stringify({
        client_id: clientId,
        requested_counsellor: 'Dr. Alex Morgan',
        urgency: 'soon',
      }),
    })

    const res = await PUT(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as { success?: boolean }
    expect(json.success).toBe(true)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toBe(
      `http://localhost:8081/api/clients/update/${encodeURIComponent(clientId)}`,
    )
    expect(init.method).toBe('PUT')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    const body = JSON.parse(init.body as string) as {
      client_id: string;
      requested_counsellor: string;
      urgency: string;
    }
    expect(body.client_id).toBe(clientId)
    expect(body.requested_counsellor).toBe('Dr. Alex Morgan')
    expect(body.urgency).toBe('soon')
  })
})
