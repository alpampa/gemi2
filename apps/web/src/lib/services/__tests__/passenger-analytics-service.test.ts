import { describe, it, expect } from "vitest";
import {
  recordTelemetryEvent,
  getTelemetrySummary,
} from "../passenger-analytics-service";

describe("Passenger Analytics & Telemetry Service", () => {
  it("starts from zero instead of seeded demo counters", async () => {
    const summary = await getTelemetrySummary();
    expect(summary.totalAppOpens).toBe(0);
    expect(summary.totalConfirmedOnboard).toBe(0);
    expect(summary.recentEvents).toEqual([]);
  });

  it("records APP_OPEN event and increments counter", async () => {
    const before = (await getTelemetrySummary()).totalAppOpens;
    const after = await recordTelemetryEvent({ eventType: "APP_OPEN" });
    expect(after.totalAppOpens).toBe(before + 1);
  });

  it("records LOCATION_GRANTED event", async () => {
    const before = (await getTelemetrySummary()).totalLocationGranted;
    const after = await recordTelemetryEvent({ eventType: "LOCATION_GRANTED" });
    expect(after.totalLocationGranted).toBe(before + 1);
  });

  it("counts route selections as app searches, separate from passenger counts", async () => {
    const summary = await recordTelemetryEvent({
      eventType: "ROUTE_SEARCH",
      line: "Bostancı → Moda",
      origin: "Bostancı",
      destination: "Moda",
    });

    expect(summary.lines["Bostancı → Moda"].routeSearches).toBe(1);
    expect(summary.totalConfirmedOnboard).toBe(0);
  });

  it("records ONBOARD_CONFIRMED event with line, operator, and vessel", async () => {
    const beforeConfirmed = (await getTelemetrySummary()).totalConfirmedOnboard;
    const summary = await recordTelemetryEvent({
      eventType: "ONBOARD_CONFIRMED",
      line: "Bostancı - Büyükada",
      operator: "Mavi Marmara",
      speedKnots: 11.4,
      vesselName: "Sedat Sevim",
      mmsi: "271001925",
    });

    expect(summary.totalConfirmedOnboard).toBe(beforeConfirmed + 1);
    expect(summary.lines["Bostancı - Büyükada"]).toBeDefined();
    expect(
      summary.lines["Bostancı - Büyükada"].confirmedOnboard,
    ).toBeGreaterThan(0);
    expect(summary.operators["Mavi Marmara"]).toBeDefined();

    // Check recent events list
    const latestEvent = summary.recentEvents[0];
    expect(latestEvent.eventType).toBe("ONBOARD_CONFIRMED");
    expect(latestEvent.line).toBe("Bostancı - Büyükada");
    expect(latestEvent.vesselName).toBe("Sedat Sevim");
  });

  it("handles new custom routes dynamically", async () => {
    const summary = await recordTelemetryEvent({
      eventType: "TRIP_UNDERWAY_GPS",
      line: "Yenikapı - Bandırma",
      operator: "İDO",
      speedKnots: 28.5,
    });

    expect(summary.lines["Yenikapı - Bandırma"]).toBeDefined();
    expect(summary.lines["Yenikapı - Bandırma"].underwayGps).toBe(1);
    expect(summary.operators["İDO"]).toBeDefined();
    expect(summary.operators["İDO"].underwayGps).toBe(1);
  });
});
