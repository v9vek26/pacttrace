import { NextResponse } from "next/server";
import { recallVendorMemories } from "@/lib/vendor-memory";

export const dynamic = "force-dynamic";

// Read-only connectivity check. Seeding belongs in the intentional local CLI.
export async function GET() {
  try {
    const memories = await recallVendorMemories("CloudNova", "What renewal discount and conditions were promised?");
    return NextResponse.json({ success: true, recalledMemoryCount: memories.length },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Hindsight connectivity check failed" }, { status: 502 });
  }
}
