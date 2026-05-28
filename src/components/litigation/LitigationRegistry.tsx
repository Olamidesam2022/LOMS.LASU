import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown, 
  Calendar,
  User,
  MapPin,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { LitigationCase, ProceduralStage } from '@/types/legal';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LitigationRegistryProps {
  cases: LitigationCase[];
  onAddCase?: () => void;
  onViewCase?: (caseItem: LitigationCase) => void;
  onEditCase?: (caseItem: LitigationCase) => void;
  onDeleteCase?: (caseItem: LitigationCase) => void;
}

const stageColors: Record<ProceduralStage, string> = {
  Mention: 'status-mention',
  Interlocutory: 'status-interlocutory',
  Trial: 'status-trial',
  Judgment: 'status-judgment',
};

export function LitigationRegistry({ cases, onAddCase, onViewCase, onEditCase, onDeleteCase }: LitigationRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<ProceduralStage | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'advisory'>('all');

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.suitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.adversaryParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.assignedCounsel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || caseItem.proceduralStage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const stages: ProceduralStage[] = ['Mention', 'Interlocutory', 'Trial', 'Judgment'];

  const advisoryStatuses = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'pending_response', label: 'Pending Response' },
    { key: 'closed', label: 'Closed' },
  ];

  const getCaseMeta = (caseItem: LitigationCase) => {
    try {
      return caseItem.description ? JSON.parse(caseItem.description) : {};
    } catch {
      return {};
    }
  };

  const advisoryCases = filteredCases.filter((caseItem) => {
    const meta = getCaseMeta(caseItem) as { case_type?: string; caseType?: string };
    return (meta.case_type || meta.caseType || '').toLowerCase() === 'advisory';
  });

  const normalizeStatus = (status: string) =>
    status.toLowerCase().replace(/\s+/g, '_');

  const handleAdvisoryDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    newStatus: string,
  ) => {
    event.preventDefault();
    const caseId = event.dataTransfer.getData('text/plain');
    if (!caseId) return;

    const caseItem = filteredCases.find((item) => item.id === caseId);
    const meta = caseItem ? getCaseMeta(caseItem) : {};
    const { error } = await supabase
      .from('cases')
      .update({
        description: JSON.stringify({
          ...meta,
          status: newStatus,
        }),
      })
      .eq('id', caseId);

    if (error) {
      console.error('Failed to update advisory case status:', error);
      toast.error('Unable to update advisory request status');
      return;
    }

    toast.success('Advisory request status updated');
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="modern-page-title">Litigation Registry</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button 
          onClick={onAddCase}
          className="gold-button flex items-center gap-2 rounded-lg px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Case</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setViewMode('all')}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === 'all'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          All Cases
        </button>
        <button
          onClick={() => setViewMode('advisory')}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === 'advisory'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          Advisory Requests
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by suit number, party, or counsel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors",
            showFilters ? "bg-muted text-foreground" : "bg-card text-muted-foreground hover:bg-muted"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="surface-card animate-fade-in p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Procedural Stage</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStageFilter('all')}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                stageFilter === 'all' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All Stages
            </button>
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  stageFilter === stage 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'advisory' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {advisoryStatuses.map((status) => {
            const columnCases = advisoryCases.filter(
              (caseItem) => normalizeStatus(caseItem.status) === status.key,
            );

            return (
              <div
                key={status.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleAdvisoryDrop(event, status.key)}
                className="min-h-64 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border p-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {status.label}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {columnCases.length}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  {columnCases.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No advisory requests here.
                    </p>
                  )}
                  {columnCases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData('text/plain', caseItem.id)
                      }
                      onClick={() => onViewCase?.(caseItem)}
                      className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-accent/60 hover:bg-accent/5"
                    >
                      <p className="font-mono text-xs text-muted-foreground">
                        {caseItem.suitNumber}
                      </p>
                      <h4 className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                        {caseItem.caseTitle}
                      </h4>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'all' && (
        <>

      <div className="grid gap-3">
        {filteredCases.map((caseItem, index) => (
          <div
            key={caseItem.id} 
            className="case-modern-row animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <button
              onClick={() => onViewCase?.(caseItem)}
              className="grid min-w-0 flex-1 gap-3 text-left md:grid-cols-[10rem_1fr_auto] md:items-center"
            >
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {caseItem.suitNumber}
                </p>
                <span className={`status-pill ${stageColors[caseItem.proceduralStage]} mt-2`}>
                  {caseItem.proceduralStage}
                </span>
              </div>

              <div className="min-w-0">
                  <h4 className="truncate text-base font-extrabold text-foreground">
                  {caseItem.caseTitle}
                </h4>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  vs. {caseItem.adversaryParty}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                    <User className="h-3.5 w-3.5" />
                    {caseItem.assignedCounsel}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{caseItem.court}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-background/70 p-3 md:justify-end">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground">Next date</p>
                  <p className="text-sm font-extrabold text-foreground">
                    {caseItem.nextHearing.toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-1 self-start md:self-center">
              <button onClick={() => onViewCase?.(caseItem)} className="icon-button" title="View">
                <Eye className="h-4 w-4" />
              </button>
              {caseItem.canEdit && (
                <button onClick={() => onEditCase?.(caseItem)} className="icon-button" title="Edit">
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {caseItem.canDelete && (
                <button onClick={() => onDeleteCase?.(caseItem)} className="icon-button hover:bg-destructive/10 hover:text-destructive" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="surface-card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">No cases found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
}
