import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown, 
  MoreHorizontal,
  Calendar,
  User,
  MapPin,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { LitigationCase, ProceduralStage } from '@/types/legal';
import { cn } from '@/lib/utils';

interface LitigationRegistryProps {
  cases: LitigationCase[];
  onAddCase?: () => void;
  onViewCase?: (caseItem: LitigationCase) => void;
  onEditCase?: (caseItem: LitigationCase) => void;
}

const stageColors: Record<ProceduralStage, string> = {
  Mention: 'status-mention',
  Interlocutory: 'status-interlocutory',
  Trial: 'status-trial',
  Judgment: 'status-judgment',
};

export function LitigationRegistry({ cases, onAddCase, onViewCase, onEditCase }: LitigationRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<ProceduralStage | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Litigation Registry</h2>
          <p className="text-muted-foreground">
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
        <div className="animate-fade-in rounded-lg border border-border bg-card p-4">
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

      {/* Cases Table - Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Suit Number</th>
                <th className="px-4 py-3 text-left">Case Title</th>
                <th className="px-4 py-3 text-left">Adversary Party</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Counsel</th>
                <th className="px-4 py-3 text-left">Next Hearing</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem, index) => (
                <tr 
                  key={caseItem.id} 
                  className="table-row animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-4 py-4">
                    <span className="font-medium text-foreground">{caseItem.suitNumber}</span>
                  </td>
                  <td className="max-w-[200px] px-4 py-4">
                    <p className="truncate text-foreground">{caseItem.caseTitle}</p>
                    <p className="truncate text-xs text-muted-foreground">{caseItem.court}</p>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {caseItem.adversaryParty}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`status-pill ${stageColors[caseItem.proceduralStage]}`}>
                      {caseItem.proceduralStage}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {caseItem.assignedCounsel}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {caseItem.nextHearing.toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onViewCase?.(caseItem)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onEditCase?.(caseItem)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cases Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredCases.map((caseItem, index) => (
          <div 
            key={caseItem.id} 
            className="animate-fade-in rounded-xl border border-border bg-card p-4"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <span className="font-semibold text-foreground">{caseItem.suitNumber}</span>
                <span className={`status-pill ${stageColors[caseItem.proceduralStage]} ml-2`}>
                  {caseItem.proceduralStage}
                </span>
              </div>
              <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            
            <h4 className="mb-1 font-medium text-foreground">{caseItem.caseTitle}</h4>
            <p className="mb-3 text-sm text-muted-foreground">vs. {caseItem.adversaryParty}</p>
            
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{caseItem.assignedCounsel.split(' ').slice(-1)[0]}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{caseItem.court}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {caseItem.nextHearing.toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">No cases found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
