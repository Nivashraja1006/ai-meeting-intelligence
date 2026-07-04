import { useState } from "react";

import EmptyState from "./EmptyState";
import { useToast } from "../context/ToastContext";
import type { MeetingIntelligence, Sentiment } from "../types";

interface ResultsViewProps {
  meetingId: number;
  data: MeetingIntelligence;
  onExportPdf: (id: number) => Promise<void>;
}

const sentimentStyles: Record<Sentiment, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  neutral: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  negative: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export default function ResultsView({ meetingId, data, onExportPdf }: ResultsViewProps) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleCopyEmail() {
    try {
      const text = `Subject: ${data.follow_up_email.subject}\n\n${data.follow_up_email.body}`;
      await navigator.clipboard.writeText(text);
      showToast("success", "Follow-up email copied to clipboard");
    } catch {
      showToast("error", "Could not copy to clipboard");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await onExportPdf(meetingId);
      showToast("success", "PDF downloaded successfully");
    } catch {
      showToast("error", "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-white sm:text-2xl">
            {data.meeting_title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">Analysis complete — review and share below</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-400">
          Summary
        </h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{data.summary}</p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-400">
          Action Items
        </h3>
        {data.action_items.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No action items"
            description="This meeting didn't surface any assigned tasks — common for discussion-only sessions."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 pr-4 font-medium">Task</th>
                    <th className="pb-2 pr-4 font-medium">Owner</th>
                    <th className="pb-2 font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.action_items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-800/60 last:border-0">
                      <td className="py-3 pr-4 text-slate-200">{item.task}</td>
                      <td className="py-3 pr-4 text-slate-300">{item.owner}</td>
                      <td className="py-3 text-slate-400">{item.due_date ?? "TBD"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 sm:hidden">
              {data.action_items.map((item, index) => (
                <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-sm text-slate-200">{item.task}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Owner: {item.owner}</span>
                    <span>Due: {item.due_date ?? "TBD"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-400">
            Key Decisions
          </h3>
          {data.key_decisions.length === 0 ? (
            <p className="text-sm text-slate-500">No decisions recorded for this meeting.</p>
          ) : (
            <ul className="space-y-2">
              {data.key_decisions.map((decision, index) => (
                <li key={index} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-indigo-400">•</span>
                  <span>{decision}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-400">
            Open Questions
          </h3>
          {data.open_questions.length === 0 ? (
            <p className="text-sm text-slate-500">No open questions flagged.</p>
          ) : (
            <ul className="space-y-2">
              {data.open_questions.map((question, index) => (
                <li key={index} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-amber-400">?</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-400">
          Participant Sentiment
        </h3>
        {data.participant_sentiment.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No sentiment data"
            description="Participants could not be identified or scored for this transcript."
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.participant_sentiment.map((entry, index) => (
              <div
                key={index}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 sm:w-auto sm:min-w-[200px]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-white">{entry.participant}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${sentimentStyles[entry.sentiment]}`}
                  >
                    {entry.sentiment}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{entry.notes}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
            Follow-Up Email
          </h3>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            Copy email
          </button>
        </div>
        <p className="mb-3 break-words text-sm font-medium text-white">
          Subject: {data.follow_up_email.subject}
        </p>
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
          {data.follow_up_email.body}
        </pre>
      </section>
    </div>
  );
}
