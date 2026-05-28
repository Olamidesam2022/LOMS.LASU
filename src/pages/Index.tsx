import { useState, useRef, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  LitigationCase,
  AdvisoryRequest,
  LegalDocument,
  User as LegacyUser,
} from "@/types/legal";
import { useAuth } from "@/contexts/AuthContext";
import { toLitigationCase, useCases } from "@/hooks/useCases";
import { useProfiles } from "@/hooks/useProfiles";
import { useAdvisoryRequests } from "@/hooks/useAdvisoryRequests";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useDocuments } from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LitigationRegistry } from "@/components/litigation/LitigationRegistry";
import { AdvisoryWorkflow } from "@/components/advisory/AdvisoryWorkflow";
import { DocumentVault } from "@/components/documents/DocumentVault";
import { AuditTrail } from "@/components/audit/AuditTrail";
import { UserManagement } from "@/components/users/UserManagement";
import { Settings } from "@/components/settings/Settings";
import { CalendarView } from "@/components/calendar/CalendarView";
import ProgressPage from "@/pages/ProgressPage";
import { AddCaseDialog } from "@/components/dialogs/AddCaseDialog";
import { AddAdvisoryDialog } from "@/components/dialogs/AddAdvisoryDialog";
import { UploadDocumentDialog } from "@/components/dialogs/UploadDocumentDialog";
import { AddUserDialog } from "@/components/dialogs/AddUserDialog";
import { ViewCaseDialog } from "@/components/dialogs/ViewCaseDialog";
import { ViewAdvisoryDialog } from "@/components/dialogs/ViewAdvisoryDialog";
import { ViewDocumentDialog } from "@/components/dialogs/ViewDocumentDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { Shield } from "lucide-react";
import { useCaseProgressModal } from "@/hooks/useCaseProgressModal";

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  litigation: "Litigation Registry",
  advisory: "Advisory Workflow",
  documents: "Document Vault",
  calendar: "Court Calendar",
  progress: "Progress",
  audit: "Audit Trail",
  users: "User Management",
  unauthorized: "Unauthorized",
  settings: "Settings",
};

