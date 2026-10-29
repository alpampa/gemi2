/** Returns a vessel name supplied with the trip, excluding common placeholders. */
export function getReportedVesselName(value?: string | null): string | undefined {
  const name = value?.trim();
  if (!name || /^(unknown vessel|unknown|tbd|bilinmiyor|belirtilmemiş)$/i.test(name)) {
    return undefined;
  }
  return name;
}
