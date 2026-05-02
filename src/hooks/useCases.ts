import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, LitigationCase } from "@/types/legal";
import { useAuth } from "@/context/AuthContext";

interface CaseRow {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

const parseDescription = (description: string | null) => {
  if (!description) return {};
  try {
    return JSON.parse(description);
  } catch {
    return { description };
  }
};

export const toLitigationCase = (row: CaseRow): LitigationCase => {
  const meta = parseDescription(row.description);
  const createdAt = new Date(row.created_at);

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
  };
};

export function useCases() {
  const { user, isApproved } = useAuth();
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
      .select("id,title,description,created_by,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    setCases(((data || []) as CaseRow[]).map(toLitigationCase));
    setIsLoading(false);
  }, [isApproved, user]);

  const createCase = useCallback(
    async (input: {
      title: string;
      description?: string;
      suitNumber?: string;
      adversaryParty?: string;
      proceduralStage?: string;
      assignedCounsel?: string;
      court?: string;
      nextHearing?: string;
    }) => {
      if (!user) throw new Error("You must be logged in to create a case.");

      const { error } = await supabase.from("cases").insert({
        title: input.title,
        created_by: user.id,
        description: JSON.stringify({
          description: input.description || "",
          suitNumber: input.suitNumber || "",
          adversaryParty: input.adversaryParty || "",
          proceduralStage: input.proceduralStage || "Mention",
          assignedCounsel: input.assignedCounsel || "",
          court: input.court || "",
          nextHearing: input.nextHearing || null,
        }),
      });

      if (error) throw error;
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

  return { cases, metrics, isLoading, fetchCases, createCase };
}
