import { NextResponse } from 'next/server';

// Cache duration - 24 hours in seconds
const CACHE_DURATION = 86400;

export async function GET() {
  try {
    const response = await fetch('http://3.142.98.113/api/news/finance', {
      next: {
        revalidate: CACHE_DURATION
      }
    });

    if (!response.ok) throw new Error('Failed to fetch news');
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
} 