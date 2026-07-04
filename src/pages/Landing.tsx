import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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

const featureGroups = [
  {
    icon: Gauge,
    title: "Live operations",
    description:
      "A focused dashboard for active matters, recent movement, deadlines, and risk signals",
  },
  {
    icon: Scale,
    title: "Matter lifecycle",
    description:
      "Litigation, advisory work, progress tracking, documents, and court dates stay linked",
  },
  {
    icon: ShieldCheck,
    title: "Controlled access",
    description:
      "Role-aware navigation, approvals, protected routes, and audit trails guard the workspace",
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

const accessHighlights = [
  ["Private", "Live case records"],
  ["Approval", "Required before entry"],
  ["Audited", "Workspace activity"],
];

const privacyRows = [
  {
    title: "Operational records stay inside the workspace",
    detail: "Cases, documents, advisories, and dates are hidden before login",
    status: "Private",
  },
  {
    title: "Approved users only",
    detail: "Account approval is required before any legal data can be viewed",
    status: "Protected",
  },
  {
    title: "Access is role-aware",
    detail: "Users only see the modules and records allowed for their role",
    status: "Secure",
  },
];

const slides = [
  {
    id: "platform",
    label: "Platform",
    eyebrow: "Secure workspace",
    title: "Legal work, records, and accountability in one secure workspace",
    description:
      "LOMS brings litigation, advisory requests, documents, court calendar, records, archive, approvals, and audit history into a calmer operating system for the Legal Unit",
  },
  {
    id: "modules",
    label: "Modules",
    eyebrow: "System modules",
    title: "Built around the real work of legal operations",
    description:
      "Every module keeps matter work connected, searchable, and ready for the next action without spreading records across disconnected tools",
  },
  {
    id: "workflow",
    label: "Workflow",
    eyebrow: "Clear process",
    title: "Clear entry, clear ownership, clear record",
    description:
      "The landing story now follows the application itself: controlled access first, structured matter work next, then durable records with activity history",
  },
];

export default function Landing() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];
  const goToSlide = (index: number) => {
    setActiveSlide((index + slides.length) % slides.length);
  };

  return (
    <div className="landing-shell min-h-screen bg-background text-foreground">
      <header className="landing-nav-wrap">
        <div className="landing-nav mx-auto flex w-[min(76rem,calc(100%-1.5rem))] items-center justify-between">
          <BrandLogo to="/" />

          <nav className="hidden items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-sm font-bold text-muted-foreground md:flex">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`landing-nav-pill ${activeSlide === index ? "is-active" : ""}`}
                onClick={() => goToSlide(index)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="landing-login-button">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section
          className="landing-slide-stage mx-auto flex min-h-screen w-[min(76rem,calc(100%-1.5rem))] flex-col justify-center gap-4 pb-6 pt-24 sm:pb-8 sm:pt-28"
          aria-labelledby="landing-slide-title"
        >
          <div key={slide.id} className="landing-slide-shell">
            <div className="landing-hero-copy">
              <div className="landing-kicker">
                <img
                  src="/favicon.jpg"
                  alt=""
                  className="h-7 w-7 rounded-md object-cover"
                />
                LASU Legal Unit Case Management
              </div>

              <p className="landing-slide-count">
                {String(activeSlide + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </p>

              <p className="landing-slide-eyebrow">{slide.eyebrow}</p>

              <h1 id="landing-slide-title" className="landing-slide-title">
                {slide.title}
              </h1>

              <p className="landing-slide-description">{slide.description}</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="landing-primary-cta">
                  Launch workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  className="landing-secondary-cta"
                  onClick={() => goToSlide(activeSlide + 1)}
                >
                  Next slide
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {activeSlide === 0 && (
                <div className="landing-slide-feature-grid">
                  {featureGroups.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <article
                        key={feature.title}
                        className="landing-brief-card"
                      >
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
              )}
            </div>

            <div className="landing-slide-panel" aria-live="polite">
              {activeSlide === 0 && (
                <>
                  <div className="landing-preview-top">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                        Access preview
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-foreground">
                        Records stay private
                      </h2>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-foreground" />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {accessHighlights.map(([value, label]) => (
                      <div key={label} className="landing-stat-tile">
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {privacyRows.map(({ title, detail, status }) => (
                      <div key={title} className="landing-preview-row">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-foreground">
                            {title}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {detail}
                          </p>
                        </div>
                        <span>{status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeSlide === 1 && (
                <>
                  <div className="landing-preview-top">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                        Module map
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-foreground">
                        One place for the whole unit
                      </h2>
                    </div>
                    <Database className="h-8 w-8 text-foreground" />
                  </div>

                  <div className="landing-slide-module-grid">
                    {modules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <article
                          key={module.label}
                          className="landing-module-card"
                        >
                          <Icon className="h-5 w-5" />
                          <h3>{module.label}</h3>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {activeSlide === 2 && (
                <>
                  <div className="landing-preview-top">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                        Operating rhythm
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-foreground">
                        From sign in to archived record
                      </h2>
                    </div>
                    <ClipboardList className="h-8 w-8 text-foreground" />
                  </div>

                  <div className="landing-timeline mt-5">
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
                </>
              )}
            </div>
          </div>

          <div className="landing-slide-controls" aria-label="Landing slides">
            <button
              type="button"
              className="landing-slide-arrow"
              aria-label="Previous slide"
              onClick={() => goToSlide(activeSlide - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="landing-slide-dots">
              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`landing-slide-dot ${activeSlide === index ? "is-active" : ""}`}
                  aria-label={`Show ${item.label} slide`}
                  aria-current={activeSlide === index}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>

            <button
              type="button"
              className="landing-slide-arrow"
              aria-label="Next slide"
              onClick={() => goToSlide(activeSlide + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
