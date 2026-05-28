import { CalendarDays, CheckCircle2, FileText, Scale, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DashboardProps {
  metrics: DashboardMetrics;
  cases: LitigationCase[];
  advisoryRequests: AdvisoryRequest[];
  auditLogs: AuditLog[];
  onNavigate?: (view: string) => void;
}

const quickLinks = [
  { label: "Cases", view: "litigation", icon: Scale, tone: "blue" },
  { label: "Documents", view: "documents", icon: FileText, tone: "pink" },
  { label: "Calendar", view: "calendar", icon: CalendarDays, tone: "mint" },
  { label: "Users", view: "users", icon: Users, tone: "sand", superadminOnly: true },
];

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
  const urgentAdvisory = advisoryRequests.filter((r) => r.status === "Urgent").length;
  const canViewAudit = role === "superadmin" || role === "admin";
  const upcomingCases = cases
    .filter((c) => c.nextHearing > new Date())
    .sort((a, b) => a.nextHearing.getTime() - b.nextHearing.getTime())
    .slice(0, 4);

  return (
    <div className="dashboard-canvas space-y-5 p-3 sm:p-5 lg:p-7">
      <section className="dashboard-hero">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">My Organization</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              LASU Legal Unit
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Organization", "Cases", "Documents", "Calendar", ...(role === "superadmin" ? ["Users"] : [])].map((item) => (
              <button
                key={item}
                onClick={() =>
                  onNavigate?.(
                    item === "Organization"
                      ? "dashboard"
                      : item === "Cases"
                        ? "litigation"
                        : item.toLowerCase(),
                  )
                }
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                  item === "Organization"
                    ? "bg-foreground text-background"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="dashboard-stat-card pastel-blue">
            <div className="flex items-center justify-between">
              <span className="dashboard-stat-icon">
                <Scale className="h-4 w-4" />
              </span>
              <span className="dashboard-mini-pill">{metrics.totalCases} total</span>
            </div>
            <p className="mt-4 text-sm font-extrabold text-foreground">Operations</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black tracking-tight text-foreground">
                {metrics.activeLitigation}
              </span>
              <span className="pb-1 text-sm font-semibold text-muted-foreground">
                / active cases
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-7 flex-1 rounded-md",
                    index < 5 ? "bg-blue-400/55" : "border border-dashed border-slate-300/80",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="dashboard-stat-card pastel-cyan">
            <div className="flex items-center justify-between">
              <span className="dashboard-stat-icon">
                <FileText className="h-4 w-4" />
              </span>
              <span className="dashboard-mini-pill">{urgentAdvisory} urgent</span>
            </div>
            <p className="mt-4 text-sm font-extrabold text-foreground">Data transfer</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black tracking-tight text-foreground">
                {pendingAdvisory}
              </span>
              <span className="pb-1 text-sm font-semibold text-muted-foreground">
                advisory backlog
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-7 flex-1 rounded-md",
                    index < 4 ? "bg-slate-400/35" : "border border-dashed border-slate-300/80",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="dashboard-panel">
          <div className="flex items-center justify-between border-b border-border/70 p-4">
            <div>
              <h2 className="text-lg font-black text-foreground">Recommended for you</h2>
              <p className="text-sm text-muted-foreground">Quick access to core workspaces</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {quickLinks
              .filter((item) => !item.superadminOnly || role === "superadmin")
              .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate?.(item.view)}
                  className={cn("dashboard-quick-tile", `tile-${item.tone}`)}
                >
                  <span className="dashboard-quick-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-black text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="dashboard-panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
            <div>
              <h2 className="text-lg font-black text-foreground">Upcoming Hearings</h2>
              <p className="text-sm text-muted-foreground">Next scheduled matters</p>
            </div>
            <button
              onClick={() => onNavigate?.("calendar")}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-black text-background"
            >
              View Calendar
            </button>
          </div>
          <div className="divide-y divide-border/70">
            {upcomingCases.length === 0 && (
              <div className="p-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold text-foreground">No upcoming hearings</p>
                <p className="text-xs text-muted-foreground">Scheduled hearings will appear here.</p>
              </div>
            )}
            {upcomingCases.map((caseItem) => (
              <button
                key={caseItem.id}
                onClick={() => onNavigate?.("calendar")}
                className="grid w-full gap-3 p-4 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-muted">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    {caseItem.nextHearing.toLocaleDateString("en-NG", { month: "short" })}
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {caseItem.nextHearing.getDate()}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-black text-foreground">
                    {caseItem.suitNumber}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {caseItem.caseTitle}
                  </span>
                </span>
                <span className="status-pill status-active w-fit">{caseItem.status}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <RiskMonitor cases={cases} />

      <RecentActivity
        logs={auditLogs}
        onViewAll={canViewAudit ? () => onNavigate?.("audit") : undefined}
      />

      {role === "superadmin" && (
        <div className="dashboard-panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-black text-foreground">Pending User Approvals</h3>
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-3"
                >
                  <div>
                    <p className="font-bold text-foreground">{u.name}</p>
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
                      className="rounded-full bg-foreground px-3 py-1 text-sm font-bold text-background"
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
                      className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-foreground"
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
