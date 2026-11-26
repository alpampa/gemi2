import { describe, expect, it } from "vitest";
import {
  getStoredAnnouncementsMeta,
  selectStoredAnnouncements,
  type AnnouncementsSnapshotFile,
} from "@/lib/agents/data-snapshot-store";
import type { OperatorAnnouncement } from "@/lib/types/announcement";

/**
 * Bu test dosyası BİLİNÇLİ olarak commit'li `announcements.json` içeriğine
 * sabitlenmez: snapshot her senkron turunda yeniden yazılır (kaynak sayfası
 * değişir, kayıt eklenir/çıkar). Testin ölçtüğü şey dosyanın o günkü hâli
 * değil, depo sözleşmesidir:
 *   - kaynaktan doğrulanmış yayın tarihi taşıyan kayıt yayımlanır,
 *   - tarihsiz kayıt snapshot günüyle damgalanıp "bugün" gibi sunulmaz.
 */
function record(
  overrides: Partial<OperatorAnnouncement> = {}
): OperatorAnnouncement {
  return {
    id: "sh-status-29.10.2026",
    operator: "Şehir Hatları",
    title: "İptal Seferler",
    type: "INFO",
    sourceUrl: "https://sehirhatlari.istanbul/tr/iptal-seferler",
    sourceVerified: true,
    ...overrides,
  };
}

function snapshot(
  announcements: OperatorAnnouncement[],
  operator = "Şehir Hatları"
): AnnouncementsSnapshotFile {
  return {
    generatedAt: "2026-10-29T14:20:00.000Z",
    sources: [
      {
        operator,
        fetchedAt: "2026-10-29T14:20:00.000Z",
        sourceUrl: "https://sehirhatlari.istanbul/tr/iptal-seferler",
        announcements,
      },
    ],
  };
}

describe("selectStoredAnnouncements — snapshot yayın sözleşmesi", () => {
  it("kaynaktan doğrulanmış yayın tarihi olan kayıt yayımlanır", () => {
    const stored = selectStoredAnnouncements(
      snapshot([
        record({ publishedAt: "29.10.2026", publishedAtSource: "SOURCE" }),
      ])
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].publishedAt).toBe("29.10.2026");
    expect(stored[0].publishedAtSource).toBe("SOURCE");
  });

  it("tarihsiz kayıt snapshot günüyle DAMGALANMAZ (uydurma tarih yok)", () => {
    const stored = selectStoredAnnouncements(snapshot([record()]));
    expect(stored).toHaveLength(0);
  });

  it("SCAN_DAY damgalı kayıt yayımlanmaz (tarihi kaynak söylemedi)", () => {
    const stored = selectStoredAnnouncements(
      snapshot([
        record({ publishedAt: "29.10.2026", publishedAtSource: "SCAN_DAY" }),
      ])
    );
    expect(stored).toHaveLength(0);
  });

  it("bozuk/eksik snapshot çökmez, boş liste döner", () => {
    expect(selectStoredAnnouncements(undefined)).toEqual([]);
    expect(
      selectStoredAnnouncements({ generatedAt: "2026-10-29T14:20:00.000Z", sources: [] })
    ).toEqual([]);
  });
});

describe("getStoredAnnouncementsMeta", () => {
  it("commit'li snapshot'ın üretim zamanı ve kaynak sayısı raporlanır", () => {
    const meta = getStoredAnnouncementsMeta();
    // Değer senkronla değişir; sözleşme "geçerli ISO damga + sayı" olmasıdır.
    expect(Number.isNaN(Date.parse(meta.generatedAt ?? ""))).toBe(false);
    expect(meta.sourceCount).toBeGreaterThanOrEqual(0);
  });
});
