import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    app: "ok",
    hindsightConfigured: Boolean(process.env.HINDSIGHT_API_KEY?.trim() && process.env.HINDSIGHT_BASE_URL?.trim()),
    groqConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
  }, { headers: { "Cache-Control": "no-store" } });
}
