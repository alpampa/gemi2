import type {
  TelemetryEventPayload,
  DailyAnalyticsSummary,
} from "../types/analytics";
import {
  isKvConfigured,
  kvGetJsonStrict,
  kvRunLuaJson,
} from "../agents/kv-store";

/**
 * Passenger Analytics & Telemetry Service
 *
 * Anonim yolcu ve vapur kullanım istatistiklerini toplar,
 * hat ve operatör bazında agregasyon yapar.
 */

// In-memory fallback for local development without a configured shared KV.
let activeStore: DailyAnalyticsSummary =
  createDefaultDaySummary(getTodayDateString());

const RETENTION_SECONDS = 8 * 24 * 60 * 60;

const APPLY_TELEMETRY_LUA = `
local raw = redis.call('GET', KEYS[1])
local summary = raw and cjson.decode(raw) or cjson.decode(ARGV[1])
local event = cjson.decode(ARGV[2])
local totalFields = {
  APP_OPEN = 'totalAppOpens',
  LOCATION_GRANTED = 'totalLocationGranted',
  PIER_PROXIMITY = 'totalPierVisits',
  TRIP_UNDERWAY_GPS = 'totalGpsUnderway',
  ONBOARD_CONFIRMED = 'totalConfirmedOnboard'
}
local totalField = totalFields[event.eventType]
if totalField then summary[totalField] = (summary[totalField] or 0) + 1 end

if event.line and event.line ~= '' then
  local line = summary.lines[event.line]
  if not line then
    local splitAt = string.find(event.line, '-', 1, true)
    local origin = event.origin or (splitAt and string.sub(event.line, 1, splitAt - 1) or '')
    local destination = event.destination or (splitAt and string.sub(event.line, splitAt + 1) or '')
    line = { line = event.line, origin = origin, destination = destination,
      appOpens = 0, atPier = 0, underwayGps = 0, confirmedOnboard = 0, routeSearches = 0 }
    summary.lines[event.line] = line
  end
  local lineFields = {
    APP_OPEN = 'appOpens', PIER_PROXIMITY = 'atPier',
    TRIP_UNDERWAY_GPS = 'underwayGps', ONBOARD_CONFIRMED = 'confirmedOnboard',
    ROUTE_SEARCH = 'routeSearches'
  }
  local lineField = lineFields[event.eventType]
  if lineField then line[lineField] = line[lineField] + 1 end
end

if event.operator and event.operator ~= '' then
  local operator = summary.operators[event.operator]
  if not operator then
    operator = { operator = event.operator, underwayGps = 0, confirmedOnboard = 0 }
    summary.operators[event.operator] = operator
  end
  if event.eventType == 'TRIP_UNDERWAY_GPS' then operator.underwayGps = operator.underwayGps + 1 end
  if event.eventType == 'ONBOARD_CONFIRMED' then operator.confirmedOnboard = operator.confirmedOnboard + 1 end
end

local recent = summary.recentEvents or {}
table.insert(recent, 1, event)
while #recent > 50 do table.remove(recent) end
summary.recentEvents = recent
redis.call('SET', KEYS[1], cjson.encode(summary), 'EX', ARGV[3])
return cjson.encode(summary)
`;

function getTodayDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function createDefaultDaySummary(date: string): DailyAnalyticsSummary {
  return {
    date,
    storage: isKvConfigured() ? "shared" : "process-local",
    totalAppOpens: 0,
    totalLocationGranted: 0,
    totalPierVisits: 0,
    totalGpsUnderway: 0,
    totalConfirmedOnboard: 0,
    lines: {},
    operators: {},
    recentEvents: [],
  };
}

function createTelemetryEvent(payload: TelemetryEventPayload) {
  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType: payload.eventType,
    ...(payload.line ? { line: payload.line } : {}),
    ...(payload.origin ? { origin: payload.origin } : {}),
    ...(payload.destination ? { destination: payload.destination } : {}),
    ...(payload.operator ? { operator: payload.operator } : {}),
    ...(payload.speedKnots !== undefined
      ? { speedKnots: payload.speedKnots }
      : {}),
    ...(payload.vesselName ? { vesselName: payload.vesselName } : {}),
    timestamp: new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date()),
  };
}

