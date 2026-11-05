import type {
  TelemetryEventPayload,
  TelemetryEventType,
} from "@/lib/types/analytics";

const EVENT_TYPES: readonly TelemetryEventType[] = [
  "APP_OPEN",
  "LOCATION_GRANTED",
  "PIER_PROXIMITY",
  "TRIP_UNDERWAY_GPS",
  "ONBOARD_CONFIRMED",
  "RADAR_CLICKED",
  "ROUTE_SEARCH",
];

const STRING_LIMITS = {
  sessionId: 100,
  line: 120,
  origin: 80,
  destination: 80,
  operator: 60,
  vesselName: 100,
  mmsi: 20,
} as const;

export function parseTelemetryPayload(
  value: unknown,
): TelemetryEventPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.eventType !== "string" ||
    !EVENT_TYPES.includes(input.eventType as TelemetryEventType)
  ) {
    return null;
  }

  const payload: TelemetryEventPayload = {
    eventType: input.eventType as TelemetryEventType,
  };
  for (const [key, maxLength] of Object.entries(STRING_LIMITS)) {
    const item = input[key];
    if (item === undefined || item === null) continue;
    if (typeof item !== "string" || item.length > maxLength) return null;
    const trimmed = item.trim();
    if (trimmed) payload[key as keyof typeof STRING_LIMITS] = trimmed;
  }

  for (const key of ["speedKnots", "headingDeg", "timestamp"] as const) {
    const item = input[key];
    if (item === undefined || item === null) continue;
    if (typeof item !== "number" || !Number.isFinite(item)) return null;
    if (key === "speedKnots" && (item < 0 || item > 60)) return null;
    if (key === "headingDeg" && (item < 0 || item > 360)) return null;
    if (key === "timestamp" && (item < 0 || item > Date.now() + 60_000))
      return null;
    payload[key] = item;
  }

  return payload;
}
