import { Archive, FileText, Search, Scale } from "lucide-react";
import { LegalDocument, LitigationCase } from "@/types/legal";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ArchiveViewProps {
  cases: LitigationCase[];
  documents: LegalDocument[];
  onViewCase?: (caseItem: LitigationCase) => void;
}

export function ArchiveView({ cases, documents, onViewCase }: ArchiveViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const archivedCases = cases.filter((caseItem) => caseItem.status === "Archived");
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

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {archivedCases.length} archived case{archivedCases.length === 1 ? "" : "s"}
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
              onClick={() => onViewCase?.(caseItem)}
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
                    Archived
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
            Cases marked Archived will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
