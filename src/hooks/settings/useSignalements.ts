import { useEffect, useState } from 'react';
import {
  ISSUE_REPORTS_BUCKET,
  buildIssueAttachmentStoragePath,
  normalizeIssueReportAttachments,
  validateIssueAttachmentFile,
  type IssueAttachment,
  type IssueAttachmentKind,
} from '@/settings/issueReports';
import { supabase } from '../../supabaseClient';
import { sha256 } from '../../utils/crypto/sha256';

export {
  ISSUE_REPORTS_MAX_ATTACHMENT_BYTES,
  buildIssueAttachmentStoragePath,
  classifyIssueAttachmentFile,
  normalizeIssueReportAttachments,
  validateIssueAttachmentFile,
} from '@/settings/issueReports';
export type { IssueAttachment, IssueAttachmentKind } from '@/settings/issueReports';

export interface IssueReport {
  id: string;
  title: string;
  status: string;
  created_at: string;
  attachments: IssueAttachment[];
}

interface SubmitParams {
  title: string;
  description: string;
  pdfAttachment?: File | null;
  imageAttachment?: File | null;
  context?: string;
}

interface UseSignalementsReturn {
  reports: IssueReport[];
  loadingReports: boolean;
  loadError: string;
  submitting: boolean;
  submitSuccess: boolean;
  submitError: string;
  loadMyReports: () => Promise<void>;
  submitReport: (params: SubmitParams) => Promise<boolean>;
}

interface UploadInput {
  userId: string;
  file: File;
  expectedKind: IssueAttachmentKind;
}

async function removeUploadedAttachments(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  await supabase.storage.from(ISSUE_REPORTS_BUCKET).remove(storagePaths);
}

async function uploadAttachment({
  userId,
  file,
  expectedKind,
}: UploadInput): Promise<IssueAttachment> {
  const kind = validateIssueAttachmentFile(file, expectedKind);
  const arrayBuffer = await file.arrayBuffer();
  const hash = await sha256(arrayBuffer);
  const storagePath = buildIssueAttachmentStoragePath({
    userId,
    fileName: file.name,
    mime: file.type,
    hash,
  });

  const { error } = await supabase.storage.from(ISSUE_REPORTS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Upload pièce jointe impossible : ${error.message}`);

  return {
    storagePath,
    fileName: file.name,
    mime: file.type,
    bytes: file.size,
    kind,
  };
}

/**
 * Hook settings pour les signalements utilisateur.
 * Les appels Supabase restent dans src/hooks, pas dans src/components.
 */
export function useSignalements(): UseSignalementsReturn {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadMyReports = async (): Promise<void> => {
    try {
      setLoadingReports(true);
      setLoadError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setLoadError('Vous devez être connecté pour voir vos signalements.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('issue_reports')
        .select('id, title, status, created_at, attachments')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      const normalizedReports: IssueReport[] = (data ?? []).map((report) => ({
        id: String(report.id),
        title: String(report.title || ''),
        status: String(report.status || ''),
        created_at: String(report.created_at || ''),
        attachments: normalizeIssueReportAttachments(report.attachments),
      }));

      setReports(normalizedReports);
    } catch (error) {
      console.error('[useSignalements] Erreur chargement signalements :', error);
      setLoadError('Erreur lors du chargement des signalements.');
    } finally {
      setLoadingReports(false);
    }
  };

  const submitReport = async ({
    title,
    description,
    pdfAttachment,
    imageAttachment,
    context,
  }: SubmitParams): Promise<boolean> => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    const uploadedAttachments: IssueAttachment[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setSubmitError('Vous devez être connecté pour soumettre un signalement.');
        return false;
      }

      const meta = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        ...(context ? { context } : {}),
      };

      if (pdfAttachment) {
        uploadedAttachments.push(
          await uploadAttachment({
            userId: user.id,
            file: pdfAttachment,
            expectedKind: 'pdf',
          }),
        );
      }

      if (imageAttachment) {
        uploadedAttachments.push(
          await uploadAttachment({
            userId: user.id,
            file: imageAttachment,
            expectedKind: 'image',
          }),
        );
      }

      const { error: insertError } = await supabase.from('issue_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        attachments: uploadedAttachments,
        meta,
        status: 'new',
      });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      void loadMyReports();
      window.setTimeout(() => setSubmitSuccess(false), 5000);
      return true;
    } catch (error) {
      console.error('[useSignalements] Erreur envoi signalement :', error);
      await removeUploadedAttachments(
        uploadedAttachments.map((attachment) => attachment.storagePath),
      ).catch(() => undefined);
      const message = error instanceof Error ? error.message : 'Veuillez réessayer.';
      setSubmitError(`Erreur lors de l'envoi : ${message}`);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    void loadMyReports();
  }, []);

  return {
    reports,
    loadingReports,
    loadError,
    submitting,
    submitSuccess,
    submitError,
    loadMyReports,
    submitReport,
  };
}
