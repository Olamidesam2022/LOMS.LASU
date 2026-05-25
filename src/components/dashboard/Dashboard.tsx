import {
  Scale,
  FileText,
  AlertTriangle,
  Clock,
  CalendarDays,
  MapPin,
  UserRound,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { RiskMonitor } from "./RiskMonitor";
import { RecentActivity } from "./RecentActivity";
import {
  LitigationCase,
  AdvisoryRequest,
  AuditLog,
  DashboardMetrics,
} from "@/types/legal";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { toast } from "sonner";

interface DashboardProps {
  metrics: DashboardMetrics;
  cases: LitigationCase[];
  advisoryRequests: AdvisoryRequest[];
  auditLogs: AuditLog[];
  onNavigate?: (view: string) => void;
}

export function Dashboard({
  metrics,
  cases,
  advisoryRequests,
  auditLogs,
  onNavigate,
}: DashboardProps) {
  const { role } = useAuth();
  const {
    pendingUsers,
    updatePendingUser,
    fetchPendingUsers,
    isLoading,
    error,
  } = usePendingApprovals();
  const pendingAdvisory = advisoryRequests.filter(
    (r) => r.status === "Pending" || r.status === "Urgent",
  ).length;
  const urgentAdvisory = advisoryRequests.filter(
    (r) => r.status === "Urgent",
  ).length;
  const canViewAudit = role === "superadmin" || role === "admin";

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Metrics Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Litigation"
          value={metrics.activeLitigation}
          subtitle={`${metrics.totalCases} total cases`}
          icon={Scale}
          variant="default"
        />
        <MetricCard
          title="Advisory Backlog"
          value={pendingAdvisory}
          subtitle={`${urgentAdvisory} urgent requests`}
          icon={FileText}
          variant="warning"
        />
        <MetricCard
          title="Urgent Hearings"
          value={metrics.urgentHearings}
          subtitle="Within 72 hours"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Risk Monitor */}
      <RiskMonitor cases={cases} />

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Upcoming Hearings */}
        <div className="lg:col-span-2 overflow-hidden">
          <div className="surface-panel">
            <div className="border-b border-border px-3 py-3 sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Upcoming Hearings
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Next 7 days schedule
                  </p>
                </div>
                <button
                  onClick={() => onNavigate?.("calendar")}
                  className="rounded-lg bg-muted px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-muted/80 whitespace-nowrap flex-shrink-0"
                >
                  View Calendar
                </button>
              </div>
            </div>

            <div className="clean-list border-y-0">
              {cases
                .filter((c) => c.nextHearing > new Date())
                .sort(
                  (a, b) => a.nextHearing.getTime() - b.nextHearing.getTime(),
                )
                .slice(0, 4)
                .map((caseItem, index) => {
                  const daysAway = Math.ceil(
                    (caseItem.nextHearing.getTime() - new Date().getTime()) /
                      (24 * 60 * 60 * 1000),
                  );

                  return (
                    <button
                      key={caseItem.id}
                      onClick={() => onNavigate?.("calendar")}
                      className="clean-list-row grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto]"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-background">
                        <span className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                          {caseItem.nextHearing.toLocaleDateString("en-NG", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-lg font-extrabold leading-none text-foreground">
                          {caseItem.nextHearing.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-bold text-foreground sm:text-base">
                            {caseItem.suitNumber}
                          </h4>
                          <span
                            className={`status-pill status-${caseItem.proceduralStage.toLowerCase()}`}
                          >
                            {caseItem.proceduralStage}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs font-medium text-muted-foreground sm:text-sm">
                          {caseItem.caseTitle}
                        </p>
                        <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {caseItem.nextHearing.toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{caseItem.court}</span>
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{caseItem.assignedCounsel}</span>
                          </span>
                        </div>
                      </div>

                      <div className="hidden min-w-[88px] flex-col items-end justify-center md:flex">
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                          {daysAway <= 1 ? "Due soon" : `${daysAway} days`}
                        </span>
                        <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Open
                        </span>
                      </div>
                    </button>
                  );
                })}
              {cases.filter((c) => c.nextHearing > new Date()).length === 0 && (
                <div className="p-8 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">No upcoming hearings</p>
                  <p className="text-xs text-muted-foreground">Scheduled hearings will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity
          logs={auditLogs}
          onViewAll={canViewAudit ? () => onNavigate?.("audit") : undefined}
        />
      </div>

      {role === "superadmin" && (
        <div className="surface-card p-4 sm:p-5 overflow-hidden mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-foreground">
              Pending User Approvals
            </h3>
            <button
              onClick={() => fetchPendingUsers()}
              className="toolbar-button px-3 py-1"
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {error ? (
            <p className="text-sm text-destructive">
              Could not load pending approvals: {error}
            </p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending signups</p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} - {u.role === "admin" ? "admin" : "legal user"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await updatePendingUser(u, { status: "approved" });
                          toast.success(`${u.name} approved`);
                        } catch (e) {
                          console.error(e);
                          toast.error("Could not approve user");
                        }
                      }}
                      className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updatePendingUser(u, { status: "rejected" });
                          toast.success(`${u.name} rejected`);
                        } catch (e) {
                          console.error(e);
                          toast.error("Could not reject user");
                        }
                      }}
                      className="rounded-lg bg-muted px-3 py-1 text-sm font-medium text-foreground border border-border"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

