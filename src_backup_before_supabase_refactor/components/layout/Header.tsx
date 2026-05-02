import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Menu,
  X,
  AlertTriangle,
  FileText,
  Scale,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { User } from "@/types/legal";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "info" | "warning";
  time: string;
  read: boolean;
}

interface HeaderProps {
  currentUser: User;
  title: string;
  onMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({
  currentUser,
  title,
  onMenuToggle,
  onSearch,
  onSidebarToggle,
  sidebarCollapsed,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        themeRef.current &&
        !themeRef.current.contains(event.target as Node)
      ) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "urgent":
        return AlertTriangle;
      case "warning":
        return FileText;
      default:
        return Scale;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "urgent":
        return "text-destructive bg-destructive/10";
      case "warning":
        return "text-warning bg-warning/10";
      default:
        return "text-info bg-info/10";
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button - shows on sm and md */}
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse button - shows on md and up */}
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:block"
              aria-label="Collapse sidebar"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          )}

          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search - hidden on mobile */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search cases, documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input w-56 lg:w-64 pl-10"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg animate-fade-in z-50">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <h3 className="font-semibold text-foreground">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-accent hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={cn(
                            "flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border last:border-0",
                            !notification.read && "bg-accent/5",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                              getNotificationColor(notification.type),
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-border p-2">
                  <button className="w-full rounded-lg py-2 text-sm font-medium text-accent transition-colors hover:bg-muted">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <div className="relative">
            <ThemeToggle />
          </div>

          {/* User Avatar - hidden on mobile */}
          <div className="hidden items-center gap-2 sm:gap-3 rounded-lg bg-muted/50 px-2 sm:px-3 py-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="hidden sm:block text-sm">
              <p className="font-medium text-foreground">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser.role === "admin" ? "Admin" : "Legal Officer"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
