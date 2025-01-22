import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const response = await fetch(`https://api2.heygen.com/v1/streaming/session.detail?session_id=${sessionId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error('HeyGen API error response:', errorText);
      throw new Error(`Failed to fetch session detail: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching session detail:', error);

    return NextResponse.json({ error: 'Failed to fetch session detail' }, { status: 500 });
  }
}
