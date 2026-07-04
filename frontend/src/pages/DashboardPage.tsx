import { useCallback, useEffect, useState } from "react";

import * as meetingsApi from "../api/meetings";
import { ApiClientError } from "../api/client";
import AnalyzeTabs from "../components/AnalyzeTabs";
import EmptyState from "../components/EmptyState";
import MeetingHistory from "../components/MeetingHistory";
import ResultsView from "../components/ResultsView";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { AnalyzeResponse, MeetingIntelligence, MeetingListItem } from "../types";

export default function DashboardPage() {
  const { authFetch, logout } = useAuth();
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [mode, setMode] = useState<"input" | "results">("input");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<{ id: number; data: MeetingIntelligence } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await authFetch((token) => meetingsApi.listMeetings(token));
      setMeetings(response.meetings);
    } catch (err) {
      showToast(
        "error",
        err instanceof ApiClientError ? err.message : "Failed to load meeting history",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [authFetch, showToast]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  function handleNewAnalysis() {
    setMode("input");
    setSelectedId(null);
    setResult(null);
    setSidebarOpen(false);
  }

  async function handleAnalyzeResponse(response: AnalyzeResponse) {
    setResult({ id: response.id, data: response.data });
    setSelectedId(response.id);
    setMode("results");
    setSidebarOpen(false);
    showToast("success", `"${response.data.meeting_title}" analyzed successfully`);
    await loadHistory();
  }

  async function handleAnalyzeTranscript(transcript: string) {
    setAnalyzing(true);
    try {
      const response = await authFetch((token) =>
        meetingsApi.analyzeTranscript(transcript, token),
      );
      await handleAnalyzeResponse(response);
    } catch (err) {
      showToast("error", err instanceof ApiClientError ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleUploadAudio(file: File) {
    setAnalyzing(true);
    try {
      const response = await authFetch((token) => meetingsApi.uploadAudio(file, token));
      await handleAnalyzeResponse(response);
    } catch (err) {
      showToast("error", err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSelectMeeting(id: number) {
    setSelectedId(id);
    try {
      const detail = await authFetch((token) => meetingsApi.getMeeting(id, token));
      setResult({ id: detail.id, data: detail.data });
      setMode("results");
      setSidebarOpen(false);
    } catch (err) {
      showToast("error", err instanceof ApiClientError ? err.message : "Failed to load meeting");
    }
  }

  async function handleExportPdf(id: number) {
    const blob = await authFetch((token) => meetingsApi.exportMeetingPdf(id, token));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meeting-${id}-report.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur sm:py-4 lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 lg:hidden"
              aria-label="Toggle meeting history"
            >
              ☰
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                AI Meeting Intelligence
              </h1>
              <p className="hidden text-xs text-slate-400 sm:block">
                Structured summaries in seconds, not minutes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <MeetingHistory
          meetings={meetings}
          selectedId={selectedId}
          loading={historyLoading}
          onSelect={(id) => void handleSelectMeeting(id)}
          onNewAnalysis={handleNewAnalysis}
          className={`fixed bottom-0 left-0 top-[53px] z-50 w-[min(100%,20rem)] transform border-r shadow-xl transition-transform duration-200 lg:static lg:top-auto lg:z-auto lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          {mode === "input" && (
            <div className="mx-auto max-w-3xl">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white sm:text-xl">Analyze a meeting</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Paste a transcript or upload audio — get summary, action items, and a follow-up
                  email in ~10 seconds.
                </p>
              </div>
              <AnalyzeTabs
                loading={analyzing}
                onAnalyzeTranscript={(t) => void handleAnalyzeTranscript(t)}
                onUploadAudio={(f) => void handleUploadAudio(f)}
              />
              {!historyLoading && meetings.length === 0 && (
                <div className="mt-6 lg:hidden">
                  <EmptyState
                    icon="⚡"
                    title="Your first analysis awaits"
                    description="Submit a transcript above to see structured intelligence appear here."
                  />
                </div>
              )}
            </div>
          )}

          {mode === "results" && result && (
            <ResultsView
              meetingId={result.id}
              data={result.data}
              onExportPdf={handleExportPdf}
            />
          )}
        </main>
      </div>
    </div>
  );
}
