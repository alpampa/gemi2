import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { kvIncrementWithTtl } from "@/lib/agents/kv-store";
import { recordTelemetryEvent } from "@/lib/services/passenger-analytics-service";
import { parseTelemetryPayload } from "@/lib/utils/telemetry-validation";

export const dynamic = "force-dynamic";
const RATE_LIMIT = 90;
const RATE_WINDOW_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 8192) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const bodyText = await req.text();
    if (bodyText.length > 8192) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let input: unknown;
    try {
      input = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }
    const body = parseTelemetryPayload(input);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid event payload" },
        { status: 400 },
      );
    }

    const clientIp =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      body.sessionId ||
      "unknown";
    const ipHash = createHash("sha256")
      .update(clientIp)
      .digest("hex")
      .slice(0, 24);
    const windowId = Math.floor(Date.now() / (RATE_WINDOW_SECONDS * 1000));
    const requestCount = await kvIncrementWithTtl(
      `vapur:telemetry-rate:${ipHash}:${windowId}`,
      RATE_WINDOW_SECONDS + 10,
    );
    if (requestCount > RATE_LIMIT) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(
                1,
                (windowId + 1) * RATE_WINDOW_SECONDS -
                  Math.floor(Date.now() / 1000),
              ),
            ),
          },
        },
      );
    }

    const summary = await recordTelemetryEvent(body);

    return NextResponse.json(
      {
        success: true,
        eventType: body.eventType,
        totalConfirmedOnboard: summary.totalConfirmedOnboard,
        totalGpsUnderway: summary.totalGpsUnderway,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Telemetry event record error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
