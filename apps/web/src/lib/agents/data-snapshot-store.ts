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

import announcementsSnapshot from "./data-snapshots/announcements.json";

const announcementsRaw = announcementsSnapshot as AnnouncementsSnapshotFile;

/**
 * Snapshot dosyasından yayımlanabilir duyuruları seçer.
 *
 * KURAL (c68659a "strict same-day cancellation policy"): kaynaktan doğrulanmış
 * bir yayın tarihi (publishedAtSource === "SOURCE") olmayan kayıt YAYIMLANMAZ.
 * Tarihsiz kaydı snapshot/tarama günüyle damgalamak, kaynağın söylemediği bir
 * tarihi uydurmak olurdu; o yüzden böyle kayıtlar sessizce "güncel" sayılmaz.
 *
 * NEDEN SAF FONKSİYON: bu davranış, commit'li `announcements.json` dosyasının
 * o günkü içeriğine bağlı olmadan doğrulanabilmeli. Snapshot her senkronda
 * değişir; test onun içeriğine sabitlenirse veri güncellendiği anda kırılır.
 */
export function selectStoredAnnouncements(
  snapshot: AnnouncementsSnapshotFile | undefined
): OperatorAnnouncement[] {
  const out: OperatorAnnouncement[] = [];
  for (const s of snapshot?.sources ?? []) {
    for (const a of s.announcements ?? []) {
      if (a.publishedAt && a.publishedAtSource === "SOURCE") {
        out.push(a);
      }
    }
  }
  return out;
}

export function getStoredAnnouncements(): OperatorAnnouncement[] {
  return selectStoredAnnouncements(announcementsRaw);
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
