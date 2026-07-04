import EmptyState from "./EmptyState";
import HistorySkeleton from "./HistorySkeleton";
import type { MeetingListItem } from "../types";

interface MeetingHistoryProps {
  meetings: MeetingListItem[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onNewAnalysis: () => void;
  className?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeetingHistory({
  meetings,
  selectedId,
  loading,
  onSelect,
  onNewAnalysis,
  className = "",
}: MeetingHistoryProps) {
  return (
    <aside
      className={`flex h-full w-full flex-col border-slate-800 bg-slate-900/50 lg:w-80 lg:border-r ${className}`}
    >
      <div className="border-b border-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Meeting History
        </h2>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          + New Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <HistorySkeleton />
        ) : meetings.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon="🎙️"
              title="No meetings yet"
              description="Analyze your first transcript or audio recording to build your meeting history."
              action={{ label: "Start analyzing", onClick: onNewAnalysis }}
            />
          </div>
        ) : (
          <ul className="space-y-1">
            {meetings.map((meeting) => {
              const active = selectedId === meeting.id;
              return (
                <li key={meeting.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(meeting.id)}
                    className={`w-full rounded-lg px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                      active
                        ? "bg-indigo-600/20 ring-1 ring-indigo-500/50"
                        : "hover:bg-slate-800/80"
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-white">{meeting.meeting_title}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(meeting.created_at)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {meeting.action_item_count} action item
                      {meeting.action_item_count === 1 ? "" : "s"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
