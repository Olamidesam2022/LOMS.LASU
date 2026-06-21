import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  ArrowRight,
  Archive,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  FolderSearch,
  Gauge,
  LockKeyhole,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useAdvisoryRequests } from "@/hooks/useAdvisoryRequests";
import { useAuth } from "@/context/AuthContext";
import { useCases } from "@/hooks/useCases";
import { useDocuments } from "@/hooks/useDocuments";

const featureGroups = [
  {
    icon: Gauge,
    title: "Live operations",
    description:
      "A focused dashboard for active matters, recent movement, deadlines, and risk signals.",
  },
  {
    icon: Scale,
    title: "Matter lifecycle",
    description:
      "Litigation, advisory work, progress tracking, documents, and court dates stay linked.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled access",
    description:
      "Role-aware navigation, approvals, protected routes, and audit trails guard the workspace.",
  },
];

const modules = [
  { icon: Scale, label: "Litigation registry" },
  { icon: FileText, label: "Advisory workflow" },
  { icon: Database, label: "Document vault" },
  { icon: CalendarDays, label: "Court calendar" },
  { icon: TrendingUp, label: "Progress tracking" },
  { icon: FolderSearch, label: "Records center" },
  { icon: Archive, label: "Archive" },
  { icon: ClipboardList, label: "Audit trail" },
  { icon: Users, label: "User management" },
  { icon: LockKeyhole, label: "Secure access" },
];

const workflow = [
  "Authenticate and wait for approval",
  "Register matters, advisories, documents, and deadlines",
  "Track movement with notes, milestones, and status changes",
  "Preserve closed records with audit history and searchable context",
];

