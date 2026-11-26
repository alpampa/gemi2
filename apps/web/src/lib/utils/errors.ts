/**
 * Hata nesnesinden güvenli mesaj çıkarımı.
 *
 * NEDEN: `catch (error: any) { error.message }` yaygın ama tip güvenli değil;
 * throw edilen her değer (string, obje, null) olabilir. Bu yardımcı, `unknown`
 * yakalanan değerlerden eyleme dönüştürülebilir bir mesaj üretir.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
