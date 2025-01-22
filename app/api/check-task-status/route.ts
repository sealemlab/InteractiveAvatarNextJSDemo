import { NextResponse } from 'next/server';

const KEY = process.env.SLIDESPEAK_API_KEY;

export async function GET(req: Request) {
  try {
    if (!KEY) {
      throw new Error('API key is missing from .env');
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.slidespeak.co/api/v1/task/${taskId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slidespeak API error response:', errorText);
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking task status:', error);
    return NextResponse.json({ error: 'Failed to check task status' }, { status: 500 });
  }
}
