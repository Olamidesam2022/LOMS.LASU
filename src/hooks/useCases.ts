import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, LitigationCase } from "@/types/legal";
import { useAuth } from "@/context/AuthContext";
import { useViewAs } from "@/context/ViewAsContext";
import { writeAuditLog } from "@/lib/audit";

interface CaseRow {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  assigned_to?: string | null;
  creator_email?: string | null;
  entered_by?: string | null;
  created_at: string;
}

interface CaseAccessRow {
  case_id: string;
  user_id: string;
}

export interface CaseInput {
  title: string;
  description?: string;
  suitNumber?: string;
  adversaryParty?: string;
  proceduralStage?: string;
  assignedCounsel?: string;
  assignedTo?: string;
  assignedUserIds?: string[];
  court?: string;
  nextHearing?: string;
  filingDeadline?: string;
  status?: string;
}

const parseDescription = (description: string | null) => {
  if (!description) return {};
  try {
    return JSON.parse(description);
  } catch {
    return { description };
  }
};

export const toLitigationCase = (
  row: CaseRow,
  viewer?: { id: string; role?: string | null },
  assignedUserIds: string[] = [],
): LitigationCase => {
  const meta = parseDescription(row.description);
  const createdAt = new Date(row.created_at);
  const enteredBy = row.entered_by || meta.enteredBy || row.created_by;
  const canEditAll = viewer?.role === "superadmin" || viewer?.role === "admin";
  const canDeleteAll = viewer?.role === "superadmin";
  const isAssigned =
    !!viewer?.id &&
    (row.assigned_to === viewer.id || assignedUserIds.includes(viewer.id));

  return {
    id: row.id,
    suitNumber: meta.suitNumber || "Unassigned",
    caseTitle: row.title,
    adversaryParty: meta.adversaryParty || "Unspecified",
    proceduralStage: meta.proceduralStage || "Mention",
    assignedCounsel: meta.assignedCounsel || "Unassigned",
    status: meta.status || "Active",
    nextHearing: meta.nextHearing ? new Date(meta.nextHearing) : createdAt,
    court: meta.court || "Unspecified",
    filedDate: createdAt,
    description: meta.description || row.description || "",
    createdBy: row.created_by,
    creatorEmail: row.creator_email || meta.creatorEmail || "",
    enteredBy,
    assignedTo: row.assigned_to || undefined,
    assignedUserIds,
    canEdit: canEditAll || isAssigned,
    canDelete: canDeleteAll,
  };
};

const canCaseBeSeenByViewer = (
  row: CaseRow,
  viewer: { id: string; role?: string | null },
  assignedUserIds: string[],
) => {
  if (viewer.role === "superadmin" || viewer.role === "admin") return true;
  return row.assigned_to === viewer.id || assignedUserIds.includes(viewer.id);
};