const Index = () => {
  const { user, profile, role, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useCaseProgressModal();
  const getViewFromPath = (pathname: string) => {
    if (pathname.startsWith("/app/documents")) return "documents";
    if (pathname.startsWith("/app/calendar")) return "calendar";
    if (pathname.startsWith("/app/progress")) return "progress";
    if (pathname.startsWith("/app/cases")) return "litigation";
    if (pathname.startsWith("/app/audit")) return "audit";
    if (pathname.startsWith("/app/users")) return role === "superadmin" ? "users" : "unauthorized";
    if (pathname.startsWith("/app/settings")) return "settings";
    return "dashboard";
  };
  const [activeView, setActiveView] = useState(getViewFromPath(location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { cases, metrics, createCase, updateCase, deleteCase } = useCases();
  const [allCasesEnabled, setAllCasesEnabled] = useState(false);
  const [allCases, setAllCases] = useState<LitigationCase[]>([]);
  const { advisoryRequests, createAdvisoryRequest } = useAdvisoryRequests();
  const { documents, createDocument, downloadDocument, deleteDocument } = useDocuments();
  const { auditLogs } = useAuditLogs();
  const { users: dbUsers, fetchUsers, updateUser } = useProfiles();

  // Dialog states
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [addAdvisoryOpen, setAddAdvisoryOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [viewCaseOpen, setViewCaseOpen] = useState(false);
  const [viewAdvisoryOpen, setViewAdvisoryOpen] = useState(false);
  const [viewDocumentOpen, setViewDocumentOpen] = useState(false);

  // Selected items for view dialogs
  const [selectedCase, setSelectedCase] = useState<LitigationCase | null>(null);
  const [selectedAdvisory, setSelectedAdvisory] =
    useState<AdvisoryRequest | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<LegalDocument | null>(null);

  useEffect(() => {
    if (user && role === "superadmin") {
      fetchUsers();
    }
  }, [fetchUsers, user, role]);

  useEffect(() => {
    setActiveView(getViewFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const match = location.pathname.match(/^\/app\/cases\/([^/]+)$/);
    if (match?.[1]) {
      openModal(match[1]);
    }
  }, [location.pathname, openModal]);

  useEffect(() => {
    const match = location.pathname.match(/^\/app\/cases\/([^/]+)\/edit$/);
    if (!match?.[1]) return;

    const caseItem = [...allCases, ...cases].find((item) => item.id === match[1]);
    if (caseItem) {
      setSelectedCase(caseItem);
      setAddCaseOpen(true);
    }
  }, [allCases, cases, location.pathname]);

  // Swipe gestures for mobile sidebar
  useSwipeGesture(mainContentRef, {
    onSwipeRight: () => setSidebarOpen(true),
    onSwipeLeft: () => setSidebarOpen(false),
    threshold: 50,
    edgeThreshold: 40,
  });

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    toast.info("You have been logged out");
  };

  // View handlers
  const handleViewCase = (caseItem: LitigationCase) => {
    openModal(caseItem.id);
  };

  const handleViewChange = (viewId: string) => {
    if (viewId === "users" && role !== "superadmin") {
      toast.error("Only superadmin accounts can access user management.");
      navigate("/app", { replace: true });
      return;
    }

    setActiveView(viewId);
    const routeByView: Record<string, string> = {
      dashboard: "/app",
      litigation: "/app/cases",
      advisory: "/app/cases?type=advisory",
      documents: "/app/documents",
      calendar: "/app/calendar",
      progress: "/app/progress",
      audit: "/app/audit",
      users: "/app/users",
      settings: "/app/settings",
    };
    navigate(routeByView[viewId] || "/app");
  };

  const handleEditCase = (caseItem: LitigationCase) => {
    setSelectedCase(caseItem);
    setAddCaseOpen(true);
  };

  const handleAllCasesToggle = async (enabled: boolean) => {
    setAllCasesEnabled(enabled);

    if (!enabled) {
      setAllCases([]);
      toast.info("Showing your assigned and granted cases.");
      return;
    }

    if (role !== "superadmin") {
      toast.error("Only superadmin can view all cases.");
      return;
    }

    const { data, error } = await supabase.functions.invoke("admin-all-cases", {
      body: { enabled: true },
    });

    if (error) {
      setAllCasesEnabled(false);
      toast.error("Unable to load all cases", {
        description: error.message,
      });
      return;
    }

    setAllCases(
      ((data?.cases || []) as any[]).map((row) =>
        toLitigationCase(row, { id: user?.id || "", role }),
      ),
    );
    toast.success("Showing all cases.");
  };

  const handleDeleteCase = async (caseItem: LitigationCase) => {
    if (!window.confirm(`Delete case "${caseItem.caseTitle}"?`)) return;

    try {
      await deleteCase(caseItem);
      toast.success("Case deleted");
    } catch (error: any) {
      toast.error("Failed to delete case", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleViewAdvisory = (request: AdvisoryRequest) => {
    setSelectedAdvisory(request);
    setViewAdvisoryOpen(true);
  };

  const handleViewDocument = (doc: LegalDocument) => {
    setSelectedDocument(doc);
    setViewDocumentOpen(true);
  };

  const handleDownloadDocument = async (doc: LegalDocument) => {
    try {
      await downloadDocument(doc);
      toast.success(`Opening document: ${doc.name}`);
    } catch (error: any) {
      toast.error("Failed to download document", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleDeleteDocument = async (doc: LegalDocument) => {
    if (!window.confirm(`Delete document "${doc.name}"?`)) return;

    try {
      if (doc.caseId && user) {
        const removedAt = new Date();
        const userName = profile?.full_name || user.email || "Unknown user";
        const noteContent = `Document '${doc.name}' was removed by ${userName} on ${removedAt.toLocaleString("en-NG")}.`;
        const { error: noteError } = await supabase.from("case_notes").insert({
          case_id: doc.caseId,
          content: noteContent,
          created_by: user.id,
          user_id: user.id,
          is_private: false,
          note_type: "system",
        });

        if (noteError) {
          console.error("Failed to insert document removal system note:", noteError);
        }
      }

      await deleteDocument(doc);
      toast.success("Document deleted");
    } catch (error: any) {
      toast.error("Failed to delete document", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleEditUser = async (legacyUser: LegacyUser) => {
    if (role !== "superadmin") {
      toast.error("Only superadmin can edit users.");
      return;
    }

    const nextRole = window.prompt(
      "Enter role: superadmin, admin, or staff",
      legacyUser.role,
    ) as "superadmin" | "admin" | "staff" | null;

    if (!nextRole) return;
    if (!["superadmin", "admin", "staff"].includes(nextRole)) {
      toast.error("Invalid role selected.");
      return;
    }

    const nextStatus = window.prompt(
      "Enter status: pending, approved, or rejected",
      legacyUser.status || "approved",
    ) as "pending" | "approved" | "rejected" | null;

    if (!nextStatus) return;
    if (!["pending", "approved", "rejected"].includes(nextStatus)) {
      toast.error("Invalid status selected.");
      return;
    }

    try {
      await updateUser(legacyUser.id, { role: nextRole, status: nextStatus });
      toast.success("User updated.");
    } catch (error: any) {
      toast.error("Failed to update user", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleDeactivateUser = async (legacyUser: LegacyUser) => {
    if (legacyUser.id === user?.id) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    if (!window.confirm(`Deactivate ${legacyUser.name}?`)) return;

    try {
      await updateUser(legacyUser.id, { status: "rejected" });
      toast.success("User deactivated.");
    } catch (error: any) {
      toast.error("Failed to deactivate user", {
        description: error.message || "Please try again.",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Shield className="h-9 w-9 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Create a compatible user object for components that expect the legacy User type
  const currentUser: LegacyUser = {
    id: user.id,
    name: profile?.full_name || user.email || "User",
    email: profile?.email || user.email || "",
    role: role || "staff",
    department: "Legal",
  };

  const displayCases = allCasesEnabled ? allCases : cases;

  // Render the current view
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            metrics={metrics}
            cases={displayCases}
            advisoryRequests={advisoryRequests}
            auditLogs={auditLogs}
            onNavigate={handleViewChange}
          />
        );
      case "litigation":
        return (
          <LitigationRegistry
            cases={displayCases}
            onAddCase={() => setAddCaseOpen(true)}
            onViewCase={handleViewCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
          />
        );
      case "advisory":
        return (
          <AdvisoryWorkflow
            requests={advisoryRequests}
            onAddRequest={() => setAddAdvisoryOpen(true)}
            onViewRequest={handleViewAdvisory}
          />
        );
      case "documents":
        return (
          <DocumentVault
            documents={documents}
            cases={displayCases}
            onUpload={() => setUploadDocumentOpen(true)}
            onViewDocument={handleViewDocument}
            onDownloadDocument={handleDownloadDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        );
      case "progress":
        return <ProgressPage />;
      case "audit":
        return <AuditTrail logs={auditLogs} />;
      case "users":
        if (role !== "superadmin") {
          return (
            <div className="flex min-h-[22rem] flex-col items-center justify-center p-6 text-center">
              <h2 className="modern-page-title">Unauthorized</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Only superadmin accounts can access user management.
              </p>
            </div>
          );
        }
        return (
          <UserManagement
            users={dbUsers}
            currentUser={currentUser}
            onAddUser={() => setAddUserOpen(true)}
            onEditUser={handleEditUser}
            onDeactivateUser={handleDeactivateUser}
          />
        );
      case "settings":
        return <Settings currentUser={currentUser} />;
      case "calendar":
        return <CalendarView cases={displayCases} onViewCase={handleViewCase} />;
      default:
        return (
          <Dashboard
            metrics={metrics}
            cases={displayCases}
            advisoryRequests={advisoryRequests}
            auditLogs={auditLogs}
            onNavigate={handleViewChange}
          />
        );
    }
  };

  return (
    <div
      ref={mainContentRef}
      className="flex h-screen w-screen overflow-hidden bg-background touch-pan-y"
    >
      {/* Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onAllCasesToggle={handleAllCasesToggle}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-1 flex-col h-full transition-all duration-300 overflow-hidden",
        )}
      >
        <Header
          currentUser={currentUser}
          title={viewTitles[activeView] || "Dashboard"}
          onMenuToggle={() => setSidebarOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          {renderView()}
        </main>
      </div>

      {/* Dialogs */}
      <AddCaseDialog
        open={addCaseOpen}
        onOpenChange={(open) => {
          setAddCaseOpen(open);
          if (!open) setSelectedCase(null);
        }}
        caseItem={selectedCase}
        onCreateCase={(input) =>
          selectedCase ? updateCase(selectedCase.id, input) : createCase(input)
        }
      />
      <AddAdvisoryDialog
        open={addAdvisoryOpen}
        onOpenChange={setAddAdvisoryOpen}
        onCreateRequest={createAdvisoryRequest}
      />
      <UploadDocumentDialog
        open={uploadDocumentOpen}
        onOpenChange={setUploadDocumentOpen}
        onUploadDocument={createDocument}
      />
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserCreated={fetchUsers}
      />
      <ViewCaseDialog
        open={viewCaseOpen}
        onOpenChange={setViewCaseOpen}
        caseItem={selectedCase}
      />
      <ViewAdvisoryDialog
        open={viewAdvisoryOpen}
        onOpenChange={setViewAdvisoryOpen}
        request={selectedAdvisory}
      />
      <ViewDocumentDialog
        open={viewDocumentOpen}
        onOpenChange={setViewDocumentOpen}
        document={selectedDocument}
        onDownloadDocument={handleDownloadDocument}
      />
    </div>
  );
};

export default Index;
