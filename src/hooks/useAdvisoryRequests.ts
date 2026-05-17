import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdvisoryRequest, AdvisoryStatus } from "@/types/legal";
import { useAuth } from "@/context/AuthContext";
import { writeAuditLog } from "@/lib/audit";

interface AdvisoryRow {
  id: string;
  title: string;
  requested_by: string;
  department: string;
  due_date: string | null;
  status: AdvisoryStatus;
  assigned_to: string | null;
  priority: "Low" | "Medium" | "High" | "Critical";
  description: string | null;
  created_at: string;
}

const toAdvisoryRequest = (row: AdvisoryRow): AdvisoryRequest => ({
  id: row.id,
  requestNumber: `ADV-${row.created_at.slice(0, 4)}-${row.id.slice(0, 4).toUpperCase()}`,
  title: row.title,
  requestedBy: row.requested_by,
  department: row.department,
  dateReceived: new Date(row.created_at),
  dueDate: row.due_date ? new Date(row.due_date) : new Date(row.created_at),
  status: row.status,
  assignedTo: row.assigned_to || "Unassigned",
  priority: row.priority,
  description: row.description || "",
});

export function useAdvisoryRequests() {
  const { user, isApproved } = useAuth();
  const [advisoryRequests, setAdvisoryRequests] = useState<AdvisoryRequest[]>([]);

  const fetchAdvisoryRequests = useCallback(async () => {
    if (!user || !isApproved) {
      setAdvisoryRequests([]);
      return;
    }

    const { data, error } = await supabase
      .from("advisory_requests")
      .select("id,title,requested_by,department,due_date,status,assigned_to,priority,description,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setAdvisoryRequests(((data || []) as AdvisoryRow[]).map(toAdvisoryRequest));
  }, [isApproved, user]);

  const createAdvisoryRequest = useCallback(
    async (input: {
      title: string;
      requestedBy: string;
      department: string;
      priority?: string;
      dueDate?: string;
      assignedTo?: string;
      description?: string;
    }) => {
      if (!user) throw new Error("You must be logged in.");

      const { data, error } = await supabase
        .from("advisory_requests")
        .insert({
          title: input.title,
          requested_by: input.requestedBy,
          department: input.department,
          priority: input.priority || "Medium",
          due_date: input.dueDate || null,
          assigned_to: input.assignedTo || null,
          description: input.description || "",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: data.id,
        resource: "Advisory",
        details: `Created advisory request: ${input.title}`,
      });
      await fetchAdvisoryRequests();
    },
    [fetchAdvisoryRequests, user],
  );

  useEffect(() => {
    fetchAdvisoryRequests().catch(console.error);
  }, [fetchAdvisoryRequests]);

  return { advisoryRequests, fetchAdvisoryRequests, createAdvisoryRequest };
}
