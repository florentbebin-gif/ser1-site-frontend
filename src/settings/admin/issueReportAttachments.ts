import { supabase } from '@/supabaseClient';
import {
  ISSUE_REPORTS_BUCKET,
  ISSUE_REPORTS_SIGNED_URL_TTL_SECONDS,
} from '@/settings/issueReports';

export async function createIssueReportAttachmentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ISSUE_REPORTS_BUCKET)
    .createSignedUrl(storagePath, ISSUE_REPORTS_SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(`Téléchargement impossible : ${error.message}`);
  if (!data?.signedUrl) throw new Error('Téléchargement impossible : URL absente.');
  return data.signedUrl;
}
