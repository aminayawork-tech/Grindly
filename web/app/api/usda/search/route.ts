import { NextRequest, NextResponse } from 'next/server';

interface UsdaFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: { nutrientId: number; value: number }[];
}

function getNutrient(nutrients: { nutrientId: number; value: number }[], id: number): number {
  return nutrients.find(n => n.nutrientId === id)?.value ?? 0;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ foods: [] });

  const apiKey = process.env.USDA_API_KEY ?? req.headers.get('x-usda-api-key') ?? 'DEMO_KEY';

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=25&api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const foods = ((data.foods as UsdaFood[]) ?? [])
      .map(f => ({
        food_name: f.description,
        brand_name: f.brandName || f.brandOwner || undefined,
        serving_qty: f.servingSize ?? 100,
        serving_unit: f.servingSizeUnit ?? 'g',
        nf_calories: getNutrient(f.foodNutrients, 1008),
        nf_protein: getNutrient(f.foodNutrients, 1003),
        nf_total_carbohydrate: getNutrient(f.foodNutrients, 1005),
        nf_total_fat: getNutrient(f.foodNutrients, 1004),
      }))
      .filter(f => f.nf_calories > 0);
    return NextResponse.json({ foods });
  } catch {
    return NextResponse.json({ error: 'Search failed', foods: [] }, { status: 200 });
  }
}