function applyTelemetryEvent(
  summary: DailyAnalyticsSummary,
  payload: TelemetryEventPayload,
): DailyAnalyticsSummary {
  const event = createTelemetryEvent(payload);

  // General counters
  switch (payload.eventType) {
    case "APP_OPEN":
      summary.totalAppOpens += 1;
      break;
    case "LOCATION_GRANTED":
      summary.totalLocationGranted += 1;
      break;
    case "PIER_PROXIMITY":
      summary.totalPierVisits += 1;
      break;
    case "TRIP_UNDERWAY_GPS":
      summary.totalGpsUnderway += 1;
      break;
    case "ONBOARD_CONFIRMED":
      summary.totalConfirmedOnboard += 1;
      break;
  }

  if (payload.line) {
    if (!summary.lines[payload.line]) {
      summary.lines[payload.line] = {
        line: payload.line,
        origin: payload.origin || payload.line.split("-")[0]?.trim() || "",
        destination:
          payload.destination || payload.line.split("-")[1]?.trim() || "",
        appOpens: 0,
        atPier: 0,
        underwayGps: 0,
        confirmedOnboard: 0,
        routeSearches: 0,
      };
    }
    const line = summary.lines[payload.line];
    if (payload.eventType === "APP_OPEN") line.appOpens += 1;
    if (payload.eventType === "PIER_PROXIMITY") line.atPier += 1;
    if (payload.eventType === "TRIP_UNDERWAY_GPS") line.underwayGps += 1;
    if (payload.eventType === "ONBOARD_CONFIRMED") line.confirmedOnboard += 1;
    if (payload.eventType === "ROUTE_SEARCH") line.routeSearches = (line.routeSearches ?? 0) + 1;
  }

  if (payload.operator) {
    if (!summary.operators[payload.operator]) {
      summary.operators[payload.operator] = {
        operator: payload.operator,
        underwayGps: 0,
        confirmedOnboard: 0,
      };
    }
    const operator = summary.operators[payload.operator];
    if (payload.eventType === "TRIP_UNDERWAY_GPS") operator.underwayGps += 1;
    if (payload.eventType === "ONBOARD_CONFIRMED")
      operator.confirmedOnboard += 1;
  }

  summary.recentEvents = [event, ...summary.recentEvents.slice(0, 49)];
  return summary;
}

export async function recordTelemetryEvent(
  payload: TelemetryEventPayload,
): Promise<DailyAnalyticsSummary> {
  const today = getTodayDateString();
  if (isKvConfigured()) {
    const persisted = await kvRunLuaJson<DailyAnalyticsSummary>(
      APPLY_TELEMETRY_LUA,
      [`vapur:analytics:${today}`],
      [
        JSON.stringify(createDefaultDaySummary(today)),
        JSON.stringify(createTelemetryEvent(payload)),
        String(RETENTION_SECONDS),
      ],
    );
    if (!persisted) throw new Error("Telemetri KV kaydı okunamadı.");
    return { ...persisted, storage: "shared" };
  }

  if (activeStore.date !== today) {
    activeStore = createDefaultDaySummary(today);
  }
  return {
    ...applyTelemetryEvent(activeStore, payload),
    storage: "process-local",
  };
}

export async function getTelemetrySummary(): Promise<DailyAnalyticsSummary> {
  const today = getTodayDateString();
  if (isKvConfigured()) {
    const persisted = await kvGetJsonStrict<DailyAnalyticsSummary>(
      `vapur:analytics:${today}`,
    );
    return persisted
      ? { ...persisted, storage: "shared" }
      : createDefaultDaySummary(today);
  }
  if (activeStore.date !== today) {
    activeStore = createDefaultDaySummary(today);
  }
  return activeStore;
}

export interface PopularRouteSearch {
  line: string;
  origin: string;
  destination: string;
  searches: number;
}

/** App içindeki rota seçimi sayısıdır; gerçek yolcu/biniş sayısı değildir. */
export async function getPopularRouteSearches(): Promise<{
  available: boolean;
  routes: PopularRouteSearch[];
}> {
  if (!isKvConfigured()) return { available: false, routes: [] };

  const totals = new Map<string, PopularRouteSearch>();
  const [year, month, day] = getTodayDateString().split("-").map(Number);
  const today = new Date(Date.UTC(year, month - 1, day, 12));

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const summary = await kvGetJsonStrict<DailyAnalyticsSummary>(`vapur:analytics:${dateKey}`);
    for (const [lineKey, line] of Object.entries(summary?.lines ?? {})) {
      const searches = line.routeSearches ?? 0;
      if (searches === 0) continue;
      const current = totals.get(lineKey) ?? {
        line: lineKey, origin: line.origin, destination: line.destination, searches: 0,
      };
      current.searches += searches;
      totals.set(lineKey, current);
    }
  }

  return {
    available: true,
    routes: Array.from(totals.values())
      .filter((route) => route.searches >= 10)
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 5),
  };
}
