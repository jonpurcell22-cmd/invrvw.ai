import type { SupabaseClient } from "@supabase/supabase-js";

const INTERVIEWER_MARKER = "\n\n--- INTERVIEWER ---\n";

export type StoredInterviewer = {
  name: string | null;
  linkedinUrl: string | null;
  profile: string | null;
};

export type SessionScoringRow = {
  id: string;
  user_id: string;
  company_name: string | null;
  role_title: string | null;
  seniority_level: string | null;
  interview_stage: string | null;
  resume_text: string | null;
  job_description_text: string | null;
  company_research: string | null;
  interviewer_name: string | null;
  interviewer_linkedin_url: string | null;
  interviewer_profile: string | null;
};

const BASE_COLUMNS =
  "id, user_id, company_name, role_title, seniority_level, interview_stage, resume_text, job_description_text, company_research";

const WITH_INTERVIEWER_COLUMNS = `${BASE_COLUMNS}, interviewer_linkedin_url, interviewer_name, interviewer_profile`;

export function isMissingInterviewerColumn(message: string | undefined): boolean {
  if (!message) return false;
  return (
    /interviewer_(linkedin_url|name|profile)/i.test(message) &&
    /column|schema cache|does not exist/i.test(message)
  );
}

/** Used only when the interviewer columns are not on `sessions` yet. */
export function packCompanyResearch(
  companyResearch: string,
  interviewer: StoredInterviewer,
): string {
  if (!interviewer.profile && !interviewer.linkedinUrl) {
    return companyResearch;
  }
  return `${companyResearch.trim()}${INTERVIEWER_MARKER}${JSON.stringify({
    name: interviewer.name ?? "",
    linkedinUrl: interviewer.linkedinUrl ?? "",
    profile: interviewer.profile ?? "",
  })}`;
}

export function unpackCompanyResearch(raw: string | null): {
  companyResearch: string | null;
  interviewer: StoredInterviewer;
} {
  const empty = {
    companyResearch: raw,
    interviewer: {
      name: null,
      linkedinUrl: null,
      profile: null,
    } satisfies StoredInterviewer,
  };
  if (!raw) return { ...empty, companyResearch: null };

  const idx = raw.indexOf(INTERVIEWER_MARKER);
  if (idx === -1) return empty;

  const company = raw.slice(0, idx).trim() || null;
  try {
    const parsed = JSON.parse(raw.slice(idx + INTERVIEWER_MARKER.length)) as {
      name?: string;
      linkedinUrl?: string;
      profile?: string;
    };
    return {
      companyResearch: company,
      interviewer: {
        name: parsed.name?.trim() || null,
        linkedinUrl: parsed.linkedinUrl?.trim() || null,
        profile: parsed.profile?.trim() || null,
      },
    };
  } catch {
    return empty;
  }
}

function coalesceInterviewer(
  row: {
    company_research: string | null;
    interviewer_name?: string | null;
    interviewer_linkedin_url?: string | null;
    interviewer_profile?: string | null;
  },
): SessionScoringRow {
  const unpacked = unpackCompanyResearch(row.company_research);
  return {
    ...(row as SessionScoringRow),
    company_research: unpacked.companyResearch,
    interviewer_name: row.interviewer_name?.trim() || unpacked.interviewer.name,
    interviewer_linkedin_url:
      row.interviewer_linkedin_url?.trim() || unpacked.interviewer.linkedinUrl,
    interviewer_profile:
      row.interviewer_profile?.trim() || unpacked.interviewer.profile,
  };
}

/**
 * Loads the session fields scoring needs. Prefers dedicated interviewer
 * columns, and falls back to a profile packed into company_research when
 * those columns have not been migrated yet.
 */
export async function loadSessionForScoring(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<{ row: SessionScoringRow | null; error: string | null }> {
  const withColumns = await supabase
    .from("sessions")
    .select(WITH_INTERVIEWER_COLUMNS)
    .eq("id", sessionId)
    .single();

  if (!withColumns.error && withColumns.data) {
    return { row: coalesceInterviewer(withColumns.data), error: null };
  }

  if (!isMissingInterviewerColumn(withColumns.error?.message)) {
    return {
      row: null,
      error: withColumns.error?.message ?? "Session not found",
    };
  }

  const base = await supabase
    .from("sessions")
    .select(BASE_COLUMNS)
    .eq("id", sessionId)
    .single();

  if (base.error || !base.data) {
    return { row: null, error: base.error?.message ?? "Session not found" };
  }

  return { row: coalesceInterviewer(base.data), error: null };
}
