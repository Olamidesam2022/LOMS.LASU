import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentType, LegalDocument } from "@/types/legal";
import { useAuth } from "@/context/AuthContext";
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
  size: string;
  status: "Draft" | "Final" | "Archived";
  created_at: string;
  updated_at: string;
}

const toLegalDocument = (row: DocumentRow): LegalDocument => ({
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
});

export function useDocuments() {
  const { user, profile, isApproved } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  const fetchDocuments = useCallback(async () => {
    if (!user || !isApproved) {
      setDocuments([]);
      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .select("id,name,type,case_id,storage_path,mime_type,version,uploaded_by,size,status,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setDocuments(((data || []) as DocumentRow[]).map(toLegalDocument));
  }, [isApproved, user]);

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
          case_id: null,
          storage_path: storagePath,
          mime_type: input.file.type || "application/octet-stream",
          version: "1.0",
          uploaded_by: profile?.full_name || user.email || "User",
          size: input.file
            ? `${(input.file.size / 1024 / 1024).toFixed(2)} MB`
            : "0 MB",
          status: "Final",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) {
        await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
        throw error;
      }
      await writeAuditLog({
        action: "CREATE",
        performedBy: user.id,
        targetId: data.id,
        resource: "Document",
        details: `Uploaded document metadata: ${input.name}`,
      });
      await fetchDocuments();
    },
    [fetchDocuments, profile?.full_name, user],
  );

  const downloadDocument = useCallback(
    async (document: LegalDocument) => {
      if (!user) throw new Error("You must be logged in.");
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
