import { useRef, useState } from "react";

type Tab = "transcript" | "audio";

interface AnalyzeTabsProps {
  loading: boolean;
  onAnalyzeTranscript: (transcript: string) => void;
  onUploadAudio: (file: File) => void;
}

export default function AnalyzeTabs({ loading, onAnalyzeTranscript, onUploadAudio }: AnalyzeTabsProps) {
  const [tab, setTab] = useState<Tab>("transcript");
  const [transcript, setTranscript] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const transcriptLength = transcript.trim().length;
  const transcriptTooShort = tab === "transcript" && transcriptLength > 0 && transcriptLength < 50;

  function handleSubmit() {
    if (tab === "transcript") {
      onAnalyzeTranscript(transcript);
      return;
    }
    if (selectedFile) onUploadAudio(selectedFile);
  }

  const canSubmit =
    !loading &&
    ((tab === "transcript" && transcriptLength >= 50) ||
      (tab === "audio" && selectedFile !== null));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 rounded-lg bg-slate-950 p-1 sm:flex-row">
        <button
          type="button"
          onClick={() => setTab("transcript")}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
            tab === "transcript" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Paste Transcript
        </button>
        <button
          type="button"
          onClick={() => setTab("audio")}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
            tab === "audio" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Upload Audio
        </button>
      </div>

      {tab === "transcript" ? (
        <div>
          <label htmlFor="transcript" className="mb-2 block text-sm font-medium text-slate-300">
            Meeting transcript
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            placeholder="Paste your raw meeting transcript here (minimum 50 characters)..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <p
            className={`mt-2 text-xs ${transcriptTooShort ? "text-amber-400" : "text-slate-500"}`}
          >
            {transcriptLength} characters
            {transcriptTooShort && " — minimum 50 required"}
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Audio file</label>
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-10 text-center transition hover:border-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:px-6"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.webm,.mp4,.mpeg,.flac,.ogg"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-2xl" aria-hidden>
              🎧
            </span>
            <p className="mt-2 text-sm text-slate-300">
              {selectedFile ? selectedFile.name : "Click to select audio file"}
            </p>
            <p className="mt-1 text-xs text-slate-500">MP3, WAV, M4A, WebM — max 25 MB</p>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Analyzing meeting...
          </span>
        ) : (
          "Analyze Meeting"
        )}
      </button>
    </div>
  );
}
