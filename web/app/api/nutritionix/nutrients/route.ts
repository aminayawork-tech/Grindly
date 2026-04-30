import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const appId = process.env.NUTRITIONIX_APP_ID ?? '';
  const appKey = process.env.NUTRITIONIX_APP_KEY ?? '';

  if (!appId || !appKey) {
    return NextResponse.json({ error: 'Nutritionix API keys not configured' }, { status: 200 });
  }

  try {
    const res = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: { 'x-app-id': appId, 'x-app-key': appKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Nutrients lookup failed' }, { status: 200 });
  }
}
