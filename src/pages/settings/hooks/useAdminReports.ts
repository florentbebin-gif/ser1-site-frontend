import { useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import type { ReportRecord } from '@/settings/admin/adminClient';

interface ReportUser {
  id: string;
  email: string;
}

export function useAdminReports(
  onError: (msg: string) => void,
  onUsersRefresh: (reason: string) => void,
) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [userReports, setUserReports] = useState<ReportRecord[]>([]);
  const [selectedReportUser, setSelectedReportUser] = useState<ReportUser | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleViewReports = async (userId: string, userEmail: string) => {
    try {
      setReportLoading(true);
      setSelectedReportUser({ id: userId, email: userEmail });
      setSelectedReport(null);
      setUserReports([]);
      setShowReportModal(true);

      const reports = await adminClient.listIssueReports({ userId });
      setUserReports(reports);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleSelectReport = (report: ReportRecord) => {
    setSelectedReport(report);
  };

  const handleBackToList = () => {
    setSelectedReport(null);
  };

  const handleCloseModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
    setUserReports([]);
    setSelectedReportUser(null);
  };

  const handleMarkAsRead = async (reportId: string) => {
    try {
      await adminClient.markIssueRead(reportId);
      onUsersRefresh('mark_issue_read');
      if (selectedReportUser) {
        void handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Supprimer definitivement ce signalement ?')) return;
    try {
      await adminClient.deleteIssue(reportId);
      setSelectedReport(null);
      onUsersRefresh('delete_issue');
      if (selectedReportUser) {
        void handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  };

  const handleDeleteAllReports = async (userId?: string) => {
    if (!userId) return;
    if (!confirm("Supprimer tout l'historique des signalements pour cet utilisateur ?")) return;
    try {
      await adminClient.deleteAllIssuesForUser(userId);
      handleCloseModal();
      onUsersRefresh('delete_all_issues_for_user');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  };

  return {
    showReportModal,
    selectedReport,
    userReports,
    selectedReportUser,
    reportLoading,
    handleViewReports,
    handleSelectReport,
    handleBackToList,
    handleCloseModal,
    handleMarkAsRead,
    handleDeleteReport,
    handleDeleteAllReports,
  };
}
