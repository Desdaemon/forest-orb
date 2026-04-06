export type LocalizedBadge = {
  name?: string;
  description?: string;
  condition?: string;
  checkbox?: Record<string, string>;
};

type LocalizedBadgesByGame = Record<string, Record<string, LocalizedBadge>>;

const localizedBadgesCache = new Map<string, Promise<LocalizedBadgesByGame>>();

export function loadLocalizedBadges(lang: string): Promise<LocalizedBadgesByGame> {
  const cached = localizedBadgesCache.get(lang);
  if (cached) return cached;

  const request = fetch(`/lang/badge/${lang}.json`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Failed to load localized badges (${lang})`);
      return (await response.json()) as LocalizedBadgesByGame;
    })
    .catch((err) => {
      console.warn('BadgeItem: localized badge file load failed', err);
      return {} as LocalizedBadgesByGame;
    });

  localizedBadgesCache.set(lang, request);
  return request;
}
