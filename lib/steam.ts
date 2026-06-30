// Steam OpenID 2.0 login + Steam Web API helpers.
// Docs: https://partner.steamgames.com/doc/features/auth#websites
//       https://steamcommunity.com/dev

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

export function getSteamLoginUrl(returnTo: string) {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": new URL(returnTo).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

/**
 * Verifies the OpenID assertion Steam sends back to our callback by
 * re-posting it to Steam with mode=check_authentication, then extracts the
 * 64-bit SteamID from openid.claimed_id.
 */
export async function verifySteamAssertion(
  searchParams: URLSearchParams
): Promise<string | null> {
  const params = new URLSearchParams(searchParams);
  params.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await res.text();
  if (!text.includes("is_valid:true")) return null;

  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = claimedId.match(/\/id\/(\d+)$/) ?? claimedId.match(/(\d{17})$/);
  return match ? match[1] : null;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

/**
 * Fetches public profile info for a SteamID via the Steam Web API.
 * Requires STEAM_API_KEY (free, instant, from https://steamcommunity.com/dev/apikey).
 */
export async function getPlayerSummary(
  steamId: string
): Promise<SteamPlayerSummary | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  return data?.response?.players?.[0] ?? null;
}

export function steamProfileUrl(steamId: string) {
  return `https://steamcommunity.com/profiles/${steamId}`;
}
