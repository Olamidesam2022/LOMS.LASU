import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/layout/BrandLogo";

const features = [
  {
    icon: Scale,
    title: "Case command center",
    description:
      "Track litigation records, advisory matters, hearings, assignments, and progress in a focused legal workspace.",
  },
  {
    icon: FileText,
    title: "Document intelligence",
    description:
      "Classify, retrieve, and audit legal documents through a secure vault connected to every case.",
  },
  {
    icon: Users,
    title: "Role-aware access",
    description:
      "Superadmins, admins, and staff see only the records their role and assignments allow.",
  },
  {
    icon: Bell,
    title: "Deadline visibility",
    description:
      "Surface hearings, filing dates, overdue actions, and workflow alerts before they become risk.",
  },
];

const processSteps = [
  "Register or sign in",
  "Get approved",
  "Manage legal work",
  "Audit every action",
];

const orbitItems = ["Cases", "Docs", "Calendar", "Audit"];

export default function Landing() {
  return (
    <div className="landing-cosmos min-h-screen overflow-hidden">
      <header className="landing-nav-wrap">
        <div className="landing-nav mx-auto flex w-[min(92rem,calc(100%-2rem))] items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo to="/" />

          <nav className="hidden items-center gap-2 rounded-full border border-border bg-background p-1 text-sm font-bold text-muted-foreground md:flex">
            <a href="#home" className="landing-nav-pill active">
              Home
            </a>
            <a href="#features" className="landing-nav-pill">
              Features
            </a>
            <a href="#workflow" className="landing-nav-pill">
              Workflow
            </a>
          </nav>

          <Link to="/login" className="landing-launch-button">
            <span className="h-2 w-2 rounded-full bg-white" />
            Launch App
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="home">
        <section className="landing-hero relative isolate flex min-h-[calc(100vh-1rem)] items-center justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="landing-grid" />
          <div className="landing-glow-top" />
          <div className="landing-planet" />
          <div className="landing-orbit orbit-one" />
          <div className="landing-orbit orbit-two" />

          <div className="landing-hero-content relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="landing-kicker">
              <Sparkles className="h-4 w-4" />
              LASU Legal Unit Case Management
            </div>

            <p className="mt-10 text-sm font-extrabold uppercase tracking-[0.22em] text-muted-foreground sm:text-base">
              Unlock secure legal operations
            </p>

            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              The Modern Command Center for Legal Case Work
            </h1>

            <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              From litigation records to documents, filings, approvals, and
              audit trails, LOMS brings the Legal Unit into one controlled
              workspace.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link to="/login" className="landing-primary-cta">
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="landing-primary-cta ">
                Explore Features
              </a>
            </div>
          </div>

          <div className="landing-orbit-panel hidden lg:block">
            {orbitItems.map((item, index) => (
              <span
                key={item}
                className="landing-orbit-chip"
                style={{ animationDelay: `${index * 260}ms` }}
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="landing-section px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="landing-reveal mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
                Built for daily legal pressure
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                A calmer way to run complex legal work
              </h2>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="landing-feature-card landing-reveal"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="landing-feature-icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-6 text-lg font-extrabold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="landing-section px-4 pb-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="landing-reveal">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
                Workflow
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                From sign-in to accountability
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
                Every user starts with approval, every record respects access
                rules, and every important action leaves a trace.
              </p>
            </div>

            <div className="landing-timeline landing-reveal">
              {processSteps.map((step, index) => (
                <div key={step} className="landing-timeline-row">
                  <span className="landing-timeline-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-extrabold text-foreground">
                      {step}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {index === 0 &&
                        "Users enter through Supabase authentication and start with a controlled profile."}
                      {index === 1 &&
                        "Superadmins approve accounts before operational access is granted."}
                      {index === 2 &&
                        "Teams manage cases, documents, advisories, and dates from the app shell."}
                      {index === 3 &&
                        "Audit trails and system notes preserve continuity across handovers."}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-foreground" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-28 sm:px-6 lg:px-8">
          <div className="landing-final-cta landing-reveal mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            <ShieldCheck className="h-10 w-10 text-foreground" />
            <h2 className="max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              Secure legal work starts with a single launch.
            </h2>
            <Link to="/login" className="landing-primary-cta">
              Enter Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
