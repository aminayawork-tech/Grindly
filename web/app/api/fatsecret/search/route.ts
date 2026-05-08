import { NextRequest, NextResponse } from 'next/server';

// Module-level token cache — survives warm requests, resets on cold start
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&scope=basic',
  });
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.token;
}

// Parses "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g"
function parseDescription(desc: string) {
  const cal = parseFloat(desc.match(/Calories:\s*([\d.]+)/)?.[1] ?? '0');
  const fat = parseFloat(desc.match(/Fat:\s*([\d.]+)/)?.[1] ?? '0');
  const carbs = parseFloat(desc.match(/Carbs:\s*([\d.]+)/)?.[1] ?? '0');
  const protein = parseFloat(desc.match(/Protein:\s*([\d.]+)/)?.[1] ?? '0');
  const serving = desc.match(/^Per\s+([^-]+)/)?.[1]?.trim() ?? '100g';
  return { cal, fat, carbs, protein, serving };
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ foods: [] });

  const clientId = process.env.FATSECRET_CLIENT_ID ?? req.headers.get('x-fatsecret-client-id') ?? '';
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET ?? req.headers.get('x-fatsecret-client-secret') ?? '';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'FatSecret credentials not configured', foods: [] });
  }

  try {
    const token = await getAccessToken(clientId, clientSecret);
    const res = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&max_results=25`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const raw = data.foods?.food ?? [];
    const list = Array.isArray(raw) ? raw : [raw];
    const foods = list
      .map((f: { food_name: string; brand_name?: string; food_description?: string }) => {
        const { cal, fat, carbs, protein, serving } = parseDescription(f.food_description ?? '');
        return {
          food_name: f.food_name,
          brand_name: f.brand_name || undefined,
          serving_qty: 1,
          serving_unit: serving,
          nf_calories: cal,
          nf_protein: protein,
          nf_total_carbohydrate: carbs,
          nf_total_fat: fat,
        };
      })
      .filter(f => f.nf_calories > 0);
    return NextResponse.json({ foods });
  } catch {
    return NextResponse.json({ error: 'Search failed', foods: [] }, { status: 200 });
  }
}
