import { describe, expect, it } from "vitest";
import { parseTelemetryPayload } from "../telemetry-validation";

describe("parseTelemetryPayload", () => {
  it("accepts known event types and keeps only bounded fields", () => {
    expect(
      parseTelemetryPayload({
        eventType: "TRIP_UNDERWAY_GPS",
        line: "  Bostancı - Büyükada  ",
        speedKnots: 12.4,
        ignoredAdminField: true,
      }),
    ).toEqual({
      eventType: "TRIP_UNDERWAY_GPS",
      line: "Bostancı - Büyükada",
      speedKnots: 12.4,
    });
  });

  it("rejects unknown event types and invalid measurements", () => {
    expect(parseTelemetryPayload({ eventType: "MADE_UP_EVENT" })).toBeNull();
    expect(
      parseTelemetryPayload({
        eventType: "TRIP_UNDERWAY_GPS",
        speedKnots: 900,
      }),
    ).toBeNull();
    expect(
      parseTelemetryPayload({
        eventType: "RADAR_CLICKED",
        headingDeg: Number.NaN,
      }),
    ).toBeNull();
  });

  it("rejects oversized labels instead of allowing unbounded metric keys", () => {
    expect(
      parseTelemetryPayload({ eventType: "APP_OPEN", line: "x".repeat(121) }),
    ).toBeNull();
  });

  it("accepts route selections for application-search statistics", () => {
    expect(parseTelemetryPayload({
      eventType: "ROUTE_SEARCH",
      origin: "Bostancı",
      destination: "Moda",
      line: "Bostancı → Moda",
    })).toMatchObject({ eventType: "ROUTE_SEARCH", origin: "Bostancı", destination: "Moda" });
  });
});
