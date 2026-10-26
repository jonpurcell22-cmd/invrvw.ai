export type LinkedInUrlResult = { url: string } | { error: string };

const PROFILE_ERROR =
  "Paste a public LinkedIn profile link, like linkedin.com/in/their-name.";

/**
 * Accepts a public LinkedIn profile URL and returns a canonical https URL.
 * Empty input means the field was left blank. Anything else that is not a
 * /in/ or /pub/ profile is an error.
 */
export function parseInterviewerLinkedInUrl(
  raw: string,
): LinkedInUrlResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { error: PROFILE_ERROR };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    return { error: PROFILE_ERROR };
  }

  const inMatch = parsed.pathname.match(/^\/in\/([^/?#]+)/i);
  if (inMatch) {
    let slug = inMatch[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      return { error: PROFILE_ERROR };
    }
    slug = slug.replace(/\/+$/, "").trim();
    if (!/^[\p{L}\p{N}_%-]{2,}$/u.test(slug)) {
      return { error: PROFILE_ERROR };
    }
    return { url: `https://www.linkedin.com/in/${encodeURIComponent(slug)}` };
  }

  const pubMatch = parsed.pathname.match(/^\/pub\/([^?#]+)/i);
  if (pubMatch) {
    const rest = pubMatch[1].replace(/\/+$/, "").trim();
    if (!rest || rest.length < 2) return { error: PROFILE_ERROR };
    return { url: `https://www.linkedin.com/pub/${rest}` };
  }

  return { error: PROFILE_ERROR };
}
