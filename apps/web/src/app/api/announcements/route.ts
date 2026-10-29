import { NextResponse } from "next/server";
import { getStoredAnnouncements, getStoredAnnouncementsMeta } from "@/lib/agents/data-snapshot-store";
import { OPERATOR_SCAN_COVERAGE, type OperatorScanReport } from "@/lib/agents/announcements-agent";
import { getLiveScan } from "@/lib/agents/live-scan-cache";
import { matchAnnouncementsToTrips } from "@/lib/agents/announcement-trip-matcher";
import { getMonitorState } from "@/lib/agents/announcement-monitor";
import { isAnnouncementCurrent } from "@/lib/utils/announcement-filter";
import { toTrDate } from "@/lib/utils/istanbul-date";
import type {
  DisruptionFreshness,
  OperatorAnnouncement,
} from "@/lib/types/announcement";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function GET() {
  try {
    const todayTr = toTrDate();
    const monitor = await getMonitorState();
    const archive = monitor.archives;
    const healthByOperator = new Map(monitor.health.map((h) => [h.operator, h]));

    const isHealthFresh = (operator: string): boolean => {
      const h = healthByOperator.get(operator);
      if (h?.status !== "OK") return false;
      const checked = Date.parse(h.lastCheckedAt);
      return !Number.isNaN(checked) && Date.now() - checked < 2 * 60 * 1000;
    };
    const sourceEntries = OPERATOR_SCAN_COVERAGE.filter((e) => e.hasSource);
    const archiveCoversAll =
      sourceEntries.length > 0 &&
      sourceEntries.every((e) => archive.has(e.operator) && isHealthFresh(e.operator));
    const live = archiveCoversAll ? null : await getLiveScan();

    const storedByOperator = new Map<string, OperatorAnnouncement[]>();
    for (const a of getStoredAnnouncements()) {
      const list = storedByOperator.get(a.operator) ?? [];
      list.push(a);
      storedByOperator.set(a.operator, list);
    }

    const useLive = new Map<string, OperatorAnnouncement[]>();
    for (const s of live?.snapshots ?? []) {
      useLive.set(s.operator, s.announcements);
    }

    const coverage: (OperatorScanReport & { usedFallback?: boolean })[] = [];
    const rawAnnouncements: OperatorAnnouncement[] = [];

    for (const entry of OPERATOR_SCAN_COVERAGE) {
      if (!entry.hasSource) {
        coverage.push({ operator: entry.operator, status: "NO_SOURCE", note: entry.note });
        continue;
      }
      const health = healthByOperator.get(entry.operator);
      const archived = archive.get(entry.operator);
      const liveReport = live?.coverage.find((c) => c.operator === entry.operator);
      const liveAnnouncements = useLive.get(entry.operator);

      if (archived && health?.status === "OK" && (!live || isHealthFresh(entry.operator))) {
        coverage.push({
          operator: entry.operator,
          status: "SCANNED",
          url: archived.sourceUrl,
          announcementCount: archived.announcements.length,
          note: `Dakikalık izleme arşivi (son doğrulama: ${archived.fetchedAt}).`,
        });
        rawAnnouncements.push(...archived.announcements);
        continue;
      }

      if (liveReport?.status === "SCANNED" && liveAnnouncements) {
        coverage.push(liveReport);
        rawAnnouncements.push(...liveAnnouncements);
        continue;
      }

      const fallbackList = archived?.announcements ?? storedByOperator.get(entry.operator);
      if (fallbackList && fallbackList.length > 0) {
        coverage.push({
          operator: entry.operator,
          status: liveReport?.status === "FAILED" ? "FAILED" : "SCANNED",
          url: entry.url,
          error: liveReport?.error,
          announcementCount: fallbackList.length,
          usedFallback: true,
          note: "Canlı tarama bu turda alınamadı; bayat iptal üretilmemesi için geçmiş snapshot iptalleri devre dışı bırakıldı.",
        });
      } else {
        coverage.push(
          liveReport ?? {
            operator: entry.operator,
            status: "SCANNED",
            url: entry.url,
            announcementCount: 0,
            note: "Bugün aktif iptal duyurusu bulunmamaktadır.",
          }
        );
      }
    }

    // KESİN KURAL: Yalnızca BUGÜNÜN (todayTr) resmî kaynak tarihli (publishedAtSource === "SOURCE")
    // ve gerçekten iptal bildiren duyurular kabul edilir.
    const announcements = rawAnnouncements.filter((a) => {
      if (a.publishedAt !== todayTr) return false;
      if (a.publishedAtSource && a.publishedAtSource !== "SOURCE") return false;
      if (!isAnnouncementCurrent(a)) return false;
      if (a.type !== "CANCELLATION" && a.type !== "CANCELLED_TRIPS") return false;
      const text = `${a.title || ""} ${a.body || ""}`.toLocaleLowerCase("tr-TR");
      if (text.includes("bulunmamaktadır") || text.includes("bulunmamaktadir")) return false;
      return text.includes("iptal") || text.includes("yapılamamakta") || text.includes("yapilamamakta");
    });

    const fallbackOperators = new Set(
      coverage.filter((c) => c.usedFallback).map((c) => c.operator)
    );
    const freshnessFor = (operator: string): DisruptionFreshness => {
      const health = healthByOperator.get(operator);
      if (fallbackOperators.has(operator) || health?.status === "UNREACHABLE") return "STALE";
      if (health?.status === "OK") return "FRESH";
      return "FRESH";
    };

    const disruptions = matchAnnouncementsToTrips(announcements)
      .filter((d) => d.kind === "CANCELLED" && !fallbackOperators.has(d.operator))
      .map((d) => ({ ...d, freshness: freshnessFor(d.operator) }));

    const storedMeta = getStoredAnnouncementsMeta();

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      announcements,
      disruptions,
      sourceHealth: monitor.health,
      recentChanges: monitor.recentChanges.slice(0, 50),
      meta: {
        announcementCount: announcements.length,
        disruptionCount: disruptions.length,
        liveScanAt: live ? new Date(live.at).toISOString() : null,
        storedSnapshotGeneratedAt: storedMeta.generatedAt ?? null,
        coverage,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Duyuru verisi okunamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
