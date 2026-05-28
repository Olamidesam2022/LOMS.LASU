import { ArrowRight, CalendarDays, Loader2, MapPin, Scale } from "lucide-react";
import { StatusProgressBar } from "@/components/cases/StatusProgressBar";
import { useCaseProgressModal } from "@/hooks/useCaseProgressModal";
import { useCases } from "@/hooks/useCases";
import { cn } from "@/lib/utils";

function humanize(value?: string | null) {
  if (!value) return "Open";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProgressPercent(status?: string | null) {
  const normalized = (status || "open").toLowerCase().replace(/\s+/g, "_");
  const percentByStatus: Record<string, number> = {
    open: 20,
    active: 20,
    urgent: 20,
    in_progress: 40,
    pending: 60,
    pending_response: 60,
    closed: 80,
    completed: 80,
    archived: 100,
  };

  return percentByStatus[normalized] ?? 20;
}

export default function ProgressPage() {
  const { openModal } = useCaseProgressModal();
  const { cases, isLoading } = useCases();

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="modern-page-title">Progress Bar</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Track each permitted case by stage, date, court, and completion.
          </p>
        </div>
        <div className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold text-muted-foreground">
          {cases.length} case{cases.length === 1 ? "" : "s"}
        </div>
      </div>

      <section className="app-table-shell">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Scale className="h-4 w-4" />
            Case Progress Overview
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading progress...
          </div>
        ) : cases.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
            <Scale className="h-9 w-9 text-muted-foreground" />
            <h3 className="mt-3 text-base font-extrabold text-foreground">
              No case progress yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Cases you create or are permitted to access will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {cases.map((caseItem) => {
              const progressPercent = getProgressPercent(caseItem.status);
              const statusKey = (caseItem.status || "open").toLowerCase();

              return (
                <article
                  key={caseItem.id}
                  className="rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold uppercase text-muted-foreground">
                        {caseItem.suitNumber}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-base font-extrabold text-foreground">
                        {caseItem.caseTitle}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "status-pill w-fit",
                        statusKey === "urgent"
                          ? "status-urgent"
                          : statusKey === "closed"
                            ? "status-completed"
                            : "status-active",
                      )}
                    >
                      {humanize(caseItem.status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <StatusProgressBar status={caseItem.status} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Next Hearing
                      </div>
                      <p className="mt-1 text-sm font-extrabold text-foreground">
                        {caseItem.nextHearing.toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        Court
                      </div>
                      <p className="mt-1 truncate text-sm font-extrabold text-foreground">
                        {caseItem.court}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Completion</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => openModal(caseItem.id)}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-extrabold text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Open Progress
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
