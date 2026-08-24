import { useState, useRef, useEffect, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  LitigationCase,
  AdvisoryRequest,
  LegalDocument,
  User as LegacyUser,
} from "@/types/legal";
import { useAuth } from "@/contexts/AuthContext";
import { useViewAs } from "@/contexts/ViewAsContext";
import { useCases } from "@/hooks/useCases";
import { useProfiles } from "@/hooks/useProfiles";
import { useAdvisoryRequests } from "@/hooks/useAdvisoryRequests";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useDocuments } from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header, HeaderSearchResult } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LitigationRegistry } from "@/components/litigation/LitigationRegistry";
import { AdvisoryWorkflow } from "@/components/advisory/AdvisoryWorkflow";
import { DocumentVault } from "@/components/documents/DocumentVault";
import { AuditTrail } from "@/components/audit/AuditTrail";
import { UserManagement } from "@/components/users/UserManagement";
import { Settings } from "@/components/settings/Settings";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ArchiveView } from "@/components/archive/ArchiveView";
import { RecordsView } from "@/components/records/RecordsView";
import { OnboardingGuide } from "@/components/onboarding/OnboardingGuide";
import ProgressPage from "@/pages/ProgressPage";
import { AddCaseDialog } from "@/components/dialogs/AddCaseDialog";
import { AddAdvisoryDialog } from "@/components/dialogs/AddAdvisoryDialog";
import { UploadDocumentDialog } from "@/components/dialogs/UploadDocumentDialog";
import { AddUserDialog } from "@/components/dialogs/AddUserDialog";
import { ViewCaseDialog } from "@/components/dialogs/ViewCaseDialog";
import { ViewAdvisoryDialog } from "@/components/dialogs/ViewAdvisoryDialog";
import { ViewDocumentDialog } from "@/components/dialogs/ViewDocumentDialog";
import { EditUserDialog } from "@/components/dialogs/EditUserDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { Loader2, Shield, X } from "lucide-react";
import { useCaseProgressModal } from "@/hooks/useCaseProgressModal";

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  litigation: "Litigation Registry",
  advisory: "Advisory Workflow",
  documents: "Document Vault",
  calendar: "Court Calendar",
  progress: "Progress",
  records: "Records",
  archive: "Archive",
  audit: "Audit Trail",
  users: "User Management",
  unauthorized: "Unauthorized",
  settings: "Settings",
};

type ConfirmDialogState = {
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => Promise<void> | void;
};

