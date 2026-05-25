import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Scale,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Manage legal cases",
    description: "Track litigation records, hearing dates, assigned counsel, and case progress in one place.",
  },
  {
    icon: FileText,
    title: "Store documents securely",
    description: "Upload, classify, and retrieve legal documents through a controlled document vault.",
  },
  {
    icon: Users,
    title: "Control user access",
    description: "Approve users and manage superadmin, admin, and staff permissions with role-based access.",
  },
  {
    icon: Bell,
    title: "Stay notified",
    description: "Receive focused alerts for approvals, documents, hearings, and important workflow updates.",
  },
];

const steps = [
  {
    title: "Create an account",
    description: "A user signs up and selects the correct account type.",
  },
  {
    title: "Get approved",
    description: "The superadmin reviews and approves the pending profile.",
  },
  {
    title: "Manage records",
    description: "Approved users can manage cases, documents, advisories, and audit trails.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="landing-fade border-b border-border bg-background/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
              <LockKeyhole className="h-5 w-5 text-primary" />
            </span>
            <span className="text-base font-bold tracking-tight">LASU Legal CMS</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-primary hover:underline">Features</a>
            <a href="#process" className="hover:text-primary hover:underline">How it works</a>
            <Link to="/login" className="hover:text-primary hover:underline">Login</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid w-full max-w-7xl gap-10 overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div className="pointer-events-none absolute right-6 top-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl landing-float" />
          <div className="pointer-events-none absolute bottom-10 left-8 h-24 w-24 rounded-full bg-success/10 blur-3xl landing-float-delayed" />
          <div className="landing-hero-copy flex flex-col justify-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
              Legal case management for LASU
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Manage cases, documents, approvals, and hearings from one secure legal workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A clean Supabase-powered system for legal officers, administrators, and superadmins to coordinate daily case work with proper access control.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="surface-card relative overflow-hidden p-5 landing-card sm:p-6">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10" />
            <div className="relative mb-6 flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Secure legal workspace</p>
                  <p className="text-sm text-muted-foreground">Built for daily case operations</p>
                </div>
              </div>
            </div>
            <div className="relative space-y-3">
              {[
                ["Authentication", "Users sign in through Supabase and wait for approval."],
                ["Case workflow", "Legal records, hearings, and advisory requests stay organized."],
                ["Document vault", "Important files are stored with controlled access."],
                ["Audit trail", "Key actions are logged for accountability."],
              ].map(([title, description], index) => (
                <div
                  key={title}
                  className="landing-row flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-border bg-muted/40">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="landing-section-title mb-8 max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Everything the legal unit needs</h2>
              <p className="mt-3 text-muted-foreground">Focused modules for case work, compliance, documents, and user control.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="surface-card landing-feature-card p-5"
                    style={{ animationDelay: `${features.indexOf(feature) * 110}ms` }}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="process" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="landing-section-title mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">A simple approval-led workflow keeps the system controlled.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div
                  className="surface-card landing-step-card h-full p-5"
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  <CheckCircle2 className="mt-5 h-5 w-5 text-success" />
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground md:block" />
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-fade border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 md:flex-row md:text-left lg:px-8">
          <p className="font-semibold text-foreground">LASU Legal CMS</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="hover:text-primary hover:underline">Login</Link>
            <a href="#features" className="hover:text-primary hover:underline">Features</a>
            <a href="#process" className="hover:text-primary hover:underline">How it works</a>
          </div>
          <p>Copyright 2026 LASU Legal Unit</p>
        </div>
      </footer>
    </div>
  );
}
