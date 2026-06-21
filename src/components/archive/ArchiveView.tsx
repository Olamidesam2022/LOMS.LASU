import {
  Archive,
  CalendarDays,
  Download,
  Eye,
  FileText,
  MapPin,
  Search,
  Scale,
  User,
} from "lucide-react";
import { LegalDocument, LitigationCase } from "@/types/legal";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArchiveViewProps {
  cases: LitigationCase[];
  documents: LegalDocument[];
  onViewDocument?: (document: LegalDocument) => void;
  onDownloadDocument?: (document: LegalDocument) => void;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArchiveView({
  cases,
  documents,
  onViewDocument,
  onDownloadDocument,
}: ArchiveViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<LitigationCase | null>(null);
  const archivedCases = cases.filter((caseItem) => caseItem.status === "Closed");
  const filteredCases = archivedCases.filter((caseItem) =>
    [
      caseItem.suitNumber,
      caseItem.caseTitle,
      caseItem.adversaryParty,
      caseItem.assignedCounsel,
      caseItem.court,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const getCaseDocuments = (caseId: string) =>
    documents.filter((document) => document.caseId === caseId);
  const selectedCaseDocuments = selectedCase ? getCaseDocuments(selectedCase.id) : [];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {archivedCases.length} closed case{archivedCases.length === 1 ? "" : "s"}
        </p>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search archive..."
            className="search-input w-full pl-10"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filteredCases.map((caseItem) => {
          const caseDocuments = getCaseDocuments(caseItem.id);
          const hasMultipleDocuments = caseDocuments.length >= 2;

          return (
            <button
              key={caseItem.id}
              onClick={() => setSelectedCase(caseItem)}
              className="case-modern-row text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Archive className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {caseItem.suitNumber}
                  </p>
                  <span className="status-pill bg-muted text-muted-foreground">
                    {caseItem.status}
                  </span>
                  {hasMultipleDocuments && (
                    <span className="status-pill bg-info/10 text-info">
                      Multiple documents
                    </span>
                  )}
                </div>
                <h4 className="mt-1 truncate text-base font-extrabold text-foreground">
                  {caseItem.caseTitle}
                </h4>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  vs. {caseItem.adversaryParty}
                </p>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 font-semibold">
                  <FileText className="h-3.5 w-3.5" />
                  {caseDocuments.length} document{caseDocuments.length === 1 ? "" : "s"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 font-semibold",
                    caseDocuments.length === 0 && "text-warning",
                  )}
                >
                  <Scale className="h-3.5 w-3.5" />
                  {caseItem.court}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredCases.length === 0 && (
        <div className="surface-card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <Archive className="h-9 w-9 text-muted-foreground" />
          <h3 className="mt-3 text-base font-extrabold text-foreground">
            No archived cases found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Cases marked Closed will appear here automatically.
          </p>
        </div>
      )}

      <Dialog open={Boolean(selectedCase)} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedCase && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3 pr-8">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Archive className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="font-mono text-base">
                      {selectedCase.suitNumber}
                    </DialogTitle>
                    <DialogDescription className="mt-1 line-clamp-2">
                      {selectedCase.caseTitle}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                      <Scale className="h-3.5 w-3.5" />
                      Parties
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      vs. {selectedCase.adversaryParty}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Court
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {selectedCase.court}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Counsel
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {selectedCase.assignedCounsel}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Filed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatDate(selectedCase.filedDate)}
                    </p>
                  </div>
                </div>

                <section className="rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                    <div>
                      <h3 className="font-semibold text-foreground">Archived Documents</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedCaseDocuments.length} document
                        {selectedCaseDocuments.length === 1 ? "" : "s"} attached
                      </p>
                    </div>
                    <span className="status-pill bg-muted text-muted-foreground">
                      Closed
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedCaseDocuments.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No documents are attached to this closed case.
                      </p>
                    ) : (
                      selectedCaseDocuments.map((document) => (
                        <div
                          key={document.id}
                          className="grid gap-3 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {document.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {document.type} - v{document.version} - uploaded by{" "}
                              {document.uploadedBy}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 sm:justify-end">
                            <span className="status-pill bg-background text-muted-foreground">
                              {document.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => onViewDocument?.(document)}
                              className="icon-button"
                              aria-label={`View ${document.name}`}
                              title="View document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDownloadDocument?.(document)}
                              className="icon-button"
                              aria-label={`Download ${document.name}`}
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
