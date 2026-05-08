import { NextRequest, NextResponse } from 'next/server';

let tokenCache: { token: string; expiresAt: number; clientId: string } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && tokenCache.clientId === clientId && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
    cache: 'no-store',
  });
  const text = await res.text();
  let data: Record<string, unknown>;
  try { data = JSON.parse(text); } catch { throw new Error(`Token endpoint non-JSON: ${text.slice(0, 200)}`); }
  if (!data.access_token) throw new Error(`Auth failed: ${text.slice(0, 300)}`);
  tokenCache = {
    token: data.access_token as string,
    expiresAt: Date.now() + (((data.expires_in as number) ?? 86400) - 60) * 1000,
    clientId,
  };
  return tokenCache.token;
}

// Parses "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g"
function parseDescription(desc: string) {
  const cal = parseFloat(desc.match(/Calories:\s*([\d.]+)/i)?.[1] ?? '0');
  const fat = parseFloat(desc.match(/Fat:\s*([\d.]+)/i)?.[1] ?? '0');
  const carbs = parseFloat(desc.match(/Carbs:\s*([\d.]+)/i)?.[1] ?? '0');
  const protein = parseFloat(desc.match(/Protein:\s*([\d.]+)/i)?.[1] ?? '0');
  const serving = desc.match(/^Per\s+([^-–]+)/)?.[1]?.trim() ?? '100g';
  return { cal, fat, carbs, protein, serving };
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ foods: [] });

  const clientId = process.env.FATSECRET_CLIENT_ID ?? req.headers.get('x-fatsecret-client-id') ?? '';
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET ?? req.headers.get('x-fatsecret-client-secret') ?? '';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Add your FatSecret Client ID and Secret in Settings', foods: [] });
  }

  let token: string;
  try {
    token = await getAccessToken(clientId, clientSecret);
  } catch (err) {
    console.error('[fatsecret] token error:', err);
    return NextResponse.json({ error: `Auth error — check your credentials (${String(err)})`, foods: [] });
  }

  try {
    const res = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&max_results=25`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    const text = await res.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { throw new Error(`Search non-JSON: ${text.slice(0, 200)}`); }

    const apiErr = data.error as { message?: string } | undefined;
    if (apiErr?.message) return NextResponse.json({ error: apiErr.message, foods: [] });

    const raw = (data.foods as { food?: unknown } | undefined)?.food ?? [];
    const list = Array.isArray(raw) ? raw : [raw];
    const foods = (list as { food_name: string; brand_name?: string; food_description?: string }[])
      .map(f => {
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
      .filter(f => !isNaN(f.nf_calories));

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('[fatsecret] search error:', err);
    return NextResponse.json({ error: String(err), foods: [] });
  }
}