export default function Landing() {
  const { user, isApproved } = useAuth();
  const { cases, isLoading: isLoadingCases } = useCases();
  const { advisoryRequests } = useAdvisoryRequests();
  const { documents } = useDocuments();

  const isRecordVisible = !!user && isApproved;

  const activeCases = useMemo(
    () =>
      cases.filter(
        (caseItem) => !["Closed", "Archived"].includes(caseItem.status),
      ),
    [cases],
  );

  const upcomingCases = useMemo(() => {
    const now = new Date();
    return activeCases
      .filter((caseItem) => caseItem.nextHearing >= now)
      .sort((a, b) => a.nextHearing.getTime() - b.nextHearing.getTime());
  }, [activeCases]);

  const pendingAdvisories = useMemo(
    () =>
      advisoryRequests.filter((request) =>
        ["Pending", "In Progress", "Urgent"].includes(request.status),
      ),
    [advisoryRequests],
  );

  const previewStats = [
    [String(activeCases.length), "Active matters"],
    [String(upcomingCases.length), "Upcoming dates"],
    [String(pendingAdvisories.length), "Pending advisories"],
  ];

  const recordRows = useMemo(() => {
    const caseRows = upcomingCases.slice(0, 3).map((caseItem) => ({
      title: caseItem.caseTitle,
      detail: `${caseItem.suitNumber} - ${caseItem.nextHearing.toLocaleDateString(
        "en-NG",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )}`,
      status: caseItem.status,
      time: caseItem.nextHearing.getTime(),
    }));

    const advisoryRows = pendingAdvisories.slice(0, 2).map((request) => ({
      title: request.title,
      detail: `${request.department} - due ${request.dueDate.toLocaleDateString(
        "en-NG",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )}`,
      status: request.status,
      time: request.dueDate.getTime(),
    }));

    const documentRows = documents.slice(0, 2).map((document) => ({
      title: document.name,
      detail: `${document.type} - ${document.uploadedAt.toLocaleDateString(
        "en-NG",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )}`,
      status: document.status,
      time: document.uploadedAt.getTime(),
    }));

    return [...caseRows, ...advisoryRows, ...documentRows]
      .sort((a, b) => b.time - a.time)
      .slice(0, 3);
  }, [documents, pendingAdvisories, upcomingCases]);

  return (
    <div className="landing-shell min-h-screen bg-background text-foreground">
      <header className="landing-nav-wrap">
        <div className="landing-nav mx-auto flex w-[min(76rem,calc(100%-1.5rem))] items-center justify-between">
          <BrandLogo to="/" />

          <nav className="hidden items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-sm font-bold text-muted-foreground md:flex">
            <a href="#platform" className="landing-nav-pill">
              Platform
            </a>
            <a href="#modules" className="landing-nav-pill">
              Modules
            </a>
            <a href="#workflow" className="landing-nav-pill">
              Workflow
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="landing-login-button">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          id="platform"
          className="mx-auto grid min-h-screen w-[min(76rem,calc(100%-1.5rem))] gap-10 pb-16 pt-28 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
        >
          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <img
                src="/favicon.jpg"
                alt=""
                className="h-7 w-7 rounded-md object-cover"
              />
              LASU Legal Unit Case Management
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-tight tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              Legal work, records, and accountability in one secure workspace.
            </h1>

            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              LOMS brings litigation, advisory requests, documents, court
              calendar, records, archive, approvals, and audit history into a
              calmer operating system for the Legal Unit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="landing-primary-cta">
                Launch workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#modules" className="landing-secondary-cta">
                View modules
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {featureGroups.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="landing-brief-card">
                    <Icon className="h-5 w-5 text-foreground" />
                    <h2 className="mt-4 text-sm font-extrabold text-foreground">
                      {feature.title}
                    </h2>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="landing-preview" aria-label="Workspace preview">
            <div className="landing-preview-top">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  Workspace snapshot
                </p>
                <h2 className="mt-1 text-2xl font-black text-foreground">
                  Today at a glance
                </h2>
              </div>
              <ShieldCheck className="h-8 w-8 text-foreground" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {isRecordVisible ? (
                previewStats.map(([value, label]) => (
                  <div key={label} className="landing-stat-tile">
                    <strong>{isLoadingCases ? "..." : value}</strong>
                    <span>{label}</span>
                  </div>
                ))
              ) : (
                <div className="landing-stat-tile sm:col-span-3">
                  <strong>Protected</strong>
                  <span>
                    Sign in with an approved account to view live records.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {isRecordVisible && recordRows.length > 0 ? (
                recordRows.map(({ title, detail, status }) => (
                  <div
                    key={`${title}-${detail}`}
                    className="landing-preview-row"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-foreground">
                        {title}
                      </h3>
                      <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                        {detail}
                      </p>
                    </div>
                    <span>{status}</span>
                  </div>
                ))
              ) : (
                <div className="landing-preview-row">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-foreground">
                      {isRecordVisible
                        ? "No live records yet"
                        : "Live records are private"}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {isRecordVisible
                        ? "Create a case, advisory request, or document in the workspace to populate this panel."
                        : "We value privacy."}
                    </p>
                  </div>
                  <span>{isRecordVisible ? "Empty" : "Locked"}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          id="modules"
          className="border-y border-border bg-muted/30 py-20"
        >
          <div className="mx-auto w-[min(76rem,calc(100%-1.5rem))]">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                System modules
              </p>
              <h2 className="mt-3 text-3xl font-black text-foreground sm:text-5xl">
                Built around the real work of legal operations.
              </h2>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <article key={module.label} className="landing-module-card">
                    <Icon className="h-5 w-5" />
                    <h3>{module.label}</h3>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto grid w-[min(76rem,calc(100%-1.5rem))] gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
        >
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-black text-foreground sm:text-5xl">
              Clear entry, clear ownership, clear record.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              The refreshed landing page now mirrors the application: controlled
              access first, then structured matter work, then durable records.
            </p>
          </div>

          <div className="landing-timeline">
            {workflow.map((item, index) => (
              <div key={item} className="landing-timeline-row">
                <span className="landing-timeline-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{item}</p>
                <CheckCircle2 className="h-5 w-5 text-foreground" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
