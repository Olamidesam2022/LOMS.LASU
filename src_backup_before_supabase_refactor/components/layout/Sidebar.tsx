import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Scale,
  FileText,
  FolderOpen,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  CalendarDays,
  X,
} from "lucide-react";
import { User, UserRole } from "@/types/legal";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: User;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "legal_officer"],
  },
  {
    id: "litigation",
    label: "Litigation Registry",
    icon: Scale,
    roles: ["admin", "legal_officer"],
  },
  {
    id: "advisory",
    label: "Advisory Workflow",
    icon: FileText,
    roles: ["admin", "legal_officer"],
  },
  {
    id: "documents",
    label: "Document Vault",
    icon: FolderOpen,
    roles: ["admin", "legal_officer"],
  },
  {
    id: "calendar",
    label: "Court Calendar",
    icon: CalendarDays,
    roles: ["admin", "legal_officer"],
  },
  { id: "audit", label: "Audit Trail", icon: ClipboardList, roles: ["admin"] },
  { id: "users", label: "User Management", icon: Users, roles: ["admin"] },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "legal_officer"],
  },
];

export function Sidebar({
  currentUser,
  activeView,
  onViewChange,
  onLogout,
  isOpen,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role),
  );

  // Close sidebar on navigation in mobile
  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    if (onClose) onClose();
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "glass-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300 ease-in-out",
          // Mobile: Full width drawer, hidden by default
          "w-72",
          // Mobile display
          !isOpen && "-translate-x-full md:translate-x-0",
          isOpen && "translate-x-0",
          // Desktop: Collapsible with smooth width transition
          "md:relative md:translate-x-0",
          collapsed ? "md:w-20 lg:w-20" : "md:w-72 lg:w-72",
          // Prevent sidebar from being hidden on desktop when collapsed
          "md:block",
        )}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-4">
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {(!collapsed || isOpen) && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  LASU Legal
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Case Management
                </p>
              </div>
            </div>
          )}
          {collapsed && !isOpen && (
            <div className="mx-auto hidden h-10 w-10 items-center justify-center rounded-lg bg-accent md:flex">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "nav-item w-full transition-all duration-300",
                      isActive && "active",
                      collapsed &&
                        !isOpen &&
                        "md:justify-center md:px-2 md:py-2",
                    )}
                    title={collapsed && !isOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {(!collapsed || isOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {/* User Info */}
          <div
            className={cn(
              "mb-4 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3 transition-all duration-300",
              collapsed && !isOpen && "md:justify-center",
            )}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            {(!collapsed || isOpen) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {currentUser.role === "admin"
                    ? "Administrator"
                    : "Legal Officer"}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className={cn(
              "space-y-2",
              collapsed &&
                !isOpen &&
                "md:flex md:flex-col md:items-center md:gap-2",
            )}
          >
            <button
              onClick={() => {
                onLogout();
                if (onClose) onClose();
              }}
              className={cn(
                "nav-item w-full text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 dark:font-semibold",
                collapsed && !isOpen && "md:justify-center md:px-2 md:py-2",
              )}
              title={collapsed && !isOpen ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {(!collapsed || isOpen) && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
