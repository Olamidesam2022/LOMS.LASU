import { useState } from 'react';
import { 
  Search, 
  Upload, 
  FolderOpen, 
  FileText, 
  FileSpreadsheet,
  File,
  Download,
  Eye,
  Trash2,
  Clock,
  User,
  Tag,
  Grid,
  List
} from 'lucide-react';
import { LegalDocument, DocumentType } from '@/types/legal';
import { cn } from '@/lib/utils';

interface DocumentVaultProps {
  documents: LegalDocument[];
  onUpload?: () => void;
  onViewDocument?: (doc: LegalDocument) => void;
  onDownloadDocument?: (doc: LegalDocument) => void;
  onDeleteDocument?: (doc: LegalDocument) => void;
}

const typeIcons: Record<DocumentType, React.ElementType> = {
  'MoU': FileText,
  'Court Process': FileSpreadsheet,
  'Legal Opinion': FileText,
  'Contract': File,
  'Correspondence': FileText,
};

const typeColors: Record<DocumentType, string> = {
  'MoU': 'bg-info/10 text-info',
  'Court Process': 'bg-warning/10 text-warning',
  'Legal Opinion': 'bg-success/10 text-success',
  'Contract': 'bg-accent/20 text-accent-foreground',
  'Correspondence': 'bg-muted text-muted-foreground',
};

const statusStyles = {
  Draft: 'bg-warning/10 text-warning',
  Final: 'bg-success/10 text-success',
  Archived: 'bg-muted text-muted-foreground',
};

export function DocumentVault({ documents, onUpload, onViewDocument, onDownloadDocument, onDeleteDocument }: DocumentVaultProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const documentTypes: DocumentType[] = ['MoU', 'Court Process', 'Legal Opinion', 'Contract', 'Correspondence'];

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document Vault</h2>
          <p className="text-muted-foreground">
            Secure digital archive with version control
          </p>
        </div>
        <button 
          onClick={onUpload}
          className="gold-button flex items-center gap-2 rounded-lg px-4 py-2.5"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All Types</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "rounded-md p-2 transition-colors",
                viewMode === 'grid' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "rounded-md p-2 transition-colors",
                viewMode === 'list' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Type Pills */}
      <div className="surface-card flex flex-wrap gap-2 p-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            typeFilter === 'all'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FolderOpen className="h-4 w-4" />
          <span>All</span>
          <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-xs">
            {documents.length}
          </span>
        </button>
        {documentTypes.map(type => {
          const count = documents.filter(d => d.type === type).length;
          const Icon = typeIcons[type];
          
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type === typeFilter ? 'all' : type)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                typeFilter === type 
                  ? typeColors[type]
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{type}</span>
              <span className="rounded-full bg-background/50 px-1.5 py-0.5 text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocuments.map((doc, index) => {
            const Icon = typeIcons[doc.type];
            
            return (
              <div
                key={doc.id}
                className="document-card group animate-fade-in p-0"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="border-b border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm", typeColors[doc.type])}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={cn("status-pill", statusStyles[doc.status])}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-foreground">
                      {doc.name}
                    </h4>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("rounded-md px-2 py-1 font-semibold", typeColors[doc.type])}>
                        {doc.type}
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-semibold">v{doc.version}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Modified</span>
                      </div>
                      <p className="font-semibold text-foreground">
                        {doc.lastModified.toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Size</span>
                      </div>
                      <p className="font-semibold text-foreground">{doc.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{doc.uploadedBy}</span>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border/70 bg-muted/20 p-3">
                  <button 
                    onClick={() => onViewDocument?.(doc)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-background py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => onDownloadDocument?.(doc)}
                    className="icon-button bg-background shadow-sm"
                    aria-label={`Download ${doc.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument?.(doc)}
                    className="icon-button bg-background shadow-sm hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Documents List View */}
      {viewMode === 'list' && (
        <div className="surface-card hidden overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Document</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Modified</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
            <tbody>
              {filteredDocuments.map((doc, index) => {
                const Icon = typeIcons[doc.type];
                
                return (
                  <tr
                    key={doc.id} 
                    className="table-row animate-fade-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg shadow-sm", typeColors[doc.type])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">{doc.name}</p>
                          <p className="truncate text-xs text-muted-foreground">Uploaded by {doc.uploadedBy}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", typeColors[doc.type])}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-muted-foreground">v{doc.version}</td>
                    <td className="px-4 py-4">
                      <span className={cn("status-pill text-xs", statusStyles[doc.status])}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {doc.lastModified.toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{doc.size}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => onViewDocument?.(doc)}
                          className="icon-button"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDownloadDocument?.(doc)}
                          className="icon-button"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteDocument?.(doc)}
                          className="icon-button hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="surface-card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">No documents found</h3>
          <p className="mb-4 text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
          <button 
            onClick={onUpload}
            className="gold-button flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      )}
    </div>
  );
}
