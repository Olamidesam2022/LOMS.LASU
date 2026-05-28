import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, LitigationCase } from "@/types/legal";
import { useAuth } from "@/context/AuthContext";
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

export interface CaseInput {
  title: string;
  description?: string;
  suitNumber?: string;
  adversaryParty?: string;
  proceduralStage?: string;
  assignedCounsel?: string;
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
): LitigationCase => {
  const meta = parseDescription(row.description);
  const createdAt = new Date(row.created_at);
  const enteredBy = row.entered_by || meta.enteredBy || row.created_by;
  const canManageAll = viewer?.role === "superadmin";
  const ownsRecord =
    !!viewer?.id &&
    (row.created_by === viewer.id ||
      row.assigned_to === viewer.id ||
      enteredBy === viewer.id);

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
    canEdit: canManageAll || ownsRecord,
    canDelete: canManageAll || ownsRecord,
  };
};

export function useCases() {
  const { user, role, profile, isApproved } = useAuth();
  const [cases, setCases] = useState<LitigationCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCases = useCallback(async () => {
    if (!user || !isApproved) {
      setCases([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("id,title,description,created_by,creator_email,entered_by,assigned_to,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    setCases(
      ((data || []) as CaseRow[]).map((row) =>
        toLitigationCase(row, { id: user.id, role }),
      ),
    );
    setIsLoading(false);
  }, [isApproved, role, user]);

  const createCase = useCallback(
    async (input: CaseInput) => {
      if (!user) throw new Error("You must be logged in to create a case.");

      const { data, error } = await supabase
        .from("cases")
        .insert({
          title: input.title,
          created_by: user.id,
          creator_email: profile?.email || user.email || null,
          entered_by: user.id,
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
      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: data.id,
        resource: "Case",
        details: `Created case: ${input.title}`,
      });
      await fetchCases();
    },
    [fetchCases, user],
  );

  const updateCase = useCallback(
    async (id: string, input: CaseInput) => {
      if (!user) throw new Error("You must be logged in to update a case.");
      const current = cases.find((caseItem) => caseItem.id === id);
      if (current && !current.canEdit) {
        throw new Error("You are not authorized to update this case.");
      }

      const { error } = await supabase
        .from("cases")
        .update({
          title: input.title,
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
      await writeAuditLog({
        action: "UPDATE",
        performedBy: user.id,
        targetId: id,
        resource: "Case",
        details: `Updated case: ${input.title}`,
      });
      await fetchCases();
    },
    [cases, fetchCases, user],
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
    const activeCases = cases.filter((caseItem) => caseItem.status !== "Closed");
    const now = new Date();
    const soon = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    return {
      activeLitigation: activeCases.length,
      advisoryBacklog: 0,
      urgentHearings: cases.filter(
        (caseItem) =>
          caseItem.nextHearing >= now && caseItem.nextHearing <= soon,
      ).length,
      winRate: 0,
      totalCases: cases.length,
      pendingAdvisory: 0,
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
