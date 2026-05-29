import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Edit,
  FileText,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { StatusProgressBar } from "@/components/cases/StatusProgressBar";
import { CaseNote, CaseTask, CaseTaskPriority, CaseTaskStatus } from "@/types/legal";
import { writeAuditLog } from "@/lib/audit";

interface CaseProgressModalProps {
  caseId: string;
  onClose: () => void;
}

interface CaseRow {
  id: string;
  title: string;
  description: string | null;
  created_at?: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface CaseMeta {
  description?: string;
  suitNumber?: string;
  adversaryParty?: string;
  proceduralStage?: string;
  assignedCounsel?: string;
  status?: string;
  priority?: string;
  caseType?: string;
  case_type?: string;
  court?: string;
  nextHearing?: string | null;
  filingDeadline?: string | null;
  dueDate?: string | null;
}

interface AuditEntry {
  id: string;
  action?: string | null;
  performed_by?: string | null;
  details?: string | null;
  created_at?: string | null;
}

interface NoteRow {
  id: string;
  case_id: string;
  content: string;
  created_by: string | null;
  user_id: string | null;
  is_private: boolean;
  note_type: string;
  created_at: string;
}

interface TaskRow {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  status: CaseTaskStatus;
  priority: CaseTaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentRow {
  id: string;
  name: string;
  type: string;
  version: string;
  uploaded_by: string;
  size: string;
  status: string;
  created_at: string;
}

interface ModalState {
  caseRecord: CaseRow | null;
  meta: CaseMeta;
  noteCount: number;
  documentCount: number;
  overdueDeadlineCount: number;
  activity: AuditEntry[];
  notes: CaseNote[];
  tasks: CaseTask[];
  profiles: ProfileRow[];
  documents: DocumentRow[];
}

const emptyState: ModalState = {
  caseRecord: null,
  meta: {},
  noteCount: 0,
  documentCount: 0,
  overdueDeadlineCount: 0,
  activity: [],
  notes: [],
  tasks: [],
  profiles: [],
  documents: [],
};

function parseMeta(description: string | null): CaseMeta {
  if (!description) return {};
  try {
    return JSON.parse(description) as CaseMeta;
  } catch {
    return { description };
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function profileLabel(profile?: ProfileRow) {
  if (!profile) return "User";
  return profile.full_name || profile.email || "User";
}

function toNote(row: NoteRow, profiles: Map<string, string>): CaseNote {
  const authorId = row.created_by || row.user_id || undefined;
  return {
    id: row.id,
    caseId: row.case_id,
    content: row.content,
    createdBy: authorId,
    authorName: authorId ? profiles.get(authorId) || "User" : "System",
    isPrivate: row.is_private,
    noteType: row.note_type,
    createdAt: new Date(row.created_at),
  };
}

function toTask(row: TaskRow, profiles: Map<string, string>): CaseTask {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    description: row.description || undefined,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    assignedTo: row.assigned_to || undefined,
    assigneeName: row.assigned_to
      ? profiles.get(row.assigned_to) || "Assigned user"
      : "Unassigned",
    createdBy: row.created_by || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export function CaseProgressModal({ caseId, onClose }: CaseProgressModalProps) {
  const navigate = useNavigate();
  const { role, user, profile } = useAuth();
  const [state, setState] = useState<ModalState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "notes" | "tasks" | "documents" | "timeline"
  >("overview");
  const [noteContent, setNoteContent] = useState("");
  const [taskInput, setTaskInput] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: "",
    priority: "normal" as CaseTaskPriority,
  });
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const fetchCaseProgress = useCallback(async () => {
    setError(null);
    const today = new Date().toISOString().slice(0, 10);

    const caseQuery = supabase
      .from("cases")
      .select("id,title,description,created_at")
      .eq("id", caseId)
      .single();
    const notesQuery = supabase
      .from("case_notes")
      .select("id,case_id,content,created_by,user_id,is_private,note_type,created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    const tasksQuery = supabase
      .from("case_tasks")
      .select("id,case_id,title,description,status,priority,due_date,assigned_to,created_by,completed_at,created_at,updated_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    const documentsQuery = supabase
      .from("documents")
      .select("id,name,type,version,uploaded_by,size,status,created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    const deadlinesQuery = supabase
      .from("deadlines")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId)
      .lt("due_date", today)
      .neq("status", "completed");
    const activityQuery = supabase
      .from("audit_logs")
      .select("id,action,performed_by,details,created_at")
      .eq("target_id", caseId)
      .order("created_at", { ascending: false })
      .limit(8);
    const profilesQuery = supabase
      .from("profiles")
      .select("id,full_name,email");

    const [caseResult, notesResult, tasksResult, documentsResult, deadlinesResult, activityResult, profilesResult] =
      await Promise.all([
        caseQuery,
        notesQuery,
        tasksQuery,
        documentsQuery,
        deadlinesQuery,
        activityQuery,
        profilesQuery,
      ]);

    if (caseResult.error) throw caseResult.error;
    const caseRecord = caseResult.data as CaseRow;
    const profileRows = (profilesResult.data || []) as ProfileRow[];
    const profileMap = new Map(
      profileRows.map((profileRow) => [profileRow.id, profileLabel(profileRow)]),
    );
    if (user) {
      profileMap.set(user.id, profile?.full_name || profile?.email || user.email || "You");
    }
    const notes = ((notesResult.data || []) as NoteRow[]).map((row) =>
      toNote(row, profileMap),
    );
    const tasks = ((tasksResult.data || []) as TaskRow[]).map((row) =>
      toTask(row, profileMap),
    );

    setState({
      caseRecord,
      meta: parseMeta(caseRecord.description),
      noteCount: notes.length,
      documentCount: (documentsResult.data || []).length,
      overdueDeadlineCount: deadlinesResult.count ?? 0,
      activity: (activityResult.data || []) as AuditEntry[],
      notes,
      tasks,
      profiles: profileRows,
      documents: (documentsResult.data || []) as DocumentRow[],
    });
  }, [caseId, profile?.email, profile?.full_name, user]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCaseProgress()
      .catch((fetchError) => {
        console.error("Failed to fetch case progress:", fetchError);
        if (isMounted) setError("Unable to load this case progress right now.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const channel = supabase
      .channel(`case-progress-${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cases",
          filter: `id=eq.${caseId}`,
        },
        () => {
          fetchCaseProgress().catch((refreshError) => {
            console.error("Failed to refresh case progress:", refreshError);
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_notes",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchCaseProgress().catch((refreshError) => {
            console.error("Failed to refresh case notes:", refreshError);
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_tasks",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchCaseProgress().catch((refreshError) => {
            console.error("Failed to refresh case tasks:", refreshError);
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchCaseProgress().catch((refreshError) => {
            console.error("Failed to refresh case documents:", refreshError);
          });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [caseId, fetchCaseProgress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const caseRecord = state.caseRecord;
  const caseNumber = state.meta.suitNumber || `Case ${caseId.slice(0, 8)}`;
  const caseTitle = caseRecord?.title || "Untitled case";
  const normalizedStatus = (state.meta.status || "").toLowerCase().replace(/\s+/g, "_");
  const canEdit =
    role === "superadmin" ||
    role === "admin" ||
    normalizedStatus === "in_progress";
  const openTaskCount = state.tasks.filter((task) => task.status !== "completed").length;
  const assigneeOptions = useMemo(() => {
    const options = state.profiles.map((profileRow) => ({
      id: profileRow.id,
      label: profileLabel(profileRow),
    }));
    if (user && !options.some((option) => option.id === user.id)) {
      options.unshift({
        id: user.id,
        label: profile?.full_name || profile?.email || user.email || "You",
      });
    }
    return options;
  }, [profile?.email, profile?.full_name, state.profiles, user]);
  const timelineItems = useMemo(() => {
    const noteItems = state.notes.slice(0, 8).map((note) => ({
      id: `note-${note.id}`,
      title: note.noteType === "system" ? "System note" : "Note added",
      detail: note.content,
      actor: note.authorName,
      date: note.createdAt,
    }));
    const taskItems = state.tasks.slice(0, 8).map((task) => ({
      id: `task-${task.id}`,
      title: task.status === "completed" ? "Task completed" : "Task assigned",
      detail: task.title,
      actor: task.assigneeName,
      date: task.completedAt || task.createdAt,
    }));
    const auditItems = state.activity.map((item) => ({
      id: `audit-${item.id}`,
      title: item.action || "Case activity",
      detail: item.details || "Case updated",
      actor: item.performed_by || "System",
      date: item.created_at ? new Date(item.created_at) : new Date(),
    }));
    return [...noteItems, ...taskItems, ...auditItems]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 12);
  }, [state.activity, state.notes, state.tasks]);

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleAddNote = async () => {
    if (!user || !noteContent.trim()) return;
    setIsSavingNote(true);
    try {
      const content = noteContent.trim();
      const { error: noteError } = await supabase.from("case_notes").insert({
        case_id: caseId,
        content,
        created_by: user.id,
        user_id: user.id,
        is_private: false,
        note_type: "note",
      });
      if (noteError) throw noteError;
      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: caseId,
        resource: "Case Note",
        details: `Added note to ${caseNumber}`,
      });
      setNoteContent("");
      await fetchCaseProgress();
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleAddTask = async () => {
    if (!user || !taskInput.title.trim()) return;
    setIsSavingTask(true);
    try {
      const { error: taskError } = await supabase.from("case_tasks").insert({
        case_id: caseId,
        title: taskInput.title.trim(),
        description: taskInput.description.trim() || null,
        due_date: taskInput.dueDate || null,
        assigned_to: taskInput.assignedTo || user.id,
        priority: taskInput.priority,
        status: "open",
        created_by: user.id,
      });
      if (taskError) throw taskError;
      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: caseId,
        resource: "Task",
        details: `Assigned task: ${taskInput.title.trim()}`,
      });
      setTaskInput({
        title: "",
        description: "",
        dueDate: "",
        assignedTo: "",
        priority: "normal",
      });
      await fetchCaseProgress();
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleTaskStatusChange = async (task: CaseTask, status: CaseTaskStatus) => {
    if (!user) return;
    const { error: taskError } = await supabase
      .from("case_tasks")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);
    if (taskError) throw taskError;
    await writeAuditLog({
      action: "UPDATE",
      performedBy: user.id,
      targetId: caseId,
      resource: "Task",
      details: `Marked task "${task.title}" as ${status.replace("_", " ")}`,
    });
    await fetchCaseProgress();
  };

  const statCards = useMemo(
    () => [
      {
        label: "Notes",
        value: state.noteCount,
        icon: MessageSquareText,
        tab: "notes" as const,
      },
      {
        label: "Documents",
        value: state.documentCount,
        icon: FileText,
        tab: "documents" as const,
      },
      {
        label: "Deadlines overdue",
        value: state.overdueDeadlineCount,
        icon: CalendarDays,
        path: `/app/calendar?case=${caseId}`,
      },
      {
        label: "Open tasks",
        value: openTaskCount,
        icon: ClipboardList,
        tab: "tasks" as const,
      },
    ],
    [caseId, openTaskCount, state.documentCount, state.noteCount, state.overdueDeadlineCount],
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Case progress"
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 p-5 backdrop-blur">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-muted-foreground">
              {caseNumber}
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {caseTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close case progress"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {isLoading && (
            <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading case progress...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isLoading && !error && caseRecord && (
            <>
              <StatusProgressBar status={state.meta.status} />

              <div className="grid gap-3 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Priority: </span>
                  <strong className="uppercase text-foreground">
                    {state.meta.priority || "Normal"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <strong className="capitalize text-foreground">
                    {state.meta.case_type || state.meta.caseType || "Litigation"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned: </span>
                  <strong className="text-foreground">
                    {state.meta.assignedCounsel || "Unassigned"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Court Date: </span>
                  <strong className="text-foreground">
                    {formatDate(state.meta.nextHearing)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Filing Date: </span>
                  <strong className="text-foreground">
                    {formatDate(state.meta.filingDeadline || state.meta.dueDate)}
                  </strong>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <button
                      key={stat.label}
                      onClick={() =>
                        "tab" in stat ? setActiveTab(stat.tab) : goTo(stat.path)
                      }
                      className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-accent/60 hover:bg-accent/5"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {stat.label}
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 overflow-x-auto border-b border-border">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "notes", label: "Notes" },
                  { id: "tasks", label: "Tasks" },
                  { id: "documents", label: "Documents" },
                  { id: "timeline", label: "Timeline" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
              <section className="rounded-lg border border-border bg-background">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-foreground">
                    Case Summary
                  </h3>
                </div>
                <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Description</p>
                    <p className="mt-1 text-foreground">
                      {state.meta.description || "No description recorded."}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Latest update</p>
                    <p className="mt-1 text-foreground">
                      {timelineItems[0]?.detail || "No activity recorded yet."}
                    </p>
                  </div>
                </div>
              </section>
              )}

              {activeTab === "notes" && (
                <section className="rounded-lg border border-border bg-background">
                  <div className="border-b border-border p-4">
                    <h3 className="font-semibold text-foreground">Case Notes</h3>
                  </div>
                  <div className="space-y-3 p-4">
                    <textarea
                      value={noteContent}
                      onChange={(event) => setNoteContent(event.target.value)}
                      rows={3}
                      placeholder="Add an internal case note..."
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={isSavingNote || !noteContent.trim()}
                      className="gap-2"
                    >
                      {isSavingNote ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Add Note
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {state.notes.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        No notes have been added to this case yet.
                      </p>
                    )}
                    {state.notes.map((note) => (
                      <div key={note.id} className="p-4 text-sm">
                        <p className="whitespace-pre-wrap text-foreground">{note.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {note.authorName}
                          <span className="mx-1">-</span>
                          {relativeTime(note.createdAt.toISOString())}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === "tasks" && (
                <section className="rounded-lg border border-border bg-background">
                  <div className="border-b border-border p-4">
                    <h3 className="font-semibold text-foreground">Task Assignment</h3>
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-2">
                    <input
                      value={taskInput.title}
                      onChange={(event) =>
                        setTaskInput((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Task title"
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <select
                      value={taskInput.assignedTo}
                      onChange={(event) =>
                        setTaskInput((current) => ({ ...current, assignedTo: event.target.value }))
                      }
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Assign to me</option>
                      {assigneeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={taskInput.dueDate}
                      onChange={(event) =>
                        setTaskInput((current) => ({ ...current, dueDate: event.target.value }))
                      }
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <select
                      value={taskInput.priority}
                      onChange={(event) =>
                        setTaskInput((current) => ({
                          ...current,
                          priority: event.target.value as CaseTaskPriority,
                        }))
                      }
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="low">Low priority</option>
                      <option value="normal">Normal priority</option>
                      <option value="high">High priority</option>
                      <option value="urgent">Urgent priority</option>
                    </select>
                    <textarea
                      value={taskInput.description}
                      onChange={(event) =>
                        setTaskInput((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Task details"
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
                    />
                    <Button
                      onClick={handleAddTask}
                      disabled={isSavingTask || !taskInput.title.trim()}
                      className="gap-2 md:w-fit"
                    >
                      {isSavingTask ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Assign Task
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {state.tasks.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        No tasks have been assigned for this case yet.
                      </p>
                    )}
                    {state.tasks.map((task) => (
                      <div key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">{task.title}</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Assigned to {task.assigneeName}
                            {task.dueDate && (
                              <>
                                <span className="mx-1">-</span>
                                Due {formatDate(task.dueDate.toISOString())}
                              </>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleTaskStatusChange(
                              task,
                              task.status === "completed" ? "open" : "completed",
                            )
                          }
                          className="gap-2"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          {task.status === "completed" ? "Completed" : "Mark Done"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === "documents" && (
                <section className="rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                    <div>
                      <h3 className="font-semibold text-foreground">Case Documents</h3>
                      <p className="text-xs text-muted-foreground">
                        {state.documentCount >= 2
                          ? `${state.documentCount} documents are attached to this case.`
                          : `${state.documentCount} document${state.documentCount === 1 ? "" : "s"} attached.`}
                      </p>
                    </div>
                    {state.documentCount >= 2 && (
                      <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-bold text-info">
                        Multiple documents
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {state.documents.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        No documents have been attached to this case yet.
                      </p>
                    )}
                    {state.documents.map((document) => (
                      <div
                        key={document.id}
                        className="grid gap-3 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {document.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {document.type} - v{document.version} - {document.size}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Uploaded by {document.uploaded_by} on{" "}
                            {formatDate(document.created_at)}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                          {document.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === "timeline" && (
                <section className="rounded-lg border border-border bg-background">
                  <div className="border-b border-border p-4">
                    <h3 className="font-semibold text-foreground">Case Timeline</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {timelineItems.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        No timeline activity has been recorded for this case.
                      </p>
                    )}
                    {timelineItems.map((item) => (
                      <div key={item.id} className="p-4 text-sm">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-foreground">{item.detail}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.actor}
                          <span className="mx-1">-</span>
                          {relativeTime(item.date.toISOString())}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => goTo(`/app/documents?case=${caseId}`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            View Documents
          </Button>
          <Button
            variant="outline"
            onClick={() => goTo(`/app/calendar?case=${caseId}`)}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            View in Calendar
          </Button>
          {canEdit && (
            <Button onClick={() => goTo(`/app/cases/${caseId}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