export function useCases() {
  const { user, role, profile, isApproved } = useAuth();
  const { viewingAsUser, isViewingAs } = useViewAs();
  const [cases, setCases] = useState<LitigationCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCases = useCallback(async () => {
    if (!user || !isApproved) {
      setCases([]);
      return;
    }

    setIsLoading(true);
    const casesQuery = supabase
      .from("cases")
      .select("id,title,description,created_by,creator_email,entered_by,assigned_to,created_at")
      .order("created_at", { ascending: false });
    const accessQuery = supabase.from("case_access").select("case_id,user_id");

    const [casesResult, accessResult] = await Promise.all([casesQuery, accessQuery]);
    const { data, error } = casesResult;

    if (error) {
      console.error("Failed to load cases:", error);
      setCases([]);
      setIsLoading(false);
      return;
    }
    if (accessResult.error) {
      console.error("Failed to load case assignments:", accessResult.error);
    }

    const assignedUsersByCase = new Map<string, string[]>();
    ((accessResult.error ? [] : accessResult.data || []) as CaseAccessRow[]).forEach((access) => {
      assignedUsersByCase.set(access.case_id, [
        ...(assignedUsersByCase.get(access.case_id) || []),
        access.user_id,
      ]);
    });

    const viewer = viewingAsUser
      ? { id: viewingAsUser.id, role: viewingAsUser.role }
      : { id: user.id, role };
    const visibleRows = ((data || []) as CaseRow[]).filter((row) => {
      if (!isViewingAs) return true;
      return canCaseBeSeenByViewer(
        row,
        viewer,
        assignedUsersByCase.get(row.id) || [],
      );
    });

    setCases(
      visibleRows.map((row) =>
        toLitigationCase(row, viewer, assignedUsersByCase.get(row.id) || []),
      ),
    );
    setIsLoading(false);
  }, [isApproved, isViewingAs, role, user, viewingAsUser]);

  const syncCaseAccess = useCallback(
    async (caseId: string, assignedUserIds: string[]) => {
      if (!user || (role !== "superadmin" && role !== "admin")) return;

      const uniqueUserIds = Array.from(new Set(assignedUserIds.filter(Boolean)));
      const { error: deleteError } = await supabase
        .from("case_access")
        .delete()
        .eq("case_id", caseId);
      if (deleteError) throw deleteError;

      if (uniqueUserIds.length === 0) return;

      const { error: insertError } = await supabase.from("case_access").insert(
        uniqueUserIds.map((userId) => ({
          case_id: caseId,
          user_id: userId,
          granted_by: user.id,
        })),
      );
      if (insertError) throw insertError;
    },
    [role, user],
  );

  const createCase = useCallback(
    async (input: CaseInput) => {
      if (!user) throw new Error("You must be logged in to create a case.");
      if (role !== "superadmin" && role !== "admin") {
        throw new Error("Only admin and superadmin accounts can create cases.");
      }

      const canAssignCases = role === "superadmin" || role === "admin";
      const assignedUserIds = canAssignCases ? input.assignedUserIds : undefined;
      const assignedTo = canAssignCases ? input.assignedTo : undefined;

      const { data, error } = await supabase
        .from("cases")
        .insert({
          title: input.title,
          created_by: user.id,
          creator_email: profile?.email || user.email || null,
          entered_by: user.id,
          assigned_to: assignedUserIds?.[0] || assignedTo || null,
          description: JSON.stringify({
            description: input.description || "",
            suitNumber: input.suitNumber || "",
            adversaryParty: input.adversaryParty || "",
            proceduralStage: input.proceduralStage || "Mention",
            assignedCounsel: input.assignedCounsel || "",
            court: input.court || "",
            nextHearing: input.nextHearing || null,
            filingDeadline: input.filingDeadline || null,
            status: input.status || "Active",
          }),
        })
        .select("id")
        .single();

      if (error) throw error;
      if (assignedUserIds !== undefined) {
        await syncCaseAccess(data.id, assignedUserIds);
      } else if (assignedTo) {
        await syncCaseAccess(data.id, [assignedTo]);
      }
      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: data.id,
        resource: "Case",
        details: `Created case: ${input.title}`,
      });
      await fetchCases();
    },
    [fetchCases, profile?.email, role, syncCaseAccess, user],
  );

  const updateCase = useCallback(
    async (id: string, input: CaseInput) => {
      if (!user) throw new Error("You must be logged in to update a case.");
      const current = cases.find((caseItem) => caseItem.id === id);
      if (current && !current.canEdit) {
        throw new Error("You are not authorized to update this case.");
      }

      const canAssignCases = role === "superadmin" || role === "admin";
      const nextAssignedUserIds = canAssignCases ? input.assignedUserIds : undefined;
      const nextAssignedTo = canAssignCases ? input.assignedTo : undefined;
      const primaryAssignedUserId =
        nextAssignedUserIds === undefined
          ? nextAssignedTo
          : nextAssignedUserIds[0] || "";

      const { error } = await supabase
        .from("cases")
        .update({
          title: input.title,
          assigned_to:
            nextAssignedUserIds === undefined && nextAssignedTo === undefined
              ? current?.assignedTo || null
              : primaryAssignedUserId || null,
          description: JSON.stringify({
            description: input.description || "",
            suitNumber: input.suitNumber || "",
            adversaryParty: input.adversaryParty || "",
            proceduralStage: input.proceduralStage || "Mention",
            assignedCounsel: input.assignedCounsel || "",
            court: input.court || "",
            nextHearing: input.nextHearing || null,
            filingDeadline: input.filingDeadline || null,
            status: input.status || "Active",
          }),
        })
        .eq("id", id);

      if (error) throw error;
      if (nextAssignedUserIds !== undefined) {
        await syncCaseAccess(id, nextAssignedUserIds);
      }
      await writeAuditLog({
        action: "UPDATE",
        performedBy: user.id,
        targetId: id,
        resource: "Case",
        details: `Updated case: ${input.title}`,
      });
      await fetchCases();
    },
    [cases, fetchCases, role, syncCaseAccess, user],
  );

  const deleteCase = useCallback(
    async (caseItem: LitigationCase) => {
      if (!user) throw new Error("You must be logged in to delete a case.");
      if (!caseItem.canDelete) {
        throw new Error("You are not authorized to delete this case.");
      }

      const { error } = await supabase.from("cases").delete().eq("id", caseItem.id);
      if (error) throw error;
      await writeAuditLog({
        action: "DELETE",
        performedBy: user.id,
        targetId: caseItem.id,
        resource: "Case",
        details: `Deleted case: ${caseItem.caseTitle}`,
      });
      await fetchCases();
    },
    [fetchCases, user],
  );

  useEffect(() => {
    fetchCases().catch(console.error);
  }, [fetchCases]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const activeCases = cases.filter(
      (caseItem) => !["Closed", "Archived"].includes(caseItem.status),
    );
    const now = new Date();
    const soon = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    return {
      activeLitigation: activeCases.length,
      urgentHearings: activeCases.filter(
        (caseItem) =>
          caseItem.nextHearing >= now && caseItem.nextHearing <= soon,
      ).length,
      winRate: 0,
      totalCases: activeCases.length,
    };
  }, [cases]);

  return {
    cases,
    metrics,
    isLoading,
    fetchCases,
    createCase,
    updateCase,
    deleteCase,
  };
}
