// Accepts either a raw SteamID64 ("7656119...") or a full profile URL
// (steamcommunity.com/profiles/<id> or /id/<vanity>) and resolves it to a
// SteamID64, using the Steam Web API to resolve vanity URLs when needed.
export async function resolveSteamId(input: string): Promise<string | null> {
  const trimmed = input.trim();

  const idMatch = trimmed.match(/^\d{17}$/) ?? trimmed.match(/\/profiles\/(\d{17})/);
  if (idMatch) return idMatch[1] ?? idMatch[0];

  const vanityMatch = trimmed.match(/\/id\/([^/?#]+)/);
  const vanity = vanityMatch ? vanityMatch[1] : (!trimmed.includes("/") ? trimmed : null);

  if (vanity) {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent(vanity)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.response?.success === 1) return data.response.steamid;
  }

  return null;
}
