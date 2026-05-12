"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/cn";

function repairTruncatedJson(str) {
  let s = str;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
  }

  if (inString) s += '"';
  while (depth > 0) {
    const lastNonSpace = s.trimEnd().slice(-1);
    if (lastNonSpace === "{" || lastNonSpace === "[") {
      s += "]";
      depth--;
    } else if (lastNonSpace === ":") {
      s += '""}]';
      depth = Math.max(0, depth - 2);
    } else if (lastNonSpace === ",") {
      s = s.trimEnd().slice(0, -1);
    } else {
      s += '"}]';
      depth = Math.max(0, depth - 2);
    }
  }

  return s;
}

function formatPreview(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch {}
  try { return JSON.stringify(JSON.parse(repairTruncatedJson(str)), null, 2); } catch {}
  return str;
}

function JsonField({ data }) {
  const [raw, setRaw] = useState(false);

  if (data == null) return <span className="text-xs text-text-muted">[No data]</span>;

  const isTruncated = data._truncated === true;
  const previewStr = isTruncated ? data._preview : null;

  const formattedData = isTruncated
    ? formatPreview(previewStr)
    : typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2);

  const rawText = isTruncated
    ? previewStr
    : typeof data === "string"
      ? data
      : JSON.stringify(data);

  const renderContent = () => {
    if (raw) return rawText;
    return formattedData;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={() => setRaw(!raw)}
          className="text-xs px-2 py-0.5 rounded border border-black/10 dark:border-white/10 text-text-muted hover:text-text-main transition-colors"
        >
          {raw ? "Formatted" : "Raw JSON"}
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(rawText)}
          className="text-xs px-2 py-0.5 rounded border border-black/10 dark:border-white/10 text-text-muted hover:text-text-main transition-colors"
        >
          Copy
        </button>
      </div>
      {isTruncated && (
        <div className="mb-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          Truncated. Original size: {(data._originalSize / 1024).toFixed(1)} KB. Showing preview.
        </div>
      )}
      <pre
        className={cn(
          "max-h-[500px] max-w-full overflow-auto rounded-lg border p-3 font-mono text-xs text-text-main sm:p-4",
          isTruncated
            ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
            : "border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5"
        )}
      >
        {renderContent()}
      </pre>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false, icon = null }) {
  const [isOpen, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-black/5 dark:border-white/5 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[18px] text-text-muted">{icon}</span>}
          <span className="font-semibold text-sm text-text-main">{title}</span>
        </div>
        <span className={cn(
          "material-symbols-outlined text-[20px] text-text-muted transition-transform duration-200",
          isOpen ? "rotate-90" : ""
        )}>
          chevron_right
        </span>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-black/5 dark:border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function RequestDetailDrawer({ detail, loading, onClose }) {
  if (loading || detail?.loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-bg rounded-xl p-8 shadow-xl border border-border" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 text-text-muted">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            <span className="text-sm">Loading detail...</span>
          </div>
        </div>
      </div>
    );
  }

  if (detail?.error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-bg rounded-xl p-8 shadow-xl border border-border max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 text-error mb-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-medium">{detail.error}</span>
          </div>
          <button onClick={onClose} className="text-sm text-text-muted hover:text-text-main">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-bg h-full overflow-y-auto shadow-2xl border-l border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-main">Request Detail</h2>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-[24px] text-text-muted hover:text-text-main transition-colors"
          >
            close
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Meta grid */}
          <div className="grid min-w-0 grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-text-muted">ID:</span>{" "}
              <span className="break-all font-mono text-text-main text-xs">{detail.id}</span>
            </div>
            <div>
              <span className="text-text-muted">Timestamp:</span>{" "}
              <span className="text-text-main">{new Date(detail.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-text-muted">Provider:</span>{" "}
              <span className="text-text-main font-medium">{detail.provider}</span>
            </div>
            <div>
              <span className="text-text-muted">Model:</span>{" "}
              <span className="text-text-main font-mono">{detail.model}</span>
            </div>
            <div>
              <span className="text-text-muted">Status:</span>{" "}
              <span className={cn("font-medium", detail.status === "success" ? "text-green-600" : "text-red-600")}>
                {detail.status}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Latency:</span>{" "}
              <span className="text-text-main font-mono">
                TTFT {detail.latency?.ttft || 0}ms / Total {detail.latency?.total || 0}ms
              </span>
            </div>
            <div>
              <span className="text-text-muted">Input Tokens:</span>{" "}
              <span className="text-text-main font-mono">{(detail.tokens?.prompt_tokens || detail.tokens?.input_tokens || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-text-muted">Output Tokens:</span>{" "}
              <span className="text-text-main font-mono">{(detail.tokens?.completion_tokens || detail.tokens?.output_tokens || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <CollapsibleSection title="1. Client Request (Input)" defaultOpen={true} icon="input">
              <JsonField data={detail.request} />
            </CollapsibleSection>

            {detail.providerRequest && (
              <CollapsibleSection title="2. Provider Request (Translated)" icon="translate">
                <JsonField data={detail.providerRequest} />
              </CollapsibleSection>
            )}

            {detail.providerResponse && (
              <CollapsibleSection title="3. Provider Response (Raw)" icon="data_object">
                <JsonField data={detail.providerResponse} />
              </CollapsibleSection>
            )}

            <CollapsibleSection title="4. Client Response (Final)" defaultOpen={true} icon="output">
              {detail.response?.thinking && (
                <div className="mb-4">
                  <h4 className="font-semibold text-text-main mb-2 flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    Thinking Process
                  </h4>
                  <pre className="max-h-[200px] max-w-full overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-3 font-mono text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 sm:p-4">
                    {detail.response.thinking}
                  </pre>
                </div>
              )}
              <h4 className="font-semibold text-text-main mb-2 text-xs uppercase tracking-wide opacity-70">Content</h4>
              <pre className="max-h-[300px] max-w-full overflow-auto rounded-lg border border-black/5 bg-black/5 p-3 font-mono text-xs text-text-main dark:border-white/5 dark:bg-white/5 sm:p-4">
                {detail.response?.content || "[No content]"}
              </pre>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}
