import { useState } from "react";
import {
  Bell,
  Shield,
  Database,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from "lucide-react";
import { User } from "@/types/legal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SettingsProps {
  currentUser: User;
}

export function Settings({ currentUser }: SettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [hearingReminders, setHearingReminders] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const handleReset = () => {
    setEmailNotifications(true);
    setPushNotifications(true);
    setHearingReminders(true);
    setDeadlineAlerts(true);
    toast.info("Settings reset to defaults");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground">
            Manage your application preferences
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance moved to dashboard */}

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Bell className="h-5 w-5 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Configure alert preferences
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Email Notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  emailNotifications ? "bg-accent" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    emailNotifications && "translate-x-5",
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Push Notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  Browser notifications
                </p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  pushNotifications ? "bg-accent" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    pushNotifications && "translate-x-5",
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Hearing Reminders</p>
                <p className="text-sm text-muted-foreground">
                  72-hour hearing alerts
                </p>
              </div>
              <button
                onClick={() => setHearingReminders(!hearingReminders)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  hearingReminders ? "bg-accent" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    hearingReminders && "translate-x-5",
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Deadline Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Advisory deadline warnings
                </p>
              </div>
              <button
                onClick={() => setDeadlineAlerts(!deadlineAlerts)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  deadlineAlerts ? "bg-accent" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    deadlineAlerts && "translate-x-5",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">
                  Account security settings
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">Current Role</p>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
                  {currentUser.role === "admin"
                    ? "Administrator"
                    : "Legal Officer"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Last Login</p>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-NG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <Lock className="h-4 w-4" />
              Change Password
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Database className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  System Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  Application details
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium text-foreground">1.0.0</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Environment</p>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                Production
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Database Status</p>
              <span className="flex items-center gap-1.5 text-sm text-success">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">NDPR Compliance</p>
              <span className="flex items-center gap-1.5 text-sm text-success">
                <Shield className="h-4 w-4" />
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-accent/20 p-3">
              <Mail className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact the LASU ICT Support team for assistance
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.info("Support contact: ict@lasu.edu.ng")}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
