import { NextRequest, NextResponse } from 'next/server';

interface OFFProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: {
    'energy-kcal_serving'?: number;
    'energy-kcal_100g'?: number;
    proteins_serving?: number;
    proteins_100g?: number;
    carbohydrates_serving?: number;
    carbohydrates_100g?: number;
    fat_serving?: number;
    fat_100g?: number;
  };
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ foods: [] });

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&action=process&page_size=30&fields=product_name,brands,serving_size,serving_quantity,nutriments&sort_by=unique_scans_n`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Grindly/1.0 (grindly.app)' },
      cache: 'no-store',
    });

    const data = await res.json() as { products?: OFFProduct[] };
    const products = data.products ?? [];

    const foods = products
      .map((p) => {
        const n = p.nutriments ?? {};
        const perServing = n['energy-kcal_serving'] != null;
        const cal = perServing ? (n['energy-kcal_serving'] ?? 0) : (n['energy-kcal_100g'] ?? 0);
        const protein = perServing ? (n['proteins_serving'] ?? 0) : (n['proteins_100g'] ?? 0);
        const carbs = perServing ? (n['carbohydrates_serving'] ?? 0) : (n['carbohydrates_100g'] ?? 0);
        const fat = perServing ? (n['fat_serving'] ?? 0) : (n['fat_100g'] ?? 0);
        const servingUnit = p.serving_size ?? (perServing ? 'serving' : '100g');

        return {
          food_name: p.product_name?.trim() ?? '',
          brand_name: p.brands?.split(',')[0]?.trim() || undefined,
          serving_qty: 1,
          serving_unit: servingUnit,
          nf_calories: Math.round(cal),
          nf_protein: Math.round(protein * 10) / 10,
          nf_total_carbohydrate: Math.round(carbs * 10) / 10,
          nf_total_fat: Math.round(fat * 10) / 10,
        };
      })
      .filter(f => f.food_name && !isNaN(f.nf_calories) && f.nf_calories > 0);

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('[openfoodfacts] error:', err);
    return NextResponse.json({ error: String(err), foods: [] });
  }
}
