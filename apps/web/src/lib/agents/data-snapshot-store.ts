/**
 * AJAN SNAPSHOT DEPOSU (SIFIR SAHTE İPTAL GARANTİLİ)
 *
 * Ajanların ürettiği "son doğrulanmış" veri ve ayak izlerini saklar.
 * KESİN KURAL: Yayın tarihi (publishedAt) olmayan hiçbir kayıt snapshot
 * tarihiyle veya bugünün tarihiyle damgalanmaz.
 */

import type { OperatorAnnouncement } from "@/lib/types/announcement";
import type { OperatorScanReport } from "@/lib/agents/announcements-agent";

export interface AnnouncementsSnapshotFile {
  generatedAt: string;
  failures?: { operator: string; error: string }[];
  coverage?: OperatorScanReport[];
  sources: {
    operator: string;
    fetchedAt: string;
    sourceUrl: string;
    announcements: OperatorAnnouncement[];
  }[];
}

const announcementsRaw = require("./data-snapshots/announcements.json") as AnnouncementsSnapshotFile;

export function getStoredAnnouncements(): OperatorAnnouncement[] {
  const out: OperatorAnnouncement[] = [];
  for (const s of announcementsRaw?.sources ?? []) {
    for (const a of s.announcements ?? []) {
      // Yalnızca kaynaktan doğrulanmış gerçek yayın tarihi olan kayıtlar döner
      if (a.publishedAt && a.publishedAtSource === "SOURCE") {
        out.push(a);
      }
    }
  }
  return out;
}

export function getStoredAnnouncementsMeta() {
  return {
    generatedAt: announcementsRaw?.generatedAt,
    sourceCount: (announcementsRaw?.sources ?? []).length,
  };
}

export function getStoredAnnouncementCountByOperator(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of announcementsRaw?.sources ?? []) {
    counts[s.operator] = (s.announcements ?? []).length;
  }
  return counts;
}
