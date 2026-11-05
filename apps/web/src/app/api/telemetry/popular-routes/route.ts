import { NextResponse } from "next/server";
import { getPopularRouteSearches } from "@/lib/services/passenger-analytics-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getPopularRouteSearches();
    return NextResponse.json(
      { ...result, periodDays: 7, minimumSearches: 10, measure: "app_route_selections" },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("Popular route summary error:", error);
    return NextResponse.json(
      { available: false, routes: [], error: "Rota özeti şu anda alınamadı." },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
