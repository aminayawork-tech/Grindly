import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ common: [], branded: [] });

  const appId = process.env.NUTRITIONIX_APP_ID ?? req.headers.get('x-nutritionix-app-id') ?? '';
  const appKey = process.env.NUTRITIONIX_APP_KEY ?? req.headers.get('x-nutritionix-app-key') ?? '';

  if (!appId || !appKey) {
    return NextResponse.json({ error: 'Nutritionix API keys not configured', common: [], branded: [] }, { status: 200 });
  }

  try {
    const res = await fetch(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`,
      { headers: { 'x-app-id': appId, 'x-app-key': appKey } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Search failed', common: [], branded: [] }, { status: 200 });
  }
}
