import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentType, LegalDocument } from "@/types/legal";
import { useAuth } from "@/context/AuthContext";
import { useViewAs } from "@/context/ViewAsContext";
import { writeAuditLog } from "@/lib/audit";

const DOCUMENT_BUCKET = "case-documents";

interface DocumentRow {
  id: string;
  name: string;
  type: DocumentType;
  case_id: string | null;
  storage_path: string | null;
  mime_type: string | null;
  version: string;
  uploaded_by: string;
  created_by?: string | null;
  entered_by?: string | null;
  size: string;
  status: "Draft" | "Final" | "Archived";
  created_at: string;
  updated_at: string;
}

interface CaseRow {
  id: string;
  assigned_to?: string | null;
}

interface CaseAccessRow {
  case_id: string;
  user_id: string;
}

const toLegalDocument = (
  row: DocumentRow,
  viewer?: { id: string; role?: string | null },
): LegalDocument => {
  const ownsRecord =
    !!viewer?.id &&
    (row.created_by === viewer.id || row.entered_by === viewer.id);
  const canManageAll = viewer?.role === "superadmin";

  return {
  id: row.id,
  name: row.name,
  type: row.type,
  caseId: row.case_id || undefined,
  storagePath: row.storage_path || undefined,
  mimeType: row.mime_type || undefined,
  version: row.version,
  uploadedBy: row.uploaded_by,
  uploadedAt: new Date(row.created_at),
  lastModified: new Date(row.updated_at || row.created_at),
  size: row.size,
  status: row.status,
  createdBy: row.created_by || undefined,
  enteredBy: row.entered_by || row.created_by || undefined,
  canDownload: true,
  canDelete: canManageAll || ownsRecord,
  };
};

export function useDocuments() {
  const { user, role, profile, isApproved } = useAuth();
  const { viewingAsUser, isViewingAs } = useViewAs();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  const fetchDocuments = useCallback(async () => {
    if (!user || !isApproved) {
      setDocuments([]);
      return;
    }

    const documentsQuery = supabase
      .from("documents")
      .select("id,name,type,case_id,storage_path,mime_type,version,uploaded_by,created_by,entered_by,size,status,created_at,updated_at")
      .order("created_at", { ascending: false });
    const caseQuery =
      isViewingAs && viewingAsUser
        ? supabase.from("cases").select("id,assigned_to")
        : null;
    const accessQuery =
      isViewingAs && viewingAsUser
        ? supabase.from("case_access").select("case_id,user_id")
        : null;

    const [documentsResult, caseResult, accessResult] = await Promise.all([
      documentsQuery,
      caseQuery ?? Promise.resolve({ data: [], error: null }),
      accessQuery ?? Promise.resolve({ data: [], error: null }),
    ]);
    const { data, error } = documentsResult;

    if (error) throw error;
    if (caseResult.error) console.error("Failed to load document case access:", caseResult.error);
    if (accessResult.error) console.error("Failed to load document access grants:", accessResult.error);

    const viewer = viewingAsUser
      ? { id: viewingAsUser.id, role: viewingAsUser.role }
      : { id: user.id, role };
    const accessibleCaseIds = new Set<string>();

    if (isViewingAs && viewingAsUser) {
      ((caseResult.data || []) as CaseRow[]).forEach((caseRow) => {
        if (
          viewer.role === "superadmin" ||
          viewer.role === "admin" ||
          caseRow.assigned_to === viewer.id
        ) {
          accessibleCaseIds.add(caseRow.id);
        }
      });
      ((accessResult.data || []) as CaseAccessRow[]).forEach((accessRow) => {
        if (accessRow.user_id === viewer.id) {
          accessibleCaseIds.add(accessRow.case_id);
        }
      });
    }

    const visibleRows = ((data || []) as DocumentRow[]).filter((row) => {
      if (!isViewingAs || !viewingAsUser) return true;
      if (viewer.role === "superadmin" || viewer.role === "admin") return true;
      if (!row.case_id) {
        return row.created_by === viewer.id || row.entered_by === viewer.id;
      }
      return accessibleCaseIds.has(row.case_id);
    });

    setDocuments(
      visibleRows.map((row) =>
        isViewingAs
          ? {
              ...toLegalDocument(row, viewer),
              canDelete: false,
            }
          : toLegalDocument(row, viewer),
      ),
    );
  }, [isApproved, isViewingAs, role, user, viewingAsUser]);

  const createDocument = useCallback(
    async (input: {
      name: string;
      type: DocumentType;
      relatedCase?: string;
      file?: File | null;
    }) => {
      if (!user) throw new Error("You must be logged in.");
      if (!input.file) throw new Error("Please select a file to upload.");

      const extension = input.file.name.includes(".")
        ? input.file.name.split(".").pop()?.toLowerCase()
        : "bin";
      const safeName = input.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}.${extension || "bin"}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(storagePath, input.file, {
          contentType: input.file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          name: input.name,
          type: input.type,
          case_id: input.relatedCase || null,
          storage_path: storagePath,
          mime_type: input.file.type || "application/octet-stream",
          version: "1.0",
          uploaded_by: profile?.full_name || user.email || "User",
          size: input.file
            ? `${(input.file.size / 1024 / 1024).toFixed(2)} MB`
            : "0 MB",
          status: "Final",
          created_by: user.id,
          entered_by: user.id,
        })
        .select("id")
        .single();

      if (error) {
        await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
        throw error;
      }

      if (input.relatedCase) {
        const { error: noteError } = await supabase.from("case_notes").insert({
          case_id: input.relatedCase,
          content: `Document "${input.name}" was uploaded to this case.`,
          created_by: user.id,
          user_id: user.id,
          is_private: false,
          note_type: "system",
        });

        if (noteError) {
          console.error("Failed to add case document note:", noteError);
        }
      }

      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: input.relatedCase || data.id,
        resource: "Document",
        details: input.relatedCase
          ? `Uploaded document "${input.name}" to a case`
          : `Uploaded document metadata: ${input.name}`,
      });
      await fetchDocuments();
    },
    [fetchDocuments, profile?.full_name, user],
  );

  const downloadDocument = useCallback(
    async (document: LegalDocument) => {
      if (!user) throw new Error("You must be logged in.");
      if (!document.canDownload) {
        throw new Error("You are not authorized to download this document.");
      }
      if (!document.storagePath) {
        throw new Error("This document has no stored file attached.");
      }

      const { data, error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(document.storagePath, 60);

      if (error) throw error;

      await writeAuditLog({
        action: "DOWNLOAD",
        performedBy: user.id,
        targetId: document.id,
        resource: "Document",
        details: `Downloaded document: ${document.name}`,
      });

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    },
    [user],
  );

  const deleteDocument = useCallback(
    async (document: LegalDocument) => {
      if (!user) throw new Error("You must be logged in.");
      const { error } = await supabase.from("documents").delete().eq("id", document.id);
      if (error) throw error;
      if (document.storagePath) {
        await supabase.storage.from(DOCUMENT_BUCKET).remove([document.storagePath]);
      }
      await writeAuditLog({
        action: "DELETE",
        performedBy: user.id,
        targetId: document.id,
        resource: "Document",
        details: `Deleted document metadata: ${document.name}`,
      });
      await fetchDocuments();
    },
    [fetchDocuments, user],
  );

  useEffect(() => {
    fetchDocuments().catch(console.error);
  }, [fetchDocuments]);

  return {
    documents,
    fetchDocuments,
    createDocument,
    downloadDocument,
    deleteDocument,
  };
}