const Index = () => {
  const { user, profile, role, isLoading, signOut } = useAuth();
  const { viewingAsUser, isViewingAs, startViewingAs, stopViewingAs } = useViewAs();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useCaseProgressModal();
  const getViewFromPath = (pathname: string) => {
    if (pathname.startsWith("/app/advisory")) return "advisory";
    if (pathname.startsWith("/app/documents")) return "documents";
    if (pathname.startsWith("/app/calendar")) return "calendar";
    if (pathname.startsWith("/app/progress")) return "progress";
    if (pathname.startsWith("/app/records")) return "records";
    if (pathname.startsWith("/app/archive")) return "archive";
    if (pathname.startsWith("/app/cases")) return "litigation";
    if (pathname.startsWith("/app/audit")) return "audit";
    if (pathname.startsWith("/app/users")) {
      return role === "superadmin" || role === "admin" ? "users" : "unauthorized";
    }
    if (pathname.startsWith("/app/settings")) return "settings";
    return "dashboard";
  };
  const [activeView, setActiveView] = useState(getViewFromPath(location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { cases, metrics, createCase, updateCase, deleteCase } = useCases();
  const {
    advisoryRequests,
    createAdvisoryRequest,
    updateAdvisoryRequest,
    deleteAdvisoryRequest,
  } = useAdvisoryRequests();
  const { documents, createDocument, downloadDocument, deleteDocument } = useDocuments();
  const { auditLogs } = useAuditLogs();
  const { users: dbUsers, fetchUsers, updateUser, deleteUser } = useProfiles();

  // Dialog states
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [addAdvisoryOpen, setAddAdvisoryOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [viewCaseOpen, setViewCaseOpen] = useState(false);
  const [viewAdvisoryOpen, setViewAdvisoryOpen] = useState(false);
  const [viewDocumentOpen, setViewDocumentOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Selected items for view dialogs
  const [selectedCase, setSelectedCase] = useState<LitigationCase | null>(null);
  const [selectedAdvisory, setSelectedAdvisory] =
    useState<AdvisoryRequest | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<LegalDocument | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState<LegacyUser | null>(null);

  useEffect(() => {
    if (user && (role === "superadmin" || role === "admin")) {
      fetchUsers();
    }
  }, [fetchUsers, user, role]);

  useEffect(() => {
    setActiveView(getViewFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    setIsPageLoading(true);
    const timeout = window.setTimeout(() => setIsPageLoading(false), 650);
    return () => window.clearTimeout(timeout);
  }, [activeView]);

  useEffect(() => {
    const match = location.pathname.match(/^\/app\/cases\/([^/]+)$/);
    if (match?.[1]) {
      openModal(match[1]);
    }
  }, [location.pathname, openModal]);

  useEffect(() => {
    const match = location.pathname.match(/^\/app\/cases\/([^/]+)\/edit$/);
    if (!match?.[1]) return;

    const caseItem = cases.find((item) => item.id === match[1]);
    if (caseItem) {
      if (isViewingAs || !caseItem.canEdit) {
        toast.error(
          isViewingAs
            ? "View-as mode is read-only."
            : "You can only edit cases assigned to you.",
        );
        navigate("/app/cases", { replace: true });
        return;
      }
      setSelectedCase(caseItem);
      setAddCaseOpen(true);
    }
  }, [cases, isViewingAs, location.pathname, navigate]);

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
    if (isViewingAs && ["audit", "users"].includes(viewId)) {
      toast.info("Exit view-as mode to use administrator workspaces.");
      navigate("/app", { replace: true });
      return;
    }

    if (viewId === "users" && role !== "superadmin" && role !== "admin") {
      toast.error("Only admin and superadmin accounts can access user management.");
      navigate("/app", { replace: true });
      return;
    }

    setActiveView(viewId);
    const routeByView: Record<string, string> = {
      dashboard: "/app",
      litigation: "/app/cases",
      advisory: "/app/advisory",
      documents: "/app/documents",
      calendar: "/app/calendar",
      progress: "/app/progress",
      records: "/app/records",
      archive: "/app/archive",
      audit: "/app/audit",
      users: "/app/users",
      settings: "/app/settings",
    };
    navigate(routeByView[viewId] || "/app");
  };

  const handleEditCase = (caseItem: LitigationCase) => {
    if (isViewingAs) {
      toast.info("View-as mode is read-only.");
      return;
    }

    if (!caseItem.canEdit) {
      toast.error("You can only edit cases assigned to you.");
      return;
    }

    setSelectedCase(caseItem);
    setAddCaseOpen(true);
  };

  const handleDeleteCase = async (caseItem: LitigationCase) => {
    if (isViewingAs) {
      toast.info("View-as mode is read-only.");
      return;
    }

    setConfirmDialog({
      title: "Delete case?",
      description: `This will permanently delete "${caseItem.caseTitle}". This action cannot be undone.`,
      actionLabel: "Delete case",
      onConfirm: async () => {
        try {
          await deleteCase(caseItem);
          toast.success("Case deleted");
        } catch (error) {
          toast.error("Failed to delete case", {
            description: error.message || "Please try again.",
          });
        }
      },
    });
  };

  const handleViewAdvisory = (request: AdvisoryRequest) => {
    setSelectedAdvisory(request);
    setViewAdvisoryOpen(true);
  };

  const handleAddAdvisory = () => {
    if (isViewingAs) {
      toast.info("View-as mode is read-only.");
      return;
    }

    setSelectedAdvisory(null);
    setAddAdvisoryOpen(true);
  };

  const handleEditAdvisory = (request: AdvisoryRequest) => {
    if (isViewingAs) {
      toast.info("View-as mode is read-only.");
      return;
    }

    setSelectedAdvisory(request);
    setViewAdvisoryOpen(false);
    setAddAdvisoryOpen(true);
  };

  const handleDeleteAdvisory = async (request: AdvisoryRequest) => {
    if (isViewingAs) {
      toast.info("View-as mode is read-only.");
      return;
    }

    setConfirmDialog({
      title: "Delete advisory request?",
      description: `This will permanently delete "${request.title}". This action cannot be undone.`,
      actionLabel: "Delete request",
      onConfirm: async () => {
        try {
          await deleteAdvisoryRequest(request);
          setViewAdvisoryOpen(false);
          setSelectedAdvisory(null);
          toast.success("Advisory request deleted");
        } catch (error) {
          toast.error("Failed to delete advisory request", {
            description: error.message || "Please try again.",
          });
        }
      },
    });
  };

  const handleViewDocument = (doc: LegalDocument) => {
    setSelectedDocument(doc);
    setViewDocumentOpen(true);
  };

  const handleDownloadDocument = async (doc: LegalDocument) => {
    try {
      await downloadDocument(doc);
      toast.success(`Opening document: ${doc.name}`);
    } catch (error) {
      toast.error("Failed to download document", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleDeleteDocument = async (doc: LegalDocument) => {
    if (isViewingAs) {
      toast.info("View-as mode is read-only.");
      return;
    }

    setConfirmDialog({
      title: "Delete document?",
      description: `This will delete "${doc.name}" from the document vault and record a system note if it is linked to a case.`,
      actionLabel: "Delete document",
      onConfirm: async () => {
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
        } catch (error) {
          toast.error("Failed to delete document", {
            description: error.message || "Please try again.",
          });
        }
      },
    });
  };

  const handleEditUser = async (legacyUser: LegacyUser) => {
    if (isViewingAs) {
      toast.info("Exit view-as mode before managing users.");
      return;
    }

    if (role !== "superadmin") {
      toast.error("Only superadmin can edit users.");
      return;
    }

    setSelectedUserForEdit(legacyUser);
    setEditUserOpen(true);
  };

  const handleSaveUserAccess = async (
    legacyUser: LegacyUser,
    nextRole: "superadmin" | "admin" | "staff",
    nextStatus: "pending" | "approved" | "rejected",
  ) => {
    try {
      await updateUser(legacyUser.id, { role: nextRole, status: nextStatus });
      toast.success("User updated.");
    } catch (error) {
      toast.error("Failed to update user", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleDeleteUser = async (legacyUser: LegacyUser) => {
    if (isViewingAs) {
      toast.info("Exit view-as mode before managing users.");
      return;
    }

    if (legacyUser.id === user?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }

    setConfirmDialog({
      title: "Delete user?",
      description: `This will permanently remove ${legacyUser.name}'s account and profile from the workspace.`,
      actionLabel: "Delete user",
      onConfirm: async () => {
        try {
          await deleteUser(legacyUser.id);
          toast.success("User deleted.");
        } catch (error) {
          toast.error("Failed to delete user", {
            description: error.message || "Please try again.",
          });
        }
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    setIsConfirming(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleViewAsUser = async (legacyUser: LegacyUser) => {
    if (role !== "superadmin") {
      toast.error("Only superadmin can view as another user.");
      return;
    }

    try {
      await startViewingAs(legacyUser);
      setAddCaseOpen(false);
      setAddAdvisoryOpen(false);
      setUploadDocumentOpen(false);
      setEditUserOpen(false);
      setSelectedCase(null);
      setSelectedAdvisory(null);
      setSelectedDocument(null);
      handleViewChange("dashboard");
      toast.success(`Viewing as ${legacyUser.name}`);
    } catch (error) {
      toast.error("Could not start view-as mode", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleExitViewAs = async () => {
    const previousName = viewingAsUser?.name || "user";
    await stopViewingAs();
    toast.success(`Stopped viewing as ${previousName}`);
  };

  const canManageCases =
    !isViewingAs && (role === "superadmin" || role === "admin");
  const displayCases = cases;
  const activeCases = useMemo(
    () =>
      displayCases.filter(
        (caseItem) => !["Closed", "Archived"].includes(caseItem.status),
      ),
    [displayCases],
  );
  const closedCases = useMemo(
    () => displayCases.filter((caseItem) => caseItem.status === "Closed"),
    [displayCases],
  );
  const globalSearchResults = useMemo<HeaderSearchResult[]>(() => {
    const query = globalSearchQuery.trim().toLowerCase();
    if (query.length < 2) return [];

    const caseResults = displayCases
      .filter((caseItem) =>
        [
          caseItem.suitNumber,
          caseItem.caseTitle,
          caseItem.adversaryParty,
          caseItem.assignedCounsel,
          caseItem.court,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((caseItem) => ({
        id: caseItem.id,
        type: "case" as const,
        title: caseItem.suitNumber,
        subtitle: caseItem.caseTitle,
      }));

    const documentResults = documents
      .filter((doc) => {
        const relatedCase = doc.caseId
          ? displayCases.find((caseItem) => caseItem.id === doc.caseId)
          : undefined;
        return [doc.name, doc.type, doc.uploadedBy, relatedCase?.suitNumber]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 4)
      .map((doc) => ({
        id: doc.id,
        type: "document" as const,
        title: doc.name,
        subtitle: `${doc.type} - uploaded by ${doc.uploadedBy}`,
      }));

    return [...caseResults, ...documentResults].slice(0, 6);
  }, [displayCases, documents, globalSearchQuery]);

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
  const workspaceUser = viewingAsUser || currentUser;

  const handleSearchResultSelect = (result: HeaderSearchResult) => {
    if (result.type === "case") {
      const caseItem = displayCases.find((item) => item.id === result.id);
      if (caseItem) {
        openModal(caseItem.id);
        return;
      }
      toast.error("Case is no longer available.");
      return;
    }

    const document = documents.find((doc) => doc.id === result.id);
    if (document) {
      setSelectedDocument(document);
      setViewDocumentOpen(true);
      return;
    }
    toast.error("Document is no longer available.");
  };

  // Render the current view
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            metrics={metrics}
            cases={activeCases}
            auditLogs={auditLogs}
            onNavigate={handleViewChange}
          />
        );
      case "litigation":
        return (
          <LitigationRegistry
            cases={activeCases}
            onAddCase={
              canManageCases
                ? () => {
                    setSelectedCase(null);
                    setAddCaseOpen(true);
                  }
                : undefined
            }
            onViewCase={handleViewCase}
            onEditCase={isViewingAs ? undefined : handleEditCase}
            onDeleteCase={isViewingAs ? undefined : handleDeleteCase}
          />
        );
      case "advisory":
        return (
          <AdvisoryWorkflow
            requests={advisoryRequests}
            onAddRequest={isViewingAs ? undefined : handleAddAdvisory}
            onViewRequest={handleViewAdvisory}
            onEditRequest={isViewingAs ? undefined : handleEditAdvisory}
            onDeleteRequest={isViewingAs ? undefined : handleDeleteAdvisory}
          />
        );
      case "documents":
        return (
          <DocumentVault
            documents={documents}
            cases={displayCases}
            onUpload={isViewingAs ? undefined : () => setUploadDocumentOpen(true)}
            onViewDocument={handleViewDocument}
            onDownloadDocument={handleDownloadDocument}
            onDeleteDocument={isViewingAs ? undefined : handleDeleteDocument}
          />
        );
      case "progress":
        return <ProgressPage />;
      case "records":
        return (
          <RecordsView
            cases={closedCases}
            documents={documents}
            auditLogs={auditLogs}
            onViewCase={handleViewCase}
          />
        );
      case "archive":
        return (
          <ArchiveView
            cases={closedCases}
            documents={documents}
            onViewDocument={handleViewDocument}
            onDownloadDocument={handleDownloadDocument}
          />
        );
      case "audit":
        if (isViewingAs) {
          return (
            <div className="flex min-h-[22rem] flex-col items-center justify-center p-6 text-center">
              <h2 className="modern-page-title">Read-only workspace</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Exit view-as mode to use the audit trail.
              </p>
            </div>
          );
        }
        return <AuditTrail logs={auditLogs} />;
      case "users":
        if (isViewingAs || (role !== "superadmin" && role !== "admin")) {
          return (
            <div className="flex min-h-[22rem] flex-col items-center justify-center p-6 text-center">
              <h2 className="modern-page-title">Unauthorized</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {isViewingAs
                  ? "Exit view-as mode to manage users."
                  : "Only admin and superadmin accounts can access user management."}
              </p>
            </div>
          );
        }
        return (
          <UserManagement
            users={dbUsers}
            currentUser={currentUser}
            onAddUser={role === "superadmin" ? () => setAddUserOpen(true) : undefined}
            onEditUser={role === "superadmin" ? handleEditUser : undefined}
            onDeleteUser={role === "superadmin" ? handleDeleteUser : undefined}
            onViewAsUser={role === "superadmin" ? handleViewAsUser : undefined}
            viewingAsUserId={viewingAsUser?.id}
          />
        );
      case "settings":
        return <Settings currentUser={workspaceUser} />;
      case "calendar":
        return <CalendarView cases={activeCases} onViewCase={handleViewCase} />;
      default:
        return (
          <Dashboard
            metrics={metrics}
            cases={activeCases}
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
        currentUser={workspaceUser}
        activeView={activeView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-1 flex-col h-full transition-all duration-300 overflow-hidden",
        )}
      >
        <Header
          currentUser={workspaceUser}
          title={viewTitles[activeView] || "Dashboard"}
          onMenuToggle={() => setSidebarOpen(true)}
          onAccountClick={() => handleViewChange("settings")}
          onHelpClick={() => setGuideOpen(true)}
          onSearch={setGlobalSearchQuery}
          searchResults={globalSearchResults}
          onSearchResultSelect={handleSearchResultSelect}
          onPendingApprovalsClick={() => handleViewChange("users")}
        />
        {isViewingAs && viewingAsUser && (
          <div className="border-b border-border bg-foreground px-3 py-2 text-background sm:px-4 md:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-extrabold">
                  Viewing as {viewingAsUser.name}
                </p>
                <p className="text-xs font-medium text-background/75">
                  Read-only workspace preview. Actions are still audited under your superadmin account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExitViewAs}
                className="inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-lg border border-background/25 px-3 py-1.5 text-sm font-bold transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Exit view
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          {isPageLoading ? (
            <div className="flex min-h-[calc(100vh-8rem)] animate-fade-in items-center justify-center p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Loading {viewTitles[activeView] || "page"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Preparing your workspace...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            renderView()
          )}
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
        users={dbUsers}
        canAssignCase={canManageCases}
        onCreateCase={(input) =>
          selectedCase ? updateCase(selectedCase.id, input) : createCase(input)
        }
      />
      <AddAdvisoryDialog
        open={addAdvisoryOpen}
        onOpenChange={(open) => {
          setAddAdvisoryOpen(open);
          if (!open) setSelectedAdvisory(null);
        }}
        request={selectedAdvisory}
        onCreateRequest={createAdvisoryRequest}
        onUpdateRequest={updateAdvisoryRequest}
      />
      <UploadDocumentDialog
        open={uploadDocumentOpen}
        onOpenChange={setUploadDocumentOpen}
        cases={displayCases}
        onUploadDocument={createDocument}
      />
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserCreated={fetchUsers}
      />
      <EditUserDialog
        open={editUserOpen}
        onOpenChange={(open) => {
          setEditUserOpen(open);
          if (!open) setSelectedUserForEdit(null);
        }}
        user={selectedUserForEdit}
        onSave={handleSaveUserAccess}
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
        onEdit={handleEditAdvisory}
        onDelete={handleDeleteAdvisory}
      />
      <ViewDocumentDialog
        open={viewDocumentOpen}
        onOpenChange={setViewDocumentOpen}
        document={selectedDocument}
        onDownloadDocument={handleDownloadDocument}
      />
      <OnboardingGuide
        userId={user.id}
        userName={currentUser.name}
        role={currentUser.role}
        open={guideOpen}
        onOpenChange={setGuideOpen}
        onNavigate={handleViewChange}
      />
      <AlertDialog
        open={Boolean(confirmDialog)}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setConfirmDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmAction();
              }}
              disabled={isConfirming}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isConfirming ? "Working..." : confirmDialog?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
