import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Edit,
  FileText,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { StatusProgressBar } from "@/components/cases/StatusProgressBar";

interface CaseProgressModalProps {
  caseId: string;
  onClose: () => void;
}

interface CaseRow {
  id: string;
  title: string;
  description: string | null;
  created_at?: string | null;
}

interface CaseMeta {
  description?: string;
  suitNumber?: string;
  adversaryParty?: string;
  proceduralStage?: string;
  assignedCounsel?: string;
  status?: string;
  priority?: string;
  caseType?: string;
  case_type?: string;
  court?: string;
  nextHearing?: string | null;
  filingDeadline?: string | null;
  dueDate?: string | null;
}

interface AuditEntry {
  id: string;
  action?: string | null;
  performed_by?: string | null;
  details?: string | null;
  created_at?: string | null;
}

interface ModalState {
  caseRecord: CaseRow | null;
  meta: CaseMeta;
  noteCount: number;
  documentCount: number;
  overdueDeadlineCount: number;
  activity: AuditEntry[];
}

const emptyState: ModalState = {
  caseRecord: null,
  meta: {},
  noteCount: 0,
  documentCount: 0,
  overdueDeadlineCount: 0,
  activity: [],
};

function parseMeta(description: string | null): CaseMeta {
  if (!description) return {};
  try {
    return JSON.parse(description) as CaseMeta;
  } catch {
    return { description };
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CaseProgressModal({ caseId, onClose }: CaseProgressModalProps) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [state, setState] = useState<ModalState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseProgress = useCallback(async () => {
    setError(null);
    const today = new Date().toISOString().slice(0, 10);

    const caseQuery = supabase
      .from("cases")
      .select("id,title,description,created_at")
      .eq("id", caseId)
      .single();
    const notesQuery = supabase
      .from("case_notes")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId);
    const documentsQuery = supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId);
    const deadlinesQuery = supabase
      .from("deadlines")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId)
      .lt("due_date", today)
      .neq("status", "completed");
    const activityQuery = supabase
      .from("audit_logs")
      .select("id,action,performed_by,details,created_at")
      .eq("target_id", caseId)
      .order("created_at", { ascending: false })
      .limit(3);

    const [caseResult, notesResult, documentsResult, deadlinesResult, activityResult] =
      await Promise.all([
        caseQuery,
        notesQuery,
        documentsQuery,
        deadlinesQuery,
        activityQuery,
      ]);

    if (caseResult.error) throw caseResult.error;
    const caseRecord = caseResult.data as CaseRow;

    setState({
      caseRecord,
      meta: parseMeta(caseRecord.description),
      noteCount: notesResult.count ?? 0,
      documentCount: documentsResult.count ?? 0,
      overdueDeadlineCount: deadlinesResult.count ?? 0,
      activity: (activityResult.data || []) as AuditEntry[],
    });
  }, [caseId]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCaseProgress()
      .catch((fetchError) => {
        console.error("Failed to fetch case progress:", fetchError);
        if (isMounted) setError("Unable to load this case progress right now.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const channel = supabase
      .channel(`case-progress-${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cases",
          filter: `id=eq.${caseId}`,
        },
        () => {
          fetchCaseProgress().catch((refreshError) => {
            console.error("Failed to refresh case progress:", refreshError);
          });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [caseId, fetchCaseProgress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const caseRecord = state.caseRecord;
  const caseNumber = state.meta.suitNumber || `Case ${caseId.slice(0, 8)}`;
  const caseTitle = caseRecord?.title || "Untitled case";
  const normalizedStatus = (state.meta.status || "").toLowerCase().replace(/\s+/g, "_");
  const canEdit =
    role === "superadmin" ||
    role === "admin" ||
    normalizedStatus === "in_progress";

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const statCards = useMemo(
    () => [
      {
        label: "Notes",
        value: state.noteCount,
        icon: MessageSquareText,
        path: `/app/cases/${caseId}#notes`,
      },
      {
        label: "Documents",
        value: state.documentCount,
        icon: FileText,
        path: `/app/documents?case=${caseId}`,
      },
      {
        label: "Deadlines overdue",
        value: state.overdueDeadlineCount,
        icon: CalendarDays,
        path: `/app/calendar?case=${caseId}`,
      },
    ],
    [caseId, state.documentCount, state.noteCount, state.overdueDeadlineCount],
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Case progress"
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 p-5 backdrop-blur">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-muted-foreground">
              {caseNumber}
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {caseTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close case progress"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {isLoading && (
            <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading case progress...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isLoading && !error && caseRecord && (
            <>
              <StatusProgressBar status={state.meta.status} />

              <div className="grid gap-3 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Priority: </span>
                  <strong className="uppercase text-foreground">
                    {state.meta.priority || "Normal"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <strong className="capitalize text-foreground">
                    {state.meta.case_type || state.meta.caseType || "Litigation"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned: </span>
                  <strong className="text-foreground">
                    {state.meta.assignedCounsel || "Unassigned"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Court Date: </span>
                  <strong className="text-foreground">
                    {formatDate(state.meta.nextHearing)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Filing Date: </span>
                  <strong className="text-foreground">
                    {formatDate(state.meta.filingDeadline || state.meta.dueDate)}
                  </strong>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <button
                      key={stat.label}
                      onClick={() => goTo(stat.path)}
                      className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-accent/60 hover:bg-accent/5"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {stat.label}
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </button>
                  );
                })}
              </div>

              <section className="rounded-lg border border-border bg-background">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-foreground">
                    Recent Activity
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {state.activity.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">
                      No recent activity has been recorded for this case.
                    </p>
                  )}
                  {state.activity.map((item) => (
                    <div key={item.id} className="p-4 text-sm">
                      <p className="text-foreground">
                        {item.details || item.action || "Case updated"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.performed_by || "System"}
                        <span className="mx-1">-</span>
                        {relativeTime(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => goTo(`/app/documents?case=${caseId}`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            View Documents
          </Button>
          <Button
            variant="outline"
            onClick={() => goTo(`/app/calendar?case=${caseId}`)}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            View in Calendar
          </Button>
          {canEdit && (
            <Button onClick={() => goTo(`/app/cases/${caseId}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
