import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

export interface IssueReport {
  id: string;
  title: string;
  page: string;
  status: string;
  created_at: string;
}

interface SubmitParams {
  title: string;
  description: string;
  page: string;
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

/**
 * Hook encapsulant les appels Supabase pour les signalements utilisateur.
 * Extrait de SignalementsBlock.tsx pour respecter la règle AGENTS.md §3
 * (pas d'import supabaseClient depuis src/components/).
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
        .select('id, title, page, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      const normalizedReports: IssueReport[] = (data ?? []).map((report) => ({
        id: String(report.id),
        title: String(report.title || ''),
        page: String(report.page || ''),
        status: String(report.status || ''),
        created_at: String(report.created_at || ''),
      }));

      setReports(normalizedReports);
    } catch (error) {
      console.error('[useSignalements] Error loading reports:', error);
      setLoadError('Erreur lors du chargement des signalements.');
    } finally {
      setLoadingReports(false);
    }
  };

  const submitReport = async ({ title, description, page }: SubmitParams): Promise<boolean> => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

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
      };

      const { error: insertError } = await supabase.from('issue_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        page,
        meta,
        status: 'new',
      });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      void loadMyReports();
      window.setTimeout(() => setSubmitSuccess(false), 5000);
      return true;
    } catch (error) {
      console.error('[useSignalements] Submit error:', error);
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
